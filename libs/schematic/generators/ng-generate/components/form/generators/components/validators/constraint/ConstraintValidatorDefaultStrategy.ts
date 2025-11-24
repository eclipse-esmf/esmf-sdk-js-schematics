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
import {Constraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig} from '../validatorsTypes';

export class ConstraintValidatorDefaultStrategy extends ConstraintValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return true;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        return [];
    }
}
