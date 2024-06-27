/*
 * Copyright (c) 2024 Robert Bosch Manufacturing Solutions GmbH
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

import {ConstraintValidatorStrategy} from './ConstraintValidatorStrategy';
import {Constraint, DefaultLengthConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig} from '../validatorsTypes';

export class ConstraintValidatorLengthStrategy extends ConstraintValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return constraint instanceof DefaultLengthConstraint;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        const typedConstraint = this.constraint as DefaultLengthConstraint;

        if (typedConstraint.minValue === undefined && typedConstraint.maxValue === undefined) {
            return [];
        }

        const isApplyToChildren = this.isList() || this.isComplex();

        return [
            {
                name: this.constraint.name,
                definition: this.isList()
                    ? `FormValidators.listLengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue})`
                    : this.isComplex()
                      ? `FormValidators.applyToChildren(FormValidators.lengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue}))`
                      : `FormValidators.lengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue})`,
                isDirectGroupValidator: !isApplyToChildren,
            },
        ];
    }
}
