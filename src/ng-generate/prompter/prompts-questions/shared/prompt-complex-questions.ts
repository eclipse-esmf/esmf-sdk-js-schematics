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
    Aspect,
    AspectModelLoader,
    BaseMetaModelElement,
    Characteristic,
    Constraint,
    DefaultAspect,
    DefaultCollection,
    DefaultEither,
    DefaultEntity,
    DefaultList,
    DefaultProperty,
    DefaultPropertyInstanceDefinition,
    DefaultSet,
    DefaultSingleEntity,
    DefaultSortedSet,
    DefaultStructuredValue,
    DefaultTrait,
    Entity,
    Property,
} from '@esmf/aspect-model-loader';
import {ComponentType, Schema} from '../../../components/shared/schema';
import {TemplateHelper} from '../../../../utils/template-helper';
import * as locale from 'locale-codes';
import {handleComplexPropList, loader} from '../../utils';
import inquirer from 'inquirer';

export const requestOverwriteFiles = (options: Schema) => ({
    type: 'confirm',
    name: 'overwrite',
    message: 'Do you want to overwrite older files(same as running command with --overwrite)?',
    when: () => !options.overwrite,
    default: true,
});

export const requestDefaultSorting = (aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
    type: 'list',
    name: 'defaultSortingCol',
    message: 'Choose the column on which default sorting is applied:',
    choices: () => {
        let selectedElement: Aspect | Entity = aspect;
        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
        }
        const columns: string[] = [];
        templateHelper
            .getProperties({
                selectedModelElement: selectedElement,
                excludedProperties: [],
                complexProps: allAnswers.complexProps,
            })
            .forEach((property: DefaultProperty) => {
                if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                    const complexProperties = templateHelper.getComplexProperties(property, allAnswers);
                    complexProperties.properties.forEach((complexProp: Property) => {
                        columns.push(`${complexProperties.complexProp}.${complexProp.name}`);
                    });
                } else {
                    columns.push(`${property.name}`);
                }
            });

        return columns.sort();
    },
    when: () => {
        let selectedElement: Aspect | Entity = aspect;
        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
        }
        return templateHelper.resolveType(selectedElement).properties.length > 1;
    },
    default: false,
});

export const requestCommandBarFunctionality = (aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
    type: 'checkbox',
    name: 'enabledCommandBarFunctions',
    message: 'Select functionality of the command bar:',
    choices: () => {
        let selectedElement: Aspect | Entity = aspect;

        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
        }

        const options = {
            selectedModelElement: selectedElement,
            excludedProperties: allAnswers.excludedProperties,
            complexProps: allAnswers.complexProps,
        };
        const choices = [
            {
                name: 'Custom action buttons',
                value: 'addCustomCommandBarActions',
            },
        ];
        if (templateHelper.getStringProperties(options as Schema).length > 0) {
            choices.push({
                name: 'Search for string properties',
                value: 'addSearchBar',
            });
        }
        if (templateHelper.getDateProperties(options as Schema).length > 0) {
            choices.push({
                name: 'Quick filters for properties of type date',
                value: 'addDateQuickFilters',
            });
        }
        if (templateHelper.getEnumProperties(options as Schema).length > 0) {
            choices.push({
                name: 'Quick filters for properties of type enumeration',
                value: 'addEnumQuickFilters',
            });
        }
        return choices;
    },
    when: (answers: any) => answers.addCommandBar,
    default: [],
});

export const requestChooseDatePickerType = (property: Property) => ({
    type: 'list',
    name: 'type',
    message: `Property ${property.name} is an date type. Choose which type of date picker you want to display:`,
    choices: () => [
        {
            name: 'Single Date Picker',
            value: 'singleDatePicker',
        },
        {
            name: 'Date Range Picker with single date option',
            value: 'startOrEndDatePicker',
        },
        {
            name: 'Date Range Picker without single date option',
            value: 'startAndEndDatePicker',
        },
    ],
    default: '',
});

export const requestOptionalMaterialTheme = (options: Schema) => ({
    type: 'confirm',
    name: 'getOptionalMaterialTheme',
    message: 'Do you want to add the Angular Material theme? (Indigo Pink Theme)',
    when: () => !options.getOptionalMaterialTheme,
    default: false,
});

export const chooseLanguageForSearch = (aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
    type: 'list',
    name: 'chooseLanguageForSearch',
    message: 'Which language should be used for the search functionality?',
    choices: () => {
        let selectedElement: Aspect | Entity = aspect;

        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
        }

        const languageCodes = templateHelper.resolveAllLanguageCodes(selectedElement);
        const choices = [{name: 'English', value: 'en'}];

        languageCodes.forEach(code => {
            if (code !== 'en') {
                choices.push({name: locale.getByTag(code).name, value: code});
            }
        });

        return choices;
    },
    when: (answers: any) => answers.addCommandBar && templateHelper.hasSearchBar(answers),
    default: 'en',
});

export const customCommandBarActions = (answers: any, templateHelper: TemplateHelper) => ({
    type: 'suggest',
    name: 'customCommandBarActions',
    message: `To add custom action buttons on the command bar, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,fa fa-edit):`,
    suggestions: ['edit', 'delete', 'add', 'remove'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
    when: () => answers.addCommandBar && templateHelper.isAddCustomCommandBarActions(answers.enabledCommandBarFunctions),
});

export const requestAspectModelWithAspect = (allAnswers: any) => ({
    type: 'list',
    name: 'aspectModelUrnToLoad', // TODO change this to aspectModelFilePath or something similar ...
    message: 'Choose the .ttl file which includes the Aspect to load:',
    choices: allAnswers.aspectModelTFiles,
    when: () => allAnswers.aspectModelTFiles?.length > 1,
    default: '',
});

export const pathDecision: any = (configFile: string, anotherFile: boolean = false) => ({
    type: 'fuzzypath',
    name: 'paths',
    excludeFilter: (nodePath: string) => !nodePath.endsWith('.ttl'),
    excludePath: (nodePath: string) => nodePath.startsWith('node_modules'),
    itemType: 'file',
    message: 'Choose the path to a .ttl file. Start writing file name for suggestions:',
    rootPath: './',
    suggestOnly: false,
    depthLimit: 5,
    when: (answer: any) => {
        if (answer.configFileName) {
            if (answer.configFileName !== configFile) {
                configFile = `${answer.configFileName}-${configFile}`;
                answer.configFile = configFile;
            }
            return true;
        }

        return anotherFile;
    },
});

export const requestComplexPropertyElements = (type: string, property: Property) => ({
    type: 'checkbox',
    name: 'complexPropertyList',
    message: `Property ${property.name} has a complex value(${property.effectiveDataType?.shortUrn}). Choose which object properties to display in the ${type}:`,
    choices: (property.effectiveDataType as DefaultEntity).properties.map(innerProp => innerProp.aspectModelUrn),
    default: [],
});

export const excludedProperties = (type: string, allAnswers: any, templateHelper: TemplateHelper, answers: any, aspect: Aspect) => ({
    type: 'checkbox',
    name: 'excludedProperties',
    message: `Choose the properties to hide in the ${type}:`,
    when: () => {
        let selectedElement: Aspect | Entity = aspect;
        if (answers.selectedModelElementUrn && answers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(answers.selectedModelElementUrn) as Aspect | Entity;
        }

        return templateHelper.resolveType(selectedElement).properties.length > 1;
    },
    choices: () => {
        let selectedElement: Aspect | Entity = aspect;
        if (answers.selectedModelElementUrn && answers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(answers.selectedModelElementUrn) as Aspect | Entity;
        }
        let allProperties: Array<any> = [];
        allProperties = getAllPropertiesFromAspectOrEntity(templateHelper, selectedElement, allAnswers);
        return allProperties;
    },
});

export const requestExcludedConstraints = (type: string, allAnswers: any, templateHelper: TemplateHelper, answers: any, aspect: Aspect) => {
    const constraints = getAllConstraints(allAnswers, templateHelper, answers, aspect);

    return {
        type: 'checkbox',
        name: 'excludedConstraints',
        message: `Choose the constraints to ignore in the ${type}:`,
        when: () => constraints.length,
        choices: () =>
            constraints.map(constraint => ({
                name: constraint.aspectModelUrn,
                value: constraint.aspectModelUrn,
            })),
    };
};

export const requestSelectedModelElement = (
    type: ComponentType,
    aspect: Aspect,
    conditionFunction: (aspect: Aspect, loader: AspectModelLoader) => any
) => ({
    type: 'list',
    name: 'selectedModelElementUrn',
    message: `Choose a specific Entity or Aspect to show as ${type}:`,
    choices: getAspectAndEntities(aspect, type),
    size: 5,
    when: () => {
        return conditionFunction(aspect, loader);
    },
    default: '',
});

export const selectedAspectModelJsonPath = (aspect: Aspect, answers: any, allAnswers: any) => ({
    type: 'list',
    name: 'jsonAccessPath',
    message: `Choose the access path in the JSON payload to show data for ${answers.selectedModelElementUrn}`,
    choices: () =>
        loader
            .determineAccessPath((loader.findByUrn(answers.selectedModelElementUrn) as Entity | Aspect).properties[0])
            .map((pathSegments: Array<string>) => (pathSegments.length > 1 ? pathSegments.slice(0, pathSegments.length - 1) : pathSegments))
            .map((pathSegments: Array<string>) => pathSegments.join('.'))
            .sort(),
    when: () => {
        const isAspect = loader.findByUrn(answers.selectedModelElementUrn) instanceof DefaultAspect;
        const elementsPathSegments: Array<Array<string>> = loader.determineAccessPath(loader.findByUrn(answers.selectedModelElementUrn));

        if (!aspect.isCollectionAspect && elementsPathSegments.length <= 1) {
            allAnswers.jsonAccessPath = elementsPathSegments[0].join('.');
        }

        return !isAspect && !aspect.isCollectionAspect && elementsPathSegments.length > 1;
    },
});

export const generateLabelsForExcludedProperties = (answers: any) => ({
    type: 'confirm',
    name: 'getExcludedPropLabels',
    message: 'Do you want to generate translation labels for excluded properties?',
    when: () => answers.excludedProperties && answers.excludedProperties.length > 0,
    default: false,
});

function getAllPropertiesFromAspectOrEntity(templateHelper: any, selectedElement: any, allAnswers: any) {
    const allProperties: Array<any> = [];
    templateHelper
        .getProperties({
            selectedModelElement: selectedElement,
            excludedProperties: [],
            complexProps: allAnswers.complexProps,
        })
        .forEach((property: DefaultProperty) => {
            if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                const complexProperties = templateHelper.getComplexProperties(property, allAnswers);
                complexProperties.properties.forEach((complexProp: Property) => {
                    allProperties.push({
                        name: `${complexProp.aspectModelUrn}`,
                        value: {
                            prop: `${complexProperties.complexProp}`,
                            propToExcludeAspectModelUrn: `${complexProp.aspectModelUrn}`,
                        },
                    });
                });
            } else {
                allProperties.push({
                    name: `${property.aspectModelUrn}`,
                    value: {
                        prop: '',
                        propToExcludeAspectModelUrn: `${property.aspectModelUrn}`,
                    },
                });
            }
        });

    return allProperties;
}

function getAspectAndEntities(aspect: Aspect, type: string) {
    return [
        {name: `${aspect.aspectModelUrn} (Aspect)`, value: `${aspect.aspectModelUrn}`},
        ...loader
            .filterElements(entry => entry instanceof DefaultEntity)
            .filter((entity: BaseMetaModelElement) => !entity.parents.some((el: BaseMetaModelElement) => el instanceof DefaultSingleEntity))
            .map(entry => ({name: `${entry.aspectModelUrn} (Entity)`, value: `${entry.aspectModelUrn}`}))
            .sort(),
    ];
}

/**
 * Extracts complex properties from a selected model element based on the provided aspect. It filters
 * out properties that are complex and match certain criteria (e.g., being an instance of DefaultSingleEntity).
 * This function is used to identify properties requiring further processing or customization.
 *
 * @param {TemplateHelper} templateHelper - Utilized for resolving the type based on aspect and fetching properties.
 * @param {any} answers - Contains the current set of answers, including the selected model element URN.
 * @param {any} allAnswers - Accumulates all answers, updated with the selected model element URN if not already specified.
 * @param {Aspect} aspect - The aspect to consider when resolving the type and fetching properties.
 * @returns {Array<Property>} - A filtered list of complex properties from the selected model element.
 */
export function extractComplexPropertyDetails(
    templateHelper: TemplateHelper,
    answers: any,
    allAnswers: any,
    aspect: Aspect
): Array<Property> {
    allAnswers.selectedModelElementUrn = answers.selectedModelElementUrn || templateHelper.resolveType(aspect).aspectModelUrn;

    const properties = templateHelper.getProperties({
        selectedModelElement: loader.findByUrn(allAnswers.selectedModelElementUrn),
        excludedProperties: [],
    });

    return properties.filter(property => property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity);
}

function getAllConstraints(allAnswers: any, templateHelper: TemplateHelper, answers: any, aspect: Aspect): Constraint[] {
    const selectedElement =
        answers.selectedModelElementUrn && answers.selectedModelElementUrn.length > 0
            ? (loader.findByUrn(answers.selectedModelElementUrn) as Entity)
            : aspect;

    const excludedPropertiesUrns = answers.excludedProperties
        ? answers.excludedProperties.map((property: any) => property.propToExcludeAspectModelUrn)
        : [];
    const allProperties = getAllPropertiesFromAspectOrEntity(templateHelper, selectedElement, allAnswers);
    const allowedPropertiesObjects = allProperties.filter(property => !excludedPropertiesUrns.includes(property.name));
    const allowedProperties = allowedPropertiesObjects.map(property => loader.findByUrn(property.name) as Property);

    return allowedProperties.reduce((acc, property) => [...acc, ...getConstraintsFromSubTree(property)], []);
}

function getConstraintsFromSubTree(property: Property): Constraint[] {
    const constraints: Constraint[] = [];

    constraints.push(...getConstraintsFromElement(property.characteristic));
    constraints.push(...getConstraintsFromComplexElement(property.characteristic));

    if (property.characteristic instanceof DefaultTrait) {
        constraints.push(...getConstraintsFromComplexElement(property.characteristic.baseCharacteristic));
    }

    return constraints;
}

function getConstraintsFromElement(element: BaseMetaModelElement | undefined): Constraint[] {
    return element instanceof DefaultTrait && element.constraints?.length ? element.constraints : [];
}

function getConstraintsFromComplexElement(characteristic: Characteristic): Constraint[] {
    if (
        characteristic instanceof DefaultSet ||
        characteristic instanceof DefaultSortedSet ||
        characteristic instanceof DefaultCollection ||
        characteristic instanceof DefaultList
    ) {
        return getConstraintsFromElement(characteristic.elementCharacteristic);
    }

    if (characteristic instanceof DefaultEither) {
        return [...getConstraintsFromElement(characteristic.left), ...getConstraintsFromElement(characteristic.right)];
    }

    if (characteristic instanceof DefaultStructuredValue) {
        return characteristic.elements.reduce(
            (acc, element) =>
                element instanceof DefaultPropertyInstanceDefinition
                    ? [...acc, ...getConstraintsFromElement(element.wrappedProperty.characteristic)]
                    : acc,
            []
        );
    }

    return [];
}

/**
 * Processes complex properties of a given generation type, extracting and handling property elements
 * through user prompts. It iterates over each property in the provided list, prompts for related complex
 * property elements based on the generation type, and compiles the handled properties into a list.
 *
 * @param {string} generationType - The type of generation (e.g., "form", "table") that influences how properties are processed.
 * @param {Array<Property>} complexProperties - A list of properties to be processed, typically requiring user input to determine specifics.
 * @returns {Promise<object>} - Resolves to an object containing a list of processed complex properties.
 */
export async function extractPropertyElements(generationType: string, complexProperties: Array<Property>): Promise<object> {
    const complexPropertyList = [];
    for (const property of complexProperties) {
        const {complexPropertyList: complexPropList} = await complexPropertyElementsPrompt(generationType, property);
        const handledProp = handleComplexPropList(property, complexPropList);
        complexPropertyList.push(handledProp);
    }

    return {complexProps: complexPropertyList};
}

async function complexPropertyElementsPrompt(generationType: string, property: Property): Promise<any> {
    return inquirer.prompt([requestComplexPropertyElements(generationType, property)]);
}

/**
 * Gathers date picker types for date-time properties of a selected model element. It determines the
 * model element's properties, prompts for date picker types for each date-time property, and returns
 * a configuration list of these selections.
 *
 * @param {TemplateHelper} templateHelper - Assists with resolving types and getting properties.
 * @param {any} allAnswers - Contains all previous answers, including the selected model element URN.
 * @param {any} answers - Current answers, expected to include the selected model element URN.
 * @param {Aspect} aspect - Used to resolve the default model element type if not specified.
 * @returns {Promise<object>} - Resolves to an object with configurations for each date-time property's date picker type.
 */
export async function getDatePickerType(templateHelper: TemplateHelper, allAnswers: any, answers: any, aspect: Aspect): Promise<object> {
    allAnswers.selectedModelElementUrn = answers.selectedModelElementUrn || templateHelper.resolveType(aspect).aspectModelUrn;

    const properties = templateHelper.getProperties({
        selectedModelElement: loader.findByUrn(allAnswers.selectedModelElementUrn),
        excludedProperties: [],
    });

    const datePickerTypeList = [];
    for (const property of properties) {
        if (templateHelper.isDateTimeProperty(property)) {
            const type = await datePickerTypePrompt(property);
            const p = property.aspectModelUrn;
            datePickerTypeList.push({propertyUrn: property.aspectModelUrn, datePicker: type});
        }
    }

    return {datePickers: datePickerTypeList};
}

async function datePickerTypePrompt(property: Property): Promise<any> {
    return inquirer.prompt([requestChooseDatePickerType(property)]);
}
