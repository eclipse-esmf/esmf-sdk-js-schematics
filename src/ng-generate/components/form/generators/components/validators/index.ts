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

import {Constraint} from '@esmf/aspect-model-loader';
import {ValidatorStrategy} from './ValidatorStrategy';
import {VALIDATOR_DEFAULT_STRATEGY, VALIDATOR_STRATEGIES} from './validator-strategies';

export function getValidatorStrategy(constraint: Constraint): ValidatorStrategy {
    const strategy = VALIDATOR_STRATEGIES.find(strategy => strategy.isTargetStrategy(constraint)) ?? VALIDATOR_DEFAULT_STRATEGY;
    return new strategy(constraint);
}
