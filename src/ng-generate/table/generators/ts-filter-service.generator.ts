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

import {classify} from '@angular-devkit/core/src/utils/strings';
import {Schema} from '../schema';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';

type PropValue = {
    propertyValue: string;
    propertyName: string;
    characteristic: string;
    enumWithEntities: boolean;
    property: Property;
    complexPropObj?: {complexProp: string; properties: Property[]};
};

export class TsFilterServiceGenerator {
    private readonly options: Schema;
    private readonly hasSearchBar: boolean;
    private readonly hasDateQuickFilter: boolean;
    private readonly hasEnumQuickFilter: boolean;
    private readonly hasFilters: boolean;
    private readonly filterServiceName: string;
    private allProps: Property[];
    private allEnumProps: PropValue[];
    private allDateProps: PropValue[];
    private allStringProps: string[];

    constructor(options: Schema) {
        this.options = options;
        this.hasSearchBar = this.options.templateHelper.isAddCommandBarFunctionSearch(this.options.enabledCommandBarFunctions);
        this.hasDateQuickFilter = this.options.templateHelper.isAddDateQuickFilters(this.options.enabledCommandBarFunctions);
        this.hasEnumQuickFilter = this.options.templateHelper.isAddEnumQuickFilters(this.options.enabledCommandBarFunctions);
        this.hasFilters = this.hasEnumQuickFilter || this.hasDateQuickFilter || this.hasSearchBar;
        this.filterServiceName = `${classify(this.options.name)}FilterService`;
    }

    generate(): string | null {
        this.allProps = this.options.templateHelper.getProperties(this.options);
        const isRemote = this.options.enableRemoteDataHandling;
        if (!this.hasFilters) {
            return null;
        }
        return `
        /** ${this.options.templateHelper.getGenerationDisclaimerText()} **/ 
        ${
            this.options.enableRemoteDataHandling
                ? `import {
                        AbstractArrayNode,
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
                    } from 'rollun-ts-rql';`
                : ''
        }
        
        ${this.hasSearchBar || this.hasDateQuickFilter ? `import {TranslateService} from '@ngx-translate/core';` : ``}
        import {Injectable, ${this.hasDateQuickFilter ? `Inject` : ``}} from '@angular/core';
        ${
            this.hasDateQuickFilter
                ? `import { FormControl, FormGroup } from '@angular/forms';import {
            DateAdapter,
            MatDateFormats,
            MAT_DATE_FORMATS,
          } from '@angular/material/core';import moment from 'moment';`
                : ''
        }
        ${this.hasSearchBar ? `import { Subject } from 'rxjs';` : ``}
        ${this.getTypesImport()}
        
        export enum FilterEnums {
            Date,
            Search,
            Enum,
        }
        
        type FilterType = {
            type: FilterEnums;
            label: string;
            prop: string|null;
            filterValue?:string;
            removable?: boolean;
        };
        ${
            this.hasSearchBar
                ? `export interface SearchField {
            columnName: string;
            selected: boolean;
        }`
                : ``
        }
        
        
        /**
         * Custom service used for table filtering logic
         */
        @Injectable({
            providedIn: 'root'
        })
        export class ${this.filterServiceName}  {
   
            ${
                this.hasSearchBar
                    ? `searchStringChanged = new Subject<string>();
                       searchString: string = '';
                      `
                    : ''
            }

            ${this.setQuickFilters(true)}
            ${this.hasSearchBar ? this.setStringColumns() : ``}            
            
            constructor(
            ${
                this.hasDateQuickFilter
                    ? `private translateService: TranslateService,
                                 @Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats,
                                 private dateAdapter: DateAdapter<any>`
                    : this.hasSearchBar
                    ? 'private translateService: TranslateService'
                    : ``
            }){}

            ${
                this.hasSearchBar
                    ? `
                    searchStringChange(event: any) {
                        this.searchStringChanged.next(event);
                    }`
                    : ''
            }

            /** Array of active filters */
            activeFilters: FilterType[]=[];

            /** Removes a specific filter. */ 
            removeFilter(filter:FilterType){
                switch(filter.type){
                    ${
                        this.hasSearchBar
                            ? `case FilterEnums.Search : this.searchString = '';
                               break;`
                            : ''
                    }
                  
                    ${this.setQuickFilters(false)}
                }

                this.activeFilters = this.activeFilters.filter(af=> af.filterValue !== filter.filterValue && af.label!== filter.label );
            }
            ${this.hasSearchBar ? this.getValueByAccessPathFn() : ``}     
            ${this.getSearchFn(isRemote)}
            ${this.getEnumFilterFn(isRemote)}
            ${this.hasSearchBar ? this.getIsSearchStringColumnsEmptyFn() : ``}
            ${this.getDateFn(isRemote)}
        }
    `;
    }

    private getTypesImport() {
        return `import {
            ${classify(this.options.templateHelper.resolveType(this.options.selectedModelElement).name)}
            ${
                !this.options.aspectModel.isCollectionAspect && !this.options.templateHelper.isAspectSelected(this.options)
                    ? `, ${classify(this.options.aspectModel.name)}`
                    : ''
            }
            ${
                this.hasEnumQuickFilter
                    ? `, ${this.options.templateHelper
                          .getEnumProperties(this.options)
                          .map(prop => {
                              return classify(prop.characteristic.name);
                          })
                          .join(', ')}`
                    : ''
            }
            } from '${this.options.templateHelper.getTypesPath(
                this.options.enableVersionSupport,
                this.options.aspectModelVersion,
                this.options.aspectModel
            )}';  `;
    }

    private setStringColumns() {
        const stringColumnsArr = `stringColumns: SearchField[] = [`;
        return `${stringColumnsArr}${this.getAllStringProps().map((stringColumn: string) => {
            return `{columnName: ${stringColumn}, selected: true}`;
        })}];
        selectedStringColumns: Array<string> = this.stringColumns.filter((col: SearchField): boolean => col.selected).map((col: SearchField): string => col.columnName);`;
    }

    private setQuickFilters(isInit: boolean) {
        let initString = '';

        if (this.hasEnumQuickFilter) {
            const props = this.getAllEnumProps();
            if (isInit) {
                initString += `${props
                    .map(prop => {
                        return `
                                ${prop.propertyName}Selected: Array<${
                            prop.enumWithEntities ? 'string' : classify(prop.characteristic || 'any')
                        }> = [];
                                ${prop.propertyName}Options: Array<any> = ${
                            prop.enumWithEntities
                                ? `${classify(prop.characteristic)}.getValueDescriptionList('${
                                      prop.complexPropObj ? prop.complexPropObj.complexProp + '.' : ''
                                  }${prop.property.name}')`
                                : `Object.values(${classify(prop.characteristic)})`
                        };`;
                    })
                    .join('')}`;
            } else {
                initString +=
                    ` case FilterEnums.Enum:
                ${props
                    .map(prop => {
                        return `if(filter.prop === '${prop.propertyValue}') {this.${prop.propertyName}Selected = this.${prop.propertyName}Selected.filter(sel=> sel !==filter.filterValue);}`;
                    })
                    .join('')}` + 'break;';
            }
        }

        if (this.hasDateQuickFilter) {
            const props = this.getAllDateProps();
            if (isInit) {
                initString += `${props
                    .map(
                        prop =>
                            `${prop.propertyName}Group = new FormGroup({
                                        start: new FormControl(),
                                        end: new FormControl()
                                   });`
                    )
                    .join('')}`;
            } else {
                initString +=
                    `case FilterEnums.Date : 
            ${props
                .map(prop => {
                    return `if(filter.prop === '${prop.propertyValue}') {this.${prop.propertyName}Group.reset();  this.${prop.propertyName}Group.reset();}`;
                })
                .join('')}` + 'break;';
            }
        }

        return initString;
    }

    getAllEnumProps(): PropValue[] {
        if (this.allEnumProps) {
            return this.allEnumProps;
        }
        const enumProps: PropValue[] = [];
        this.options.templateHelper.getProperties(this.options).forEach((property: Property) => {
            if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                const complexPropObj = this.options.templateHelper.getComplexProperties(property, this.options);
                complexPropObj.properties.forEach((complexProp: Property) => {
                    if (
                        this.options.templateHelper.isEnumProperty(complexProp) &&
                        !this.options.excludedProperties.find(
                            excludedProperty => excludedProperty.propToExcludeAspectModelUrn === complexProp.aspectModelUrn
                        )
                    ) {
                        const propertyName = `${complexPropObj.complexProp}${classify(complexProp.name)}`;
                        const propertyValue = `${complexPropObj.complexProp}.${complexProp.name}${
                            this.options.templateHelper.isEnumPropertyWithEntityValues(complexProp)
                                ? '.' + this.options.templateHelper.getEnumEntityInstancePayloadKey(complexProp)
                                : ''
                        }`;

                        enumProps.push({
                            propertyValue: propertyValue,
                            propertyName: propertyName,
                            characteristic: complexProp.characteristic?.name,
                            enumWithEntities: this.options.templateHelper.isEnumPropertyWithEntityValues(complexProp),
                            property: complexProp,
                            complexPropObj: complexPropObj,
                        });
                    }
                });
            } else if (this.options.templateHelper.isEnumProperty(property)) {
                enumProps.push({
                    propertyName: property.name,
                    propertyValue: `${property.name}${
                        this.options.templateHelper.isEnumPropertyWithEntityValues(property)
                            ? '.' + this.options.templateHelper.getEnumEntityInstancePayloadKey(property)
                            : ''
                    }`,
                    characteristic: property.characteristic?.name,
                    enumWithEntities: this.options.templateHelper.isEnumPropertyWithEntityValues(property),
                    property: property,
                });
            }
        });
        return enumProps;
    }

    private getAllDateProps() {
        if (this.allDateProps) {
            return this.allDateProps;
        }
        const datesProps: PropValue[] = [];
        this.allProps.forEach((property: Property) => {
            if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                const complexPropObj = this.options.templateHelper.getComplexProperties(property, this.options);
                complexPropObj.properties.forEach((complexProp: Property) => {
                    if (
                        this.options.templateHelper.isDateTimeProperty(complexProp) &&
                        !this.options.excludedProperties.find(
                            excludedProperty => excludedProperty.propToExcludeAspectModelUrn === complexProp.aspectModelUrn
                        )
                    ) {
                        const propertyName = `${complexPropObj.complexProp}${classify(complexProp.name)}`;
                        const propertyValue = `${complexPropObj.complexProp}.${complexProp.name}`;
                        datesProps.push({
                            propertyValue: propertyValue,
                            propertyName: propertyName,
                            characteristic: complexProp.characteristic?.name,
                            enumWithEntities: false,
                            property: complexProp,
                            complexPropObj: complexPropObj,
                        });
                    }
                });
            } else if (this.options.templateHelper.isDateTimeProperty(property)) {
                datesProps.push({
                    propertyValue: property.name,
                    propertyName: property.name,
                    characteristic: property.characteristic?.name,
                    enumWithEntities: false,
                    property: property,
                });
            }
        });
        return datesProps;
    }

    private getAllStringProps() {
        if (this.allStringProps) {
            return this.allStringProps;
        }
        const stringProps: string[] = [];
        this.allProps.forEach((property: Property) => {
            if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                const complexProps = this.options.templateHelper.getComplexProperties(property, this.options);
                complexProps.properties.forEach((complexProp: Property) => {
                    if (!this.options.templateHelper.isStringProperty(complexProp)) {
                        return;
                    }
                    stringProps.push(`'${complexProps.complexProp}.${complexProp.name}'`);
                    return;
                });
            }
            if (this.options.templateHelper.isStringProperty(property)) {
                stringProps.push(`'${property.name}'`);
            }
        });
        return stringProps;
    }

    private getValueByAccessPathFn() {
        return `
        /**
            * Get a value using a dot access path
            * @param accessPath access path e.g. object.attrL1.attrL2
            * @param object value behind the path or '' if not found/doesn't exist
        */
        getValueByAccessPath(accessPath: string, object: any) {
            try {
                return accessPath.split('.').reduce((a, b) => a[b], object);
            } catch (error) {
                return '';
            }
        }
        `;
    }

    private getSearchFn(isRemote: boolean) {
        if (!this.hasSearchBar) {
            return '';
        }

        this.allStringProps = this.getAllStringProps();

        if (!isRemote) {
            const key = `item.${this.options.jsonAccessPath}`;
            const itemKey = key.substring(0, key.length - 1);
            return `applyStringSearchFilter(data: Array<${classify(
                this.options.templateHelper.resolveType(this.options.aspectModel).name
            )}>): Array<${classify(this.options.templateHelper.resolveType(this.options.aspectModel).name)}> {
                    if (!this.searchString) {
                        this.activeFilters = this.activeFilters.filter(af=> af.type !== FilterEnums.Search);
                        return data;
                    }
                    const searchFilterObj = this.activeFilters.find(af=> af.type === FilterEnums.Search);
                    if(searchFilterObj) {
                        searchFilterObj.filterValue = this.searchString;
                        searchFilterObj.label = \`\${ this.translateService.instant('search')} : \${this.searchString} in \${this.selectedStringColumns.join(', ')}\`;
                    } else  {
                        this.activeFilters.push(<FilterType>{
                            removable: true,
                            type:FilterEnums.Search,
                            label: \`\${ this.translateService.instant('search')} : \${this.searchString} in \${this.selectedStringColumns.join(', ')}\`, 
                            prop:null, 
                            filterValue:this.searchString
                         });
                    }
                    return (this.searchString === '') ? data : data.filter((item: any): boolean => {                       
                        let foundSearchStringInProperty = false;
                        this.selectedStringColumns.forEach((keyId: any): void => {
                            if (this.getValueByAccessPath(keyId, ${itemKey}).toLocaleLowerCase().includes(this.searchString.toLocaleLowerCase())) {
                                foundSearchStringInProperty = true;
                            }
                        });
                        return foundSearchStringInProperty;
                    });
                }`;
        } else {
            return `applyStringSearchFilter(query: AbstractLogicalNode): void {
                        if (!this.searchString) {
                            this.activeFilters = this.activeFilters.filter(af=> af.type !== FilterEnums.Search);
                            return;
                        }
                        const searchFilterObj = this.activeFilters.find(af=> af.type === FilterEnums.Search);
                        if(searchFilterObj) {
                            searchFilterObj.filterValue = this.searchString;
                            searchFilterObj.label = \`\${ this.translateService.instant('search')} : \${this.searchString} in \${this.selectedStringColumns.join(', ')}\`;
                        } else  {
                            this.activeFilters.push(<FilterType>{
                                removable: true,type:FilterEnums.Search,
                                label:\`\${ this.translateService.instant('search')} : \${this.searchString} in \${this.selectedStringColumns.join(', ')}\`, 
                                prop:null, 
                                filterValue:this.searchString
                             });
                        }
                        ${
                            this.allStringProps.length > 0
                                ? `if(this.searchString !== '') {
                                        query.addNode(new Or([
                                        ${this.allStringProps.map(prop => ` new Like(${prop}, \`\${this.searchString}\`),`).join('')}])); }`
                                : ``
                        }
                        }`;
        }
    }

    private getChipLabelEnum(filterProp: PropValue) {
        if (filterProp.enumWithEntities) {
            return (
                '`${selected} - ${this.translateService.instant(this.' +
                filterProp.propertyName +
                "Options.filter(option => option.value === selected).map(option => option.translationKey).join(''))}`"
            );
        }

        return `\`\${selected}\``;
    }

    private getEnumFilterFn(isRemote: boolean) {
        const props = this.getAllEnumProps();

        if (!this.hasEnumQuickFilter) {
            return '';
        }
        if (!isRemote) {
            return `applyEnumFilter(data: Array<${classify(this.options.selectedModelElement.name)}>) {
                                let filteredData = data;
                                ${props
                                    .map(
                                        prop =>
                                            `filteredData = this.${
                                                prop.propertyName
                                            }Selected.length === 0 ? filteredData : filteredData.filter(
                                                (item:${classify(this.options.selectedModelElement.name)}): boolean =>
                                                (this.${prop.propertyName}Selected.includes(item.${this.options.jsonAccessPath}${
                                                prop.propertyValue
                                            })));
                                            this.${prop.propertyName}Selected.forEach(selected=> {
                                                const filterProp = '${this.options.jsonAccessPath}${prop.propertyValue}';
                                                const filterVal = selected;
                                                if(!this.activeFilters.filter(af => af.prop === filterProp).map(af=> af.filterValue).includes(filterVal)) {
                                                this.activeFilters.push(<FilterType>{
                                                    removable: true,
                                                    type:FilterEnums.Enum,
                                                    label: ${this.getChipLabelEnum(prop)},
                                                    prop:filterProp,
                                                    filterValue : filterVal 
                                                })
                                            }});

                                            this.activeFilters
                                            .filter((af) => af.prop === '${this.options.jsonAccessPath}${prop.propertyValue}')
                                            .forEach((filter) => {
                                              if (
                                                !this.${prop.propertyName}Selected.includes(filter.filterValue as any)
                                              ) {
                                                this.removeFilter(filter);
                                              }
                                            });
                                            `
                                    )
                                    .join('')}
                                return filteredData;
                      }`;
        } else {
            return `applyEnumFilter(query: AbstractLogicalNode): void {
                             ${props
                                 .map(
                                     prop => `if (this.${prop.propertyName}Selected.length > 0) {
                                        query.addNode(new In('${this.options.jsonAccessPath}${prop.propertyValue}', this.${
                                         prop.propertyName
                                     }Selected));}
                                        this.${prop.propertyName}Selected.forEach(selected=> {
                                            const filterProp = '${this.options.jsonAccessPath}${prop.propertyValue}';
                                            const filterVal = selected;
                                            if(!this.activeFilters.filter(af => af.prop === filterProp).map(af=> af.filterValue).includes(filterVal)) {
                                            this.activeFilters.push(<FilterType>{
                                                removable: true,
                                                type:FilterEnums.Enum,
                                                label: ${this.getChipLabelEnum(prop)},
                                                prop:filterProp,
                                                filterValue : filterVal 
                                            })
                                        }});
                                        this.activeFilters
                                        .filter((af) => af.prop === '${this.options.jsonAccessPath}${prop.propertyValue}')
                                        .forEach((filter) => {
                                          if (
                                            !this.${prop.propertyName}Selected.includes(filter.filterValue as any)
                                          ) {
                                            this.removeFilter(filter);
                                          }
                                        });`
                                 )
                                 .join('')}}`;
        }
    }

    private getIsSearchStringColumnsEmptyFn() {
        return `
          isSearchStringColumnsEmpty(): boolean {
              return !this.stringColumns.some(col => col.selected && col.columnName);
          }
          `;
    }

    private getDateFn(isRemote: boolean): string {
        const dateHelperFn = ` private getFormattedDate(theDate: string) {
            return this.dateFormats.display.dateInput !== 'L'
              ? this.dateAdapter.format(
                  moment(theDate),
                  this.dateFormats.display.dateInput
                )
              : new Date(theDate).toLocaleDateString(
                  this.translateService.currentLang,
                  {
                    timeZone: 'UTC',
                  }
                );
          }`;
        const props = this.getAllDateProps();
        if (!this.hasDateQuickFilter) {
            return '';
        }

        const createDateAsUTCfn = `private createDateAsUTC(date: Date) {
                                    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())).toISOString();
                                }`;

        if (!isRemote) {
            return ` applyDateFilter(data: Array<any>): Array<any> {
                        let filteredData = data;
                        ${props
                            .map(
                                prop =>
                                    `${`if (this.${prop.propertyName}Group.value.start !== null && this.${prop.propertyName}Group.value.end !== null) {
                                                const startDate = this.createDateAsUTC(new Date(this.${prop.propertyName}Group.value.start));
                                                const beginningOfDay = new Date(this.${prop.propertyName}Group.value.end).setHours(23, 59, 59, 999);
                                                const endDate = this.createDateAsUTC(new Date(beginningOfDay));
                                              filteredData = filteredData.filter(item => ((new Date(endDate) >= new Date(item.${prop.propertyValue}) && new Date(item.${prop.propertyValue}) >= new Date(startDate))));
                                              const filter =  this.activeFilters.find(af=> af.prop === '${prop.propertyValue}');
                                              const newLabel = \`${prop.propertyValue}: from \${this.getFormattedDate(startDate)} to \${this.getFormattedDate(endDate)}\`;
                                              if( !filter) {
                                              this.activeFilters.push(<FilterType>{
                                                removable: true,
                                                type:FilterEnums.Date,
                                                label:newLabel, 
                                                prop:'${prop.propertyValue}' 
                                              });
                                            } else {filter.label = newLabel;}
                                            } else if (this.${prop.propertyName}Group.value.end !== null) {
                                                const beginningOfDay = new Date(this.${prop.propertyName}Group.value.end).setHours(23, 59, 59, 999);
                                                const endDate = this.createDateAsUTC(new Date(beginningOfDay));
                                                filteredData = filteredData.filter(item => ((new Date(item.${prop.propertyValue}) <= new Date(endDate))));
                                                const filter =  this.activeFilters.find(af=> af.prop === '${prop.propertyValue}');
                                                const newLabel =\`${prop.propertyValue}: until \${this.getFormattedDate(endDate)}\`;
                                                if(!filter) {
                                                    this.activeFilters.push(<FilterType>{
                                                        removable: true,
                                                        type:FilterEnums.Date,
                                                        label:newLabel, prop:'${prop.propertyValue}' 
                                                     });
                                                } else {filter.label = newLabel;}
                                            } else if (this.${prop.propertyName}Group.value.start !== null) {
                                                const startDate = this.createDateAsUTC(new Date(this.${prop.propertyName}Group.value.start));
                                                filteredData = filteredData.filter(item => ((new Date(item.${prop.propertyValue}) >= new Date(startDate))));
                                                const filter =  this.activeFilters.find(af=> af.prop === '${prop.propertyValue}');
                                                const newLabel =\`${prop.propertyValue}: from \${this.getFormattedDate(startDate)}\`;
                                                if( !filter) {
                                                    this.activeFilters.push(<FilterType>{
                                                        removable: true,
                                                        type:FilterEnums.Date,
                                                        label:newLabel, 
                                                        prop:'${prop.propertyValue}' 
                                                     });
                                                } else {filter.label = newLabel;}
                                            }`}`
                            )
                            .join('')}
                        return filteredData;
              }
              ${createDateAsUTCfn} 
              ${dateHelperFn}`;
        } else {
            return `
              applyDateFilter(query: AbstractLogicalNode): void {
                ${this.getAllDateProps()
                    .map(
                        prop => `if (this.${prop.propertyName}Group.value.end && this.${prop.propertyName}Group.value.start) {
                                    const eDate = new Date(this.${prop.propertyName}Group.value.end).setHours(23, 59, 59, 999);
                                    const endDate = this.createDateAsUTC(new Date(eDate));
                                    const startDate = this.createDateAsUTC(new Date(this.${prop.propertyName}Group.value.start));
      
                                    query.addNode(new And([new Le('${this.options.jsonAccessPath}${prop.propertyValue}', \`\${endDate}\`), new Ge('${this.options.jsonAccessPath}${prop.propertyValue}', \`\${startDate}\`)]));
                                    const filter =  this.activeFilters.find(af=> af.prop === '${prop.propertyValue}');
                                    const newLabel =\`${prop.propertyValue}: from \${this.getFormattedDate(startDate)} to \${this.getFormattedDate(endDate)}\`;
                                    if( !filter) {
                                    this.activeFilters.push(<FilterType>{
                                            removable: true,
                                            type:FilterEnums.Date,
                                            label:newLabel, 
                                            prop:'${prop.propertyValue}' 
                                        });
                                    } else {filter.label = newLabel;}
                                }`
                    )
                    .join('')}
              }
              ${createDateAsUTCfn} 
              ${dateHelperFn}`;
        }
    }
}
