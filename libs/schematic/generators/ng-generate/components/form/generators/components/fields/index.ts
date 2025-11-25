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

import {SchematicContext} from '@angular-devkit/schematics';
import {FormFieldStrategy} from './FormFieldStrategy';
import {Characteristic, Constraint, DefaultTrait, Property, Trait} from '@esmf/aspect-model-loader';
import {FORM_FIELD_DEFAULT_STRATEGY, FORM_FIELD_STRATEGIES} from './form-field-strategies';

export function getFormFieldStrategy(
  options: any,
  context: SchematicContext,
  parent: Property,
  child: Characteristic | Trait,
  fieldName: string
): FormFieldStrategy {
  const {characteristic, constraints} = getChildData(child);
  const strategy = FORM_FIELD_STRATEGIES.find(strategy => strategy.isTargetStrategy(characteristic)) ?? FORM_FIELD_DEFAULT_STRATEGY;
  return new strategy(options, context, parent, characteristic, fieldName, constraints);
}

function getChildData(child: Characteristic | Trait): {characteristic: Characteristic; constraints: Constraint[]} {
  return child instanceof DefaultTrait
    ? {
        characteristic: child.baseCharacteristic,
        constraints: child.constraints,
      }
    : {
        characteristic: child,
        constraints: [],
      };
}
