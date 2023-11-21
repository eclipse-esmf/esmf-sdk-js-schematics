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

import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, ValidatorConfig, ValidatorType} from '../FormFieldStrategy';

export class NumberFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/number/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return (
            urn === 'byte' ||
            urn === 'float' ||
            urn === 'decimal' ||
            urn === 'double' ||
            urn === 'integer' ||
            urn === 'int' ||
            urn === 'positiveInteger' ||
            urn === 'long' ||
            urn === 'negativeInteger' ||
            urn === 'nonPositiveInteger' ||
            urn === 'nonNegativeInteger' ||
            urn === 'short' ||
            urn === 'unsignedInt' ||
            urn === 'unsignedByte' ||
            urn === 'unsignedLong' ||
            urn === 'unsignedShort'
        );
    }

    buildConfig(): FormFieldConfig {
        const untypedChild = this.child as any;

        return {
            ...this.getBaseFormFieldConfig(),
            exampleValue: this.parent.exampleValue || '',
            unitName: untypedChild.unit?.name || '',
            validators: this.getValidatorsConfigs(),
        };
    }

    getDataTypeValidatorsConfigs(): ValidatorConfig[] {
        const urn = FormFieldStrategy.getShortUrn(this.child);

        return urn === 'byte'
            ? [
                  {
                      name: 'byte',
                      type: ValidatorType.Byte,
                      definition: 'FormValidators.byteValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'float'
            ? [
                  {
                      name: 'float',
                      type: ValidatorType.Float,
                      definition: 'FormValidators.floatValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'decimal'
            ? [
                  {
                      name: 'decimal',
                      type: ValidatorType.Decimal,
                      definition: 'FormValidators.decimalValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'double'
            ? [
                  {
                      name: 'double',
                      type: ValidatorType.Double,
                      definition: 'FormValidators.doubleValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'integer'
            ? [
                  {
                      name: 'integer',
                      type: ValidatorType.Integer,
                      definition: 'FormValidators.integerValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'int'
            ? [
                  {
                      name: 'int',
                      type: ValidatorType.Int,
                      definition: 'FormValidators.intValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'positiveInteger'
            ? [
                  {
                      name: 'positiveInteger',
                      type: ValidatorType.PositiveInteger,
                      definition: 'FormValidators.positiveIntegerValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'long'
            ? [
                  {
                      name: 'long',
                      type: ValidatorType.Long,
                      definition: 'FormValidators.longValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'negativeInteger'
            ? [
                  {
                      name: 'negativeInteger',
                      type: ValidatorType.NegativeInteger,
                      definition: 'FormValidators.negativeIntegerValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'nonPositiveInteger'
            ? [
                  {
                      name: 'nonPositiveInteger',
                      type: ValidatorType.NonPositiveInteger,
                      definition: 'FormValidators.nonPositiveIntegerValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'nonNegativeInteger'
            ? [
                  {
                      name: 'nonNegativeInteger',
                      type: ValidatorType.NonNegativeInteger,
                      definition: 'FormValidators.nonNegativeIntegerValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'short'
            ? [
                  {
                      name: 'short',
                      type: ValidatorType.Short,
                      definition: 'FormValidators.shortValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'unsignedInt'
            ? [
                  {
                      name: 'unsignedInt',
                      type: ValidatorType.UnsignedInt,
                      definition: 'FormValidators.unsignedIntValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'unsignedByte'
            ? [
                  {
                      name: 'unsignedByte',
                      type: ValidatorType.UnsignedByte,
                      definition: 'FormValidators.unsignedByteValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'unsignedLong'
            ? [
                  {
                      name: 'unsignedLong',
                      type: ValidatorType.UnsignedLong,
                      definition: 'FormValidators.unsignedLongValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'unsignedShort'
            ? [
                  {
                      name: 'unsignedShort',
                      type: ValidatorType.UnsignedShort,
                      definition: 'FormValidators.unsignedShortValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : [
                  {
                      name: 'number',
                      type: ValidatorType.Number,
                      definition: 'FormValidators.numberValidator()',
                      isDirectGroupValidator: false,
                  },
              ];
    }
}
