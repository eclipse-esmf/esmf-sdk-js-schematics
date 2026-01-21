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

import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {NodeDependencyType} from '@schematics/angular/utility/dependencies';
import ora from 'ora';
import {formatGeneratedFiles} from '../../utils/file';
import {addPackageJsonDependencies, addPackageJsonScripts} from '../../utils/package-json';
import {TemplateHelper} from '../../utils/template-helper';
import {generateTranslationModule} from '../components/shared/generators/index';
import {Schema} from './schema';

/**
 * Updates the project with dependencies, scripts, and modules required for translation functionality.
 *
 * @param {Schema} options - The options configured for the schematics command.
 *
 * @returns {Rule} - The rule to be applied to the Tree.
 */
export default function (options: Schema): Rule {
  const spinner = ora().start();
  options.spinner = spinner;
  (options as any).templateHelper = new TemplateHelper();
  return chain([
    addPackageJsonDependencies(options.skipImport, spinner, dependencies),
    addPackageJsonScripts(scripts),
    generateTranslationModule(options),
    formatGeneratedFiles(
      {
        getPath() {
          return `src/app/shared`;
        },
      },
      options,
      ['app-shared.module.ts'],
    ),
    installPackages(),
  ]);
}

const dependencies = [
  {type: NodeDependencyType.Default, version: '^7.4.2', name: '@jsverse/transloco-locale', overwrite: false},
  {type: NodeDependencyType.Default, version: '~1.2.0', name: 'ngx-i18n-combine', overwrite: false},
];

const scripts = [
  {
    name: 'combine-i18n',
    command: 'ngx-i18n-combine -i ./src/**/i18n/shared/components/**/*.translation.json -o ./src/assets/i18n/{en,de}.json',
  },
];

function installPackages(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return tree;
  };
}
