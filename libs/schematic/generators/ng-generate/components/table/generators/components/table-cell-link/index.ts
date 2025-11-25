/*
 * Copyright Robert Bosch Manufacturing Solutions GmbH, Germany. All rights reserved.
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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';

export function generateTableCellLinkComponent(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return mergeWith(
      apply(url('./generators/components/table-cell-link/files'), [
        applyTemplates({
          classify: strings.classify,
          dasherize: strings.dasherize,
          options: options,
          name: 'esmf-table-cell-link',
        }),
        move('src/app/shared/components/table-cell-link'),
      ]),
      options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
    );
  };
}
