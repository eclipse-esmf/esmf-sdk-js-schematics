/*
 * Copyright (c) 2023 Robert Bosch Manufacturing Solutions GmbH
 *
 * See the AUTHORS file(s) distributed with this work for
 * additional information regarding authorship.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import {Characteristic, Constraint, DefaultConstraint, DefaultTrait, Property} from '@esmf/aspect-model-loader';
import {apply, applyTemplates, chain, MergeStrategy, mergeWith, move, Rule, SchematicContext, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {templateInclude} from '../../../../shared/include';
import {addToComponentModule} from '../../../../../../utils/angular';
import {getFormFieldStrategy} from './index';
import {getConstraintValidatorStrategy} from '../validators/constraint/index';
import {ConstraintValidatorStrategyClass} from '../validators/constraint/constraint-validator-strategies';

export enum ValidatorType {
    DeconstructionRule = 'DeconstructionRule',
    Encoding = 'Encoding',
    FixedPoint = 'FixedPoint',
    Length = 'Length',
    Range = 'Range',
    Required = 'Required',
    RegExp = 'RegExp',
    UniqueValues = 'UniqueValues',
}

export interface ValidatorConfig {
    name: string;
    type: ValidatorType;
    definition: string;
    isDirectGroupValidator?: boolean;
}

export interface BaseFormFieldConfig {
    name: string;
    nameDasherized: string;
    selector: string;
}

export interface FormFieldConfig extends BaseFormFieldConfig {
    validators: ValidatorConfig[];
    exampleValue?: string;
    values?: any[];
    unitName?: string;
    children?: FormFieldConfig[];
    dataFormat?: string;
    placeholder?: string;
    deconstructionRule?: string;
    isList?: boolean;
    isScalarChild?: boolean;
}

export abstract class FormFieldStrategy {
    pathToFiles: string;
    hasChildren: boolean;
    options: any;
    isList: boolean = false;

    static isTargetStrategy(child: Characteristic): boolean {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    static getShortUrn(child: Characteristic): string | undefined {
        return child.dataType?.shortUrn;
    }

    constructor(
        options: any,
        public context: SchematicContext,
        public parent: Property,
        public child: Characteristic,
        public fieldName: string,
        public constraints: Constraint[]
    ) {
        this.options = {...options};
    }

    getValidatorsConfigs(ignoreStrategies: ConstraintValidatorStrategyClass = []): ValidatorConfig[] {
        return [...this.getBaseValidatorsConfigs(), ...this.getConstraintValidatorsConfigs(ignoreStrategies)];
    }

    getBaseValidatorsConfigs(): ValidatorConfig[] {
        const validatorsConfigs: ValidatorConfig[] = [];

        if (!this.parent.isOptional) {
            validatorsConfigs.push({
                name: `required`,
                type: ValidatorType.Required,
                definition: 'Validators.required',
            });
        }

        return validatorsConfigs;
    }

    getConstraintValidatorsConfigs(ignoreStrategies: ConstraintValidatorStrategyClass): ValidatorConfig[] {
        const applicableConstraints: Constraint[] = this.constraints.filter(
            constraint =>
                // Check that it's not excluded explicitly
                !this.options.excludedConstraints.includes(constraint.aspectModelUrn) &&
                // It's not a direct instance of "DefaultConstraint" (it contains no validation rules)
                constraint.constructor !== DefaultConstraint
        );

        return applicableConstraints.reduce((acc, constraint) => {
            const validatorStrategy = getConstraintValidatorStrategy(constraint, this.child);
            const isIgnoredStrategy = !!ignoreStrategies.find(ignoredStrategy => validatorStrategy instanceof ignoredStrategy);

            if (isIgnoredStrategy) {
                return acc;
            }

            return [...acc, ...validatorStrategy.getValidatorsConfigs()];
        }, []);
    }

    getBaseFormFieldConfig(): BaseFormFieldConfig {
        return {
            name: this.fieldName,
            nameDasherized: this.getNameDasherized(),
            selector: this.getSelector(),
        };
    }

    getSelector(): string {
        return `${this.options.prefix}-${strings.dasherize(this.fieldName)}`;
    }

    getNameDasherized(): string {
        return strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1));
    }

    applyTemplate(): Rule {
        return () => {
            return applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                options: {...this.options, name: this.fieldName},
                name: this.fieldName,
            });
        };
    }

    buildConfig(): FormFieldConfig {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    generate(): Rule {
        const fieldConfig = this.buildConfig();
        this.options.fieldConfig = fieldConfig;

        const modules = [
            {
                name: strings.classify(this.fieldName) + 'Component',
                fromLib: `./${fieldConfig.nameDasherized}/${fieldConfig.nameDasherized}.component`,
            },
        ];

        const operations = [
            mergeWith(
                apply(url(this.pathToFiles), [
                    templateInclude(this.context, this.applyTemplate(), {...this.options, name: this.fieldName}, '../shared/methods'),
                    move(this.options.path + `/${fieldConfig.nameDasherized}`),
                ]),
                this.options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
            ),
            addToComponentModule(this.options.skipImport, this.options, modules),
        ];

        if (this.hasChildren) {
            operations.push(...this.getChildStrategies().map(strategy => strategy.generate()));
        }

        return chain(operations);
    }

    getChildConfigs(): FormFieldConfig[] {
        return this.getChildStrategies().map(strategy => strategy.buildConfig());
    }

    getChildStrategies(): FormFieldStrategy[] {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    getChildStrategy(parent: Property, child: Characteristic): FormFieldStrategy {
        return getFormFieldStrategy(
            this.options,
            this.context,
            this.parent,
            child,
            child instanceof DefaultTrait ? child.baseCharacteristic.name : child.name
        );
    }
}
