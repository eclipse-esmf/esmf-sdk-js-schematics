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
import {strings} from '@angular-devkit/core';

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
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            exampleValue: this.parent.exampleValue || '',
            unitName: untypedChild.unit?.name || '',
            validators: [...this.getBaseValidatorsConfigs()],
        };
    }
}
