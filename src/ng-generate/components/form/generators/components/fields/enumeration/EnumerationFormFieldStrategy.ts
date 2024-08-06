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

import {Characteristic, DefaultEnumeration} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';

export class EnumerationFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/enumeration/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultEnumeration;
    }

    buildConfig(): FormFieldConfig {
        const typedChild = this.child as DefaultEnumeration;

        return {
            ...this.getBaseFormFieldConfig(),
            exampleValue: this.parent.exampleValue || '',
            values: typedChild.values,
            validators: this.getValidatorsConfigs(),
        };
    }
}
