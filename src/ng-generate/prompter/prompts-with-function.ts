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

import {loader} from "./utils";
import {Tree} from "@angular-devkit/schematics";
import {
    Aspect,
    DefaultAspect,
    DefaultEntity,
    DefaultProperty,
    DefaultSingleEntity,
    Entity,
    Property
} from "@esmf/aspect-model-loader";
import {TemplateHelper} from "../../utils/template-helper";
import {Schema} from "../cards/schema";
import * as locale from "locale-codes";

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
    }
});

export const requestAspectModelUrnToLoad = (allAnswers: any) => ({
    type: 'list',
    name: 'aspectModelUrnToLoad',
    message: 'Choose the .ttl file which includes the Aspect to load:',
    choices: allAnswers.aspectModelTFiles,
    when: () => allAnswers.aspectModelTFiles?.length > 1,
    default: '',
});

export const requestSelectedModelElement = (type: string, aspect: Aspect) => ({
    type: 'search-list',
    name: 'selectedModelElementUrn',
    message: `Choose a specific Entity or Aspect to show as ${type}:`,
    choices: [
        {name: `${aspect.aspectModelUrn} (Aspect)`, value: `${aspect.aspectModelUrn}`},
        ...loader
            .filterElements(entry => entry instanceof DefaultEntity)
            .map(entry => ({name: `${entry.aspectModelUrn} (Entity)`, value: `${entry.aspectModelUrn}`}))
            .sort(),
    ],
    size: 5,
    when: () => !aspect.isCollectionAspect &&
        loader.filterElements(entry => entry instanceof DefaultEntity).length >= 1,
    default: '',
});

export const requestComplexPropertyElements = (type: string, property: Property) => ({
    type: 'checkbox',
    name: 'complexPropertyList',
    message: `Property ${property.name} has a complex value(${property.effectiveDataType?.shortUrn}). Choose which object properties to display in the ${type}:`,
    choices: (property.effectiveDataType as DefaultEntity).properties.map(innerProp => innerProp.aspectModelUrn),
    default: [],
});

export const requestJSONPathSelectedModelElement = (aspect: Aspect, allAnswers: any, tree: Tree) => ({
    type: 'list',
    name: 'jsonAccessPath',
    message: `Choose the access path in the JSON payload to show data for ${allAnswers.selectedModelElementUrn}`,
    choices: () => loader.determineAccessPath((loader.findByUrn(allAnswers.selectedModelElementUrn) as Entity | Aspect).properties[0])
        .map((pathSegments: Array<string>) => pathSegments.length > 1 ? pathSegments.slice(0, pathSegments.length - 1) : pathSegments)
        .map((pathSegments: Array<string>) => pathSegments.join('.'))
        .sort(),
    when: () => {
        const isAspect = loader.findByUrn(allAnswers.selectedModelElementUrn) instanceof DefaultAspect;
        const elementsPathSegments: Array<Array<string>> = loader.determineAccessPath(loader.findByUrn(allAnswers.selectedModelElementUrn));

        if (!aspect.isCollectionAspect && elementsPathSegments.length <= 1) {
            allAnswers.jsonAccessPath = elementsPathSegments[0].join('.');
        }

        return !isAspect && !aspect.isCollectionAspect && elementsPathSegments.length > 1;
    },
});

export const requestExcludedProperties = (type: string, aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
    type: 'checkbox',
    name: 'excludedProperties',
    message: `Choose the properties to hide in the ${type}:`,
    when: () => {
        let selectedElement: Aspect | Entity = aspect;

        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
        }

        return templateHelper.resolveType(selectedElement).properties.length > 1;
    },
    choices: () => {
        let selectedElement: Aspect | Entity = aspect;

        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
        }

        const allProperties: Array<any> = [];
        templateHelper.getProperties({
            selectedModelElement: selectedElement,
            excludedProperties: [],
            complexProps: allAnswers.complexProps,
        }).forEach((property: DefaultProperty) => {
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
    },
});

export const requestGenerateLabelsForExcludedProps = (answers: any) => ({
    type: 'confirm',
    name: 'getExcludedPropLabels',
    message: 'Do you want to generate translation labels for excluded properties?',
    when: () => answers.excludedProperties.length > 0,
    default: false,
});

export const requestOptionalMaterialTheme = (options: Schema) => ({
    type: 'confirm',
    name: 'getOptionalMaterialTheme',
    message: 'Do you want to add the Angular Material theme? (Indigo Pink Theme)',
    when: () => !options.getOptionalMaterialTheme,
    default: false,
});

export const requestDefaultSortingCol = (aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
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

export const requestEnableCommandBarFunctions = (aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
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

export const requestChooseLanguageForSearchAction = (aspect: Aspect, allAnswers: any, templateHelper: TemplateHelper) => ({
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

export const requestCustomCommandBarActions = (answers: any, templateHelper: TemplateHelper) => ({
    type: 'suggest',
    name: 'customCommandBarActions',
    message: `To add custom action buttons on the command bar, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,fa fa-edit):`,
    suggestions: ['edit', 'delete', 'add', 'remove'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
    when: () => answers.addCommandBar && templateHelper.isAddCustomCommandBarActions(answers.enabledCommandBarFunctions),
});

export const requestOverwriteFiles = (options: Schema) => ({
    type: 'confirm',
    name: 'overwrite',
    message: 'Do you want to overwrite older files(same as running command with --overwrite)?',
    when: () => !options.overwrite,
    default: true,
});

export const requestCustomRowActions = (type: string) => ({
    type: 'suggest',
    name: 'customRowActions',
    message: `To add custom action buttons for each table row, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,fa fa-edit):`,
    suggestions: ['edit', 'delete', 'add', 'remove'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
    when: () => (type === 'table'),
});

export const requestRowCheckboxes = (type: string) => ({
    type: 'confirm',
    name: 'addRowCheckboxes',
    message: 'Do you want to add multi-selection checkboxes for selecting table rows?',
    when: () => (type === 'table'),
    default: false,
});
