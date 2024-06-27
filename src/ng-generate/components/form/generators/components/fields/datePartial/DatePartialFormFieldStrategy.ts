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
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {ConstraintValidatorRangeStrategy} from '../../validators/constraint/ConstraintValidatorRangeStrategy';
import {DataType, DataTypeValidator, ValidatorConfig} from '../../validators/validatorsTypes';

const typesConfigs = [
    {
        type: DataType.GDay,
        placeholder: "'---04', '---04+03:00'",
    },
    {
        type: DataType.GMonth,
        placeholder: "'--04', '--04+03:00'",
    },
    {
        type: DataType.GYear,
        placeholder: "'2000', '2000+03:00'",
    },
    {
        type: DataType.GMonthDay,
        placeholder: "'--01-01', '--01-01+03:00'",
    },
    {
        type: DataType.GYearMonth,
        placeholder: "'2000-01', '2000-01+03:00'",
    },
];
const supportedTypes: DataType[] = typesConfigs.map(dt => dt.type);

export class DatePartialFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/duration/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const type = this.getShortUrn(child);
        return type ? supportedTypes.includes(type) : false;
    }

    buildConfig(): FormFieldConfig {
        return {
            ...this.getBaseFormFieldConfig(),
            exampleValue: this.parent.exampleValue || '',
            validators: this.getValidatorsConfigs([ConstraintValidatorRangeStrategy]),
            placeholder: this.getPlaceholder(),
        };
    }

    getPlaceholder(): string | undefined {
        const type = DatePartialFormFieldStrategy.getShortUrn(this.child);
        return typesConfigs.find(dt => dt.type === type)?.placeholder;
    }

    getDataTypeValidatorsConfigs(): ValidatorConfig[] {
        const type = FormFieldStrategy.getShortUrn(this.child);

        return type === DataType.GDay
            ? [
                  {
                      name: DataTypeValidator.GDay,
                      definition: 'FormValidators.gDayValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : type === DataType.GMonth
              ? [
                    {
                        name: DataTypeValidator.GMonth,
                        definition: 'FormValidators.gMonthValidator()',
                        isDirectGroupValidator: false,
                    },
                ]
              : type === DataType.GYear
                ? [
                      {
                          name: DataTypeValidator.GYear,
                          definition: 'FormValidators.gYearValidator()',
                          isDirectGroupValidator: false,
                      },
                  ]
                : type === DataType.GMonthDay
                  ? [
                        {
                            name: DataTypeValidator.GMonthDay,
                            definition: 'FormValidators.gMonthDayValidator()',
                            isDirectGroupValidator: false,
                        },
                    ]
                  : type === DataType.GYearMonth
                    ? [
                          {
                              name: DataTypeValidator.GYearMonth,
                              definition: 'FormValidators.gYearMonthValidator()',
                              isDirectGroupValidator: false,
                          },
                      ]
                    : [];
    }
}
