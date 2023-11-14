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

import {Characteristic, DefaultEither} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, ValidatorType} from '../FormFieldStrategy';

export class EitherFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/either/files';
    hasChildren = true;

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultEither;
    }

    buildConfig(): FormFieldConfig {
        return {
            ...this.getBaseFormFieldConfig(),
            validators: [
                ...this.getValidatorsConfigs(),
                {
                    name: 'uniqueValues',
                    type: ValidatorType.UniqueValues,
                    definition: 'FormValidators.uniqueValuesValidator()',
                    isDirectGroupValidator: true,
                },
            ],
            children: this.getChildConfigs(),
        };
    }

    getChildStrategies(): FormFieldStrategy[] {
        const typedChild = this.child as DefaultEither;
        return [this.getChildStrategy(this.parent, typedChild.left), this.getChildStrategy(this.parent, typedChild.right)];
    }
}
