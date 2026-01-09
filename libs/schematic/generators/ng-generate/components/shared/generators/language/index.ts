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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {DefaultEntityInstance, DefaultEnumeration, Property} from '@esmf/aspect-model-loader';
import {dasherize} from '@angular-devkit/core/src/utils/strings';
import {isArrayOfStrings} from '../../../../../utils/type-guards';
import {normalizeActionName} from '../../../../../utils/config-helper';

let sharedOptions: any = {};

export function generateLanguageTranslationAsset(options: any, assetsPath: string, language: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    sharedOptions = options;

    return mergeWith(
      apply(url('../shared/generators/language/files'), [
        applyTemplates({
          classify: strings.classify,
          dasherize: strings.dasherize,
          options: sharedOptions,
          name: `${language}.${dasherize(options.name)}`,
          aspectModelName: sharedOptions.aspectModel.name,
          selectedModelElementName: sharedOptions.selectedModelElement.name,
          preferredName: sharedOptions.aspectModel.getPreferredName(language),
          description: sharedOptions.aspectModel.getDescription(language),
          properties: getProperties(language),
          blockTransCustomColumns: getBlockTransCustomColumns(),
          blockTransRowActions: getBlockTransRowActions(options.customRowActions),
          blockCustomCommandBarActions: getBlockCustomCommandBarActions(),
        }),
        move(assetsPath),
      ]),
      options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
    );
  };
}

function getProperties(language: string) {
  return sharedOptions.templateHelper
    .getProperties(sharedOptions, sharedOptions.getExcludedPropLabels)
    .map((property: Property) => {
      return `
                "${property.name}.preferredName": "${replaceIncorrectSymbols(property.getPreferredName(language)) || property.name}",
                "${property.name}.description": "${replaceIncorrectSymbols(property.getDescription(language))}",
                ${replaceIncorrectSymbols(getBlockEntityInstance(property, language))}
                ${replaceIncorrectSymbols(getBlockTransEntity(property, language))}`;
    })
    .join('');
}

function getBlockTransEntity(property: Property, lang: string): string {
  if (property.effectiveDataType?.isComplex) {
    return (property.effectiveDataType as any).properties
      .map((effProp: Property) => {
        const {name} = effProp;
        const preferredName = effProp.getPreferredName(lang) || name;
        const description = effProp.getDescription(lang);
        const blockEntityInstance = getBlockEntityInstance(effProp, lang, property.name);

        return `
                    "${property.name}.${name}.preferredName": "${replaceIncorrectSymbols(preferredName)}",
                    "${property.name}.${name}.description": "${replaceIncorrectSymbols(description)}",
                    ${replaceIncorrectSymbols(blockEntityInstance)}`;
      })
      .join('');
  }
  return '';
}

function getBlockEntityInstance(property: Property, lang: string, parentPropertyName = ''): string {
  const {characteristic} = property;

  if (characteristic instanceof DefaultEnumeration && characteristic.values?.[0] instanceof DefaultEntityInstance) {
    return '';
  }

  if (!(characteristic instanceof DefaultEnumeration) || !characteristic.dataType?.isComplex || !characteristic.values) {
    return '';
  }

  const entityInstanceToString = (entityInstance: DefaultEntityInstance) =>
    `,"${parentPropertyName ? parentPropertyName + '.' : ''}${property.name}.${entityInstance.name}.${entityInstance.descriptionKey}": "${
      entityInstance.getDescription(lang) || ''
    }"`;

  return characteristic.values.map(entityInstanceToString).join('');
}

function getBlockTransCustomColumns(): string {
  const customColumns = sharedOptions.customColumns?.map((cc: string) => `"customColumn.${cc}": "${cc}"`).join(', ');

  return customColumns?.length > 0 ? `${customColumns}` : '';
}

/**
 * The method transforms array of custom row actions into translation keys and values.
 * @param {string} customRowActions - Array of custom row actions in the format 'action.svg' or 'action.svg: Custom Title'.
 * @returns {string} Translation file block with the list of custom row actions.
 * @example
 * const customRowActions = ['forward-right.svg'];
 * const customRowActionsWithTitle = ['forward-right.svg: View Movement Details'];
 * const b = 20;
 *
 * const actionBlocks = getBlockTransRowActions(customRowAction);
 * console.log(actionBlocks);
 * // Logs: `
 *   "customRowAction": {
 *     "forward-right": {
 *       "title": "forward-right",
 *       "notAvailable": "The action is not available"
 *     }
 *   }
 *
 * const actionsBlockWithTitle = getBlockTransRowActions(customRowActionsWithTitle);
 * console.log(actionsBlockWithTitle);
 * // Logs: `
 *   "customRowAction": {
 *     "forward-right": {
 *       "title": "View Movement Details",
 *       "notAvailable": "The action is not available"
 *     }
 *   }
 */
function getBlockTransRowActions(customRowActions: unknown): string {
  if (!isArrayOfStrings(customRowActions) || customRowActions.length === 0) {
    return '';
  }

  const actionTranslations = customRowActions
    .map(action => action.split(':'))
    .map(([action, title]) => buildActionTranslationBlock(action, title));

  return `
        "customRowAction": {
          ${actionTranslations.join(',')}
        }
    `;
}

function getBlockCustomCommandBarActions(): string {
  const actions = sharedOptions.customCommandBarActions.map(normalizeActionName);

  const actionStrings = actions.map((action: string) => `"${action}.customCommandBarAction": "${action}"`);

  return actionStrings.length > 0 ? `${actionStrings}` : '';
}

function replaceIncorrectSymbols(str = ''): string {
  return str.replace(/[\n\r\t]+/g, ' ');
}

function buildActionTranslationBlock(action:string, title:string): string {
  action = normalizeActionName(action);
  return `
        "${action}": {
          "title": "${title || action}",
          "notAvailable": "The action is not available"
        }
    `;
}
