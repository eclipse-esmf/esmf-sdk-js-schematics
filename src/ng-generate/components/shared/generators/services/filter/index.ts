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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, noop, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {classify} from '@angular-devkit/core/src/utils/strings';
import {getAllEnumProps, PropValue} from '../../../../../../utils/aspect-model';
import {ComponentType} from '../../../schema';

let sharedOptions: any = {};

export function generateFilterService(options: any): Rule {
    sharedOptions = options;

    return (tree: Tree, _context: SchematicContext) => {
        if (sharedOptions.componentType === ComponentType.TABLE && !sharedOptions.hasFilters) {
            return noop;
        }

        const enumValues = getAllEnumProps(sharedOptions);
        const dataValues = getAllDateProps(sharedOptions.listAllProperties);

        const key = `item.${sharedOptions.jsonAccessPath}`;
        const itemKey = key.substring(0, key.length - 1);

        return mergeWith(
            apply(url('../shared/generators/services/filter/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: sharedOptions,
                    name: sharedOptions.name,
                    itemKey: itemKey,
                    getAllStringProps: getAllStringProps(sharedOptions.listAllProperties),
                    setStringColumns: setStringColumns(sharedOptions.listAllProperties),
                    getEnumProperties: getEnumProperties(),
                    setEnumQuickFilter: setEnumQuickFilter(enumValues),
                    setEnumRemoveFilter: setEnumRemoveFilter(enumValues),
                    setDataQuickFilter: setDataQuickFilter(dataValues),
                    setDataRemoveFilter: setDataRemoveFilter(dataValues),
                    getEnumFilterRemote: getEnumFilterRemote(enumValues),
                    getEnumFilterNotRemote: getEnumFilterNotRemote(enumValues),
                    getDateRemote: getDateRemote(dataValues),
                    getDateNotRemote: getDateNotRemote(dataValues),
                }),
                move(sharedOptions.path),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}

function getAllStringProps(allProps: Property[]): string[] {
    return allProps.flatMap((property: Property) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexProps = sharedOptions.templateHelper.getComplexProperties(property, sharedOptions);
            return complexProps.properties
                .filter(
                    (complexProp: Property) =>
                        sharedOptions.templateHelper.isStringProperty(complexProp) ||
                        sharedOptions.templateHelper.isMultiStringProperty(complexProp)
                )
                .map((complexProp: Property) => `'${complexProps.complexProp}.${complexProp.name}'`);
        }
        return sharedOptions.templateHelper.isStringProperty(property) || sharedOptions.templateHelper.isMultiStringProperty(property)
            ? [`'${property.name}'`]
            : [];
    });
}

function getEnumProperties(): string {
    return sharedOptions.templateHelper
        .getEnumProperties(sharedOptions)
        .map((property: Property) => classify(property.characteristic.name))
        .join(', ');
}

function getAllDateProps(allProps: Property[]) {
    const getPropValue = (prop: Property, complexPropObj?: any) => ({
        propertyValue: complexPropObj ? `${complexPropObj.complexProp}.${prop.name}` : prop.name,
        propertyName: complexPropObj ? `${complexPropObj.complexProp}${classify(prop.name)}` : prop.name,
        characteristic: prop.characteristic?.name,
        enumWithEntities: false,
        property: prop,
        complexPropObj: complexPropObj,
    });

    return allProps.flatMap(property => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexPropObj = sharedOptions.templateHelper.getComplexProperties(property, sharedOptions);
            return complexPropObj.properties
                .filter(
                    (complexProp: any) =>
                        sharedOptions.templateHelper.isDateTimeProperty(complexProp) &&
                        !sharedOptions.excludedProperties.some(
                            (excludedProperty: any) => excludedProperty.propToExcludeAspectModelUrn === complexProp.aspectModelUrn
                        )
                )
                .map((complexProp: any) => getPropValue(complexProp, complexPropObj));
        } else if (sharedOptions.templateHelper.isDateTimeProperty(property)) {
            return getPropValue(property);
        }
        return [];
    });
}

function setStringColumns(allProps: Property[]) {
    const stringColumnsArr = `stringColumns: string[] = [${getAllStringProps(allProps).join(', ')}];\n`;
    return `${stringColumnsArr}readonly advancedSearchAllValue = 'allTextFields';\nselectedStringColumn: FormControl<string | null> = new FormControl(this.advancedSearchAllValue);`;
}

function setEnumQuickFilter(values: PropValue[]) {
    const template = (value: any) => `
        ${value.propertyName}Selected: Array<${value.enumWithEntities ? 'string' : classify(value.characteristic || 'any')}> = [];
        ${value.propertyName}Options: Array<any> = ${
        value.enumWithEntities
            ? `${classify(value.characteristic)}.getValueDescriptionList('${
                  value.complexPropObj ? value.complexPropObj.complexProp + '.' : ''
              }${value.property.name}')`
            : `Object.values(${classify(value.characteristic)})`
    };`;

    return values.map(template).join('');
}

function setEnumRemoveFilter(values: PropValue[]) {
    const template = (value: any) => `
        if(filter.prop === '${value.propertyValue}') {
            this.${value.propertyName}Selected = this.${value.propertyName}Selected.filter(sel => sel !== filter.filterValue);
        }`;

    const filterStatements = values.map(template).join('');
    const filterRemovalStatement =
        'this.activeFilters = this.activeFilters.filter(af => af.filterValue !== filter.filterValue && af.label !== filter.label );';
    const endStatement = 'break;';

    return `case FilterEnums.Enum: ${filterStatements} ${filterRemovalStatement} ${endStatement}`;
}

function setDataQuickFilter(values: PropValue[]) {
    const template = (value: any) => `
        ${value.propertyName}Group = new FormGroup({
            start: new FormControl(),
            end: new FormControl()
        });`;

    return values.map(template).join('');
}

function setDataRemoveFilter(values: PropValue[]) {
    const template = (value: any) =>
        `if(filter.prop === '${value.propertyValue}') {
            this.${value.propertyName}Group.reset();  
            this.${value.propertyName}Group.reset();
        }`;

    const filtersLogic = values.map(template).join('');

    return `case FilterEnums.Date: 
        ${filtersLogic}
        this.activeFilters = this.activeFilters.filter(af => af.filterValue !== filter.filterValue && af.label !== filter.label);
        break;`;
}

function getEnumFilterRemote(values: PropValue[]) {
    const template = (value: any) => `
        if (this.${value.propertyName}Selected.length > 0) {
            query.addNode(new In('${sharedOptions.jsonAccessPath}${value.propertyValue}', this.${value.propertyName}Selected));
        }
        
        this.${value.propertyName}Selected.forEach(selected => {
            const filterProp = '${sharedOptions.jsonAccessPath}${value.propertyValue}';
            const filterVal = selected;
            
            if(!this.activeFilters.filter(af => af.prop === filterProp).map(af=> af.filterValue).includes(filterVal)) {
                this.activeFilters.push(<FilterType>{
                    removable: true,
                    type: FilterEnums.Enum,
                    label: ${getChipLabelEnum(value)},
                    prop: filterProp,
                    filterValue : filterVal
                })
            }
        });

        this.activeFilters
            .filter((af) => af.prop === '${sharedOptions.jsonAccessPath}${value.propertyValue}')
            .forEach((filter) => {
                if (!this.${value.propertyName}Selected.includes(filter.filterValue as any)) {
                    this.removeFilter(filter);
                }
            });`;

    return `applyEnumFilter(query: AbstractLogicalNode): void {
        ${values.map(template).join('')}
    }`;
}

function getEnumFilterNotRemote(values: PropValue[]) {
    const code = values.map(generateFilterCode).join('');

    return `applyEnumFilter(data: Array<${classify(sharedOptions.selectedModelElement.name)}>) {
        let filteredData = data;
        ${code}
        return filteredData;
    }`;
}

const generateFilterCode = (value: any) => `
filteredData = this.${value.propertyName}Selected.length === 0 ? filteredData : 
                filteredData.filter((item:${classify(sharedOptions.selectedModelElement.name)}): boolean =>
                    (this.${value.propertyName}Selected.includes(item.${sharedOptions.jsonAccessPath}${value.propertyValue})));
                
this.${value.propertyName}Selected.forEach(selected=> {
    const filterProp = '${sharedOptions.jsonAccessPath}${value.propertyValue}';
    const filterVal = selected;

    if (!this.activeFilters.filter(af => af.type === FilterEnums.Enum && af.prop === filterProp).map(af=> af.filterValue).includes(filterVal)) {
        this.activeFilters.push(<FilterType>{
            removable: true,
            type: FilterEnums.Enum,
            label: ${getChipLabelEnum(value)},
            prop: filterProp,
            filterValue : filterVal 
        })
    }
});

this.activeFilters
    .filter((af) => af.type === FilterEnums.Enum && af.prop === '${sharedOptions.jsonAccessPath}${value.propertyValue}')
    .forEach((filter) => {
      if (!this.${value.propertyName}Selected.includes(filter.filterValue as any)) {
        this.removeFilter(filter);
      }
    });
`;

const getChipLabelEnum = (filterProp: PropValue) => {
    const templateWithEntities = (propName: string) =>
        `\`${'${selected} - ${this.translateService.translate(this.'}${propName}Options.filter(option => option.value === selected).map(option => option.translationKey).join(''))}\``;

    const templateWithoutEntities = `\`${'${selected}'}\``;

    return filterProp.enumWithEntities ? templateWithEntities(filterProp.propertyName) : templateWithoutEntities;
};

function getDateRemote(values: PropValue[]): string {
    const template = (value: any) => `
        if (this.${value.propertyName}Group.value.end && this.${value.propertyName}Group.value.start) {
            const eDate = new Date(this.${value.propertyName}Group.value.end).setHours(23, 59, 59, 999);
            const endDate = this.createDateAsUTC(new Date(eDate));
            const startDate = this.createDateAsUTC(new Date(this.${value.propertyName}Group.value.start));

            query.addNode(new And([new Le('${sharedOptions.jsonAccessPath}${value.propertyValue}', \`\${endDate}\`), new Ge('${sharedOptions.jsonAccessPath}${value.propertyValue}', \`\${startDate}\`)]));
            const filter = this.activeFilters.find(af => af.prop === '${value.propertyValue}');
            const newLabel =\`${value.propertyValue}: from \${this.getFormattedDate(startDate)} to \${this.getFormattedDate(endDate)}\`;

            if(!filter) {
                this.activeFilters.push(<FilterType>{
                    removable: true,
                    type: FilterEnums.Date,
                    label: newLabel, 
                    prop: '${value.propertyValue}' 
                });
            } else {
                filter.label = newLabel;
            }
        }`;

    const formattedValues = values.map(template).join('');

    return `
        applyDateFilter(query: AbstractLogicalNode): void {
            ${formattedValues}
        }`;
}

function getDateNotRemote(values: PropValue[]): string {
    const dateFilterLogic = (value: any) => `
    if (this.${value.propertyName}Group.value.start !== null && this.${value.propertyName}Group.value.end !== null) {
      const startDate = this.createDateAsUTC(new Date(this.${value.propertyName}Group.value.start));
      const beginningOfDay = new Date(this.${value.propertyName}Group.value.end).setHours(23, 59, 59, 999);
      const endDate = this.createDateAsUTC(new Date(beginningOfDay));
      filteredData = filteredData.filter(item => ((new Date(endDate) >= new Date(item.${value.propertyValue}) && new Date(item.${value.propertyValue}) >= new Date(startDate))));
      this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: from \${this.getFormattedDate(startDate)} to \${this.getFormattedDate(endDate)}\`);
    } else if (this.${value.propertyName}Group.value.end !== null) {
      const beginningOfDay = new Date(this.${value.propertyName}Group.value.end).setHours(23, 59, 59, 999);
      const endDate = this.createDateAsUTC(new Date(beginningOfDay));
      filteredData = filteredData.filter(item => ((new Date(item.${value.propertyValue}) <= new Date(endDate))));
      this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: until \${this.getFormattedDate(endDate)}\`);
    } else if (this.${value.propertyName}Group.value.start !== null) {
      const startDate = this.createDateAsUTC(new Date(this.${value.propertyName}Group.value.start));
      filteredData = filteredData.filter(item => ((new Date(item.${value.propertyValue}) >= new Date(startDate))));
      this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: from \${this.getFormattedDate(startDate)}\`);
    }`;

    return `
        applyDateFilter(data: Array<any>): Array<any> {
          let filteredData = data;
          ${values.map(dateFilterLogic).join('')}
          return filteredData;
        }
        updateActiveFilters(prop: string, label: string) {
          const filter =  this.activeFilters.find(af=> af.prop === prop);
          if(!filter) {
            this.activeFilters.push(<FilterType>{
              removable: true,
              type: FilterEnums.Date,
              label: label, 
              prop: prop 
            });
          } else {
            filter.label = label;
          }
        }`;
}
