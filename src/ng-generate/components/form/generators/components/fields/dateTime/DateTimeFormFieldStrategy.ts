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

const DEFAULT_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ';
const typesConfigs = [
    {
        type: 'dateTime',
        format: 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ',
    },
    {
        type: 'dateTimeStamp',
        format: 'YYYY-MM-DDTHH:mm:ss.SSSSSZ',
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class DateTimeFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/dateTime/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn ? supportedTypes.includes(urn) : false;
    }

    buildConfig(): FormFieldConfig {
        return {
            ...this.getBaseFormFieldConfig(),
            exampleValue: this.parent.exampleValue || '',
            validators: [...this.getBaseValidatorsConfigs()],
            dataFormat: this.getDataFormat(),
        };
    }

    getDataFormat(): string {
        const urn = DateTimeFormFieldStrategy.getShortUrn(this.child);
        const format = typesConfigs.find(dt => dt.type === urn)?.format;
        return format || DEFAULT_FORMAT;
    }
}
