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
import {FormFieldConfig, FormFieldStrategy, ValidatorConfig, ValidatorType} from '../FormFieldStrategy';

export class TextFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/text/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn === 'string' || urn === 'anyURI' || urn === 'hexBinary' || urn === 'curie' || urn === 'base64Binary';
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
        const urn = FormFieldStrategy.getShortUrn(this.child);

        return urn === 'hexBinary'
            ? [
                  {
                      name: 'hexBinary',
                      type: ValidatorType.HexBinary,
                      definition: 'FormValidators.hexBinaryValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'base64Binary'
            ? [
                  {
                      name: 'base64Binary',
                      type: ValidatorType.Base64Binary,
                      definition: 'FormValidators.base64BinaryValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'anyURI'
            ? [
                  {
                      name: 'anyURI',
                      type: ValidatorType.AnyURI,
                      definition: 'FormValidators.anyUriValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : urn === 'curie'
            ? [
                  {
                      name: 'curie',
                      type: ValidatorType.Curie,
                      definition: 'FormValidators.curieValidator()',
                      isDirectGroupValidator: false,
                  },
              ]
            : [];
    }
}
