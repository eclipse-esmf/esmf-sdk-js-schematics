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

import {ComponentType, Schema} from '../../../components/shared/schema';
import {TemplateHelper} from '../../../../utils/template-helper';
import {
  excludedProperties,
  requestExcludedConstraints,
  requestOptionalMaterialTheme,
  requestOverwriteFiles,
  requestSelectedModelElement,
} from '../shared/prompt-complex-questions';
import {requestAspectModelVersionSupport, requestSetViewEncapsulation} from '../shared/prompt-simple-questions';
import {Aspect, DefaultCollection, DefaultEntity} from '@esmf/aspect-model-loader';
import {loadInquirer} from '../../../../utils/angular';

export const requestReadOnlyForm = (options: Schema) => ({
  type: 'confirm',
  name: 'readOnlyForm',
  message: 'Do you want to set the form read only?',
  when: () => !options.readOnlyForm,
  default: false,
});

export async function formPrompterQuestions(
  answerConfigurationFileConfig: any,
  answerAspectModel: any,
  templateHelper: TemplateHelper,
  options: Schema,
  aspect: Aspect,
  combineAnswers: (...answers: any[]) => any,
  allAnswers: any
) {
  combineAnswers(
    answerConfigurationFileConfig,
    answerAspectModel,
    await getUserSpecificFormConfigs(templateHelper, options, allAnswers, aspect)
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
async function getUserSpecificFormConfigs(templateHelper: TemplateHelper, options: Schema, allAnswers: any, aspect: Aspect) {
  const inquirer = await loadInquirer();
  const firstBatchAnswers = await inquirer.prompt([requestSelectedModelElement(ComponentType.FORM, aspect, requestSelectedModelCondition)]);

  const secondBatchAnswers = await inquirer.prompt([
    excludedProperties(ComponentType.FORM, allAnswers, templateHelper, firstBatchAnswers, aspect),
  ]);

  const thirdBatchAnswers = await inquirer.prompt([
    requestExcludedConstraints(ComponentType.FORM, allAnswers, templateHelper, {...firstBatchAnswers, ...secondBatchAnswers}, aspect),
    requestAspectModelVersionSupport,
    requestOptionalMaterialTheme(options),
    requestSetViewEncapsulation,
    requestReadOnlyForm(options),
    requestOverwriteFiles(options),
  ]);

  return {...firstBatchAnswers, ...secondBatchAnswers, ...thirdBatchAnswers};
}

function requestSelectedModelCondition(aspect: Aspect, loader: any): boolean {
  return (
    aspect.isCollectionAspect ||
    loader.filterElements((entry: any) => entry instanceof DefaultEntity).length >= 1 ||
    loader.filterElements((entry: any) => entry instanceof DefaultCollection).length >= 1 ||
    aspect.properties.length >= 1
  );
}
