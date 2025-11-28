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

import {apply, applyTemplates, chain, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {camelize, classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {getAllEnumProps} from '../../../../../../utils/aspect-model';
import {generateCommandBar} from '../../../../shared/generators/index';
import {
  getCustomRowActions,
  getEnumProperties,
  getEnumPropertyDefinitions,
  getTableColumValues,
  resolveDateTimeFormat,
} from '../../../../shared/utils';
import {templateInclude} from '../../../../shared/include';
import {Schema} from '../../../../shared/schema';
import {TableSchema} from '../../../schema';

let sharedOptions: any = {};

export function generateTableComponent(options: TableSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    sharedOptions = options;
    sharedOptions['allProps'] = options.listAllProperties;
    sharedOptions['tableColumValues'] = getTableColumValues;
    sharedOptions['tableColumns'] = getTableColumValues(options.listAllProperties, options);
    sharedOptions['resolveDateTimeFormat'] = resolveDateTimeFormat;
    sharedOptions['getCustomRowActions'] = getCustomRowActions;

    return chain([
      ...(options.addCommandBar ? [generateCommandBar(sharedOptions, sharedOptions.allProps)] : []),
      generateHtml(options, _context),
    ])(tree, _context);
  };
}

function generateHtml(options: Schema, _context: SchematicContext): Rule {
  return mergeWith(
    apply(url('./generators/components/table/files'), [
      templateInclude(_context, applyTemplate, sharedOptions, '../shared/methods'),
      move(sharedOptions.path),
    ]),
    sharedOptions.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
  );
}

function applyTemplate(): Rule {
  return applyTemplates({
    classify: strings.classify,
    dasherize: strings.dasherize,
    camelize: strings.camelize,
    options: sharedOptions,
    name: sharedOptions.name,
    selectedModelElementUrn: sharedOptions.selectedModelElement.aspectModelUrn,
    aspectModelElementUrn: sharedOptions.aspectModel.aspectModelUrn,
    isCollectionAspect: sharedOptions.aspectModel.isCollectionAspect,
    aspectModelName: sharedOptions.aspectModel.name,
    aspectModelTypeName: sharedOptions.aspectModelTypeName,
    enumPropertyDefinitions: getEnumPropertyDefinitions(sharedOptions, sharedOptions.allProps),
    enumCustomColumns: getEnumCustomColumns(),
    enumProperties: getEnumProperties(sharedOptions),
    customRowActionInput: getCustomRowActionInput(),
    customColumnsInput: getCustomColumnsInput(),
    byValueFunction: getByValueFunction(),
    commonImports: commonImports(),
    sharedCustomRows: getSharedCustomRows(),
    customColumn: getCustomColumn(),
    columnTransKeyPrefix: getColumnTransKeyPrefix(),
  });
}

function getEnumCustomColumns(): string {
  return sharedOptions.customColumns
    .map((value: string) => `${dasherize(value.trim()).replace(/-/g, '_').toUpperCase()} = '${value.trim()}',`)
    .join('');
}

function getCustomRowActionInput(): string {
  return `${sharedOptions.customRowActions
    .map((customRowAction: string) => {
      const formattedAction = customRowAction.replace(/\.[^/.]+$/, '');
      const classifiedFormattedAction = classify(formattedAction);
      return `@Input() is${classifiedFormattedAction}Visible = true;`;
    })
    .join('')}`;
}

function getCustomColumnsInput(): string {
  return `${
    sharedOptions.customColumns && sharedOptions.customColumns.length > 0
      ? sharedOptions.customColumns
          .map((customColumn: string) => `@Input("${camelize(customColumn)}Column") ${camelize(customColumn)}Template!: TemplateRef<any>;`)
          .join('')
      : ''
  }`;
}

function getCustomColumn(): string {
  return `${sharedOptions.customColumns.map((value: string) => `'${value.trim()}'`).join(', ')}`;
}

function getByValueFunction(): string {
  const propertyValues = getAllEnumProps(sharedOptions);
  return `${propertyValues
    .map(property => {
      return property.enumWithEntities
        ? `get${classify(property.propertyName)}Value = ${classify(property.characteristic)}.getByValue;`
        : '';
    })
    .join('')}`;
}

function hasCustomActions(): boolean {
  return [...sharedOptions.customRowActions, ...sharedOptions.customCommandBarActions].findIndex(element => element.includes('.')) !== -1;
}

function getSharedCustomRows(): string {
  return `this.currentLanguage = this.translateService.getActiveLang();
    ${[...sharedOptions.customRowActions, ...sharedOptions.customCommandBarActions]
      .map(
        (customRowActions: string) =>
          `${
            customRowActions.lastIndexOf('.') > -1
              ? `iconRegistry.addSvgIcon('${customRowActions.replace(
                  /\.[^/.]+$/,
                  ''
                )}', sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/${customRowActions}'));`
              : ``
          }`
      )
      .join('')}`;
}

function commonImports(): string {
  return `${hasCustomActions() ? `iconRegistry: MatIconRegistry,` : ``}
            private sanitizer: DomSanitizer,
            private translateService: TranslocoService,
            public dialog: MatDialog,
            private storageService: EsmfLocalStorageService,
            @Inject(EsmfPaginatorSelectConfigInjector) public paginatorSelectConfig: MatPaginatorSelectConfig,
            ${sharedOptions.hasFilters ? `public filterService: ${sharedOptions.filterServiceName},` : ''}
            ${
              sharedOptions.isDateQuickFilter
                ? 'private dateAdapter: DateAdapter<any>,@Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats,'
                : ''
            }`;
}

function getColumnTransKeyPrefix(): string {
  return sharedOptions.enableVersionSupport
    ? `${sharedOptions.selectedModelElement.name.toLowerCase()}.v${sharedOptions.templateHelper.formatAspectModelVersion(
        sharedOptions.aspectModelVersion
      )}.`
    : ``;
}
