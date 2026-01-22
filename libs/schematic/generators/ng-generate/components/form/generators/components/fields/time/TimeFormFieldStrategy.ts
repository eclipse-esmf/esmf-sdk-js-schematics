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
    type: DataType.Time,
    placeholder: "'14:23:00', '14:23:00.527634Z', '14:23:00+03:00'",
  },
];
const supportedTypes: DataType[] = typesConfigs.map(dt => dt.type);

export class TimeFormFieldStrategy extends FormFieldStrategy {
  pathToFiles = './generators/components/fields/time/files';
  hasChildren = false;

  static isTargetStrategy(child: Characteristic): boolean {
    const type = this.getShortUrn(child);
    return type ? supportedTypes.includes(type) : false;
  }

  buildConfig(): FormFieldConfig {
    const untypedChild = this.child as any;

    return {
      ...this.getBaseFormFieldConfig(),
      exampleValue: this.parent.exampleValue || '',
      unitName: untypedChild.unit?.name || '',
      validators: this.getValidatorsConfigs([ConstraintValidatorRangeStrategy]),
      placeholder: this.getPlaceholder(),
    };
  }

  getPlaceholder(): string | undefined {
    const type = TimeFormFieldStrategy.getShortUrn(this.child);
    return typesConfigs.find(dt => dt.type === type)?.placeholder;
  }

  getDataTypeValidatorsConfigs(): ValidatorConfig[] {
    const type = FormFieldStrategy.getShortUrn(this.child);

    return type === DataType.Time
      ? [
          {
            name: DataTypeValidator.Time,
            definition: 'FormValidators.timeValidator()',
            isDirectGroupValidator: false,
          },
        ]
      : [];
  }
}
