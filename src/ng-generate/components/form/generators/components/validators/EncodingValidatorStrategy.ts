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
import {Constraint, DefaultEncodingConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig} from '../fields/FormFieldStrategy';

export class EncodingValidatorStrategy extends ValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return constraint instanceof DefaultEncodingConstraint;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        const typedConstraint = this.constraint as DefaultEncodingConstraint;
        const type = typedConstraint.value.split('#')[1];

        return type === 'US-ASCII'
            ? [
                  {
                      name: this.constraint.name,
                      definition: `FormValidators.encodingValidator('US-ASCII')`,
                  },
              ]
            : type === 'ISO-8859-1'
            ? [
                  {
                      name: this.constraint.name,
                      definition: `FormValidators.encodingValidator('ISO-8859-1')`,
                  },
              ]
            : type === 'UTF-8'
            ? [
                  {
                      name: this.constraint.name,
                      definition: `FormValidators.encodingValidator('UTF-8')`,
                  },
              ]
            : type === 'UTF-16'
            ? [
                  {
                      name: this.constraint.name,
                      definition: `FormValidators.encodingValidator('UTF-16')`,
                  },
              ]
            : type === 'UTF-16BE'
            ? [
                  {
                      name: this.constraint.name,
                      definition: `FormValidators.encodingValidator('UTF-16BE')`,
                  },
              ]
            : type === 'UTF-16LE'
            ? [
                  {
                      name: this.constraint.name,
                      definition: `FormValidators.encodingValidator('UTF-16LE')`,
                  },
              ]
            : [];
    }
}
