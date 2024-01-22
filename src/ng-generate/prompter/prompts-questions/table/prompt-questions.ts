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
    getComplexPropertyElements,
    requestChooseLanguageForSearchAction,
    requestCustomCommandBarActions,
    requestDefaultSortingCol,
    requestEnableCommandBarFunctions,
    requestExcludedProperties,
    requestGenerateLabelsForExcludedProps,
    requestJSONPathSelectedModelElement,
    requestOptionalMaterialTheme,
    requestOverwriteFiles,
    requestSelectedModelElement,
} from '../shared/prompt-complex-questions';
import {ComponentType, Schema} from '../../../components/shared/schema';
import {Aspect, DefaultEntity} from '@esmf/aspect-model-loader';
import {
    requestAddCommandBar,
    requestAspectModelVersionSupport,
    requestCustomService,
    requestCustomStyleImports,
    requestEnableRemoteDataHandling,
    requestSetViewEncapsulation,
} from '../shared/prompt-simple-questions';
import {ITableDefaultsSchema, TableDefaultsSchema} from '../../../components/table/schema';

export async function tablePrompterQuestions(
    answerConfigurationFileConfig: any,
    answerAspectModel: any,
    templateHelper: TemplateHelper,
    options: Schema,
    aspect: Aspect,
    combineAnswers: (...answers: any[]) => any,
    allAnswers: any
) {
    // check if TableDefaultsSchema interface has values
    const defaults: ITableDefaultsSchema = new TableDefaultsSchema();

    if (Object.keys(defaults).length > 0) {
        combineAnswers(
            answerConfigurationFileConfig,
            answerAspectModel,
            await getUserSpecificTableConfigs(templateHelper, options, aspect, allAnswers, defaults)
        );
    } else {
        combineAnswers(
            answerConfigurationFileConfig,
            answerAspectModel,
            await getUserSpecificTableConfigs(templateHelper, options, aspect, allAnswers)
        );
    }
}

/**
 * This function fetches user specific configurations by prompting a set of questions.
 * The answers are grouped into two batches based on their dependency.
 *
 * @param {Tree} tree - Represents the file tree.
 * @param {TemplateHelper} templateHelper - An instance of the TemplateHelper to aid in handling templates.
 * @param {Schema} options - User defined options provided when running the script.
 * @returns {Promise<Object>} An object containing the user responses.
 */
async function getUserSpecificTableConfigs(
    templateHelper: TemplateHelper,
    options: Schema,
    aspect: Aspect,
    allAnswers: any,
    defaults?: any
) {
    const firstBatchAnswers = await inquirer.prompt([
        requestSelectedModelElement(ComponentType.TABLE, aspect, requestSelectedModelCondition),
    ]);

    const secondBatchAnswers = await getComplexPropertyElements(templateHelper, firstBatchAnswers, ComponentType.TABLE, allAnswers, aspect);

    const thirdBatchAnswers = await inquirer.prompt([
        requestJSONPathSelectedModelElement(aspect, firstBatchAnswers, allAnswers),
        requestExcludedProperties(ComponentType.TABLE, allAnswers, templateHelper, firstBatchAnswers, aspect),
    ]);

    const fourthBatchAnswers = await inquirer.prompt([
        requestGenerateLabelsForExcludedProps(firstBatchAnswers),
        requestDefaultSortingCol(aspect, allAnswers, templateHelper),
        requestCustomColumnNames,
        requestRowCheckboxes,
        requestCustomRowActions,
        requestAddCommandBar,
        requestEnableCommandBarFunctions(aspect, allAnswers, templateHelper),
        requestChooseLanguageForSearchAction(aspect, allAnswers, templateHelper),
        requestCustomCommandBarActions(allAnswers, templateHelper),
        requestEnableRemoteDataHandling,
        requestCustomService,
        requestAspectModelVersionSupport,
        requestOptionalMaterialTheme(options),
        requestCustomStyleImports,
        requestSetViewEncapsulation,
        requestOverwriteFiles(options),
    ]);

    return defaults
        ? {...firstBatchAnswers, ...secondBatchAnswers, ...thirdBatchAnswers, ...fourthBatchAnswers, ...defaults}
        : {...firstBatchAnswers, ...secondBatchAnswers, ...thirdBatchAnswers, ...fourthBatchAnswers};
}

export const requestCustomRowActions = {
    type: 'suggest',
    name: 'customRowActions',
    message: `To add custom action buttons for each table row, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,fa fa-edit):`,
    suggestions: ['edit', 'delete', 'add', 'remove'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
};

export const requestRowCheckboxes = {
    type: 'confirm',
    name: 'addRowCheckboxes',
    message: 'Do you want to add multi-selection checkboxes for selecting table rows?',
    default: false,
};

export const requestCustomColumnNames = {
    type: 'suggest',
    name: 'customColumns',
    message:
        "To add custom columns to show individual content. Use keys and adapt column naming in the translation files afterwards. Use ','  to enter multiple (e.g. special-chart, slider):",
    suggestions: ['chart', 'slider'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
};

function requestSelectedModelCondition(aspect: Aspect, loader: any): boolean {
    return !aspect.isCollectionAspect && loader.filterElements((entry: any) => entry instanceof DefaultEntity).length >= 1;
}
