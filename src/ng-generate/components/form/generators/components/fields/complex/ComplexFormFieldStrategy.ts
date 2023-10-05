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

import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {getFormFieldStrategy} from '../index';

export class ComplexFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/complex/files';
    hasChildren = true;

    static isTargetStrategy(child: Characteristic): boolean {
        return child.dataType !== null && !!child.dataType?.isComplex;
    }

    buildConfig(): FormFieldConfig {
        return {
            ...this.getBaseFormFieldConfig(),
            validators: [...this.getBaseValidatorsConfigs()],
            children: this.getChildConfigs(),
        };
    }

    getChildStrategies(): FormFieldStrategy[] {
        const untypedDataType = this.child.dataType as any;
        return untypedDataType?.properties
            ? untypedDataType.properties.map((p: Property) => this.getChildStrategy(p, p.characteristic))
            : [];
    }

    getChildStrategy(parent: Property, child: Characteristic): FormFieldStrategy {
        return getFormFieldStrategy(this.options, this.context, parent, child, parent.name);
    }
}
