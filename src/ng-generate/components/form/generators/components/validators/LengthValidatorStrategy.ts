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

import {ValidatorStrategy} from './ValidatorStrategy';
import {Constraint, DefaultLengthConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig} from '../fields/FormFieldStrategy';

export class LengthValidatorStrategy extends ValidatorStrategy {
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
                definition: `FormValidators.lengthValidator(${typedConstraint.minValue}, ${typedConstraint.maxValue})`,
            },
        ];
    }
}
