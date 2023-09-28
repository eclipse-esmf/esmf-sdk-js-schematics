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

import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {apply, applyTemplates, chain, MergeStrategy, mergeWith, move, Rule, SchematicContext, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {templateInclude} from '../../../../shared/include';
import {addToComponentModule} from '../../../../../../utils/angular';
import {getFormFieldStrategy} from './index';

export interface ValidatorConfig {
    definition: string;
    errorCode: string;
    errorMessage: string;
}

export interface FormFieldConfig {
    name: string;
    nameDasherized: string;
    validators: ValidatorConfig[];
    exampleValue?: string;
    values?: any[];
    unitName?: string;
    children?: FormFieldConfig[];
    dataFormat?: string;
    placeholder?: string;
    deconstructionRule?: string;
}

export class FormFieldStrategy {
    pathToFiles: string;
    hasChildren: boolean;
    options: any;

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
        public fieldName: string
    ) {
        this.options = {...options};
    }

    getBaseValidatorsConfigs(): ValidatorConfig[] {
        const validatorsConfigs: ValidatorConfig[] = [];

        if (!this.parent.isOptional) {
            validatorsConfigs.push({
                definition: 'Validators.required',
                errorCode: 'required',
                errorMessage: `${this.fieldName} is required.`,
            });
        }

        return validatorsConfigs;
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
        return getFormFieldStrategy(this.options, this.context, this.parent, child, child.name);
    }
}
