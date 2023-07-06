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

import {
    apply,
    applyTemplates,
    chain,
    MergeStrategy,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {chipList} from "../chip-list/index";
import {commandBar} from "../command-bar/index";
import {DefaultSingleEntity, Property} from "@esmf/aspect-model-loader";
import {camelize, classify, dasherize} from "@angular-devkit/core/src/utils/strings";
import {TsFilterServiceGenerator} from "../ts-filter-service.generator";

export function tableGeneration(options: any): Rule {
    const templateHelper = options.templateHelper;
    options.hasSearchBar = options.templateHelper.isAddCommandBarFunctionSearch(options.enabledCommandBarFunctions);
    options.hasFilters = options.hasSearchBar ||
        options.templateHelper.isAddDateQuickFilters(options.enabledCommandBarFunctions) ||
        options.templateHelper.isAddEnumQuickFilters(options.enabledCommandBarFunctions);

    options.filterServiceName = `${classify(options.name)}FilterService`;

    return (tree: Tree, _context: SchematicContext) => {
        const allProps = templateHelper.getProperties(options);

        return chain([
            ...(options.hasFilters ? [chipList(options)] : []),
            ...(options.addCommandBar ? [commandBar(options, allProps)] : []),
            generateHtml(options, allProps),
        ])(tree, _context);
    };
}


function generateHtml(options: any, allProps: Array<Property>): Rule {
    const getTypePath = options.templateHelper.getTypesPath(options.enableVersionSupport, options.aspectModelVersion, options.aspectModel);
    const getTableDateFormat = options.templateHelper.getDateProperties(options).find((property: Property) => options.templateHelper.isDateProperty(property));
    const getTableDateTimeFormat = options.templateHelper.getDateProperties(options).find((property: Property) => options.templateHelper.isDateTimestampProperty(property));
    const getTableTimeFormat = options.templateHelper.getDateProperties(options).find((property: Property) => options.templateHelper.isTimeProperty(property));

    return mergeWith(
        apply(url('./generators/table/files'), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                camelize: strings.camelize,
                addCommandBar: options.addCommandBar,
                hasFilters: options.hasFilters,
                hasSearchBar: options.hasSearchBar,
                selectedModelElementUrn: options.selectedModelElement.aspectModelUrn,
                aspectModelElementUrn: options.aspectModel.aspectModelUrn,
                isCollectionAspect: options.aspectModel.isCollectionAspect,
                customRowActions: options.customRowActions,
                customCommandBarActions: options.customCommandBarActions,
                aspectModelName: options.aspectModel.name,
                styleExtension: options.style,
                changeDetection: options.changeDetection,
                viewEncapsulation: options.viewEncapsulation,
                defaultSortingCol: options.defaultSortingCol,
                customColumns: options.customColumns,
                getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                hasDateQuickFilter: options.templateHelper.isAddDateQuickFilters(options.enabledCommandBarFunctions),
                hasEnumQuickFilter: options.templateHelper.isAddEnumQuickFilters(options.enabledCommandBarFunctions),
                selectedModelTypeName: options.templateHelper.resolveType(options.selectedModelElement).name,
                aspectModelTypeName: options.templateHelper.resolveType(options.aspectModel).name,
                getLocalStorageKeyColumns: options.templateHelper.getLocalStorageKeyColumns(options),
                getLocalStorageKeyConfig: options.templateHelper.getLocalStorageKeyConfig(options),
                getReplacedLocalStorageKeyColumnsLowerCase: getReplacedLocalStorageKeyColumnsLowerCase(options),
                getReplacedLocalStorageKeyConfigLowerCase: getReplacedLocalStorageKeyConfigLowerCase(options),
                isAspectSelected: options.templateHelper.isAspectSelected(options),
                filterServiceName: options.filterServiceName,
                remoteDataHandling: !options.enableRemoteDataHandling ? ` dataSource.length` : `totalItems`,
                addRowCheckboxes: options.addRowCheckboxes,
                enableVersionSupport: options.enableVersionSupport,
                getTableColumns: getTableColumns(options, allProps),
                getEnumPropertyColumns: getEnumPropertyColumns(options, allProps),
                getEnumCustomColumns: getEnumCustomColumns(options),
                getCustomColumns: getCustomColumns(options),
                getCustomRowActions: getCustomRowActions(options),
                getEnumProperties: getEnumProperties(options),
                getCustomRowActionInput: getCustomRowActionInput(options),
                getCustomColumnsInput: getCustomColumnsInput(options),
                getByValueFunction: getByValueFunction(options),
                commonImports: commonImports(options),
                getSharedCustomRows: getSharedCustomRows(options),
                getCustomColumn: getCustomColumn(options),
                getApplyFilters: getApplyFilters(options),
                getColumnTransKeyPrefix: getColumnTransKeyPrefix(options),
                getBlockHeaderToExport: getBlockHeaderToExport(options),
                getTypePath: getTypePath,
                getTableDateFormat: getTableDateFormat,
                getTableDateTimeFormat: getTableDateTimeFormat,
                getTableTimeFormat: getTableTimeFormat,
                isRemote: options.enableRemoteDataHandling,
                customRemoteService: options.customRemoteService,
                name: options.name,
            }),
            move(options.path),
        ]),
        MergeStrategy.Overwrite
    );
}

function getTableColumns(options: any, allProps: Array<Property>): string {
    return allProps.map((property: Property, index: number) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexPropObj = options.templateHelper.getComplexProperties(property, options);
            return complexPropObj.properties.map((complexProp: Property, index: number): string =>
                getColumnTemplate(options, allProps, complexProp, index, `${complexPropObj.complexProp}.`));
        }

        return getColumnTemplate(options, allProps, property, index, ``);
    }).join('');
}

function getColumnTemplate(options: any, allProps: Array<Property>, property: Property, index: number, complexPrefix: string): string {
    const language = options.templateHelper.isMultiStringProperty(property) ? '[currentLanguage]' : '';
    const propertyName = options.templateHelper.isEnumPropertyWithEntityValues(property)
        ? property.name + '?.' + options.templateHelper.getEnumEntityInstancePayloadKey(property)
        : property.name
    const cellPropertyPath = `${options.jsonAccessPath}${complexPrefix}${propertyName}`;
    const isEmptyValue = `row.${cellPropertyPath} === null || row.${cellPropertyPath} === undefined`;
    const propertyLocaleKeyPath = `${options.templateHelper.getVersionedAccessPrefix(options)}${options.templateHelper.isAspectSelected(options) ? options.jsonAccessPath : ''}${complexPrefix}${property.name}`;

    const datePipe = options.templateHelper.isDateTimeProperty(property) ? `| date: ${resolveDateTimeFormat(options, property)}` : '';
    const descriptionPipe = options.templateHelper.isEnumPropertyWithEntityValues(property) ? ` | showDescription:get${classify(property.name)}Value` : '';
    const cellContent = `!(${isEmptyValue}) ? (row.${cellPropertyPath}${descriptionPipe}${language}${datePipe})  : '-'`;

    return ` <!-- ${complexPrefix}${property.name} Column -->
                    <ng-container data-test="table-column" matColumnDef="${options.jsonAccessPath}${complexPrefix}${property.name}">
                        <th data-test="table-header" mat-header-cell *matHeaderCellDef 
                            mat-sort-header="${cellPropertyPath}"
                            ${options.templateHelper.isNumberProperty(property) ? `class="table-header-number"` : ''}
                            ${
        allProps.length - 1 > index
            ? `[resizeColumn]="true" [index]="${index}" (dragging)='dragging = $event'`
            : ''
    }>
                            <span [matTooltip]="'${propertyLocaleKeyPath}.description' | translate"
                                  [matTooltipDisabled]="headerTooltipsOff"
                                  matTooltipPosition="above"
                                  data-test="table-header-text">
                                {{ '${propertyLocaleKeyPath}.preferredName' | translate }}
                            </span>
                        </th>

                        <td data-test="table-cell" ${
        options.templateHelper.isEnumPropertyWithEntityValues(property)
            ?
            `
                [matTooltip]="!(${isEmptyValue}) ? (row.${cellPropertyPath}${descriptionPipe}:true${language}) : ''"
                [matTooltipDisabled]="${isEmptyValue}"
                `
            : ''} 
            mat-cell *matCellDef="let row" ${options.templateHelper.isNumberProperty(property) ? `class="table-cell-number"` : ''}>
            ${options.hasSearchBar ? `
                 <ng-container
                  [ngTemplateOutlet]="highlightConfig?.selected && ((${cellContent}) | searchString: highlightString) ? searchedWordExists : normal"
                  [ngTemplateOutletContext]="{ value: ${cellContent} }"></ng-container>` : `{{${cellContent}}}`}
            
              <button data-test="copy-to-clipboard-button"
                    *ngIf="!(${isEmptyValue})"
                    mat-icon-button class="copy-to-clipboard"
                    (click)="copyToClipboard(row.${cellPropertyPath}${language}, $event)">
                    <mat-icon data-test="copy-to-clipboard-icon" class="material-icons">content_copy</mat-icon>
              </button>
              </td>
           </ng-container>`;
}

function resolveDateTimeFormat(options: any, property: Property): string {
    if (options.templateHelper.isTimeProperty(property)) {
        return 'tableTimeFormat';
    }
    if (options.templateHelper.isDateTimestampProperty(property)) {
        return 'tableDateTimeFormat';
    }
    if (options.templateHelper.isDateProperty(property)) {
        return 'tableDateFormat';
    }
    return '';
}

function getCustomColumns(options: any): string {
    return options.customColumns && options.customColumns.length > 0
        ? ` ${options.customColumns.map((columnName: string) => {
            return `<!-- ${columnName} Column -->
                          <ng-container data-test="custom-column-container" matColumnDef="${columnName}">
                          ${
                options.enableVersionSupport
                    ? `<th data-test="custom-column-header" mat-header-cell *matHeaderCellDef mat-sort-header>{{ '${options.selectedModelElement.name.toLowerCase()}.v${options.templateHelper.formatAspectModelVersion(
                        options.aspectModelVersion
                    )}.customColumn.${columnName}' | translate }}</th>`
                    : `<th data-test="custom-column-header" mat-header-cell *matHeaderCellDef mat-sort-header>{{ '${options.selectedModelElement.name.toLowerCase()}.customColumn.${columnName}' | translate }}</th>`
            }
                                <td data-test="custom-column-cell" mat-cell *matCellDef="let row" >
                                  <ng-container data-test="custom-column-container" *ngTemplateOutlet="${camelize(columnName)}Template; context:{aspect:row}"></ng-container>
                                </td>
                              </ng-container>`;
        })
            .join('')}`
        : '';
}

function getCustomRowActions(options: any): string {
    return options.customRowActions.length > 0
        ? `  <ng-container data-test="custom-row-actions" matColumnDef="customRowActions" [stickyEnd]="setStickRowActions">
      <th data-test="custom-actions-header" 
          mat-header-cell 
          *matHeaderCellDef 
          [style.min-width.px]="customRowActionsLength <= visibleRowActionsIcons ? ${options.customRowActions.length * 30 + 15} : 80">
            {{ '${options.templateHelper.getVersionedAccessPrefix(options)}customRowActions.preferredName' | translate}}
      </th>
      <td data-test="custom-actions-row" mat-cell *matCellDef="let row">
      <ng-container data-test="custom-actions-container" *ngIf="customRowActionsLength <= visibleRowActionsIcons; else customActionsButton">
      ${options.customRowActions
            .map((action: string) => {
                const formattedAction = action.replace(/\.[^/.]+$/, '');
                const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                const commonParts = `data-test="custom-action-icon" *ngIf="is${classify(
                    formattedActionKebab
                )}Visible" (click)="executeCustomAction($event, '${formattedActionKebab}', row)" style="cursor: pointer;" matTooltip="{{ '${
                    options.templateHelper.getVersionedAccessPrefix(options)
                }${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${
                    options.templateHelper.getVersionedAccessPrefix(options)
                }${formattedActionKebab}.customRowAction' | translate }}"`;
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
              ${options.customRowActions
            .map((action: string): string => {
                const formattedAction = action.replace(/\.[^/.]+$/, '');
                const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                const classifiedAction = classify(formattedActionKebab);
                const commonParts = `style="cursor: pointer;" matTooltip="{{ '${options.templateHelper.getVersionedAccessPrefix(options)}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${options.templateHelper.getVersionedAccessPrefix(options)}${formattedActionKebab}.customRowAction' | translate }}"`;
                const iconTemplate =
                    action.lastIndexOf('.') === -1
                        ? `<mat-icon data-test="custom-action-icon" ${commonParts} class="material-icons">${formattedAction}</mat-icon>`
                        : `<mat-icon data-test="custom-action-icon" svgIcon="${formattedAction}" ${commonParts}></mat-icon>`;
                return `
                      <button mat-menu-item *ngIf="is${classifiedAction}Visible" data-test="custom-action-button" (click)="executeCustomAction($event, '${formattedActionKebab}', row)">
                          ${iconTemplate}
                          <span data-test="custom-action-text" style="vertical-align: middle">{{ '${options.templateHelper.getVersionedAccessPrefix(options)}${formattedActionKebab}.customRowAction' | translate}}</span>
                      </button>
                     `;
            })
            .join('')}
      </mat-menu>
      </td>
    </ng-container>`
        : '';
}

function getEnumProperties(options: any): string {
    return options.templateHelper.getEnumProperties(options)
        .map((property: Property) => classify(property.characteristic.name)).join(',')
}

function getEnumPropertyColumns(options: any, allProps: Array<Property>): string {
    return allProps.map((property: Property, index: number, arr: Property[]) => {
        let complexEnumProperties = ``;
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexProps = options.templateHelper.getComplexProperties(property, options);
            complexProps.properties.map((complexProp: Property, i: number, complexPropsArr: Property[]) => {
                complexEnumProperties = `${complexEnumProperties}${dasherize(`${complexProps.complexProp}_${complexProp.name}`)
                    .replace(/-/g, '_')
                    .toUpperCase()} = '${complexProps.complexProp}.${complexProp.name}',`;
                return complexProp;
            });
        }

        return `${!(property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity)
            ? `${dasherize(property.name).replace(/-/g, '_').toUpperCase()} = '${options.jsonAccessPath}${property.name.trim()}'${index <= arr.length - 1 ? `,` : ``}`
            : `${complexEnumProperties}`}`;
    }).join('')
}

function getEnumCustomColumns(options: any): string {
    return options.customColumns
        .map((value: string) => `${dasherize(value.trim()).replace(/-/g, '_').toUpperCase()} = '${value.trim()}',`)
        .join('')
}

function getCustomRowActionInput(options: any): string {
    return `${options.customRowActions.map((customRowAction: string) => {
        const formattedAction = customRowAction.replace(/\.[^/.]+$/, '');
        const classifiedFormattedAction = classify(formattedAction);
        return `@Input() is${classifiedFormattedAction}Visible = true;`;
    }).join('')}`
}

function getCustomColumnsInput(options: any): string {
    return `${options.customColumns && options.customColumns.length > 0 ? options.customColumns.map((customColumn: string) =>
        `@Input("${camelize(customColumn)}Column") ${camelize(customColumn)}Template!: TemplateRef<any>;`).join('') : ''}`;
}

function getCustomColumn(options: any): string {
    return `${options.customColumns.map((value: string) => {
        `'${value.trim()}'`;
    }).join(', ')}`;
}

function getByValueFunction(options: any): string {
    const propertyValues = new TsFilterServiceGenerator(options).getAllEnumProps();
    return `${propertyValues.map(property => {
        return property.enumWithEntities ? `get${classify(property.propertyName)}Value = ${classify(property.characteristic)}.getByValue;` : '';
    }).join('')}`;
}

function hasCustomActions(options: any): boolean {
    return [...options.customRowActions, ...options.customCommandBarActions].findIndex(element => element.includes('.')) !== -1;
}

function getSharedCustomRows(options: any): string {
    return `this.currentLanguage = this.translateService.currentLang; 
    ${[...options.customRowActions, ...options.customCommandBarActions]
        .map((customRowActions: string) => `${customRowActions.lastIndexOf('.') > -1 ? `iconRegistry.addSvgIcon('${customRowActions.replace(/\.[^/.]+$/, '')}', sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/${customRowActions}'));` : ``}`)
        .join('')}`;
}

function commonImports(options: any): string {
    return `${hasCustomActions(options) ? `iconRegistry: MatIconRegistry,` : ``}
            private sanitizer: DomSanitizer,
            private translateService: TranslateService,
            public dialog: MatDialog,
            private clipboard: Clipboard,
            private storageService: JSSdkLocalStorageService,
            ${options.hasFilters ? `public filterService: ${options.filterServiceName},` : ''}
            ${options.hasDateQuickFilter ? 'private dateAdapter: DateAdapter<any>,@Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats,' : ''}`;
}

function getApplyFilters(options: any) {
    const removeFilterFn = `removeFilter(filterData:any):void {
                                    ${options.hasFilters ? `this.filterService.removeFilter(filterData)` : ''};
                                    this.paginator.firstPage();
                                    ${options.hasSearchBar ? `this.filterService.searchString.reset();` : ''}
                                    this.applyFilters();
                                }`;

    if (options.enableRemoteDataHandling) {
        return `
                applyFilters(): void {
                    ${options.hasSearchBar ? `
                        if(this.filterService.searchString.errors) {
                            return;
                        }` : ``}
                    
                    this.tableUpdateStartEvent.emit();
                    ${options.addRowCheckboxes ? `this.selection.clear();
                    this.rowSelectionEvent.emit(this.selection.selected);` : ``}
                    const query = new And();
                    ${options.hasEnumQuickFilter ? `this.filterService.applyEnumFilter(query);` : ``}
                    ${options.hasSearchBar ? `this.filterService.applyStringSearchFilter(query);
                        this.highlightString = this.filterService.activeFilters
                            .filter(elem => elem.type === FilterEnums.Search && elem.filterValue !== undefined)
                            .map(elem => elem.filterValue as string);` : ``}
                    ${options.hasDateQuickFilter ? `this.filterService.applyDateFilter(query);` : ``}

                    if (this.customFilterExtension) {
                        this.customFilterExtension.apply(query);
                    }

                    const queryFilter = new Query({query: query});

                    const queryOption = new Query();
                    if (this.sort.active) {
                        queryOption.setSort(
                            new Sort(<any>{
                                [this.sort.active]: this.sort.direction === 'asc' ? 1 : -1,
                            })
                        );
                    }

                    queryOption.setLimit(new Limit(this.paginator.pageIndex * this.paginator.pageSize, this.paginator.pageSize));

                    if (this.customOptionsExtension) {
                        this.customOptionsExtension.apply(queryOption);
                    }

                    // override function to ensure to create supported RQL
                    QueryStringifier['withType'] = (value: any) => {
                        return typeof value === 'string' && value !== 'null()' && value !== '' ? '"' + value + '"' : value;
                    };
                    QueryStringifier['encodeRql'] = (value: any) => {
                        return value;
                    };
                    
                    const additionalCondition = new Eq('local', '${options.chooseLanguageForSearch ? options.chooseLanguageForSearch.toUpperCase() : 'EN'}');
                    queryFilter?.queryNode.subNodes.push(additionalCondition);

                    const filterRQLQuery = queryFilter ? QueryStringifier.stringify(queryFilter) : '';
                    const optionsRQLQuery = QueryStringifier.stringify(queryOption).replace(/&/g, ',');

                    let rqlStringTemp = '';
                    if(filterRQLQuery.length > 0) {
                        rqlStringTemp = \`filter=\${filterRQLQuery}\`;
                    }
                    if (optionsRQLQuery.length > 0) {
                        rqlStringTemp = \`\${rqlStringTemp}\${rqlStringTemp !== '' ? '&' : ''}option=\${optionsRQLQuery}\`;
                    }
                    if (!(QueryStringifier as any)['superParseQueryNode']) {
                        (QueryStringifier as any)['superParseQueryNode'] = QueryStringifier['parseQueryNode'];
                    }
                    QueryStringifier['parseQueryNode'] = (node?: AbstractNode): string => {
                        let result = (QueryStringifier as any)['superParseQueryNode'](node);
                        if (node instanceof AbstractArrayNode) {
                            const arrayNode = <AbstractArrayNode>node;
                            const encodedValues = arrayNode.values.map(value => QueryStringifier['withType'](QueryStringifier['withEncoding'](value)));

                            // ensure outer brackets are not used. valid query ..in(<name>, "value1", "value2", ...)..
                            result = \`\${QueryStringifier['withEncoding'](arrayNode.name, {isField: true})}(\${QueryStringifier['withEncoding'](
                                 arrayNode.field,
                                 {isField: true}
                             )},\${encodedValues.join(',')})\`;
                        }
                        return result;
                    };
                    
                    this.rqlString = rqlStringTemp;

                    try{
                      this.${camelize((options.customRemoteService ? 'custom' : '') + options.name)}Service.requestData(this.remoteAPI, {query: rqlStringTemp}).subscribe((response: ${classify(options.aspectModel.name)}Response): void => {
                          this.dataSource.setData(response.items);
                          this.filteredData = response.items;
                          this.totalItems = this.data.length;
                          this.maxExportRows = this.totalItems;
                          this.cd.detectChanges();
                          this.totalItems = (response.totalItems !== null && response.totalItems !== undefined) ? response.totalItems : response.items.length;
                          this.tableUpdateFinishedEvent.emit();
                      }, error => {
                        this.tableUpdateFinishedEvent.emit(error);
                      });
                    } catch (error) {
                        this.tableUpdateFinishedEvent.emit(error)
                    }
                }

                ${removeFilterFn}`;
    } else {
        return `
                applyFilters(): void {
                ${options.hasSearchBar ? `
                    if(this.filterService.searchString.errors){
                        return;
                    }` : ``}
                    
                    this.tableUpdateStartEvent.emit();
                    let dataTemp = [...this.data];
                    ${options.hasEnumQuickFilter ? `dataTemp = this.filterService.applyEnumFilter(dataTemp);` : ``}
                    ${options.hasSearchBar ? `dataTemp = this.filterService.applyStringSearchFilter(dataTemp);
                    this.highlightString = this.filterService.activeFilters
                    .filter(elem => elem.type === FilterEnums.Search && elem.filterValue !== undefined)
                    .map(elem => elem.filterValue as string);` : ``}
                    
                    ${options.hasDateQuickFilter ? `dataTemp = this.filterService.applyDateFilter(dataTemp); ` : ``}
                        this.dataSource.setData(dataTemp);
                          this.filteredData = dataTemp;
                          this.totalItems = this.data.length;
                          this.maxExportRows = this.totalItems;
                          this.checkIfOnValidPage();
                          ${options.addRowCheckboxes ? `this.trimSelectionToCurrentPage();` : ``}
                          this.tableUpdateFinishedEvent.emit();
                       }
                    ${removeFilterFn}
                 `;
    }
}

function getColumnTransKeyPrefix(options: any): string {
    return options.enableVersionSupport ? `${options.selectedModelElement.name.toLowerCase()}.v${options.templateHelper.formatAspectModelVersion(options.aspectModelVersion)}.` : ``;
}

function getBlockHeaderToExport(options: any): string {
    let defTemp = `const headersToExport = columns`;

    defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(options.name)}Column.COLUMNS_MENU)`;

    if (options.addRowCheckboxes) {
        defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(options.name)}Column.CHECKBOX)`;
    }

    if (options.customRowActions.length > 0) {
        defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(options.name)}Column.CUSTOM_ROW_ACTIONS)`;
    }

    if (options.customColumns.length > 0) {
        defTemp = `${defTemp}.filter((columnName: string): boolean => !this.isCustomColumn(columnName))`;
    }

    return `${defTemp};`;
}

function getReplacedLocalStorageKeyColumnsLowerCase(options: any): string {
    return options.templateHelper.getLocalStorageKeyColumns(options).replace(options.templateHelper.getLocalStoragePrefix(), '').toLowerCase()
}

function getReplacedLocalStorageKeyConfigLowerCase(options: any): string {
    return options.templateHelper.getLocalStorageKeyConfig(options).replace(options.templateHelper.getLocalStoragePrefix(), '').toLowerCase()
}
