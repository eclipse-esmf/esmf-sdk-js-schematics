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

import {strings} from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url
} from '@angular-devkit/schematics';

export function generateExportCardDialog(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return mergeWith(
      apply(url('./generators/components/export-dialog/files'), [
        applyTemplates({
          classify: strings.classify,
          dasherize: strings.dasherize,
          options: options,
          name: 'export-card-dialog',
        }),
        move('src/app/shared/components/export-confirmation-dialog'),
      ]),
      options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
    );
  };
}
