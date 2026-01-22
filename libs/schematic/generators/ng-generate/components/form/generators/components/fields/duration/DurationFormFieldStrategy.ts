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
import {ConstraintValidatorRangeStrategy} from '../../validators/constraint/ConstraintValidatorRangeStrategy';
import {DataType, DataTypeValidator, ValidatorConfig} from '../../validators/validatorsTypes';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';

const typesConfigs = [
  {
    type: DataType.Duration,
    placeholder: "'P30D', '-P1Y2M3DT1H', 'PT1H5M0S'",
  },
  {
    type: DataType.DayTimeDuration,
    placeholder: "'P30D', 'P1DT5H', 'PT1H5M0S'",
  },
  {
    type: DataType.YearMonthDuration,
    placeholder: "'P10M', 'P5Y2M'",
  },
];
const supportedTypes: DataType[] = typesConfigs.map(dt => dt.type);

export class DurationFormFieldStrategy extends FormFieldStrategy {
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
    const type = DurationFormFieldStrategy.getShortUrn(this.child);
    return typesConfigs.find(dt => dt.type === type)?.placeholder;
  }

  getDataTypeValidatorsConfigs(): ValidatorConfig[] {
    const type = FormFieldStrategy.getShortUrn(this.child);

    return type === DataType.Duration
      ? [
          {
            name: DataTypeValidator.Duration,
            definition: 'FormValidators.durationValidator()',
            isDirectGroupValidator: false,
          },
        ]
      : type === DataType.DayTimeDuration
        ? [
            {
              name: DataTypeValidator.DayTimeDuration,
              definition: 'FormValidators.dayTimeDurationValidator()',
              isDirectGroupValidator: false,
            },
          ]
        : type === DataType.YearMonthDuration
          ? [
              {
                name: DataTypeValidator.YearMonthDuration,
                definition: 'FormValidators.yearMonthDurationValidator()',
                isDirectGroupValidator: false,
              },
            ]
          : [];
  }
}
