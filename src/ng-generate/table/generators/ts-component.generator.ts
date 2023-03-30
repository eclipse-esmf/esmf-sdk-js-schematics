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

import {Schema} from '../schema';
import {camelize, classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {TemplateHelper} from '../../../utils/template-helper';
import {TsFilterServiceGenerator} from './ts-filter-service.generator';

export class TsComponentGenerator {
    private readonly options: Schema;
    private readonly hasSearchBar: boolean;
    private readonly hasDateQuickFilter: boolean;
    private readonly hasEnumQuickFilter: boolean;
    private readonly hasFilters: boolean;
    private readonly filterServiceName: string;
    private allProps: Property[];

    constructor(options: Schema) {
        this.options = options;
        this.hasSearchBar = this.options.templateHelper.isAddCommandBarFunctionSearch(this.options.enabledCommandBarFunctions);
        this.hasDateQuickFilter = this.options.templateHelper.isAddDateQuickFilters(this.options.enabledCommandBarFunctions);
        this.hasEnumQuickFilter = this.options.templateHelper.isAddEnumQuickFilters(this.options.enabledCommandBarFunctions);
        this.hasFilters = this.hasEnumQuickFilter || this.hasDateQuickFilter || this.hasSearchBar;
        this.filterServiceName = `${classify(this.options.name)}FilterService`;
    }

    generate(): string {
        this.allProps = this.options.templateHelper.getProperties(this.options);
        const isRemote = this.options.enableRemoteDataHandling;

        return `
        /** ${this.options.templateHelper.getGenerationDisclaimerText()} **/ 
        ${this.getImports(isRemote)}
        ${this.getDefinitionColumns()}
        
        ${this.getComponentDeclaration()}
        export class ${classify(this.options.name)}Component implements OnInit, AfterViewInit, AfterViewChecked${
            !isRemote ? `, OnChanges` : ``
        }${this.hasSearchBar ? `, OnDestroy` : ``}
        {

            ${this.getVariables(isRemote)}
            ${this.getConstructor(isRemote)}
            
            ${this.getOnInit(isRemote)}
            ${this.getOnChange(isRemote)}
            ${this.hasSearchBar ? this.getOnDestroy() : ''}
            ${this.getAfterViewInit(isRemote)}
            ${this.getAfterViewChecked()}
            
            ${this.getOnInitializeColumns(this.options)}
            ${this.hasSearchBar ? this.getToggleSelection() : ''}

            hideColumn(column: ${classify(this.options.name)}Column): void {
                this.displayedColumns = this.displayedColumns.filter(columnName => columnName !== column);
            }

            showColumn(column: ${classify(this.options.name)}Column, index: number): void {
                if (!this.displayedColumns.includes(column)) {
                    this.displayedColumns.splice(index, 0, column);
                }
            }

            resetDisplayedColumns(): void {
                this.displayedColumns = Object.values(${classify(this.options.name)}Column);
            }

            ${this.getIsCustomColumnFn()}

            pageChange(): void {
                this.applyFilters();
                ${
            !isRemote && this.options.addRowCheckboxes
                ? `this.selection.clear();
                           this.rowSelectionEvent.emit(this.selection.selected);`
                : ''
        }
            }
            
            sortData(): void {
                this.applyFilters();
            }
            
            trackBy(index:number): number {
                return index;
            }
            
            rowClicked(row: any, $event: MouseEvent): boolean {
                  if (this.highlightSelectedRow) {
                    this.checkboxClicked(row);
                  }
                  if ($event.type === 'contextmenu') {
                    $event.preventDefault();
                    let mousePositionOnClick = { x: $event.clientX + 'px', y: $event.clientY + 'px' };
                    this.rowRightClickEvent.emit({ data: row, mousePosition: mousePositionOnClick });
                  }
                  if ($event.type === 'click') {
                    this.rowClickEvent.emit({ data: row })
                  }
                  return false;
            }
            
            rowDblClicked(row: any, $event: MouseEvent): void {
                this.rowDblClickEvent.emit({data: row});
            }
            
            copyToClipboard(value: any, event: MouseEvent): void {
                event.stopPropagation();
                event.preventDefault();
                this.clipboard.copy(value);
                this.copyToClipboardEvent.emit(value);
            }
            
            ${this.processRowCheckboxes(isRemote)}
            
            ${
            this.options.customRowActions.length > 0
                ? ` executeCustomAction($event: MouseEvent, action: string, row:any): void{
                        if(this.customRowActionsLength <= this.visibleRowActionsIcons) {
                            $event.stopPropagation();
                        }
                        this.customActionEvent.emit({action: action, data: row})
                   }`
                : ''
        }
            
            ${
            this.options.customCommandBarActions.length > 0
                ? ` executeCustomCommandBarAction($event: MouseEvent, action: string){
                            $event.stopPropagation()
                            this.customCommandBarActionEvent.emit({action: action})
                      }`
                : ``
        }
            
            ${TsComponentGenerator.getReloadFilters()}
            ${this.getApplyFilters(isRemote)}
            ${this.getExportFns()}
            ${this.getDownloadCsvFn()}
            
            initOpenedColumnMenuDialog(): void {
                this.columMenuComponent.keyLocalStorage = this.${this.options.templateHelper.getLocalStorageKeyColumns(this.options)};
                this.columMenuComponent.columnsDefault = [
                    ...Object.values(${classify(this.options.name)}Column)
                      ${
            this.options.addRowCheckboxes
                ? `.filter(columnName => columnName !== ${classify(this.options.name)}Column['CHECKBOX'])`
                : ''
        }
                      ${
            this.options.customRowActions.length > 0
                ? `.filter(columnName => columnName !== ${classify(this.options.name)}Column['CUSTOM_ROW_ACTIONS'])`
                : ''
        }
                      .filter(columnName => columnName !== ${classify(this.options.name)}Column['COLUMNS_MENU'])
                      .map(columnName => {
                        return {name: columnName, selected: true};
                    }),
                ];
                this.columMenuComponent.columns.splice(0, this.columMenuComponent.columns.length);
                this.columMenuComponent.columns.push(...this.columns);
            }
            
            setDisplayedColumns(columns: Array<Column>): void {
                let displayedColumnsTmp: Array<Column> = [];
        
                ${
            this.options.addRowCheckboxes
                ? `if (columns[0].name !== ${classify(this.options.name)}Column['CHECKBOX']) {
                        displayedColumnsTmp.push({name: ${classify(this.options.name)}Column['CHECKBOX'], selected: true});
                    }`
                : ''
        }
                
        
                displayedColumnsTmp.push(...columns);
        
                ${
            this.options.customRowActions.length > 0
                ? `if (${classify(
                    this.options.name
                )}Column['CUSTOM_ROW_ACTIONS'] && columns[columns.length - 1].name !== ${classify(
                    this.options.name
                )}Column['CUSTOM_ROW_ACTIONS']) {
                        displayedColumnsTmp.push({name: ${classify(this.options.name)}Column['CUSTOM_ROW_ACTIONS'], selected: true});
                    }`
                : ''
        }
                
                if (${classify(this.options.name)}Column['COLUMNS_MENU'] && columns[columns.length - 1].name !== ${classify(
            this.options.name
        )}Column['COLUMNS_MENU']) {
                    displayedColumnsTmp.push({name: ${classify(this.options.name)}Column['COLUMNS_MENU'], selected: true});
                }
                
                this.columns = [...columns];
                this.displayedColumns = displayedColumnsTmp.filter(column => column.selected).map(column => column.name);
            }
    
            ${
            !isRemote
                ? `checkIfOnValidPage(): void {
                            if(this.paginator.length  > this.filteredData.length){
                                this.paginator.firstPage();
                            }
                      }`
                : ``
        }
        }`;
    }

    private getVariables(isRemote: boolean): string {
        return `
            ${this.hasSearchBar ? ` @Input() initialSearchString = '';` : ''}
            ${this.options.customRowActions
            .map(cra => {
                const formattedAction = cra.replace(/\.[^/.]+$/, '');
                const classifiedFormattedAction = classify(formattedAction);
                return `@Input() is${classifiedFormattedAction}Visible = true;`;
            })
            .join('')}
            
            ${
            this.options.templateHelper.getDateProperties(this.options).find(prop => this.options.templateHelper.isDateProperty(prop))
                ? "@Input() tableDateFormat = 'short';"
                : ''
        }
            ${
            this.options.templateHelper
                .getDateProperties(this.options)
                .find(prop => this.options.templateHelper.isDateTimestampProperty(prop))
                ? "@Input() tableDateTimeFormat = 'short';"
                : ''
        }
            ${
            this.options.templateHelper.getDateProperties(this.options).find(prop => this.options.templateHelper.isTimeProperty(prop))
                ? "@Input() tableTimeFormat = 'shortTime';"
                : ''
        }
                        
            @Input() data: Array<(${classify(this.options.templateHelper.resolveType(this.options.aspectModel).name)})> = [];
            @Input() customTemplate?: TemplateRef<any>;
            @Input() searchHint?: string;
            @Input() showFirstLastButtons: boolean = true;
            ${
            this.options.customColumns && this.options.customColumns.length > 0
                ? `${this.options.customColumns
                    .map(cc => {
                        return `@Input("${camelize(cc)}Column") ${camelize(cc)}Template!: TemplateRef<any>;`;
                    })
                    .join('')}`
                : ''
        }
            
            @Input() pageSize: number = 20;
            @Input() pageSizeOptions: Array<number> = [5, 20, 50, 100];
            
            @Input() highlightSelectedRow: boolean = true;
            @Input() highlightColor = 'rgba(127, 198, 231, 0.3)';
            @Input() isMultipleSelectionEnabled = true;
            @Input() noDataMessage: string = '';
            @Input() visibleRowActionsIcons: number = 3;
            @Input() headerTooltipsOff: boolean = false;
            @Input() setStickRowActions: boolean = true;
            @Input() customTableClass: string = '';
            @Input() debounceTime: number = 500;
            @Input() minNumberCharacters: number = 2;
            @Input() allowedCharacters: string = '';
            @Input() regexValidator:string = '';
            ${
            isRemote
                ? ` 
                        @Input() maxExportPages: number = 5000;
                        @Input() customFilterExtension: CustomRQLFilterExtension | undefined;
                        @Input() customOptionsExtension: CustomRQLOptionExtension | undefined;
                        @Input() extendedCsvExporter: ExtendedCsvExporter | undefined;
                        @Input() remoteAPI: string = '';`
                : '@Input() maxExportPages: number = 0'
        }

            @Output() rowClickEvent = new EventEmitter<any>();
            @Output() rowDblClickEvent = new EventEmitter<any>();
            @Output() rowRightClickEvent = new EventEmitter<any>();
            @Output() tableUpdateStartEvent = new EventEmitter<any>();
            @Output() tableUpdateFinishedEvent = new EventEmitter<any>();
            @Output() copyToClipboardEvent = new EventEmitter<any>();
            @Output() downloadEvent = new EventEmitter<{error: boolean, success: boolean, inProgress: boolean}>();
            @Output() rowSelectionEvent = new EventEmitter<any>();
            ${this.options.customRowActions.length > 0 ? ` @Output() customActionEvent = new EventEmitter<any>(); ` : ``}
            ${this.options.customCommandBarActions.length > 0 ? `@Output() customCommandBarActionEvent = new EventEmitter<any>();` : ``}
           
            @ViewChild(MatSort) private sort!: MatSort;
            @ViewChild(MatPaginator) private paginator!: MatPaginator
            @ViewChild(MatTable) private table!: MatTable<${classify(
            this.options.templateHelper.resolveType(this.options.aspectModel).name
        )}>;
            @ViewChild(${classify(this.options.name)}ColumnMenuComponent) private columMenuComponent!: ${classify(
            this.options.name
        )}ColumnMenuComponent;
            @ViewChild(MatAutocompleteTrigger) autocomplete!: MatAutocompleteTrigger;

            @HostBinding("attr.style")
            public get valueAsStyle(): any {
                if(!this.highlightColor) {
                    return;
                }
                return this.sanitizer.bypassSecurityTrustStyle(\`--selected-row-highlight-color: $\{this.highlightColor}\`);
            }
            
            readonly ${this.options.templateHelper.getLocalStorageKeyColumns(this.options)} = '${this.options.templateHelper
            .getLocalStorageKeyColumns(this.options)
            .replace(this.options.templateHelper.getLocalStoragePrefix(), '')
            .toLowerCase()}'; 
            
            ${this.hasSearchBar ? 'subscription: Subscription | undefined;' : ''}
            
            totalItems: number = 0;
            selection = new SelectionModel<any>(this.isMultipleSelectionEnabled, []);
            dataSource: ${classify(this.options.name)}DataSource;
            columnToSort:{sortColumnName: string, sortDirection: SortDirection} = {sortColumnName:'${
            this.options.defaultSortingCol
        }', sortDirection : 'asc'};
            displayedColumns: Array<string> = Object.values(${classify(this.options.name)}Column);
            columns: Array<Column> = [];
            currentLanguage: string;
            filteredData: Array<${classify(this.options.templateHelper.resolveType(this.options.aspectModel).name)}> = [];
            dragging: boolean = false;
            customRowActionsLength: number = ${this.options.customRowActions.length};
            closeColumnMenu: boolean = false;
            rqlString: string = '';
            searchString = new FormControl();
            searchFocused: boolean = false;
            ${this.getByValueFunction()}
            `;
    }

    private getComponentDeclaration(): string {
        return `@Component({
                selector: '${this.options.selector}',
                templateUrl: './${dasherize(this.options.name)}.component.html',
                styleUrls: ['./${dasherize(this.options.name)}.component.${this.options.style}']
                ${
            this.options.viewEncapsulation
                ? `,encapsulation: ViewEncapsulation.${this.options.viewEncapsulation}${
                    this.options.changeDetection !== 'Default'
                        ? `, changeDetection: ChangeDetectionStrategy.${this.options.changeDetection},`
                        : ''
                }`
                : ``
        }
              })`;
    }

    private getConstructor(isRemote: boolean) {
        const hasCustomActions =
            [...this.options.customRowActions, ...this.options.customCommandBarActions].findIndex(element => element.includes('.')) !== -1;
        const getSharedCustomRows = `
                this.currentLanguage = this.translateService.currentLang;
                ${[...this.options.customRowActions, ...this.options.customCommandBarActions]
            .map(
                cra =>
                    `${
                        cra.lastIndexOf('.') > -1
                            ? `iconRegistry.addSvgIcon('${cra.replace(
                                /\.[^/.]+$/,
                                ''
                            )}', sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/${cra}'));`
                            : ``
                    }`
            )
            .join('')}
                ${
            this.hasSearchBar
                ? ` this.subscription = this.filterService.searchStringChanged
                                .pipe(
                                    debounceTime(this.debounceTime),
                                    map((event: any) => (event?.target?.value ? event.target.value.trim() : '')),
                                    distinctUntilChanged(),
                                    filter((searchText: string) => searchText.length >= this.minNumberCharacters && this.minNumberCharacters !== 0)
                                )
                                .subscribe(() => this.applyFilters());
                          `
                : ''
        }`;

        const commonImports = `
            ${hasCustomActions ? `iconRegistry: MatIconRegistry,` : ``}
            private sanitizer: DomSanitizer,
            private translateService: TranslateService,
            public dialog: MatDialog,
            private clipboard: Clipboard,
            private storageService: JSSdkLocalStorageService,
            ${this.hasFilters ? `public filterService: ${this.filterServiceName},` : ''}
            ${
            this.hasDateQuickFilter
                ? 'private dateAdapter: DateAdapter<any>,@Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats,'
                : ''
        }`;
        if (isRemote) {
            return `constructor(
                    ${commonImports} private ${camelize((this.options.customRemoteService ? 'custom' : '') + this.options.name)}Service: ${
                this.options.customRemoteService ? 'Custom' : ''
            }${classify(this.options.name)}Service,
                    private cd: ChangeDetectorRef) {
                        this.dataSource = new ${classify(this.options.name)}DataSource();
                        ${getSharedCustomRows}
                    }`;
        } else {
            return `constructor(
                    ${commonImports} private ${camelize(this.options.name)}Service: ${classify(this.options.name)}Service) {
                        this.dataSource = new ${classify(this.options.name)}DataSource(this.translateService);
                        ${getSharedCustomRows}
              }`;
        }
    }

    private getDefinitionColumns(): string {
        const templateHelper = new TemplateHelper();
        return `
            /**
             * Enumeration of all available columns which can be shown/hide in the table.
             */
            export enum ${classify(this.options.name)}Column {
            ${this.options.addRowCheckboxes ? `CHECKBOX = 'checkboxes',` : ''}
            ${this.allProps
            .map((prop: Property, index: number, arr: Property[]) => {
                let complexEnumProperties = ``;
                if (prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity) {
                    const complexProps = templateHelper.getComplexProperties(prop, this.options);
                    complexProps.properties.map((complexProp: Property, i: number, complexPropsArr: Property[]) => {
                        complexEnumProperties = `${complexEnumProperties}${dasherize(`${complexProps.complexProp}_${complexProp.name}`)
                            .replace(/-/g, '_')
                            .toUpperCase()} = '${complexProps.complexProp}.${complexProp.name}',`;
                        return complexProp;
                    });
                }

                return `${
                    !(prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity)
                        ? `${dasherize(prop.name).replace(/-/g, '_').toUpperCase()} = '${
                            this.options.jsonAccessPath
                        }${prop.name.trim()}'${index <= arr.length - 1 ? `,` : ``}`
                        : `${complexEnumProperties}`
                }`;
            })
            .join('')}
            ${this.options.customColumns
            .map(prop => {
                return `${dasherize(prop.trim()).replace(/-/g, '_').toUpperCase()} = '${prop.trim()}',`;
            })
            .join('')}
            ${this.options.customRowActions.length > 0 ? `CUSTOM_ROW_ACTIONS = 'customRowActions',` : ''}
            COLUMNS_MENU = 'columnsMenu'
        }`;
    }

    private getExportFns(): string {
        const serviceName =
            camelize((this.options.enableRemoteDataHandling && this.options.customRemoteService ? 'custom' : '') + this.options.name) +
            'Service';
        return `
            exportToCsv() {
                this.openExportConfirmationDialog();
            }

            openExportConfirmationDialog() {
                const reduce = this.displayedColumns.filter(col => col === 'checkboxes' || col === 'columnsMenu').length;
                
                const dialogRef = this.dialog.open(ExportConfirmationDialog, {
                    data: {
                        ${this.options.enableRemoteDataHandling ? `extendedCsvExporter: this.extendedCsvExporter,` : ``}
                        allColumns: this.columns.length,
                        displayedColumns: this.displayedColumns.length - reduce,
                        maxExportPages: this.maxExportPages,
                    },
                    maxWidth: 478,
                });

                dialogRef.afterClosed().pipe(filter(e => !!e)).subscribe((exportEvent: {exportAllPages: boolean, exportAllColumns: boolean}): void => {
                    const { exportAllPages, exportAllColumns } = exportEvent;

                    if (exportAllPages && this.data.length > this.maxExportPages) {
                        this.data.length = this.maxExportPages;
                    } else if (this.data.length > this.paginator.pageSize) {
                        this.data.length = this.paginator.pageSize;
                    }
                    
                    ${
            this.options.enableRemoteDataHandling
                ? `const columns = exportAllColumns ? this.columns.map(c => c.name) : this.displayedColumns;
                                this.extendedCsvExporter?.export(columns, this.rqlString)`
                : `this.prepareCsv(this.${serviceName}.flatten(this.data), exportAllColumns)`
        }
                });
            }

            ${this.generatePrepareCsvFn()}
        `;
    }

    private generatePrepareCsvFn(): string {
        const columnTransKeyPrefix = this.options.enableVersionSupport
            ? `${this.options.selectedModelElement.name.toLowerCase()}.v${this.options.templateHelper.formatAspectModelVersion(
                this.options.aspectModelVersion
            )}.`
            : ``;

        return `prepareCsv(data: any, exportAllColumns: boolean): void {

            const columns = exportAllColumns ? this.columns.map(c => c.name) : this.displayedColumns;
            ${this.getBlockHeaderToExport()}

            const headersCSV = unparse({
                fields: headersToExport
                    ${!this.options.templateHelper.isAspectSelected(this.options) ? ".map(columnName => columnName.split('.').pop())" : ''}
                    .map(columnName => {
                        const translatedHeader = this.translateService.instant(\`${columnTransKeyPrefix}\${columnName}.preferredName\`);
                        return translatedHeader !== \`${columnTransKeyPrefix}\${columnName}.preferredName\` ? translatedHeader : columnName;
                }),
                data: [],
            });

            this.downloadCsv(\`\${headersCSV}\${unparse(data, {header: false, columns: headersToExport})}\`);
        }`;
    }

    private getIsCustomColumnFn() {
        if (!this.options.customColumns.length) {
            return ``;
        }
        return `
            isCustomColumn(columnName: string): boolean {
                const customColumns = [${this.options.customColumns
            .map(prop => {
                return `'${prop.trim()}'`;
            })
            .join(', ')}];

                return customColumns.includes(columnName);
            }
        `;
    }

    private getBlockHeaderToExport(): string {
        let defTemp = `const headersToExport = columns`;

        defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(this.options.name)}Column.COLUMNS_MENU)`;

        if (this.options.addRowCheckboxes) {
            defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(this.options.name)}Column.CHECKBOX)`;
        }

        if (this.options.customRowActions.length > 0) {
            defTemp = `${defTemp}.filter(columnName => columnName !== ${classify(this.options.name)}Column.CUSTOM_ROW_ACTIONS)`;
        }

        if (this.options.customColumns.length > 0) {
            defTemp = `${defTemp}.filter((columnName: string): boolean => !this.isCustomColumn(columnName))`;
        }

        return `${defTemp};`;
    }

    private getDownloadCsvFn(): string {
        return `
        downloadCsv(csvArray: any): void {
            this.downloadEvent.emit({error: false, success: false, inProgress: true});
            try {
                this.${camelize(
            (this.options.enableRemoteDataHandling && this.options.customRemoteService ? 'custom' : '') + this.options.name
        )}Service.downloadCsv(csvArray);
                this.downloadEvent.emit({error: false, success: true, inProgress: false});
            } catch(error: any) {
                this.downloadEvent.emit({error: true, success: false, inProgress: false});
            }
        }
        `;
    }

    static getExportComponentDialog(options: Schema): string {
        return `
        /** ${options.templateHelper.getGenerationDisclaimerText()} **/
        import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
        import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
        import { TranslateService } from '@ngx-translate/core';
        import { MatCheckbox } from '@angular/material/checkbox';
        
        @Component({
            selector: 'export-confirmation-dialog',
            templateUrl: 'export-confirmation-dialog.component.html',
            styleUrls: ['./export-confirmation-dialog.component.scss'],
        })
        export class ExportConfirmationDialog implements AfterViewInit {
            @ViewChild('exportAllPages') exportAllPages!: MatCheckbox;
            @ViewChild('exportAllColumns') exportAllColumns!: MatCheckbox;
          
            dialogDescription = '';
            showAllColumnsBox = true;

            constructor(
                @Inject(MAT_DIALOG_DATA) public data: {
                    ${options.enableRemoteDataHandling ? `extendedCsvExporter: boolean, ` : ``}
                    allColumns: number;
                    displayedColumns: number;
                    maxExportPages: number;                    
                },
                public dialogRef: MatDialogRef<ExportConfirmationDialog>,
                private translateService: TranslateService,
            ) {}
            
            ngAfterViewInit() {
              this.showAllColumnsBox =
                this.data.displayedColumns === this.data.allColumns;
                    
              this.setDialogDescription();
            }
            
            setDialogDescription() {
              const {maxExportPages, allColumns, displayedColumns} = this.data;
      
              const isExportAllPagesChecked = this.exportAllPages.checked;
              const isExportAllColumnsChecked = this.exportAllColumns?.checked;
              
              if (isExportAllPagesChecked && isExportAllColumnsChecked) {
                  this.dialogDescription = this.translateService.instant('exportData.description.caseOne', {
                      maxExportPages,
                      allColumns,
                  });
              } else if (isExportAllPagesChecked && !isExportAllColumnsChecked) {
                  this.dialogDescription = this.translateService.instant(
                      displayedColumns > 1 ? 'exportData.description.caseTwo.plural' : 'exportData.description.caseTwo.singular',
                      {
                          maxExportPages,
                          displayedColumns,
                      }
                  );
              } else if (!isExportAllPagesChecked && !isExportAllColumnsChecked) {
                  this.dialogDescription = this.translateService.instant(
                      displayedColumns > 1 ? 'exportData.description.caseThree.plural' : 'exportData.description.caseThree.singular',
                      {
                          displayedColumns,
                      }
                  );
              } else if (!isExportAllPagesChecked && isExportAllColumnsChecked) {
                  this.dialogDescription = this.translateService.instant('exportData.description.caseFour', {
                      allColumns,
                  });
              } else {
                  this.dialogDescription = this.translateService.instant('exportData.description.default');
              }
            }

            closeDialog() {
              this.dialogRef.close();
            }
          
            exportData() {
              this.dialogRef.close({
                exportAllPages: this.exportAllPages.checked,
                exportAllColumns: this.exportAllColumns?.checked,
              });
            }
        }
        `;
    }

    private static getReloadFilters(): string {
        return `
        reloadFilter(): void {
            this.paginator.firstPage();
            this.applyFilters();
        }`;
    }

    private getApplyFilters(isRemote: boolean) {
        const removeFilterFn = `removeFilter(filterData:any):void {
                                    ${this.hasFilters ? `this.filterService.removeFilter(filterData)` : ''};
                                    this.paginator.firstPage();
                                    this.applyFilters();
                                }`;

        if (isRemote) {
            return `
                applyFilters(): void {
                ${
                this.hasSearchBar
                    ? `
                    if(this.searchString.errors || this.filterService.isSearchStringColumnsEmpty()){
                        return;
                    }
                `
                    : ``
            }
                    
                    this.tableUpdateStartEvent.emit();
                    this.autocomplete.closePanel();
                    ${
                this.options.addRowCheckboxes
                    ? `this.selection.clear();
                                this.rowSelectionEvent.emit(this.selection.selected);`
                    : ``
            }
                    const query = new And();
                    ${this.hasEnumQuickFilter ? `this.filterService.applyEnumFilter(query);` : ``}
                    ${this.hasSearchBar ? `this.filterService.applyStringSearchFilter(query);` : ``}
                    ${this.hasDateQuickFilter ? `this.filterService.applyDateFilter(query);` : ``}

                    if (this.customFilterExtension) {
                        this.customFilterExtension.apply(query);
                    }

                    const queryFilter = query.subNodes.length === 0 ? null : new Query({query: query});

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

                    const filterRQLQuery = queryFilter ? QueryStringifier.stringify(queryFilter) : '';
                    const optionsRQLQuery = QueryStringifier.stringify(queryOption).replace('&', ',');

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
                      this.${camelize(
                (this.options.customRemoteService ? 'custom' : '') + this.options.name
            )}Service.requestData(this.remoteAPI, {query: rqlStringTemp}).subscribe((response: ${classify(
                this.options.aspectModel.name
            )}Response): void => {
                          this.dataSource.setData(response.items);
                          this.filteredData = response.items;
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
                          ${
                this.hasSearchBar
                    ? `
                          if(this.filterService.isSearchStringColumnsEmpty()){
                              return;
                          }`
                    : ``
            }
                          this.tableUpdateStartEvent.emit();
                          this.autocomplete.closePanel();
                          let dataTemp = [...this.data];
                          ${this.hasEnumQuickFilter ? `dataTemp = this.filterService.applyEnumFilter(dataTemp);` : ``}
                          ${this.hasSearchBar ? `dataTemp = this.filterService.applyStringSearchFilter(dataTemp);` : ``}
                          ${this.hasDateQuickFilter ? `dataTemp = this.filterService.applyDateFilter(dataTemp); ` : ``}
                          this.dataSource.setData(dataTemp);
                          this.filteredData = dataTemp;
                          this.checkIfOnValidPage();
                          ${this.options.addRowCheckboxes ? `this.trimSelectionToCurrentPage();` : ``}
                          this.tableUpdateFinishedEvent.emit();
                       }

                       ${removeFilterFn}
                 `;
        }
    }

    private processRowCheckboxes(isRemote: boolean): string {
        const defaultFunctions = `
            checkboxClicked(row: any): void {
                    if(!this.isMultipleSelectionEnabled) {
                        this.selection.clear();
                    }
                    this.selection.toggle(row);
                    this.rowSelectionEvent.emit(this.selection.selected);
            }`;

        if (this.options.addRowCheckboxes) {
            return `
                    ${defaultFunctions}
                    
                    isAllSelected(): boolean {
                      return this.selection.selected.length == this.dataSource.displayedData.length;
                    }

                    toggleSelectAll(): void {
                      this.isAllSelected() ? this.selection.clear() : this.dataSource.displayedData.forEach(item => this.selection.select(item));
                      this.rowSelectionEvent.emit(this.selection.selected);
                    }

                    ${
                !isRemote
                    ? `  trimSelectionToCurrentPage(): void {
                                      const indexOfLastItemOnPreviousPage = this.paginator.pageSize * this.paginator.pageIndex - 1;
                                      const indexOfFirstItemOnNextPage = this.paginator.pageSize * (this.paginator.pageIndex + 1);
                                      this.selection.selected.forEach((u): void => {
                                        if(!this.filteredData.includes(u)) {
                                          this.selection.deselect(u);
                                        }
                                      })
                                      this.filteredData.forEach((u, i): void => {
                                          if (i >= indexOfFirstItemOnNextPage || i <= indexOfLastItemOnPreviousPage) {
                                              this.selection.deselect(this.filteredData[i]);
                                          }
                                      });
                                      this.rowSelectionEvent.emit(this.selection.selected);
                                }`
                    : ``
            }
            `;
        }
        return defaultFunctions;
    }

    private getImports(isRemote: boolean) {
        return `import {
            AfterViewInit,
            Component,
            Input,
            ViewChild,
            Output,
            EventEmitter,
            SimpleChanges,
            HostBinding,
            Inject,
            OnInit,
            AfterViewChecked,
            TemplateRef,
           ${this.hasSearchBar ? 'OnDestroy,' : ''} 
           ${!isRemote ? `OnChanges,` : ``}
           ${this.options.viewEncapsulation ? `ViewEncapsulation,` : ``}
           ${this.options.changeDetection !== 'Default' ? `ChangeDetectionStrategy,` : ``}
           ${isRemote ? `ChangeDetectorRef, ` : ``}
            } from '@angular/core';
            import { MatPaginator } from '@angular/material/paginator';
            import { MatSort, SortDirection } from '@angular/material/sort';
            import { MatTable } from '@angular/material/table';
            ${
            this.hasFilters
                ? `import { ${this.filterServiceName} ${this.hasSearchBar ? `, SearchField` : ``}} from './${dasherize(
                    this.options.name
                )}.filter.service'`
                : ''
        }
            import {Clipboard} from '@angular/cdk/clipboard';
            import {unparse} from 'papaparse';
            import {ExportConfirmationDialog} from '${
            this.options.enableVersionSupport ? `../` : ``
        }../export-confirmation-dialog/export-confirmation-dialog.component';
            import {MatDialog} from '@angular/material/dialog';
            import {FormControl} from '@angular/forms';
            import {
            ${classify(this.options.templateHelper.resolveType(this.options.selectedModelElement).name)}
            ${
            this.options.selectedModelElement.aspectModelUrn !== this.options.aspectModel.aspectModelUrn &&
            !this.options.aspectModel.isCollectionAspect
                ? `, ${classify(this.options.templateHelper.resolveType(this.options.aspectModel).name)}`
                : ''
        }
            ${
            this.hasEnumQuickFilter
                ? `, ${this.options.templateHelper
                    .getEnumProperties(this.options)
                    .map(prop => {
                        return classify(prop.characteristic.name);
                    })
                    .join(',')}`
                : ''
        }
            } from '${this.options.templateHelper.getTypesPath(
            this.options.enableVersionSupport,
            this.options.aspectModelVersion,
            this.options.aspectModel
        )}';
            import {${classify(this.options.name)}DataSource} from './${dasherize(this.options.name)}-datasource';
            ${
            this.hasDateQuickFilter
                ? `
                       import {DateAdapter,MatDateFormats,MAT_DATE_FORMATS} from '@angular/material/core';`
                : ''
        }
            ${
            [...this.options.customRowActions, ...this.options.customCommandBarActions].findIndex(element => element.includes('.')) !==
            -1
                ? `import { MatIconRegistry } from '@angular/material/icon';`
                : ''
        }
            import {DomSanitizer} from '@angular/platform-browser';
            import {SelectionModel} from '@angular/cdk/collections';
            import {TranslateService} from '@ngx-translate/core';
            import {JSSdkLocalStorageService} from "${this.options.enableVersionSupport ? `../` : ``}../../services/storage.service";
            import {${classify(this.options.name)}ColumnMenuComponent} from './${dasherize(this.options.name)}-column-menu.component';
            ${
            this.hasFilters
                ? `import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
                       import {Subscription} from 'rxjs';`
                : `import {filter} from 'rxjs/operators';`
        }
            ${
            isRemote
                ? `import {${this.options.customRemoteService ? 'Custom' : ''}${classify(this.options.name)}Service} from './${
                    this.options.customRemoteService ? 'custom-' : ''
                }${dasherize(this.options.name)}.service';
                       import {${classify(this.options.aspectModel.name)}Response} from './${dasherize(this.options.name)}.service'; 
                       import {AbstractArrayNode,
                               AbstractLogicalNode,
                               AbstractNode,
                               And,
                               Ge,
                               In,
                               Le,
                               Like,
                               Limit,
                               Or,
                               Query,
                               QueryStringifier,
                               Sort
                       } from 'rollun-ts-rql';
                       
                       /**
                        * Interface of a CustomRQLFilterExtension which will be used to
                        * modify the RQL query before the API service will be called to query 
                        * the backend.  
                        */ 
                       export interface CustomRQLFilterExtension {
                            /** 
                             * Apply modification to the given RQL query
                             */
                            apply(query: And): void;
                       }

                       /**
                        * Interface of a CustomRQLOptionExtension which will be used to
                        * modify the RQL query before the API service will be called to query 
                        * the backend.  
                        */ 
                       export interface CustomRQLOptionExtension {
                            /** 
                             * Apply modification to the given RQL query
                             */
                            apply(query: Query): void;
                       }
                       
                       /**
                        * Interface of ExtendedCsvExporter which will used to export data
                        * from a remote backend.
                        */
                       export interface ExtendedCsvExporter {
                            /**
                             * Exports the all data
                             */
                            export(displayedColumns: string[], rqlQuery: string): void;
                       }`
                : `import {${classify(this.options.name)}Service, ${classify(
                    this.options.aspectModel.name
                )}Response} from './${dasherize(this.options.name)}.service';`
        }
            import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
            
            export interface Column {
                /** Column name **/
                name: string;
                /** State if the column is selected **/
                selected: boolean;
            }
        
        `;
    }

    private getOnInit(isRemote: boolean): string {
        return `ngOnInit(): void {
                    ${this.hasSearchBar ? ` this.filterService.searchString = this.initialSearchString;` : ''}
                    this.initializeColumns();
                    ${!isRemote ? 'this.maxExportPages = this.data.length;' : ''}
               }`;
    }

    private getOnDestroy(): string {
        return `ngOnDestroy(): void {
                    if(this.subscription) {
                        this.subscription.unsubscribe();
                    }
                }`;
    }

    private getAfterViewInit(isRemote: boolean): string {
        return `ngAfterViewInit(): void {
                    ${!isRemote ? '' : `this.applyFilters();`}
                    this.dataSource.paginator = this.paginator;
                    this.dataSource.sort = this.sort;
                    this.pageChange();
                }`;
    }

    private getAfterViewChecked(): string {
        return `ngAfterViewChecked(): void {
                    if (this.table) {
                        this.table.updateStickyColumnStyles();
                    }
                }`;
    }

    private getOnChange(isRemote: boolean): string {
        return !isRemote
            ? ` ngOnChanges(changes: SimpleChanges): void {
                        if (this.table) {
                            this.dataSource.setData(this.data);
                            this.totalItems = this.data.length;
                            this.maxExportPages = this.totalItems;
                            this.applyFilters();
                    }}`
            : '';
    }

    private getOnInitializeColumns(options: Schema): string {
        return `
        initializeColumns(): void {
            if (this.storageService.getItem(this.${options.templateHelper.getLocalStorageKeyColumns(options)})) {
                this.storageService
                    .getItem(this.${options.templateHelper.getLocalStorageKeyColumns(options)})
                    .filter((column: Column) => this.displayedColumns.find(columnName => columnName === column.name))
                    .map((column: Column) => this.columns.push({name: column.name, selected: column.selected}));
            }
    
            this.displayedColumns.forEach((displayedColumn: string): void => {
                if (
                    ${options.addRowCheckboxes ? `displayedColumn === ${classify(options.name)}Column['CHECKBOX'] ||` : ''}
                    ${
            options.customRowActions.length > 0
                ? `displayedColumn === ${classify(options.name)}Column['CUSTOM_ROW_ACTIONS'] ||`
                : ''
        }
                    displayedColumn === ${classify(options.name)}Column['COLUMNS_MENU'] ||                 
                    this.columns.find(column => column.name === displayedColumn)
                ) {
                    return;
                }
    
                this.columns.push({name: displayedColumn, selected: true});
            });
    
            // if no column besides checkboxes and column actions is active, reset and show all columns
            if (!this.columns.find((column: Column) => column.selected)) {
                this.columns.forEach((column: Column) => (column.selected = true));
            }
    
            this.setDisplayedColumns(this.columns);
        }
        `;
    }

    private getToggleSelection() {
        return `
          toggleSelection(searchField: SearchField): void {
              searchField.selected = !searchField.selected;
              this.searchString.updateValueAndValidity();
              if (this.searchString.value && !this.filterService.isSearchStringColumnsEmpty()) {
                  this.applyFilters();
              }
          }
      `;
    }

    private getByValueFunction(): string {
        const props = new TsFilterServiceGenerator(this.options).getAllEnumProps();
        return `${props
            .map(prop => {
                return prop.enumWithEntities ? `get${classify(prop.propertyName)}Value = ${classify(prop.characteristic)}.getByValue;` : '';
            })
            .join('')}`;
    }
}
