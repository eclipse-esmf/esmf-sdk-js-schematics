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
        
        ${this.hasSearchBar || this.hasDateQuickFilter ? `import {TranslateService} from '@ngx-translate/core';
        import {AbstractControl, FormControl, ValidationErrors, ValidatorFn} from '@angular/forms';` : ``}
        import {Injectable, ${this.hasDateQuickFilter ? `Inject` : ``}} from '@angular/core';
        ${
            this.hasDateQuickFilter
                ? `import { FormGroup } from '@angular/forms';import {
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
        
        ${this.hasSearchBar ? 
        `export const validateInputsValidator = (pattern: string): ValidatorFn => {
            return (control: AbstractControl): ValidationErrors | null => {
                const value = control.value;
                const allowedCharacters = new RegExp(pattern);
                
                //allow input to be empty
                if (value?.length === 0) {
                    return null;
                }
      
                //trigger error if input has blank space
                if (value?.indexOf(' ') === 0 || value?.endsWith(' ')) {
                    return {blankSpace: true};
                }
      
                // no validation pattern
                if (!pattern || !pattern.length) {
                    return null;
                }
                
                //trigger error if input does not meet the pattern criteria
                if (value?.length > 0 && !value?.match(allowedCharacters)) {
                  return {invalidInput: true};
                }
            
                return null;
            };
        }
        
        export const validateInputLength = (minNoCharacters: number, maxNoCharacters: number): ValidatorFn => {
            return (control: AbstractControl): ValidationErrors | null => {
                const value = control.value;
                
                // no validation required
                if (!minNoCharacters && !maxNoCharacters) {
                  return null;
                }
            
                //allow input to be empty
                if (value?.length === 0) {
                  return null;
                }
            
                //trigger error if input has less characters than minNoCharacters
                if (minNoCharacters && value?.length < minNoCharacters) {
                  return {minCharNo: true};
                }
            
                //trigger error if input has more characters than maxNoCharacters
                if (maxNoCharacters && value?.length > maxNoCharacters) {
                  return {maxCharNo: true};
                }
            
                return null;
            };
        }` : ''}

        /**
         * Custom service used for table filtering logic
         */
        @Injectable({
            providedIn: 'root'
        })
        export class ${this.filterServiceName}  {
   
            /** Array of active filters */
            activeFilters: FilterType[]=[];
            
            ${this.hasSearchBar? `searchString = new FormControl<string | null>('');` : ``}
            ${this.hasSearchBar ? this.setStringColumns() : ``}

            ${this.setQuickFilters(true)}
                        
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
                    searchStringInit(initialValue: string, regexValidator: string, minCharNo: number, maxCharNo: number) {
                        this.searchString = new FormControl<string | null>(initialValue, [validateInputsValidator(regexValidator), validateInputLength(minCharNo, maxCharNo)]);
                    }`
                    : ''
            }


            /** Removes a specific filter. */ 
            removeFilter(filter:FilterType){
                switch(filter.type){
                    ${
                        this.hasSearchBar
                            ? `case FilterEnums.Search:
                                const removedFilter = this.activeFilters.findIndex(elem => elem.filterValue === filter.filterValue && elem.prop === filter.prop);
                                this.activeFilters.splice(removedFilter, 1);
                                this.searchString.setValue('');
                                break;`
                            : ''
                    }
                    ${this.setQuickFilters(false)}
                }
            }
            ${this.hasSearchBar ? this.getValueByAccessPathFn() : ``}     
            ${this.getSearchFn(isRemote)}
            ${this.getAddSelectedColumnsQuery(isRemote)}
            ${this.getEnumFilterFn(isRemote)}
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
        const stringColumnsArr = `stringColumns: string[] = [`;
        return `${stringColumnsArr}${this.getAllStringProps().map((stringColumn: string) => {
            return stringColumn;
        })}];
        readonly advancedSearchAllValue = 'allTextFields';
        selectedStringColumn: FormControl<string | null> = new FormControl(this.advancedSearchAllValue);`;
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
                    .join('')}` + 'this.activeFilters = this.activeFilters.filter(af=> af.filterValue !== filter.filterValue && af.label!== filter.label );' + 'break;';
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
                .join('')}` + 'this.activeFilters = this.activeFilters.filter(af=> af.filterValue !== filter.filterValue && af.label!== filter.label );' + 'break;';
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
                    if (this.searchString.value && this.searchString.value !== '' && !this.activeFilters.find(elem => elem.prop === this.selectedStringColumn.value && elem.filterValue === this.searchString.value)) {
                            const label = \` in \${ this.selectedStringColumn.value === this.advancedSearchAllValue ?
                                this.translateService.instant('allTextFields') :
                                this.translateService.instant(\`${this.options.templateHelper.getTranslationPath(this.options)}\` + this.selectedStringColumn.value + '.preferredName')}\`;
                            this.activeFilters.push(<FilterType>{
                            removable: true,
                            type:FilterEnums.Search,
                            label, 
                            prop: this.selectedStringColumn.value, 
                            filterValue:this.searchString.value
                        });
                    }
                    const searchFilters = this.activeFilters.filter(elem => elem.type === FilterEnums.Search);
                    return (searchFilters.length === 0) ? data : data.filter((item: any): boolean => {                       
                        let foundSearchStringInProperty = false;
                        searchFilters.forEach((filter: any): void => {
                            if (filter.prop === this.advancedSearchAllValue) {
                                this.stringColumns.forEach(elem => {
                                    if (this.getValueByAccessPath(elem, item).toLocaleLowerCase().includes(filter.filterValue.toLocaleLowerCase())) {
                                      foundSearchStringInProperty = true;
                                    }
                                });
                            } else {
                                if (this.getValueByAccessPath(filter.prop, ${itemKey}).toLocaleLowerCase().includes(filter.filterValue.toLocaleLowerCase())) {
                                    foundSearchStringInProperty = true;
                                }
                            }
                        });
                        return foundSearchStringInProperty;
                    });
                }`;
        } else {
            return `applyStringSearchFilter(query: AbstractLogicalNode): void {
                        if (this.searchString.value && this.searchString.value !== '' && !this.activeFilters.find(elem => elem.prop === this.selectedStringColumn.value && elem.filterValue === this.searchString.value)) {
                            const label = \` in \${ this.selectedStringColumn.value === this.advancedSearchAllValue ?
                                this.translateService.instant('allTextFields') :
                                this.translateService.instant(\`${this.options.templateHelper.getTranslationPath(this.options)}\` + this.selectedStringColumn.value + '.preferredName')}\`;
                            this.activeFilters.push(<FilterType>{
                                removable: true,
                                type:FilterEnums.Search,
                                label, 
                                prop: this.selectedStringColumn.value, 
                                filterValue:this.searchString.value
                             });
                        }
                        ${
                            this.allStringProps.length > 0
                                ? `this.activeFilters.filter(af => af.type === FilterEnums.Search).forEach(af => {
                                        query.addNode(new Or(this.addSelectedColumnsQuery(af.prop, af.filterValue))); })`
                                : ``
                        }
                   }`;
        }
    }

    private getAddSelectedColumnsQuery(isRemote: boolean): string {
        if (isRemote) {
            return `addSelectedColumnsQuery(selectedStringColumn: string, searchString: string): Like[] {
                if (selectedStringColumn !== this.advancedSearchAllValue) {
                    return [new Like(selectedStringColumn, \`*\${searchString}*\`)];
                } else {
                    return this.stringColumns.map((column: string) => {
                        return new Like(column, \`*\${searchString}*\`);
                    });
                }
            }`
        } else {
            return '';
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
                                                if(!this.activeFilters.filter(af => af.type === FilterEnums.Enum && af.prop === filterProp).map(af=> af.filterValue).includes(filterVal)) {
                                                this.activeFilters.push(<FilterType>{
                                                    removable: true,
                                                    type:FilterEnums.Enum,
                                                    label: ${this.getChipLabelEnum(prop)},
                                                    prop:filterProp,
                                                    filterValue : filterVal 
                                                })
                                            }});

                                            this.activeFilters
                                            .filter((af) => af.type === FilterEnums.Enum && af.prop === '${this.options.jsonAccessPath}${prop.propertyValue}')
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
