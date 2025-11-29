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
import {ComponentType, Values} from '../shared/schema';
import {generateTableComponent} from './generators/components/table/index';
import {TableSchema} from './schema';
import {LOG_COLOR} from '../../../utils/constants';
import {generateCustomService, generateFilterService, generateSemanticExplanation} from '../shared/generators';
import {generateTranslationFiles} from '../../../utils/aspect-model';
import {wrapBuildComponentExecution} from '../../../utils/angular';

export default function (tableSchema: TableSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    generateComponent(context, tableSchema, ComponentType.TABLE);
  };
}

export function generateTable(tableSchema: TableSchema): Rule {
  console.log(LOG_COLOR, 'Start generating Table component...');

  prepareOptions(tableSchema, ComponentType.TABLE);

  return chain([
    loadRdfRule(),
    loadAspectModelRule(),
    setCustomActionsAndFiltersRule(),
    setComponentNameRule(ComponentType.TABLE),
    insertVersionIntoSelectorRule(),
    insertVersionIntoPathRule(),
    setTemplateOptionValuesRule(),
    generateFilterService(options),
    // TODO remove the method call generateGeneralStyle(options),
    generateTranslationFiles(options, false),
    wrapBuildComponentExecution(options),
    generateCustomService(options),
    generateSemanticExplanation(options as Values),
    generateTableComponent(options as TableSchema),
    // TODO check how we can handle it at in standalone app ...addAndUpdateConfigurationFilesRule(),
    formatAllFilesRule(),
  ]);
}
