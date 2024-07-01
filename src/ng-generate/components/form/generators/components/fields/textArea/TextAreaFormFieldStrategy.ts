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

import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {DataType, DataTypeValidator, ValidatorConfig} from '../../validators/validatorsTypes';

export class TextAreaFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/textArea/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const type = this.getShortUrn(child);
        return type === DataType.LangString;
    }

    buildConfig(): FormFieldConfig {
        const untypedChild = this.child as any;

        return {
            ...this.getBaseFormFieldConfig(),
            exampleValue: this.parent.exampleValue || '',
            unitName: untypedChild.unit?.name || '',
            validators: this.getValidatorsConfigs(),
        };
    }

    getDataTypeValidatorsConfigs(): ValidatorConfig[] {
        const type = FormFieldStrategy.getShortUrn(this.child);

        return type === DataType.LangString
            ? [
                  {
                      name: DataTypeValidator.LangString,
                      definition: 'FormValidators.langStringValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : [];
    }
}
