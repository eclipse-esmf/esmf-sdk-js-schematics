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
import {Constraint, DefaultRangeConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig, ValidatorType} from '../../fields/FormFieldStrategy';

export class ConstraintValidatorRangeStrategy extends ConstraintValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return constraint instanceof DefaultRangeConstraint;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        const typedConstraint = this.constraint as DefaultRangeConstraint;

        if (typedConstraint.minValue === undefined && typedConstraint.maxValue === undefined) {
            return [];
        }

        const isApplyToChildren = this.isList() || this.isComplex();

        return [
            {
                name: this.constraint.name,
                type: ValidatorType.Range,
                definition: isApplyToChildren
                    ? `FormValidators.applyToChildren(FormValidators.rangeValidator(${typedConstraint.minValue}, "${typedConstraint.lowerBoundDefinition}", ${typedConstraint.maxValue}, "${typedConstraint.upperBoundDefinition}"))`
                    : `FormValidators.rangeValidator(${typedConstraint.minValue}, "${typedConstraint.lowerBoundDefinition}", ${typedConstraint.maxValue}, "${typedConstraint.upperBoundDefinition}")`,
            },
        ];
    }
}
