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
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {Observable, Subscriber} from 'rxjs';
import {ComponentType} from '../../components/shared/schema';
import {TypesSchema} from '../../types/schema';
import {generate} from '../index';

export default function (options: TypesSchema) {
  return (tree: Tree, context: SchematicContext) => {
    return new Observable<Tree>((subscriber: Subscriber<Tree>) => {
      generate(subscriber, tree, options, ComponentType.TYPES);
    });
  };
}
