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
import {Constraint, DefaultEncodingConstraint} from '@esmf/aspect-model-loader';
import {ValidatorConfig, ValidatorType} from '../../fields/FormFieldStrategy';

export class ConstraintValidatorEncodingStrategy extends ConstraintValidatorStrategy {
    static isTargetStrategy(constraint: Constraint): boolean {
        return constraint instanceof DefaultEncodingConstraint;
    }

    getValidatorsConfigs(): ValidatorConfig[] {
        const typedConstraint = this.constraint as DefaultEncodingConstraint;
        const type = typedConstraint.value.split('#')[1];
        const isApplyToChildren = this.isList() || this.isComplex();

        return type === 'US-ASCII'
            ? [
                  {
                      name: this.constraint.name,
                      type: ValidatorType.Encoding,
                      definition: isApplyToChildren
                          ? `FormValidators.applyToChildren(FormValidators.encodingValidator('US-ASCII'))`
                          : `FormValidators.encodingValidator('US-ASCII')`,
                      isDirectGroupValidator: !isApplyToChildren,
                  },
              ]
            : type === 'ISO-8859-1'
            ? [
                  {
                      name: this.constraint.name,
                      type: ValidatorType.Encoding,
                      definition: isApplyToChildren
                          ? `FormValidators.applyToChildren(FormValidators.encodingValidator('ISO-8859-1'))`
                          : `FormValidators.encodingValidator('ISO-8859-1')`,
                      isDirectGroupValidator: !isApplyToChildren,
                  },
              ]
            : type === 'UTF-8'
            ? [
                  {
                      name: this.constraint.name,
                      type: ValidatorType.Encoding,
                      definition: isApplyToChildren
                          ? `FormValidators.applyToChildren(FormValidators.encodingValidator('UTF-8'))`
                          : `FormValidators.encodingValidator('UTF-8')`,
                      isDirectGroupValidator: !isApplyToChildren,
                  },
              ]
            : type === 'UTF-16'
            ? [
                  {
                      name: this.constraint.name,
                      type: ValidatorType.Encoding,
                      definition: isApplyToChildren
                          ? `FormValidators.applyToChildren(FormValidators.encodingValidator('UTF-16'))`
                          : `FormValidators.encodingValidator('UTF-16')`,
                      isDirectGroupValidator: !isApplyToChildren,
                  },
              ]
            : type === 'UTF-16BE'
            ? [
                  {
                      name: this.constraint.name,
                      type: ValidatorType.Encoding,
                      definition: isApplyToChildren
                          ? `FormValidators.applyToChildren(FormValidators.encodingValidator('UTF-16BE'))`
                          : `FormValidators.encodingValidator('UTF-16BE')`,
                      isDirectGroupValidator: !isApplyToChildren,
                  },
              ]
            : type === 'UTF-16LE'
            ? [
                  {
                      name: this.constraint.name,
                      type: ValidatorType.Encoding,
                      definition: isApplyToChildren
                          ? `FormValidators.applyToChildren(FormValidators.encodingValidator('UTF-16LE'))`
                          : `FormValidators.encodingValidator('UTF-16LE')`,
                      isDirectGroupValidator: !isApplyToChildren,
                  },
              ]
            : [];
    }
}
