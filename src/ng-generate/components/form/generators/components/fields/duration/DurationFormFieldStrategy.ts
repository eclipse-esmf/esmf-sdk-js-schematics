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

const typesConfigs = [
    {
        type: 'dayTimeDuration',
        placeholder: "'P30D', 'P1DT5H', 'PT1H5M0S'",
    },
    {
        type: 'duration',
        placeholder: "'P30D', '-P1Y2M3DT1H', 'PT1H5M0S'",
    },
    {
        type: 'yearMonthDuration',
        placeholder: "'P10M', 'P5Y2M'",
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class DurationFormFieldStrategy extends FormFieldStrategy {
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
            validators: [...this.getBaseValidatorsConfigs()],
            placeholder: this.getPlaceholder(),
        };
    }

    getPlaceholder(): string | undefined {
        const urn = DurationFormFieldStrategy.getShortUrn(this.child);
        return typesConfigs.find(dt => dt.type === urn)?.placeholder;
    }
}
