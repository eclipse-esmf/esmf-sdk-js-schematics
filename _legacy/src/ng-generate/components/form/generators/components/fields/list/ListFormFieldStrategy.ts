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

import {Characteristic, DefaultCollection, DefaultEntity, DefaultList, DefaultSet, DefaultSortedSet} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';

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
            ...this.getBaseFormFieldConfig(),
            validators: this.getValidatorsConfigs(),
            children: this.getChildConfigs(),
            isList: this.isList,
            isScalarChild: this.isScalarChild(),
        };
    }

    getChildStrategies(): FormFieldStrategy[] {
        return this.child.dataType instanceof DefaultEntity
            ? this.child.dataType.properties.map(property => this.getChildStrategy(property, property.characteristic))
            : this.isScalarChild()
              ? [this.getChildStrategy(this.parent, this.child.elementCharacteristic!)]
              : [];
    }

    private isScalarChild(): boolean {
        return !!this.child.elementCharacteristic;
    }
}
