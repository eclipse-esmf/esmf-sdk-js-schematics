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
        type: 'time',
        placeholder: "'14:23:00', '14:23:00.527634Z', '14:23:00+03:00'",
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class TimeFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/time/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn ? supportedTypes.includes(urn) : false;
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
        const urn = TimeFormFieldStrategy.getShortUrn(this.child);
        return typesConfigs.find(dt => dt.type === urn)?.placeholder;
    }

    getDataTypeValidatorsConfigs(): ValidatorConfig[] {
        const urn = FormFieldStrategy.getShortUrn(this.child);

        return urn === 'time'
            ? [
                  {
                      name: 'time',
                      type: ValidatorType.Time,
                      definition: 'FormValidators.timeValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : [];
    }
}
