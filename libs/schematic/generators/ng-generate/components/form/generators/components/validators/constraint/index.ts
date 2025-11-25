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

import {Characteristic, Constraint} from '@esmf/aspect-model-loader';
import {ConstraintValidatorStrategy} from './ConstraintValidatorStrategy';
import {CONSTRAINT_VALIDATOR_DEFAULT_STRATEGY, CONSTRAINT_VALIDATOR_STRATEGIES} from './constraint-validator-strategies';

export function getConstraintValidatorStrategy(constraint: Constraint, characteristic: Characteristic): ConstraintValidatorStrategy {
  const strategy =
    CONSTRAINT_VALIDATOR_STRATEGIES.find(strategy => strategy.isTargetStrategy(constraint)) ?? CONSTRAINT_VALIDATOR_DEFAULT_STRATEGY;
  return new strategy(constraint, characteristic);
}
