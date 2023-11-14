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

import {ConstraintValidatorDefaultStrategy} from './ConstraintValidatorDefaultStrategy';
import {ConstraintValidatorEncodingStrategy} from './ConstraintValidatorEncodingStrategy';
import {ConstraintValidatorFixedPointStrategy} from './ConstraintValidatorFixedPointStrategy';
import {ConstraintValidatorLengthStrategy} from './ConstraintValidatorLengthStrategy';
import {ConstraintValidatorRangeStrategy} from './ConstraintValidatorRangeStrategy';
import {ConstraintValidatorRegularExpressionStrategy} from './ConstraintValidatorRegularExpressionStrategy';

export const CONSTRAINT_VALIDATOR_STRATEGIES = [
    ConstraintValidatorEncodingStrategy,
    ConstraintValidatorFixedPointStrategy,
    ConstraintValidatorLengthStrategy,
    ConstraintValidatorRangeStrategy,
    ConstraintValidatorRegularExpressionStrategy,
];

export const CONSTRAINT_VALIDATOR_DEFAULT_STRATEGY = ConstraintValidatorDefaultStrategy;
export type ConstraintValidatorStrategyClass = typeof CONSTRAINT_VALIDATOR_STRATEGIES;
