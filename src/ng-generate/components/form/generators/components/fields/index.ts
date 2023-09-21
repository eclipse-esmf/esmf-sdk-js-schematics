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

import {SchematicContext} from '@angular-devkit/schematics';
import {FormFieldStrategy} from './FormFieldStrategy';
import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {FORM_FIELD_DEFAULT_STRATEGY, FORM_FIELD_STRATEGIES} from './form-field-strategies';

export function getFormFieldStrategy(
    options: any,
    context: SchematicContext,
    parent: Property,
    child: Characteristic,
    fieldName: string
): FormFieldStrategy {
    // TODO: Handle
    // if (property.characteristic instanceof options.collection)

    const strategy = FORM_FIELD_STRATEGIES.find(strategy => strategy.isTargetStrategy(child)) ?? FORM_FIELD_DEFAULT_STRATEGY;
    return new strategy(options, context, parent, child, fieldName);
}
