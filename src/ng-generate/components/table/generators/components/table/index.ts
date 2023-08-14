/*
 * Copyright (c) 2023 Robert Bosch Manufacturing Solutions GmbH
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
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {camelize, classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {getAllEnumProps} from '../../../../../../utils/aspect-model';
import {generateChipList, generateCommandBar} from '../../../../shared/generators';
import {getEnumProperties, getEnumPropertyDefinitions} from '../../../../shared/utils';
import {templateInclude} from '../../../../shared/include';
import {Schema} from '../../../../shared/schema';

let sharedOptions: any = {};
let allProps: Array<Property> = [];

export function generateTableComponent(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        allProps = options.listAllProperties;

        return chain([
            ...(options.hasFilters ? [generateChipList(options)] : []),
            ...(options.addCommandBar ? [generateCommandBar(options, allProps)] : []),
            generateHtml(options, _context),
        ])(tree, _context);
    };
}

function generateHtml(options: Schema, _context: SchematicContext): Rule {
    sharedOptions = options;

    return mergeWith(
        apply(url('./generators/components/table/files'), [
            templateInclude(_context, applyTemplate, options, '../shared/methods'),
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
        remoteDataHandling: !sharedOptions.enableRemoteDataHandling ? ` dataSource.length` : `totalItems`,
        tableColumValues: getTableColumValues(),
        enumPropertyDefinitions: getEnumPropertyDefinitions(sharedOptions, allProps),
        enumCustomColumns: getEnumCustomColumns(),
        customRowActions: getCustomRowActions(),
        enumProperties: getEnumProperties(sharedOptions),
        customRowActionInput: getCustomRowActionInput(),
        customColumnsInput: getCustomColumnsInput(),
        byValueFunction: getByValueFunction(),
        commonImports: commonImports(),
        sharedCustomRows: getSharedCustomRows(),
        customColumn: getCustomColumn(),
        columnTransKeyPrefix: getColumnTransKeyPrefix(),
        blockHeaderToExport: getBlockHeaderToExport(),
        resolveDateTimeFormat: resolveDateTimeFormat,
    });
}

function getTableColumValues(): Array<{property: Property; index: number; complexPrefix: string}> {
    return allProps.flatMap((property: Property, index: number) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexPropObj = sharedOptions.templateHelper.getComplexProperties(property, sharedOptions);
            return complexPropObj.properties.map((complexProp: Property, index: number) => {
                return {property: complexProp, index: index, complexPrefix: `${complexPropObj.complexProp}.`};
            });
        }

        return [{property: property, index: index, complexPrefix: ''}];
    });
}

function resolveDateTimeFormat(property: Property): string {
    if (sharedOptions.templateHelper.isTimeProperty(property)) {
        return 'tableTimeFormat';
    }
    if (sharedOptions.templateHelper.isDateTimestampProperty(property)) {
        return 'tableDateTimeFormat';
    }
    if (sharedOptions.templateHelper.isDateProperty(property)) {
        return 'tableDateFormat';
    }
    return '';
}

function getCustomRowActions(): string {
    return sharedOptions.customRowActions.length > 0
        ? `  <ng-container data-test="custom-row-actions" matColumnDef="customRowActions" [stickyEnd]="setStickRowActions">
      <th data-test="custom-actions-header" 
          mat-header-cell 
          *matHeaderCellDef 
          [style.min-width.px]="customRowActionsLength <= visibleRowActionsIcons ? ${sharedOptions.customRowActions.length * 30 + 15} : 80">
            {{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(sharedOptions)}customRowActions.preferredName' | translate}}
      </th>
      <td data-test="custom-actions-row" mat-cell *matCellDef="let row">
      <ng-container data-test="custom-actions-container" *ngIf="customRowActionsLength <= visibleRowActionsIcons; else customActionsButton">
      ${sharedOptions.customRowActions
          .map((action: string) => {
              const formattedAction = action.replace(/\.[^/.]+$/, '');
              const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
              const commonParts = `data-test="custom-action-icon" *ngIf="is${classify(
                  formattedActionKebab
              )}Visible" (click)="executeCustomAction($event, '${formattedActionKebab}', row)" style="cursor: pointer;" matTooltip="{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(
                  sharedOptions
              )}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(
                  sharedOptions
              )}${formattedActionKebab}.customRowAction' | translate }}"`;
              return `${action.lastIndexOf('.') > -1 ? `<mat-icon svgIcon="${formattedAction}" ${commonParts}></mat-icon>` : ''}${
                  action.lastIndexOf('.') === -1 ? `<mat-icon ${commonParts} class="material-icons">${action}</mat-icon>` : ''
              }
            `;
          })
          .join('')}
      </ng-container>
      <ng-template #customActionsButton data-test="custom-actions-button-container">
        <button data-test="custom-actions-button" 
                mat-icon-button [matMenuTriggerFor]="customActionsMenu" 
                aria-label="Context menu for custom actions"
                (click)="$event.preventDefault(); $event.stopPropagation()">
                <mat-icon class="material-icons">more_vert</mat-icon>
        </button>
      </ng-template>
      <mat-menu #customActionsMenu data-test="custom-actions-menu">
              ${sharedOptions.customRowActions
                  .map((action: string): string => {
                      const formattedAction = action.replace(/\.[^/.]+$/, '');
                      const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                      const classifiedAction = classify(formattedActionKebab);
                      const commonParts = `style="cursor: pointer;" matTooltip="{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(
                          sharedOptions
                      )}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(
                          sharedOptions
                      )}${formattedActionKebab}.customRowAction' | translate }}"`;
                      const iconTemplate =
                          action.lastIndexOf('.') === -1
                              ? `<mat-icon data-test="custom-action-icon" ${commonParts} class="material-icons">${formattedAction}</mat-icon>`
                              : `<mat-icon data-test="custom-action-icon" svgIcon="${formattedAction}" ${commonParts}></mat-icon>`;
                      return `
                      <button mat-menu-item *ngIf="is${classifiedAction}Visible" data-test="custom-action-button" (click)="executeCustomAction($event, '${formattedActionKebab}', row)">
                          ${iconTemplate}
                          <span data-test="custom-action-text" style="vertical-align: middle">{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(
                              sharedOptions
                          )}${formattedActionKebab}.customRowAction' | translate}}</span>
                      </button>
                     `;
                  })
                  .join('')}
      </mat-menu>
      </td>
    </ng-container>`
        : '';
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
                  .map(
                      (customColumn: string) =>
                          `@Input("${camelize(customColumn)}Column") ${camelize(customColumn)}Template!: TemplateRef<any>;`
                  )
                  .join('')
            : ''
    }`;
}

function getCustomColumn(): string {
    return `${sharedOptions.customColumns
        .map((value: string) => {
            `'${value.trim()}'`;
        })
        .join(', ')}`;
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
    return `this.currentLanguage = this.translateService.currentLang; 
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
            private translateService: TranslateService,
            public dialog: MatDialog,
            private clipboard: Clipboard,
            private storageService: JSSdkLocalStorageService,
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

function getBlockHeaderToExport(): string {
    let defTemp = `const headersToExport = columns`;

    defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(sharedOptions.name)}Column.COLUMNS_MENU)`;

    if (sharedOptions.addRowCheckboxes) {
        defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(sharedOptions.name)}Column.CHECKBOX)`;
    }

    if (sharedOptions.customRowActions.length > 0) {
        defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(sharedOptions.name)}Column.CUSTOM_ROW_ACTIONS)`;
    }

    if (sharedOptions.customColumns.length > 0) {
        defTemp = `${defTemp}.filter((columnName: string): boolean => !this.isCustomColumn(columnName))`;
    }

    return `${defTemp};`;
}
