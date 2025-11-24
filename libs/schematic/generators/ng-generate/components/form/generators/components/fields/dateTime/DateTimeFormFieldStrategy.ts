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
import {ConstraintValidatorRangeStrategy} from '../../validators/constraint/ConstraintValidatorRangeStrategy';
import {DataType} from '../../validators/validatorsTypes';

const DEFAULT_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ';
const typesConfigs = [
  {
    type: DataType.DateTime,
    format: 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ',
  },
  {
    type: DataType.DateTimeStamp,
    format: 'YYYY-MM-DDTHH:mm:ss.SSSSSZ',
  },
];
const supportedTypes: DataType[] = typesConfigs.map(dt => dt.type);

export class DateTimeFormFieldStrategy extends FormFieldStrategy {
  pathToFiles = './generators/components/fields/dateTime/files';
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
      dataFormat: this.getDataFormat(),
    };
  }

  getDataFormat(): string {
    const type = DateTimeFormFieldStrategy.getShortUrn(this.child);
    const format = typesConfigs.find(dt => dt.type === type)?.format;
    return format || DEFAULT_FORMAT;
  }
}
