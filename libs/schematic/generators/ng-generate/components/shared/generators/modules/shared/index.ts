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
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
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
import {addModuleImportToModule} from '@angular/cdk/schematics';

/**
 * Generates a shared module and adds it to the app module.
 * The method is used at forms generation only
 * @param options
 */
export function generateSharedModule(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    options.module = `${dasherize(options.name)}.module.ts`;

    const sourcePath = options.path.replace('src/app', '.');
    const modulePath = `${sourcePath}/${dasherize(options.name)}.module.ts`;
    addModuleImportToModule(tree, '/src/app/app.module.ts', `${classify(options.name)}Module`, `${modulePath.replace('.ts', '')}`);

    return mergeWith(
      apply(url('../shared/generators/modules/shared/files'), [
        applyTemplates({
          classify: strings.classify,
          dasherize: strings.dasherize,
          options: options,
          name: options.name,
        }),
        move(options.path),
      ]),
      options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
    );
  };
}
