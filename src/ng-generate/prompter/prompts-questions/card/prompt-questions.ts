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
import {ComponentType, Schema} from '../../../components/shared/schema';
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
import {
    requestAddCommandBar,
    requestAspectModelVersionSupport,
    requestCustomService,
    requestCustomStyleImports,
    requestEnableRemoteDataHandling,
    requestSetViewEncapsulation,
} from '../shared/prompt-simple-questions';
import {Aspect, DefaultEntity} from '@esmf/aspect-model-loader';

export async function cardPrompterQuestions(
    answerConfigurationFileConfig: any,
    answerAspectModel: any,
    templateHelper: TemplateHelper,
    options: Schema,
    aspect: Aspect,
    combineAnswers: Function,
    allAnswers: any
) {
    combineAnswers(
        answerConfigurationFileConfig,
        answerAspectModel,
        await getUserSpecificCardConfigs(templateHelper, options, aspect, allAnswers)
    );
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
async function getUserSpecificCardConfigs(templateHelper: TemplateHelper, options: Schema, aspect: Aspect, allAnswers: any) {
    const firstBatchAnswers = await inquirer.prompt([
        requestSelectedModelElement(ComponentType.CARD, aspect, requestSelectedModelCondition),
    ]);

    const secondBatchAnswers = await getComplexPropertyElements(templateHelper, firstBatchAnswers, ComponentType.CARD, allAnswers, aspect);

    const thirdBatchAnswers = await inquirer.prompt([
        requestJSONPathSelectedModelElement(aspect, firstBatchAnswers, allAnswers),
        requestExcludedProperties(ComponentType.CARD, allAnswers, templateHelper, firstBatchAnswers, aspect),
    ]);

    const fourthBatchAnswers = await inquirer.prompt([
        requestGenerateLabelsForExcludedProps(firstBatchAnswers),
        requestDefaultSortingCol(aspect, allAnswers, templateHelper),
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

    return {...firstBatchAnswers, ...secondBatchAnswers, ...thirdBatchAnswers, ...fourthBatchAnswers};
}

function requestSelectedModelCondition(aspect: Aspect, loader: any): boolean {
    return !aspect.isCollectionAspect && loader.filterElements((entry: any) => entry instanceof DefaultEntity).length >= 1;
}
