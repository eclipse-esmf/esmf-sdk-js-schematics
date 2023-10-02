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

import {Characteristic, DefaultCollection, DefaultList, DefaultSet, DefaultSortedSet} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class ListFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/list/files';
    hasChildren = false;
    isList = true;

    child: DefaultList | DefaultCollection | DefaultSet | DefaultSortedSet;

    static isTargetStrategy(child: Characteristic): boolean {
        return (
            child instanceof DefaultList ||
            child instanceof DefaultCollection ||
            child instanceof DefaultSet ||
            child instanceof DefaultSortedSet
        );
    }

    buildConfig(): FormFieldConfig {
        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            validators: [...this.getBaseValidatorsConfigs()],
            children: this.getChildConfigs(),
            isList: this.isList,
        };
    }

    getChildStrategies(): FormFieldStrategy[] {
        return this.child.elementCharacteristic ? [this.getChildStrategy(this.parent, this.child.elementCharacteristic)] : [];
    }
}
