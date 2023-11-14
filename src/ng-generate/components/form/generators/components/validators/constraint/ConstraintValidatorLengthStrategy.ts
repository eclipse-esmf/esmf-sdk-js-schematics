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

import {ConstraintValidatorStrategy} from './ConstraintValidatorStrategy';
import {Constraint, DefaultLengthConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig, ValidatorType} from '../../fields/FormFieldStrategy';

export class ConstraintValidatorLengthStrategy extends ConstraintValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return constraint instanceof DefaultLengthConstraint;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        const typedConstraint = this.constraint as DefaultLengthConstraint;

        if (typedConstraint.minValue === undefined && typedConstraint.maxValue === undefined) {
            return [];
        }

        return [
            {
                name: this.constraint.name,
                type: ValidatorType.Length,
                definition: this.isList()
                    ? `FormValidators.listLengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue})`
                    : this.isComplex()
                    ? `FormValidators.applyToChildren(FormValidators.lengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue}))`
                    : `FormValidators.lengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue})`,
            },
        ];
    }
}
