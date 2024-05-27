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
import {Constraint, DefaultRegularExpressionConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig} from '../validatorsTypes';

export class ConstraintValidatorRegularExpressionStrategy extends ConstraintValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return constraint instanceof DefaultRegularExpressionConstraint;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        const typedConstraint = this.constraint as DefaultRegularExpressionConstraint;

        if (!typedConstraint.value) {
            return [];
        }

        const isApplyToChildren = this.isList() || this.isComplex();

        return [
            {
                name: this.constraint.name,
                definition: isApplyToChildren
                    ? `FormValidators.applyToChildren(FormValidators.regularExpression(/${typedConstraint.value}/))`
                    : `FormValidators.regularExpression(/${typedConstraint.value}/)`,
                isDirectGroupValidator: !isApplyToChildren,
            },
        ];
    }
}
