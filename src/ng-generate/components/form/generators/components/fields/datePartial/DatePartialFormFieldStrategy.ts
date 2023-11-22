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
import {ConstraintValidatorRangeStrategy} from '../../validators/constraint/ConstraintValidatorRangeStrategy';

const typesConfigs = [
    {
        type: 'gDay',
        placeholder: "'---04', '---04+03:00'",
    },
    {
        type: 'gMonth',
        placeholder: "'--04', '--04+03:00'",
    },
    {
        type: 'gYear',
        placeholder: "'2000', '2000+03:00'",
    },
    {
        type: 'gMonthDay',
        placeholder: "'--01-01', '--01-01+03:00'",
    },
    {
        type: 'gYearMonth',
        placeholder: "'2000-01', '2000-01+03:00'",
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class DatePartialFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/duration/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn ? supportedTypes.includes(urn) : false;
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
        const urn = DatePartialFormFieldStrategy.getShortUrn(this.child);
        return typesConfigs.find(dt => dt.type === urn)?.placeholder;
    }

    getDataTypeValidatorsConfigs(): ValidatorConfig[] {
        const urn = FormFieldStrategy.getShortUrn(this.child);

        return urn === 'gDay'
            ? [
                  {
                      name: 'gDay',
                      type: ValidatorType.GDay,
                      definition: 'FormValidators.gDayValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'gMonth'
            ? [
                  {
                      name: 'gMonth',
                      type: ValidatorType.GMonth,
                      definition: 'FormValidators.gMonthValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'gYear'
            ? [
                  {
                      name: 'gYear',
                      type: ValidatorType.GYear,
                      definition: 'FormValidators.gYearValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'gMonthDay'
            ? [
                  {
                      name: 'gMonthDay',
                      type: ValidatorType.GMonthDay,
                      definition: 'FormValidators.gMonthDayValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'gYearMonth'
            ? [
                  {
                      name: 'gYearMonth',
                      type: ValidatorType.GYearMonth,
                      definition: 'FormValidators.gYearMonthValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : [];
    }
}
