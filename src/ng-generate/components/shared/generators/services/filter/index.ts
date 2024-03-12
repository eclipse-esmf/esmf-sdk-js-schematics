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
    MergeStrategy,
    mergeWith,
    move,
    noop,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {classify} from '@angular-devkit/core/src/utils/strings';
import {DatePicker, getAllEnumProps, PropValue} from '../../../../../../utils/aspect-model';
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
                    setDateFormGroups: setDateFormGroups(dataValues),
                    setDateQuickFilters: setDateQuickFilters(dataValues),
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

function setDateFormGroups(values: PropValue[]) {
    const template = (value: any) => `
        ${value.propertyName}Group;`;

    return values.map(template).join('');
}

function setDateQuickFilters(values: PropValue[]) {
    const template = (value: any) => {
        debugger
        const datePicker = sharedOptions.datePickers
            .find((element: any) => element.propertyUrn === value.property.aspectModelUrn)?.datePicker.type;
        const required = datePicker === 'startAndEndDatePicker' ? ', Validators.required' : '';

        return `this.${value.propertyName}Group = this.fb.group({
            from: [null${required}],
            to: [null${required}]
        })`
    }

    return values.map(template).join('');
}

function datePickerType(datePickers: Array<DatePicker>, property: Property): string | undefined {
    return
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
            const conditions = [];
            const {to, from} = this[\`${value.propertyName}Group\`].value;

            const startDateUTC: Date | null = from ? this.createDateAsUTC(new Date(from)).toISOString() : null;
            let endDateUTC: Date | null = to ? this.createDateAsUTC(new Date(to)) : null;

            if (endDateUTC) {
                endDateUTC = new Date(endDate.setHours(23, 59, 59, 999));
                endDateUTC = endDate.toISOString();
            }

            if (startDateUTC) {
                conditions.push(new Ge(\`${sharedOptions.jsonAccessPath}${value.propertyValue}\`, \`\${startDateUTC}\`));
            }
            if (endDateUTC) {
                conditions.push(new Le(\`${sharedOptions.jsonAccessPath}${value.propertyValue}\`, \`\${endDateUTC}\`));
            }
            if (conditions.length > 0) {
                query.addNode(conditions.length > 1 ? new And(conditions) : conditions[0]);
            }

            const filterIndex = this.activeFilters.findIndex(af => af.prop === value.propertyValue);

            let label = \`${value.propertyValue}:\`;

            if (startDateUTC && endDateUTC) {
               label += \` \${this.getFormattedDate(startDateUTC)} - \${this.getFormattedDate(endDateUTC)}\`;
            } else if (endDateUTC) {
               label += \` to \${this.getFormattedDate(endDateUTC)}\`;
            } else if (startDateUTC) {
                label += \` from \${this.getFormattedDate(startDateUTC)}\`;
            }
        
            if (filterIndex === -1) {
                this.activeFilters.push({
                    removable: true,
                    type: FilterEnums.Date,
                    label,
                    prop: value.propertyValue
                });
            } else {
               this.activeFilters[filterIndex].label = label;
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
    const {from, to} = this.${value.propertyName}Group.value;
   
    const startDate: Date | null = from ? this.createDateAsUTC(new Date(from)) : null;
    let endDate: Date | null = to ? this.createDateAsUTC(new Date(to)) : null;

    if (endDate) {
        endDate = new Date(endDate.setHours(23, 59, 59, 999));
    }

    const filteredData = data.filter(item => {
        const itemDate = new Date(item.${value.propertyValue});
        return (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    });

    if (startDate && endDate) {
        this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: \${this.getFormattedDate(startDate.toISOString())} - \${this.getFormattedDate(endDate.toISOString())}\`);
    } else if (endDate) {
        this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: until \${this.getFormattedDate(endDate.toISOString())}\`);
    } else if (startDate) {
        this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: from \${this.getFormattedDate(startDate.toISOString())}\`);
    }`;

    return `
        applyDateFilter(data: Array<any>): Array<any> {
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
