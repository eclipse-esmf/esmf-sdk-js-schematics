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

import {Characteristic, DefaultCollection, DefaultList} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class ListFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/list/files';
    hasChildren = false;

    child: DefaultList | DefaultCollection;

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultList || child instanceof DefaultCollection;
    }

    buildConfig(): FormFieldConfig {
        console.warn(this.fieldName);
        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            validators: [...this.getBaseValidatorsConfigs()],
        };
    }
}
