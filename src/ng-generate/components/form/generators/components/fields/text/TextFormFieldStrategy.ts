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
import {DataType, DataTypeValidator, ValidatorConfig} from '../../validators/validatorsTypes';

export class TextFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/text/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const type = this.getShortUrn(child);
        return (
            type === DataType.String ||
            type === DataType.AnyURI ||
            type === DataType.HexBinary ||
            type === DataType.Curie ||
            type === DataType.Base64Binary
        );
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

        return type === DataType.HexBinary
            ? [
                  {
                      name: DataTypeValidator.HexBinary,
                      definition: 'FormValidators.hexBinaryValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : type === DataType.Base64Binary
            ? [
                  {
                      name: DataTypeValidator.Base64Binary,
                      definition: 'FormValidators.base64BinaryValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : type === DataType.AnyURI
            ? [
                  {
                      name: DataTypeValidator.AnyURI,
                      definition: 'FormValidators.anyUriValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : type === DataType.Curie
            ? [
                  {
                      name: DataTypeValidator.Curie,
                      definition: 'FormValidators.curieValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : [];
    }
}
