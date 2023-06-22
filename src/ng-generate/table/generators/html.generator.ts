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

import {camelize, classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {Schema} from '../schema';
import {TemplateHelper} from '../../../utils/template-helper';

type PropValue = {
    propertyValue: string;
    propertyName: string;
    isEnum?: boolean;
    enumWithEntities?: boolean;
    isDate?: boolean;
};

export class HtmlGenerator {
    private readonly options: Schema;
    private readonly hasSearchBar: boolean;
    private readonly hasFilters: boolean;
    private allProps: Property[];
    private versionedAccessPrefix: string;
    private readonly templateHelper: TemplateHelper;

    constructor(options: Schema) {
        this.options = options;
        this.templateHelper = this.options.templateHelper;
        this.hasSearchBar = this.options.templateHelper.isAddCommandBarFunctionSearch(this.options.enabledCommandBarFunctions);
        this.hasFilters =
            this.hasSearchBar ||
            this.options.templateHelper.isAddDateQuickFilters(this.options.enabledCommandBarFunctions) ||
            this.options.templateHelper.isAddEnumQuickFilters(this.options.enabledCommandBarFunctions);
    }

    generate(): string {
        this.versionedAccessPrefix = this.templateHelper.getVersionedAccessPrefix(this.options)
            ? `${this.templateHelper.getVersionedAccessPrefix(this.options)}.`
            : ``;
        this.allProps = this.templateHelper.getProperties(this.options);
        return `
        <div class="js-sdk-component-container">
            ${this.options.addCommandBar ? this.getCommandBar() : ''}
            ${this.getCustomTemplate()}
            ${
            this.hasFilters
                ? `<div class="scrollable-chips-container" *ngIf="filterService.activeFilters.length">
                          <button data-test="scroll-left-button" mat-mini-fab class="mat-elevation-z0"
                                  [disabled]="chipsScrollEl.disableLeftBtn" (click)="chipsScrollEl.scrollChipList('left')"
                                  *ngIf="chipsScrollEl.scrollable">
                              <mat-icon data-test="scroll-left-icon" class="material-icons"
                                        [matTooltip]="'scroll.left' | translate">chevron_left
                              </mat-icon>
                          </button>
                          <div class="chip-list-container" data-test="chip-list-container" horizontalOverflow #chipsScrollEl="horizontalOverflow" #chipList [chipsObj]="chips">
                              <mat-chip-list data-test="chip-list" #chips>
                                  <mat-chip
                                          data-test="chip"
                                          *ngFor="let filter of filterService.activeFilters"
                                          [removable]="filter.removable"
                                          (removed)="removeFilter(filter)"
                                  >
                                      <div data-test="chip-text" class="chip-text"
                                           matTooltip="{{ filter.prop }}: {{ filter.label }}">
                                           <b>{{filter.prop}}</b>: {{ filter.label }}</div>
                                      <button *ngIf="filter.removable" matChipRemove data-test="mat-chip-remove">
                                          <mat-icon class="material-icons" data-test="remove-chip">cancel</mat-icon>
                                      </button>
                                  </mat-chip>
                              </mat-chip-list>
                          </div>
                          <button data-test="scroll-right-button" mat-mini-fab class="mat-elevation-z0"
                                  [disabled]="chipsScrollEl.disableRightBtn" (click)="chipsScrollEl.scrollChipList('right')"
                                  *ngIf="chipsScrollEl.scrollable">
                              <mat-icon data-test="scroll-right-icon" class="material-icons"
                                        [matTooltip]="'scroll.right' | translate">chevron_right
                              </mat-icon>
                          </button>
                      </div>`
                : ''
        }
            <div [hidden]="!!customTemplate && !dataSource.data.length">
                <div data-test="table-container" class="mat-table-container">
                    <table data-test="table" mat-table class="full-width-table" matSortDisableClear="true" matSort (matSortChange)="sortData()"
                            [matSortActive]="columnToSort.sortColumnName" [matSortDirection]="columnToSort.sortDirection" [ngClass]="customTableClass"
                            [dataSource]="dataSource" [trackBy]="trackBy" aria-label="Elements" [matSortDisabled]="dragging">
            
                        <!-- Row shown when there is no matching data that will be provided to the wrapper table. -->
                        <tr data-test="no-data-table-row" class="mat-row" *matNoDataRow>
                        <td data-test="no-data-table-cell" class="mat-cell" [colSpan]="displayedColumns.length" *ngIf="!dataSource.data.length">
                            <span data-test="no-data-message">{{noDataMessage || 'No data'}}</span>
                        </td>
                        </tr>
            
                        ${this.options.addRowCheckboxes ? this.getRowCheckboxes() : ''}
                        ${this.getTableColumns()}
                        ${this.getCustomColumns()}
                        ${this.getCustomRowActions()}
                        
                        <ng-container data-test="columns-menu-button-header" matColumnDef="columnsMenu" stickyEnd>
                            <th data-test="columns-menu-button-header" mat-header-cell *matHeaderCellDef>
                                <button data-test="mat-table-menu-button" 
                                        mat-icon-button 
                                        [matMenuTriggerFor]="columnMenu"
                                        (menuOpened)="initOpenedColumnMenuDialog()"
                                        aria-label="Menu for the table" 
                                        class="mat-table-menu-button">
                                    <mat-icon data-test="mat-table-menu-icon" [matTooltip]="'tableActions.openColumnsMenu' | translate" class="material-icons">settings</mat-icon>
                                </button>
                            </th>
                            <td data-test="columns-menu-button-cell" mat-cell *matCellDef="let row" [class.bg-transparent]="!setStickRowActions"></td>
                        </ng-container>
            
                        <tr data-test="table-header-row" mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
                        <tr data-test="table-row" mat-row *matRowDef="let row; columns: displayedColumns;" [class.selected-row]="selection.isSelected(row) && highlightSelectedRow" (click)="rowClicked(row, $event)" (contextmenu)="rowClicked(row, $event)" (dblclick)="rowDblClicked(row, $event)"></tr>
                    </table>
                
                    <mat-menu data-test="column-menu" #columnMenu="matMenu" class="column-menu">
                        <${dasherize(this.options.name)}-column-menu #columMenuComponent (columnsChangedEvent)="setDisplayedColumns($event)"></${dasherize(this.options.name)}-column-menu>
                    </mat-menu>
                    
                    ${this.hasSearchBar ? `
                      <mat-menu data-test="column-menu" #configurationMenu="matMenu" class="column-menu">
                        <${dasherize(this.options.name)}-config-menu #configurationMenuComponent (configChangedEvent)="setConfiguration($event)"></${dasherize(this.options.name)}-config-menu>
                      </mat-menu>
                    ` : ''}
                    
                </div>
                <mat-paginator data-test="paginator" #paginator
                    [length]="${!this.options.enableRemoteDataHandling ? ` dataSource.length` : `totalItems`}"
                    [pageIndex]="0"
                    [pageSize]="pageSize"
                    [pageSizeOptions]="pageSizeOptions"
                    [showFirstLastButtons]="showFirstLastButtons"
                    (page)="pageChange()">
                </mat-paginator>
            </div>
        </div>
        
        ${this.hasSearchBar ? `
            <!-- Highlighting search values -->
            <ng-template #normal let-value="value">{{ value === null ? '-' : value }}</ng-template>
            <ng-template #searchedWordExists let-value="value">
              <ng-container *ngFor="let letter of value.toString().split(''); let i = index">
                <ng-container [ngTemplateOutlet]="shouldHighlight(value, letter) ? highlight : notHighlighted"
                              [ngTemplateOutletContext]="{ $implicit: letter }"></ng-container>
              </ng-container>
            </ng-template>
            <ng-template #highlight let-letter>
              <mark [style.background-color]="highlightConfig?.color">{{ letter }}</mark>
            </ng-template>
            <ng-template #notHighlighted let-letter>{{ letter }}</ng-template>` : ''}
        `;
    }

    generateExportDialogContent(): string {
        return `
            <div mat-dialog-title class="export-dialog-title">
              {{ 'exportData.title' | translate }}
              <button (click)="closeDialog()" class="export-dialog-close-button">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div mat-dialog-content>
              <section data-test="dialogDescription" class="export-dialog-description-container">{{ dialogDescription }}</section>
              <section>
                <div class="export-dialog-checkbox-wrapper">
                  <mat-checkbox data-test="exportAllPages" #exportAllPages (change)="setDialogDescription()">
                    {{ 'exportData.exportAllPages' | translate: {maxExportRows: data.maxExportRows} }}
                  </mat-checkbox>
                </div>
                <div class="export-dialog-checkbox-wrapper">
                  <mat-checkbox *ngIf="!showAllColumnsBox" data-test="exportAllColumns" #exportAllColumns (change)="setDialogDescription()">
                    {{ 'exportData.exportAllColumns' | translate: {allColumns: data.allColumns} }}
                  </mat-checkbox>
                </div>
              </section>
            </div>
            <div mat-dialog-actions class="export-dialog-button-container">
              <button mat-button data-test="closeDialog"
                      (click)="closeDialog()">{{ 'cancel' | translate }}</button>
              <button mat-button data-test="exportData" mat-raised-button class="mat-primary"
                      (click)="exportData()"><span>{{ 'export' | translate }}</span></button>
            </div>
        `;
    }

    private getCustomRowActions(): string {
        return this.options.customRowActions.length > 0
            ? `  <ng-container data-test="custom-row-actions" matColumnDef="customRowActions" [stickyEnd]="setStickRowActions">
      <th data-test="custom-actions-header" 
          mat-header-cell 
          *matHeaderCellDef 
          [style.min-width.px]="customRowActionsLength <= visibleRowActionsIcons ? ${this.options.customRowActions.length * 30 + 15} : 80">
            {{ '${this.versionedAccessPrefix}customRowActions.preferredName' | translate}}
      </th>
      <td data-test="custom-actions-row" mat-cell *matCellDef="let row">
      <ng-container data-test="custom-actions-container" *ngIf="customRowActionsLength <= visibleRowActionsIcons; else customActionsButton">
      ${this.options.customRowActions
                .map((action: string) => {
                    const formattedAction = action.replace(/\.[^/.]+$/, '');
                    const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                    const commonParts = `data-test="custom-action-icon" *ngIf="is${classify(
                        formattedActionKebab
                    )}Visible" (click)="executeCustomAction($event, '${formattedActionKebab}', row)" style="cursor: pointer;" matTooltip="{{ '${
                        this.versionedAccessPrefix
                    }${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${
                        this.versionedAccessPrefix
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
              ${this.options.customRowActions
                .map((action: string): string => {
                    const formattedAction = action.replace(/\.[^/.]+$/, '');
                    const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                    const classifiedAction = classify(formattedActionKebab);
                    const commonParts = `style="cursor: pointer;" matTooltip="{{ '${this.versionedAccessPrefix}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${this.versionedAccessPrefix}${formattedActionKebab}.customRowAction' | translate }}"`;
                    const iconTemplate =
                        action.lastIndexOf('.') === -1
                            ? `<mat-icon data-test="custom-action-icon" ${commonParts} class="material-icons">${formattedAction}</mat-icon>`
                            : `<mat-icon data-test="custom-action-icon" svgIcon="${formattedAction}" ${commonParts}></mat-icon>`;
                    return `
                      <button mat-menu-item *ngIf="is${classifiedAction}Visible" data-test="custom-action-button" (click)="executeCustomAction($event, '${formattedActionKebab}', row)">
                          ${iconTemplate}
                          <span data-test="custom-action-text" style="vertical-align: middle">{{ '${this.versionedAccessPrefix}${formattedActionKebab}.customRowAction' | translate}}</span>
                      </button>
                     `;
                })
                .join('')}
      </mat-menu>
      </td>
    </ng-container>`
            : '';
    }

    private getCustomColumns() {
        return this.options.customColumns && this.options.customColumns.length > 0
            ? ` ${this.options.customColumns
                .map((columnName: string) => {
                    return `<!-- ${columnName} Column -->
                          <ng-container data-test="custom-column-container" matColumnDef="${columnName}">
                          ${
                        this.options.enableVersionSupport
                            ? `<th data-test="custom-column-header" mat-header-cell *matHeaderCellDef mat-sort-header>{{ '${this.options.selectedModelElement.name.toLowerCase()}.v${this.templateHelper.formatAspectModelVersion(
                                this.options.aspectModelVersion
                            )}.customColumn.${columnName}' | translate }}</th>`
                            : `<th data-test="custom-column-header" mat-header-cell *matHeaderCellDef mat-sort-header>{{ '${this.options.selectedModelElement.name.toLowerCase()}.customColumn.${columnName}' | translate }}</th>`
                    }
                                <td data-test="custom-column-cell" mat-cell *matCellDef="let row" >
                                  <ng-container data-test="custom-column-container" *ngTemplateOutlet="${camelize(columnName)}Template; context:{aspect:row}"></ng-container>
                                </td>
                              </ng-container>`;
                })
                .join('')}`
            : '';
    }

    private getRowCheckboxes(): string {
        return `<ng-container matColumnDef="checkboxes" data-test="checkboxes-container">
                    <th mat-header-cell *matHeaderCellDef data-test="table-header-checkbox">
                      <mat-checkbox data-test="header-checkbox" (change)="$event ? toggleSelectAll() : null" [checked]="selection.hasValue() && isAllSelected()" [indeterminate]="selection.hasValue() && !isAllSelected()"></mat-checkbox>
                    </th>
                    <td mat-cell *matCellDef="let row" data-test="table-cell-checkbox">
                      <mat-checkbox data-test="cell-checkbox" (click)="$event.stopPropagation()" (change)="$event ? checkboxClicked(row) : null" [checked]="selection.isSelected(row)"></mat-checkbox>
                    </td>
                </ng-container>`;
    }

    private getTableColumns(): string {
        return this.allProps
            .map((property: Property, index: number) => {
                if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                    const complexPropObj = this.templateHelper.getComplexProperties(property, this.options);
                    return complexPropObj.properties.map((complexProp: Property, i: number): string => {
                        return this.getColumnTemplate(complexProp, i, `${complexPropObj.complexProp}.`);
                    });
                }

                return this.getColumnTemplate(property, index, ``);
            })
            .join('');
    }

    private getColumnTemplate(property: Property, index: number, complexPrefix: string): string {
        const language = this.options.templateHelper.isMultiStringProperty(property) ? '[currentLanguage]' : '';
        const propertyName = this.templateHelper.isEnumPropertyWithEntityValues(property)
                             ? property.name + '?.' + this.templateHelper.getEnumEntityInstancePayloadKey(property)
                             : property.name
        const cellPropertyPath = `${this.options.jsonAccessPath}${complexPrefix}${propertyName}`;
        const isEmptyValue = `row.${cellPropertyPath} === null || row.${cellPropertyPath} === undefined`;
        const propertyLocaleKeyPath = `${this.versionedAccessPrefix}${this.templateHelper.isAspectSelected(this.options) ? this.options.jsonAccessPath : ''}${complexPrefix}${property.name}`;

        const datePipe = this.options.templateHelper.isDateTimeProperty(property) ? `| date: ${this.resolveDateTimeFormat(property)}` : '';
        const descriptionPipe = this.templateHelper.isEnumPropertyWithEntityValues(property) ? ` | showDescription:get${classify(property.name)}Value` : '';
        const cellContent = `!(${isEmptyValue}) ? (row.${cellPropertyPath}${descriptionPipe}${language}${datePipe})  : '-'`;

        return ` <!-- ${complexPrefix}${property.name} Column -->
                    <ng-container data-test="table-column" matColumnDef="${this.options.jsonAccessPath}${complexPrefix}${property.name}">
                        <th data-test="table-header" mat-header-cell *matHeaderCellDef 
                            mat-sort-header="${cellPropertyPath}"
                            ${this.templateHelper.isNumberProperty(property) ? `class="table-header-number"` : ''}
                            ${
            this.allProps.length - 1 > index
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
            this.templateHelper.isEnumPropertyWithEntityValues(property)
                ?
                `
                [matTooltip]="!(${isEmptyValue}) ? (row.${cellPropertyPath}${descriptionPipe}:true${language}) : ''"
                [matTooltipDisabled]="${isEmptyValue}"
                `
                : ''} 
            mat-cell *matCellDef="let row" ${this.templateHelper.isNumberProperty(property) ? `class="table-cell-number"` : ''}>
            ${this.hasSearchBar ? `
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

    private resolveDateTimeFormat(property: Property): string {
        if (this.options.templateHelper.isTimeProperty(property)) {
            return 'tableTimeFormat';
        }
        if (this.options.templateHelper.isDateTimestampProperty(property)) {
            return 'tableDateTimeFormat';
        }
        if (this.options.templateHelper.isDateProperty(property)) {
            return 'tableDateFormat';
        }
        return '';
    }

    private getCommandBar(): string {
        return `
            <mat-toolbar data-test="toolbar" class="toolbar">
            <div *ngIf="isMultipleSelectionEnabled" data-test="toolbar-number-of-items" class="command-bar-number-of-items">{{ selection.selected.length > 0 ? (selection.selected.length + ' / ') : '' }}{{ totalItems }}</div>
            ${
            this.options.templateHelper.isAddCommandBarFunctionSearch(this.options.enabledCommandBarFunctions)
                ? `<mat-form-field data-test="search-form-field" appearance="fill" floatLabel="never" class="search-input">
                          <mat-label data-test="search-label">{{ 'search' | translate }}</mat-label>
                          <input
                                #searchInput
                                data-test="search-input"
                                matInput
                                [formControl]="filterService.searchString"
                                type="text"
                                (keyup.enter)="reloadFilter()"
                                (focus)="searchFocused = true"
                                (blur)="searchFocused = false"
                          />
                          <mat-error *ngIf="filterService.searchString.errors && filterService.searchString.errors['blankSpace']">
                              {{ 'validation.blankSpace' | translate }}
                          </mat-error>
                          <mat-error *ngIf="filterService.searchString.errors && filterService.searchString.errors['invalidInput']">
                              {{ 'validation.invalidInput' | translate }} {{ allowedCharacters }}
                          </mat-error>
                          <mat-error *ngIf="!filterService.stringColumns || !filterService.stringColumns.length">
                              {{'validation.empty_string_columns_array' | translate }}
                          </mat-error>
                          <mat-error *ngIf="filterService.searchString.errors && filterService.searchString.errors['minCharNo']">
                              {{'validation.min_char_no' | translate }} {{ minNumberCharacters }}
                          </mat-error>
                          <mat-error *ngIf="filterService.searchString.errors && filterService.searchString.errors['maxCharNo']">
                              {{'validation.max_char_no' | translate }} {{ maxNumberCharacters }}
                          </mat-error>
                          <mat-hint *ngIf="!searchFocused && !!searchHint">{{ searchHint }}</mat-hint>
                          <button data-test="search-button" mat-icon-button matSuffix aria-label="search" (click)="reloadFilter()">
                              <mat-icon data-test="search-icon" class="material-icons">search</mat-icon>
                          </button>
                    </mat-form-field>
                    <ng-container *ngIf="hasAdvancedSearch">
                        <mat-form-field data-test="form-field-select" appearance="fill" floatLabel="never">
                            <mat-label data-test="select-label">{{ 'advancedSearch' | translate }}</mat-label>
                            <mat-select data-test="select" [formControl]="filterService.selectedStringColumn">
                                <mat-option [value]="filterService.advancedSearchAllValue">{{ 'allTextFields' | translate }}</mat-option>
                                <mat-option *ngFor="let searchField of filterService.stringColumns" [value]="searchField">
                                    <span>{{ '${this.templateHelper.getTranslationPath(this.options)}' + searchField + '.preferredName' | translate }}</span>
                                    <span class="advanced-search-option-description">
                                        {{ '${this.templateHelper.getTranslationPath(this.options)}' + searchField + '.description' | translate }}</span>
                                </mat-option>
                            </mat-select>
                      </mat-form-field>
                  </ng-container>
                `
                : ''
        }
            ${this.getPropertiesToCreateFilters()
            .map(property => {
                const propValue = property.propertyValue;
                const propName = property.propertyName;
                return ` ${
                    this.templateHelper.isAddDateQuickFilters(this.options.enabledCommandBarFunctions) && property.isDate
                        ? `<mat-form-field data-test="form-field-date-time" appearance="fill" floatLabel="never">
                                  <mat-label data-test="date-time-label">{{ '${this.versionedAccessPrefix}${propValue}.preferredName' | translate }}</mat-label>
                                    <mat-date-range-input data-test="date-range-input" [rangePicker]="${propName}Picker" [formGroup]="filterService.${propName}Group">
                                      <input data-test="start-date-input" matStartDate [placeholder]="'date.start' | translate" formControlName="start">
                                      <input data-test="end-date-input" matEndDate [placeholder]="'date.end' | translate" formControlName="end" (dateChange)="reloadFilter()">
                                    </mat-date-range-input>
                                  <mat-datepicker-toggle data-test="datepicker-toggle" matSuffix [for]="${propName}Picker"></mat-datepicker-toggle>
                                  <mat-date-range-picker data-test="date-range-picker" #${propName}Picker>
                                    <mat-date-range-picker-actions data-test="date-range-picker-actions">
                                        <button data-test="date-picker-cancel-button" mat-button matDateRangePickerCancel>{{ 'cancel' | translate }}</button>
                                        <button data-test="date-picker-apply-button" mat-raised-button color="primary" matDateRangePickerApply>{{ 'apply' | translate }}</button>
                                    </mat-date-range-picker-actions>
                                  </mat-date-range-picker>
                            </mat-form-field>`
                        : ''
                }${
                    this.templateHelper.isAddEnumQuickFilters(this.options.enabledCommandBarFunctions) && property.isEnum
                        ? `<mat-form-field data-test="form-field-select" appearance="fill" floatLabel="never">
                             <mat-label data-test="select-label">{{ '${
                            this.versionedAccessPrefix
                        }${propValue}.preferredName' | translate }}</mat-label>
                                <mat-select data-test="select" [(value)]="filterService.${propName}Selected" #${propName}Select multiple>
                                    <div class="filter-options-container">
                                    ${
                            property.enumWithEntities
                                ? ` <mat-option data-test="select-option" *ngFor="let ${propName}Option of filterService.${propName}Options" [value]="${propName}Option.value">
                                                {{ ${propName}Option.value }} - {{ ${propName}Option.translationKey | translate }}
                                           </mat-option>
                                        `
                                : ` <mat-option data-test="select-option" *ngFor="let ${propName}Option of filterService.${propName}Options" [value]="${propName}Option">
                                                {{${propName}Option}}
                                           </mat-option>
                                       `
                        }
                                    </div>
                                     <div data-test="filter-actions-container" class="filter-actions-container">

                                         <button data-test="filter-cancel-button" mat-button (click)="${propName}Select.close();">
                                            <span data-test="filter-cancel-text">{{ 'cancel' | translate }}</span>
                                         </button>
    
                                         <button
                                            data-test="filter-apply-button"
                                            mat-raised-button
                                            color="primary"
                                            class="filter-apply-btn"
                                            (click)="reloadFilter(); ${propName}Select.close();">
                                            <span data-test="filter-apply-text">{{ 'apply' | translate }}</span>
                                         </button>
                                     </div>
                                </mat-select>
                             </mat-form-field>`
                        : ''
                }
                 `;
            })
            .join('')}
            <span data-test="spacer" class="spacer"></span>
            ${
            // prettier-ignore
            this.options.customCommandBarActions.length > 0
                ? `${this.options.customCommandBarActions
                    .map(action => {
                        const commonParts = `data-test="toolbar-custom-action-icon" matTooltip="{{'${this.versionedAccessPrefix}${this.templateHelper.spinalCase(action)}.customCommandBarAction' | translate }}" aria-hidden="false"`;
                        return `
                                    <button data-test="toolbar-custom-action-button" mat-icon-button (click)="executeCustomCommandBarAction($event, '${this.templateHelper.spinalCase(action)}')"
                                            attr.aria-label="{{ '${this.versionedAccessPrefix}${this.templateHelper.spinalCase(action)}.customCommandBarAction' | translate }}">
                                        <mat-icon ${commonParts}
                                            ${action.lastIndexOf(".") > -1 ? `svgIcon="${this.templateHelper.spinalCase(action)}"` : ``}
                                            ${action.lastIndexOf(".") === -1 ? `class='material-icons'` : ``}>
                                            ${action.lastIndexOf(".") === -1 ? `${action}` : ``}
                                        </mat-icon>
                                    </button>`;
                    }).join("")
                }`
                : ""
        }

            <button data-test="refresh-data-button" mat-icon-button aria-label="Refresh table" (click)="applyFilters()">
                <mat-icon data-test="refresh-data-icon" class="material-icons" [matTooltip]="'tableActions.refreshData' | translate">autorenew</mat-icon>
            </button>
            <button data-test="export-data-button" mat-icon-button aria-label="Download data as CSV" (click)="exportToCsv()">
                <mat-icon data-test="export-data-icon" class="material-icons" [matTooltip]="'tableActions.exportData' | translate">file_download</mat-icon>
            </button>
            ${this.hasSearchBar ? `
            <button data-test="open-configuration" mat-icon-button aria-label="Open configuration" [matMenuTriggerFor]="configurationMenu" (menuOpened)="initOpenedConfigurationDialog()">
              <mat-icon data-test="open-configuration-icon" class="material-icons"[matTooltip]="'tableActions.openConfig' | translate">settings </mat-icon>
            </button>` : ''}
        </mat-toolbar>
      `;
    }

    private getCustomTemplate(): string {
        return `
            <ng-container *ngIf="!!customTemplate && !dataSource.data.length">
                <ng-container *ngTemplateOutlet="loadCustomTemplate()"></ng-container>
            </ng-container>
        `;
    }

    private getPropertiesToCreateFilters(): PropValue[] {
        if (
            !this.templateHelper.isAddEnumQuickFilters(this.options.enabledCommandBarFunctions) &&
            !this.templateHelper.isAddDateQuickFilters(this.options.enabledCommandBarFunctions)
        ) {
            return [];
        }

        const propertyValues: PropValue[] = [];
        this.allProps.forEach((property: Property) => {
            if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                const complexPropObj = this.templateHelper.getComplexProperties(property, this.options);
                complexPropObj.properties.forEach((complexProp: Property) => {
                    if (
                        this.options.templateHelper.isEnumProperty(complexProp) ||
                        this.options.templateHelper.isDateTimeProperty(complexProp)
                    ) {
                        propertyValues.push({
                            propertyName: `${complexPropObj.complexProp}${classify(complexProp.name)}`,
                            propertyValue: `${complexPropObj.complexProp}.${complexProp.name}`,
                            isEnum: this.options.templateHelper.isEnumProperty(complexProp),
                            enumWithEntities: this.templateHelper.isEnumPropertyWithEntityValues(complexProp),
                            isDate: this.options.templateHelper.isDateTimeProperty(complexProp),
                        });
                    }
                });
            } else {
                propertyValues.push({
                    propertyName: property.name,
                    propertyValue: property.name,
                    isEnum: this.options.templateHelper.isEnumProperty(property),
                    enumWithEntities: this.templateHelper.isEnumPropertyWithEntityValues(property),
                    isDate: this.options.templateHelper.isDateTimeProperty(property),
                });
            }
        });

        return propertyValues;
    }
}
