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

let sharedOptions: any = {};
let allProps: Array<Property> = [];

export function tableGeneration(options: any): Rule {
    sharedOptions = options;

    const templateHelper = sharedOptions.templateHelper;
    sharedOptions.hasSearchBar = sharedOptions.templateHelper.isAddCommandBarFunctionSearch(sharedOptions.enabledCommandBarFunctions);
    sharedOptions.hasFilters = sharedOptions.hasSearchBar ||
        sharedOptions.templateHelper.isAddDateQuickFilters(sharedOptions.enabledCommandBarFunctions) ||
        sharedOptions.templateHelper.isAddEnumQuickFilters(sharedOptions.enabledCommandBarFunctions);

    sharedOptions.filterServiceName = `${classify(sharedOptions.name)}FilterService`;

    return (tree: Tree, _context: SchematicContext) => {
        allProps = templateHelper.getProperties(sharedOptions);


        return chain([
            ...(sharedOptions.hasFilters ? [chipList(sharedOptions)] : []),
            ...(sharedOptions.addCommandBar ? [commandBar(sharedOptions, allProps)] : []),
            generateHtml(),
        ])(tree, _context);
    };
}


function generateHtml(): Rule {
    const getTypePath = sharedOptions.templateHelper.getTypesPath(sharedOptions.enableVersionSupport, sharedOptions.aspectModelVersion, sharedOptions.aspectModel);
    const getTableDateFormat = sharedOptions.templateHelper.getDateProperties(sharedOptions).find((property: Property) => sharedOptions.templateHelper.isDateProperty(property));
    const getTableDateTimeFormat = sharedOptions.templateHelper.getDateProperties(sharedOptions).find((property: Property) => sharedOptions.templateHelper.isDateTimestampProperty(property));
    const getTableTimeFormat = sharedOptions.templateHelper.getDateProperties(sharedOptions).find((property: Property) => sharedOptions.templateHelper.isTimeProperty(property));

    return mergeWith(
        apply(url('./generators/table/files'), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                camelize: strings.camelize,
                options: sharedOptions,
                templateHelper: sharedOptions.templateHelper,
                name: sharedOptions.name,
                selectedModelElementUrn: sharedOptions.selectedModelElement.aspectModelUrn,
                aspectModelElementUrn: sharedOptions.aspectModel.aspectModelUrn,
                isCollectionAspect: sharedOptions.aspectModel.isCollectionAspect,
                aspectModelName: sharedOptions.aspectModel.name,
                getGenerationDisclaimerText: sharedOptions.templateHelper.getGenerationDisclaimerText(),
                hasDateQuickFilter: sharedOptions.templateHelper.isAddDateQuickFilters(sharedOptions.enabledCommandBarFunctions),
                hasEnumQuickFilter: sharedOptions.templateHelper.isAddEnumQuickFilters(sharedOptions.enabledCommandBarFunctions),
                selectedModelTypeName: sharedOptions.templateHelper.resolveType(sharedOptions.selectedModelElement).name,
                aspectModelTypeName: sharedOptions.templateHelper.resolveType(sharedOptions.aspectModel).name,
                getLocalStorageKeyColumns: sharedOptions.templateHelper.getLocalStorageKeyColumns(sharedOptions),
                getLocalStorageKeyConfig: sharedOptions.templateHelper.getLocalStorageKeyConfig(sharedOptions),
                getReplacedLocalStorageKeyColumnsLowerCase: getReplacedLocalStorageKeyColumnsLowerCase(),
                getReplacedLocalStorageKeyConfigLowerCase: getReplacedLocalStorageKeyConfigLowerCase(),
                isAspectSelected: sharedOptions.templateHelper.isAspectSelected(sharedOptions),
                remoteDataHandling: !sharedOptions.enableRemoteDataHandling ? ` dataSource.length` : `totalItems`,
                getTableColumValues: getTableColumValues(),
                getEnumPropertyColumns: getEnumPropertyColumns(),
                getEnumCustomColumns: getEnumCustomColumns(),
                getCustomColumns: getCustomColumns(),
                getCustomRowActions: getCustomRowActions(),
                getEnumProperties: getEnumProperties(),
                getCustomRowActionInput: getCustomRowActionInput(),
                getCustomColumnsInput: getCustomColumnsInput(),
                getByValueFunction: getByValueFunction(),
                commonImports: commonImports(),
                getSharedCustomRows: getSharedCustomRows(),
                getCustomColumn: getCustomColumn(),
                getApplyFilters: getApplyFilters(),
                getColumnTransKeyPrefix: getColumnTransKeyPrefix(),
                getBlockHeaderToExport: getBlockHeaderToExport(),
                getTypePath: getTypePath,
                getTableDateFormat: getTableDateFormat,
                getTableDateTimeFormat: getTableDateTimeFormat,
                getTableTimeFormat: getTableTimeFormat,
                resolveDateTimeFormat: resolveDateTimeFormat,
            }),
            move(sharedOptions.path),
        ]),
        MergeStrategy.Overwrite
    );
}

function getTableColumValues(): Array<{ property: Property, index: number, complexPrefix: string }> {
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

function getCustomColumns(): string {
    return sharedOptions.customColumns && sharedOptions.customColumns.length > 0
        ? ` ${sharedOptions.customColumns.map((columnName: string) => {
            return `<!-- ${columnName} Column -->
                          <ng-container data-test="custom-column-container" matColumnDef="${columnName}">
                          ${
                sharedOptions.enableVersionSupport
                    ? `<th data-test="custom-column-header" mat-header-cell *matHeaderCellDef mat-sort-header>{{ '${sharedOptions.selectedModelElement.name.toLowerCase()}.v${sharedOptions.templateHelper.formatAspectModelVersion(
                        sharedOptions.aspectModelVersion
                    )}.customColumn.${columnName}' | translate }}</th>`
                    : `<th data-test="custom-column-header" mat-header-cell *matHeaderCellDef mat-sort-header>{{ '${sharedOptions.selectedModelElement.name.toLowerCase()}.customColumn.${columnName}' | translate }}</th>`
            }
                                <td data-test="custom-column-cell" mat-cell *matCellDef="let row" >
                                  <ng-container data-test="custom-column-container" *ngTemplateOutlet="${camelize(columnName)}Template; context:{aspect:row}"></ng-container>
                                </td>
                              </ng-container>`;
        })
            .join('')}`
        : '';
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
                )}Visible" (click)="executeCustomAction($event, '${formattedActionKebab}', row)" style="cursor: pointer;" matTooltip="{{ '${
                    sharedOptions.templateHelper.getVersionedAccessPrefix(sharedOptions)
                }${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${
                    sharedOptions.templateHelper.getVersionedAccessPrefix(sharedOptions)
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
              ${sharedOptions.customRowActions
            .map((action: string): string => {
                const formattedAction = action.replace(/\.[^/.]+$/, '');
                const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                const classifiedAction = classify(formattedActionKebab);
                const commonParts = `style="cursor: pointer;" matTooltip="{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(sharedOptions)}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(sharedOptions)}${formattedActionKebab}.customRowAction' | translate }}"`;
                const iconTemplate =
                    action.lastIndexOf('.') === -1
                        ? `<mat-icon data-test="custom-action-icon" ${commonParts} class="material-icons">${formattedAction}</mat-icon>`
                        : `<mat-icon data-test="custom-action-icon" svgIcon="${formattedAction}" ${commonParts}></mat-icon>`;
                return `
                      <button mat-menu-item *ngIf="is${classifiedAction}Visible" data-test="custom-action-button" (click)="executeCustomAction($event, '${formattedActionKebab}', row)">
                          ${iconTemplate}
                          <span data-test="custom-action-text" style="vertical-align: middle">{{ '${sharedOptions.templateHelper.getVersionedAccessPrefix(sharedOptions)}${formattedActionKebab}.customRowAction' | translate}}</span>
                      </button>
                     `;
            })
            .join('')}
      </mat-menu>
      </td>
    </ng-container>`
        : '';
}

function getEnumProperties(): string {
    return sharedOptions.templateHelper.getEnumProperties(sharedOptions)
        .map((property: Property) => classify(property.characteristic.name)).join(',')
}

function getEnumPropertyColumns(): string {
    return allProps.map((property: Property, index: number, arr: Property[]) => {
        let complexEnumProperties = ``;
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexProps = sharedOptions.templateHelper.getComplexProperties(property, sharedOptions);
            complexProps.properties.map((complexProp: Property, i: number, complexPropsArr: Property[]) => {
                complexEnumProperties = `${complexEnumProperties}${dasherize(`${complexProps.complexProp}_${complexProp.name}`)
                    .replace(/-/g, '_')
                    .toUpperCase()} = '${complexProps.complexProp}.${complexProp.name}',`;
                return complexProp;
            });
        }

        return `${!(property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity)
            ? `${dasherize(property.name).replace(/-/g, '_').toUpperCase()} = '${sharedOptions.jsonAccessPath}${property.name.trim()}'${index <= arr.length - 1 ? `,` : ``}`
            : `${complexEnumProperties}`}`;
    }).join('')
}

function getEnumCustomColumns(): string {
    return sharedOptions.customColumns
        .map((value: string) => `${dasherize(value.trim()).replace(/-/g, '_').toUpperCase()} = '${value.trim()}',`)
        .join('')
}

function getCustomRowActionInput(): string {
    return `${sharedOptions.customRowActions.map((customRowAction: string) => {
        const formattedAction = customRowAction.replace(/\.[^/.]+$/, '');
        const classifiedFormattedAction = classify(formattedAction);
        return `@Input() is${classifiedFormattedAction}Visible = true;`;
    }).join('')}`
}

function getCustomColumnsInput(): string {
    return `${sharedOptions.customColumns && sharedOptions.customColumns.length > 0 ? sharedOptions.customColumns.map((customColumn: string) =>
        `@Input("${camelize(customColumn)}Column") ${camelize(customColumn)}Template!: TemplateRef<any>;`).join('') : ''}`;
}

function getCustomColumn(): string {
    return `${sharedOptions.customColumns.map((value: string) => {
        `'${value.trim()}'`;
    }).join(', ')}`;
}

function getByValueFunction(): string {
    const propertyValues = new TsFilterServiceGenerator(sharedOptions).getAllEnumProps();
    return `${propertyValues.map(property => {
        return property.enumWithEntities ? `get${classify(property.propertyName)}Value = ${classify(property.characteristic)}.getByValue;` : '';
    }).join('')}`;
}

function hasCustomActions(): boolean {
    return [...sharedOptions.customRowActions, ...sharedOptions.customCommandBarActions].findIndex(element => element.includes('.')) !== -1;
}

function getSharedCustomRows(): string {
    return `this.currentLanguage = this.translateService.currentLang; 
    ${[...sharedOptions.customRowActions, ...sharedOptions.customCommandBarActions]
        .map((customRowActions: string) => `${customRowActions.lastIndexOf('.') > -1 ? `iconRegistry.addSvgIcon('${customRowActions.replace(/\.[^/.]+$/, '')}', sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/${customRowActions}'));` : ``}`)
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
            ${sharedOptions.hasDateQuickFilter ? 'private dateAdapter: DateAdapter<any>,@Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats,' : ''}`;
}

function getApplyFilters() {
    const removeFilterFn = `removeFilter(filterData:any):void {
                                    ${sharedOptions.hasFilters ? `this.filterService.removeFilter(filterData)` : ''};
                                    this.paginator.firstPage();
                                    ${sharedOptions.hasSearchBar ? `this.filterService.searchString.reset();` : ''}
                                    this.applyFilters();
                                }`;

    if (sharedOptions.enableRemoteDataHandling) {
        return `
                applyFilters(): void {
                    ${sharedOptions.hasSearchBar ? `
                        if(this.filterService.searchString.errors) {
                            return;
                        }` : ``}
                    
                    this.tableUpdateStartEvent.emit();
                    ${sharedOptions.addRowCheckboxes ? `this.selection.clear();
                    this.rowSelectionEvent.emit(this.selection.selected);` : ``}
                    const query = new And();
                    ${sharedOptions.hasEnumQuickFilter ? `this.filterService.applyEnumFilter(query);` : ``}
                    ${sharedOptions.hasSearchBar ? `this.filterService.applyStringSearchFilter(query);
                        this.highlightString = this.filterService.activeFilters
                            .filter(elem => elem.type === FilterEnums.Search && elem.filterValue !== undefined)
                            .map(elem => elem.filterValue as string);` : ``}
                    ${sharedOptions.hasDateQuickFilter ? `this.filterService.applyDateFilter(query);` : ``}

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
                    
                    const additionalCondition = new Eq('local', '${sharedOptions.chooseLanguageForSearch ? sharedOptions.chooseLanguageForSearch.toUpperCase() : 'EN'}');
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
                      this.${camelize((sharedOptions.customRemoteService ? 'custom' : '') + sharedOptions.name)}Service.requestData(this.remoteAPI, {query: rqlStringTemp}).subscribe((response: ${classify(sharedOptions.aspectModel.name)}Response): void => {
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
                ${sharedOptions.hasSearchBar ? `
                    if(this.filterService.searchString.errors){
                        return;
                    }` : ``}
                    
                    this.tableUpdateStartEvent.emit();
                    let dataTemp = [...this.data];
                    ${sharedOptions.hasEnumQuickFilter ? `dataTemp = this.filterService.applyEnumFilter(dataTemp);` : ``}
                    ${sharedOptions.hasSearchBar ? `dataTemp = this.filterService.applyStringSearchFilter(dataTemp);
                    this.highlightString = this.filterService.activeFilters
                    .filter(elem => elem.type === FilterEnums.Search && elem.filterValue !== undefined)
                    .map(elem => elem.filterValue as string);` : ``}
                    
                    ${sharedOptions.hasDateQuickFilter ? `dataTemp = this.filterService.applyDateFilter(dataTemp); ` : ``}
                        this.dataSource.setData(dataTemp);
                          this.filteredData = dataTemp;
                          this.totalItems = this.data.length;
                          this.maxExportRows = this.totalItems;
                          this.checkIfOnValidPage();
                          ${sharedOptions.addRowCheckboxes ? `this.trimSelectionToCurrentPage();` : ``}
                          this.tableUpdateFinishedEvent.emit();
                       }
                    ${removeFilterFn}
                 `;
    }
}

function getColumnTransKeyPrefix(): string {
    return sharedOptions.enableVersionSupport ? `${sharedOptions.selectedModelElement.name.toLowerCase()}.v${sharedOptions.templateHelper.formatAspectModelVersion(sharedOptions.aspectModelVersion)}.` : ``;
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

function getReplacedLocalStorageKeyColumnsLowerCase(): string {
    return sharedOptions.templateHelper.getLocalStorageKeyColumns(sharedOptions).replace(sharedOptions.templateHelper.getLocalStoragePrefix(), '').toLowerCase()
}

function getReplacedLocalStorageKeyConfigLowerCase(): string {
    return sharedOptions.templateHelper.getLocalStorageKeyConfig(sharedOptions).replace(sharedOptions.templateHelper.getLocalStoragePrefix(), '').toLowerCase()
}
