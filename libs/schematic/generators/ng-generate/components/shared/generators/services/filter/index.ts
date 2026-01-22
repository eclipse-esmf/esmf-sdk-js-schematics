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

import {strings} from '@angular-devkit/core';
import {classify} from '@angular-devkit/core/src/utils/strings';
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
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
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
      options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
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
            sharedOptions.templateHelper.isStringProperty(complexProp) || sharedOptions.templateHelper.isMultiStringProperty(complexProp),
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
              (excludedProperty: any) => excludedProperty.propToExcludeAspectModelUrn === complexProp.aspectModelUrn,
            ),
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
            ? `${classify(value.characteristic)}.getValueDescriptionList('${value.complexPropObj ? value.complexPropObj.complexProp + '.' : ''}${
                value.property.name
              }')`
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

  return `case FilterEnums.Enum: {${filterStatements} ${filterRemovalStatement} ${endStatement}}`;
}

function setDateFormGroups(values: PropValue[]) {
  const template = (value: any) => `
        ${value.propertyName}Group;`;

  return values.map(template).join('');
}

function setDateQuickFilters(values: PropValue[]) {
  const template = (value: any) => {
    const datePicker = sharedOptions.datePickers?.find((element: any) => element.propertyUrn === value.property.aspectModelUrn)?.datePicker
      .type;

    if (sharedOptions.isDateQuickFilter && datePicker) {
      const required = datePicker === 'startAndEndDatePicker' ? ', Validators.required' : '';

      return `this.${value.propertyName}Group = this.fb.group({
                fromControl: [null${required}],
                toControl: [null${required}]
            });`;
    }

    return '';
  };

  return values.map(template).join('');
}

function setDataRemoveFilter(values: PropValue[]) {
  const template = (value: any) =>
    `if(filter.prop === '${value.propertyValue}') {
            this.${value.propertyName}Group.reset();
        }`;

  const filtersLogic = values.map(template).join('');

  return `case FilterEnums.Date: {
        ${filtersLogic}
        this.activeFilters = this.activeFilters.filter(af => af.filterValue !== filter.filterValue && af.label !== filter.label);
        break;
     }`;
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
        if(this.${value.propertyName}Group.valid) {
            const {fromControl, toControl} = this.${value.propertyName}Group.value;
            this.applySingleDateFilter(query, fromControl, toControl, '${value.propertyName}');
        }
    `;

  const activeFilters = values.map(template).join('');

  return `
        applyDateFilter(query: AbstractLogicalNode): void {
            ${activeFilters}
        }

        private applySingleDateFilter(query: AbstractLogicalNode, from: number, to: number, filterPropName: string): void {
            const conditions = [];

            const fromDateUTC: string | null = from ? this.createDateAsUTC(new Date(from)).toISOString() : null;
            let toDateUTC: string | null = null;
            let toDate: Date | null = to ? this.createDateAsUTC(new Date(to)) : null;

            if (toDate) {
                toDateUTC = this.createDateAsUTC(new Date(toDate.setHours(23, 59, 59, 999))).toISOString();
            }

            if (fromDateUTC) {
                conditions.push(new Ge(filterPropName, fromDateUTC));
            }
            if (toDateUTC) {
                conditions.push(new Le(filterPropName, toDateUTC));
            }
            if (conditions.length > 0) {
                query.addNode(conditions.length > 1 ? new And(conditions) : conditions[0]);
            }

            // DCV-SPECIFIC: wrap the rest of the code in if condition to avoid chip list not updating or removing
            if (fromDateUTC || toDateUTC) {
                const filterIndex = this.activeFilters.findIndex(af => af.prop === filterPropName);

                let label = this.translateService.translate('batch.v030.' + filterPropName + '.preferredName');

                if (fromDateUTC && toDateUTC) {
                    label += ' ' + this.getFormattedDate(fromDateUTC) + ' - ' + this.getFormattedDate(toDate.toISOString());
                } else if (toDateUTC) {
                    label += ' to ' + this.getFormattedDate(toDate.toISOString());
                } else if (fromDateUTC) {
                    label += ' from ' + this.getFormattedDate(fromDateUTC);
                }

                if (filterIndex === -1) {
                    this.activeFilters.push({
                        removable: true,
                        type: FilterEnums.Date,
                        label,
                        prop: filterPropName
                    });
                } else {
                    this.activeFilters[filterIndex].label = label;
                }
            }
      }
`;
}

function getDateNotRemote(values: PropValue[]): string {
  const dateFilterLogic = (value: any, index: number) => `
    const {${value.propertyName}From, ${value.propertyName}To} = this.${value.propertyName}Group.value as any;;

    const ${value.propertyName}StartDate: Date | null = ${value.propertyName}From ? this.createDateAsUTC(new Date(${
      value.propertyName
    }From)) : null;
    let ${value.propertyName}EndDate: Date | null = ${value.propertyName}To ? this.createDateAsUTC(new Date(${
      value.propertyName
    }To)) : null;

    if (${value.propertyName}EndDate) {
        ${value.propertyName}EndDate = new Date(${value.propertyName}EndDate.setHours(23, 59, 59, 999));
    }

    ${filteredData(values, index)}.filter(item => {
        const itemDate = new Date(item.${value.propertyValue});
        return (!${value.propertyName}StartDate || itemDate >= ${value.propertyName}StartDate) && (!${
          value.propertyName
        }EndDate || itemDate <= ${value.propertyName}EndDate);
    });

    if (${value.propertyName}StartDate && ${value.propertyName}EndDate) {
        this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: \${this.getFormattedDate(${
          value.propertyName
        }StartDate.toISOString())} - \${this.getFormattedDate(${value.propertyName}EndDate.toISOString())}\`);
    } else if (${value.propertyName}EndDate) {
        this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: until \${this.getFormattedDate(${
          value.propertyName
        }EndDate.toISOString())}\`);
    } else if (${value.propertyName}StartDate) {
        this.updateActiveFilters('${value.propertyValue}', \`${value.propertyValue}: from \${this.getFormattedDate(${
          value.propertyName
        }StartDate.toISOString())}\`);
    }`;

  return `
        applyDateFilter(data: Array<any>): Array<any> {
          ${values.map(dateFilterLogic).join('')}
          return filteredData;
        }

        private dateInformation (prop: string, label: string) {
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

function filteredData(values: PropValue[], index: number): string {
  if (values.length === 1) {
    return 'const filteredData = data';
  } else if (values.length > 1 && index === 0) {
    return 'let filteredData = data';
  }

  return 'filteredData = filteredData';
}
