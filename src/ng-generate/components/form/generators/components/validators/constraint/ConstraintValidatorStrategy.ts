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

import {
    Characteristic,
    Constraint,
    DefaultCollection,
    DefaultEither,
    DefaultList,
    DefaultSet,
    DefaultSortedSet,
    DefaultStructuredValue
} from '@esmf/aspect-model-loader';
import {ValidatorConfig} from '../validatorsTypes';

export abstract class ConstraintValidatorStrategy {
    constructor(
        public constraint: Constraint,
        public characteristic: Characteristic,
    ) {}

    static isTargetStrategy(constraint: Constraint): boolean {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    isList(): boolean {
        return (
            this.characteristic instanceof DefaultList ||
            this.characteristic instanceof DefaultCollection ||
            this.characteristic instanceof DefaultSet ||
            this.characteristic instanceof DefaultSortedSet
        );
    }

    isComplex(): boolean {
        return (
            this.characteristic instanceof DefaultEither ||
            this.characteristic instanceof DefaultStructuredValue ||
            (this.characteristic.dataType !== null && !!this.characteristic.dataType?.isComplex)
        );
    }
}
