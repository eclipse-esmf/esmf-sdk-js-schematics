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

import {Aspect, BaseMetaModelElement, DefaultEntity} from '@esmf/aspect-model-loader';
import {BaseModelLoader} from '@esmf/aspect-model-loader/dist/base-model-loader';
import {loadInquirer} from '../../../../utils/angular';
import {TemplateHelper} from '../../../../utils/template-helper';
import {CardDefaultsSchema} from '../../../components/card/schema';
import {ComponentType, Schema} from '../../../components/shared/schema';
import {ConfigurationDefaultsSchema} from '../../../components/table/schema';
import {
  chooseLanguageForSearch,
  customCommandBarActions,
  excludedProperties,
  extractComplexPropertyDetails,
  extractPropertyElements,
  generateLabelsForExcludedProperties,
  getCommandBarFilterOrder,
  getDatePickerType,
  requestCommandBarFunctionality,
  requestDefaultSorting,
  requestOptionalMaterialTheme,
  requestOverwriteFiles,
  requestSelectedModelElement,
  selectedAspectModelJsonPath
} from '../shared/prompt-complex-questions';
import {
  requestAddCommandBar,
  requestAspectModelVersionSupport,
  requestCustomService,
  requestCustomStyleImports,
  requestEnableRemoteDataHandling,
  requestSetViewEncapsulation
} from '../shared/prompt-simple-questions';

/**
 * Asynchronously prompts the user with a series of questions related to card configurations,
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
export async function cardPrompterQuestions(
  answerConfigurationFileConfig: any,
  answerAspectModel: any,
  templateHelper: TemplateHelper,
  options: Schema,
  aspect: Aspect,
  combineAnswers: (...answers: any[]) => any,
  allAnswers: any,
): Promise<void> {
  const defaultConfiguration: ConfigurationDefaultsSchema = new CardDefaultsSchema();

  combineAnswers(
    answerConfigurationFileConfig,
    answerAspectModel,
    await fetchUserSpecificCardConfigurations(
      templateHelper,
      options,
      aspect,
      allAnswers,
      Object.keys(defaultConfiguration).length > 0 ? defaultConfiguration : {},
    ),
  );
}

async function fetchUserSpecificCardConfigurations(
  templateHelper: TemplateHelper,
  options: Schema,
  aspect: Aspect,
  allAnswers: any,
  defaultConfiguration?: ConfigurationDefaultsSchema,
): Promise<object> {
  const inquirer = await loadInquirer();
  const gatherInitialModelElement = await inquirer.prompt([
    requestSelectedModelElement(ComponentType.CARD, aspect, requestSelectedModelCondition),
  ]);
  const complexPropertiesAnswers = extractComplexPropertyDetails(templateHelper, gatherInitialModelElement, allAnswers, aspect);
  const propertyElementAnswers = await extractPropertyElements(ComponentType.CARD, complexPropertiesAnswers);
  const selectedAspectModelJsonPathAnswers = await inquirer.prompt([
    selectedAspectModelJsonPath(aspect, gatherInitialModelElement, allAnswers),
  ]);
  const excludedPropertiesAnswers = await inquirer.prompt([
    excludedProperties(ComponentType.CARD, allAnswers, templateHelper, gatherInitialModelElement, aspect),
  ]);
  const labelsForExcludedPropsAnswers = await inquirer.prompt([generateLabelsForExcludedProperties(gatherInitialModelElement)]);
  const defaultSortingAnswers = await inquirer.prompt([requestDefaultSorting(aspect, allAnswers, templateHelper)]);
  const commandbarFunctionalityAnswers = await inquirer.prompt([
    requestAddCommandBar,
    requestCommandBarFunctionality(aspect, allAnswers, templateHelper),
    chooseLanguageForSearch(aspect, allAnswers, templateHelper),
  ]);
  const datePickerTypeAnswers = commandbarFunctionalityAnswers.enabledCommandBarFunctions.includes('addDateQuickFilters')
    ? await getDatePickerType(templateHelper, allAnswers, gatherInitialModelElement, aspect)
    : {};
  const customBarActionsAnswers = await inquirer.prompt([customCommandBarActions(allAnswers, templateHelper)]);

  const setCommandBarFilterOrder = await getCommandBarFilterOrder(
    templateHelper,
    allAnswers,
    gatherInitialModelElement,
    aspect,
    options,
    commandbarFunctionalityAnswers.enabledCommandBarFunctions,
  );

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
