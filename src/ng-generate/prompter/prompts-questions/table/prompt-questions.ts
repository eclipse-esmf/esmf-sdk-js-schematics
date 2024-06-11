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

import {TemplateHelper} from '../../../../utils/template-helper';
import inquirer from 'inquirer';
import {
    chooseLanguageForSearch,
    customCommandBarActions,
    excludedProperties,
    extractComplexPropertyDetails,
    extractPropertyElements,
    generateLabelsForExcludedProperties,
    getDatePickerType,
    requestCommandBarFunctionality,
    requestDefaultSorting,
    requestOptionalMaterialTheme,
    requestOverwriteFiles,
    requestSelectedModelElement,
    selectedAspectModelJsonPath,
    getCommandBarFilterOrder
} from '../shared/prompt-complex-questions';
import {ComponentType, Schema} from '../../../components/shared/schema';
import {Aspect, BaseMetaModelElement, DefaultEntity} from '@esmf/aspect-model-loader';
import {
    requestAddCommandBar,
    requestAspectModelVersionSupport,
    requestCustomService,
    requestCustomStyleImports,
    requestEnableRemoteDataHandling,
    requestSetViewEncapsulation,
} from '../shared/prompt-simple-questions';
import {ConfigurationDefaultsSchema, TableDefaultsSchema} from '../../../components/table/schema';
import {BaseModelLoader} from '@esmf/aspect-model-loader/dist/base-model-loader';

/**
 * Asynchronously prompts the user with a series of questions related to table configurations,
 * combines these answers with existing configurations, and updates the provided answers.
 *
 * @param {any} answerConfigurationFileConfig - The existing configuration from a configuration file.
 * @param {any} answerAspectModel - The current aspect model's answers.
 * @param {TemplateHelper} templateHelper - An instance of TemplateHelper for assisting in generating template-based configurations.
 * @param {Schema} options - Schema options that might affect the generation of table prompts.
 * @param {Aspect} aspect - The current aspect of the table for which the configurations are being generated.
 * @param {Function} combineAnswers - A function to combine all answers into a single configuration object.
 * @param {any} allAnswers - All previously gathered answers that may influence current prompts.
 * @returns {Promise<void>} - A promise that resolves once all configurations are combined and processed.
 */
export async function tablePrompterQuestions(
    answerConfigurationFileConfig: any,
    answerAspectModel: any,
    templateHelper: TemplateHelper,
    options: Schema,
    aspect: Aspect,
    combineAnswers: (...answers: any[]) => any,
    allAnswers: any
): Promise<void> {
    const defaultConfiguration: ConfigurationDefaultsSchema = new TableDefaultsSchema();

    combineAnswers(
        answerConfigurationFileConfig,
        answerAspectModel,
        await fetchUserSpecificTableConfigurations(
            templateHelper,
            options,
            aspect,
            allAnswers,
            Object.keys(defaultConfiguration).length > 0 ? defaultConfiguration : {}
        )
    );
}

async function fetchUserSpecificTableConfigurations(
    templateHelper: TemplateHelper,
    options: Schema,
    aspect: Aspect,
    allAnswers: any,
    defaultConfiguration?: ConfigurationDefaultsSchema
): Promise<object> {
    const gatherInitialModelElement = await inquirer.prompt([
        requestSelectedModelElement(ComponentType.TABLE, aspect, requestSelectedModelCondition),
    ]);
    const complexPropertiesAnswers = extractComplexPropertyDetails(templateHelper, gatherInitialModelElement, allAnswers, aspect);
    const propertyElementAnswers = await extractPropertyElements(ComponentType.TABLE, complexPropertiesAnswers);
    const selectedAspectModelJsonPathAnswers = await inquirer.prompt([
        selectedAspectModelJsonPath(aspect, gatherInitialModelElement, allAnswers),
    ]);
    const excludedPropertiesAnswers = await inquirer.prompt([
        excludedProperties(ComponentType.TABLE, allAnswers, templateHelper, gatherInitialModelElement, aspect),
    ]);
    const labelsForExcludedPropsAnswers = await inquirer.prompt([generateLabelsForExcludedProperties(gatherInitialModelElement)]);
    const defaultSortingAnswers = await inquirer.prompt([requestDefaultSorting(aspect, allAnswers, templateHelper)]);
    const customColumnNamesAnswers = await inquirer.prompt([requestCustomColumnNames]);
    const rowCheckBoxesAnswers = await inquirer.prompt([requestRowCheckboxes]);
    const customRowCheckBoxesAnswers = await inquirer.prompt([requestCustomRowActions]);
    const commandbarFunctionalityAnswers = await inquirer.prompt([
        requestAddCommandBar,
        requestCommandBarFunctionality(aspect, allAnswers, templateHelper),
        chooseLanguageForSearch(aspect, allAnswers, templateHelper)
    ]);
    const datePickerTypeAnswers = commandbarFunctionalityAnswers.enabledCommandBarFunctions?.includes('addDateQuickFilters')
        ? await getDatePickerType(templateHelper, allAnswers, gatherInitialModelElement, aspect)
        : {};

    const setCommandBarFilterOrder = await getCommandBarFilterOrder(templateHelper, allAnswers,gatherInitialModelElement,aspect,options,commandbarFunctionalityAnswers.enabledCommandBarFunctions) || {};

    const customBarActionsAnswers = await inquirer.prompt([customCommandBarActions(allAnswers, templateHelper)]);
    const enableRemoteDataHandlingAnswers = await inquirer.prompt([requestEnableRemoteDataHandling, requestCustomService]);
    const aspectModelVersionSupportAnswers = await inquirer.prompt([requestAspectModelVersionSupport]);
    const optionalMaterialThemeAnswers = await inquirer.prompt([requestOptionalMaterialTheme(options)]);
    const customStyleImportsAnswers = await inquirer.prompt([requestCustomStyleImports]);
    const setViewEncapsulationAnswers = await inquirer.prompt([requestSetViewEncapsulation]);
    const overwriteFilesAnswers = await inquirer.prompt([requestOverwriteFiles(options)]);

    return {
        ...gatherInitialModelElement,
        ...propertyElementAnswers,
        ...selectedAspectModelJsonPathAnswers,
        ...excludedPropertiesAnswers,
        ...labelsForExcludedPropsAnswers,
        ...defaultSortingAnswers,
        ...customColumnNamesAnswers,
        ...rowCheckBoxesAnswers,
        ...customRowCheckBoxesAnswers,
        ...commandbarFunctionalityAnswers,
        ...datePickerTypeAnswers,
        ...customBarActionsAnswers,
        ...setCommandBarFilterOrder,
        ...enableRemoteDataHandlingAnswers,
        ...aspectModelVersionSupportAnswers,
        ...optionalMaterialThemeAnswers,
        ...customStyleImportsAnswers,
        ...setViewEncapsulationAnswers,
        ...overwriteFilesAnswers,
        ...defaultConfiguration,
    };
}

function requestSelectedModelCondition(aspect: Aspect, baseModelLoader: BaseModelLoader): boolean {
    return (
        !aspect.isCollectionAspect &&
        baseModelLoader.filterElements((entry: BaseMetaModelElement) => entry instanceof DefaultEntity).length >= 1
    );
}

const requestCustomRowActions = {
    type: 'suggest',
    name: 'customRowActions',
    message: `To add custom action buttons for each table row, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,fa fa-edit):`,
    suggestions: ['edit', 'delete', 'add', 'remove'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
};

const requestRowCheckboxes = {
    type: 'confirm',
    name: 'addRowCheckboxes',
    message: 'Do you want to add multi-selection checkboxes for selecting table rows?',
    default: false,
};

const requestCustomColumnNames = {
    type: 'suggest',
    name: 'customColumns',
    message:
        "To add custom columns to show individual content. Use keys and adapt column naming in the translation files afterwards. Use ','  to enter multiple (e.g. special-chart, slider):",
    suggestions: ['chart', 'slider'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
};
