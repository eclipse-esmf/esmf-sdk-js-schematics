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

import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {DataType, DataTypeValidator, GenericValidator, ValidatorConfig} from '../../validators/validatorsTypes';

export class NumberFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/number/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const type = this.getShortUrn(child);
        return (
            type === DataType.Byte ||
            type === DataType.Float ||
            type === DataType.Decimal ||
            type === DataType.Double ||
            type === DataType.Integer ||
            type === DataType.Int ||
            type === DataType.PositiveInteger ||
            type === DataType.Long ||
            type === DataType.NegativeInteger ||
            type === DataType.NonPositiveInteger ||
            type === DataType.NonNegativeInteger ||
            type === DataType.Short ||
            type === DataType.UnsignedInt ||
            type === DataType.UnsignedByte ||
            type === DataType.UnsignedLong ||
            type === DataType.UnsignedShort
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
        const type = FormFieldStrategy.getShortUrn(this.child);

        return type === DataType.Byte
            ? [
                  {
                      name: DataTypeValidator.Byte,
                      definition: 'FormValidators.byteValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : type === DataType.Float
              ? [
                    {
                        name: DataTypeValidator.Float,
                        definition: 'FormValidators.floatValidator()',
                        isDirectGroupValidator: false,
                    },
                ]
              : type === DataType.Decimal
                ? [
                      {
                          name: DataTypeValidator.Decimal,
                          definition: 'FormValidators.decimalValidator()',
                          isDirectGroupValidator: false,
                      },
                  ]
                : type === DataType.Double
                  ? [
                        {
                            name: DataTypeValidator.Double,
                            definition: 'FormValidators.doubleValidator()',
                            isDirectGroupValidator: false,
                        },
                    ]
                  : type === DataType.Integer
                    ? [
                          {
                              name: DataTypeValidator.Integer,
                              definition: 'FormValidators.integerValidator()',
                              isDirectGroupValidator: false,
                          },
                      ]
                    : type === DataType.Int
                      ? [
                            {
                                name: DataTypeValidator.Int,
                                definition: 'FormValidators.intValidator()',
                                isDirectGroupValidator: false,
                            },
                        ]
                      : type === DataType.PositiveInteger
                        ? [
                              {
                                  name: DataTypeValidator.PositiveInteger,
                                  definition: 'FormValidators.positiveIntegerValidator()',
                                  isDirectGroupValidator: false,
                              },
                          ]
                        : type === DataType.Long
                          ? [
                                {
                                    name: DataTypeValidator.Long,
                                    definition: 'FormValidators.longValidator()',
                                    isDirectGroupValidator: false,
                                },
                            ]
                          : type === DataType.NegativeInteger
                            ? [
                                  {
                                      name: DataTypeValidator.NegativeInteger,
                                      definition: 'FormValidators.negativeIntegerValidator()',
                                      isDirectGroupValidator: false,
                                  },
                              ]
                            : type === DataType.NonPositiveInteger
                              ? [
                                    {
                                        name: DataTypeValidator.NonPositiveInteger,
                                        definition: 'FormValidators.nonPositiveIntegerValidator()',
                                        isDirectGroupValidator: false,
                                    },
                                ]
                              : type === DataType.NonNegativeInteger
                                ? [
                                      {
                                          name: DataTypeValidator.NonNegativeInteger,
                                          definition: 'FormValidators.nonNegativeIntegerValidator()',
                                          isDirectGroupValidator: false,
                                      },
                                  ]
                                : type === DataType.Short
                                  ? [
                                        {
                                            name: DataTypeValidator.Short,
                                            definition: 'FormValidators.shortValidator()',
                                            isDirectGroupValidator: false,
                                        },
                                    ]
                                  : type === DataType.UnsignedInt
                                    ? [
                                          {
                                              name: DataTypeValidator.UnsignedInt,
                                              definition: 'FormValidators.unsignedIntValidator()',
                                              isDirectGroupValidator: false,
                                          },
                                      ]
                                    : type === DataType.UnsignedByte
                                      ? [
                                            {
                                                name: DataTypeValidator.UnsignedByte,
                                                definition: 'FormValidators.unsignedByteValidator()',
                                                isDirectGroupValidator: false,
                                            },
                                        ]
                                      : type === DataType.UnsignedLong
                                        ? [
                                              {
                                                  name: DataTypeValidator.UnsignedLong,
                                                  definition: 'FormValidators.unsignedLongValidator()',
                                                  isDirectGroupValidator: false,
                                              },
                                          ]
                                        : type === DataType.UnsignedShort
                                          ? [
                                                {
                                                    name: DataTypeValidator.UnsignedShort,
                                                    definition: 'FormValidators.unsignedShortValidator()',
                                                    isDirectGroupValidator: false,
                                                },
                                            ]
                                          : [
                                                {
                                                    name: GenericValidator.Number,
                                                    definition: 'FormValidators.numberValidator()',
                                                    isDirectGroupValidator: false,
                                                },
                                            ];
    }
}
