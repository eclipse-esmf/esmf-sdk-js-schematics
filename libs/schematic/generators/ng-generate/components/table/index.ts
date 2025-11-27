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

import {chain, Rule, SchematicContext} from '@angular-devkit/schematics';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {
  formatAllFilesRule,
  generateComponent,
  generateGeneralFilesRules,
  insertVersionIntoPathRule,
  insertVersionIntoSelectorRule,
  loadAspectModelRule,
  loadRdfRule,
  options,
  prepareOptions,
  setComponentNameRule,
  setCustomActionsAndFiltersRule,
  setTemplateOptionValuesRule,
} from '../shared/index';
import {ComponentType} from '../shared/schema';
import {generateStorageService} from './generators/services/storage/index';
import {generateColumnMenu} from './generators/components/column-menu/index';
import {generateConfigMenu} from './generators/components/config-menu/index';
import {generateTableComponent} from './generators/components/table/index';
import {generateDataSource} from './generators/data-source/index';
import {TableSchema} from './schema';

export default function (tableSchema: TableSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    generateComponent(context, tableSchema, ComponentType.TABLE);
  };
}

export function generateTable(tableSchema: TableSchema): Rule {
  prepareOptions(tableSchema, ComponentType.TABLE);

  return chain([
    loadRdfRule(),
    loadAspectModelRule(),
    setCustomActionsAndFiltersRule(),
    setComponentNameRule(ComponentType.TABLE),
    insertVersionIntoSelectorRule(),
    insertVersionIntoPathRule(),
    setTemplateOptionValuesRule(),
    ...generateGeneralFilesRules(),
    ...tableSpecificGeneration(),
    // TODO check how we can handle it at in standalone app ...addAndUpdateConfigurationFilesRule(),
    formatAllFilesRule(),
  ]);
}

function tableSpecificGeneration(): Array<Rule> {
  return [
    generateTableComponent(options as TableSchema),
    generateDataSource(options),
    generateStorageService(options), // General
    generateColumnMenu(options), // General
    generateConfigMenu(options), // General
  ];
}
