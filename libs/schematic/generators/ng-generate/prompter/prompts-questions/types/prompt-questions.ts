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

import {ConfigurationDefaultsSchema, TableDefaultsSchema} from '../../../components/table/schema';
/**
 * Asynchronously prompts the user with a series of questions related to table configurations,
 * combines these answers with existing configurations, and updates the provided answers.
 *
 * @param {any} answerConfigurationFileConfig - The existing configuration from a configuration file.
 * @param {any} answerAspectModel - The current aspect model's answers.
 * @param {Function} combineAnswers - A function to combine all answers into a single configuration object.
 * @returns {Promise<void>} - A promise that resolves once all configurations are combined and processed.
 */
export async function typesPrompterQuestions(
  answerConfigurationFileConfig: any,
  answerAspectModel: any,
  combineAnswers: (...answers: any[]) => any
): Promise<void> {
  const defaultConfiguration: ConfigurationDefaultsSchema = new TableDefaultsSchema();
  combineAnswers(
    answerConfigurationFileConfig,
    answerAspectModel,
    await fetchTypesConfigurations(Object.keys(defaultConfiguration).length > 0 ? defaultConfiguration : {})
  );
}

async function fetchTypesConfigurations(defaultConfiguration?: ConfigurationDefaultsSchema): Promise<object> {
  return {
    ...defaultConfiguration,
  };
}
