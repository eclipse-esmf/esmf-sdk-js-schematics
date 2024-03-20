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

import {ConfigurationDefaultsSchema, TableDefaultsSchema} from '../../../components/table/schema';
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
export async function typesPrompterQuestions(
    answerConfigurationFileConfig: any,
    answerAspectModel: any,
    combineAnswers: (...answers: any[]) => any,
): Promise<void> {
    const defaultConfiguration: ConfigurationDefaultsSchema = new TableDefaultsSchema();
    const configuration = Object.keys(defaultConfiguration).length > 0 ? defaultConfiguration : {};
    combineAnswers(
        answerConfigurationFileConfig,
        answerAspectModel,
        await fetchTypesConfigurations(Object.keys(defaultConfiguration).length > 0 ? defaultConfiguration : {})
    );
}

async function fetchTypesConfigurations(
    defaultConfiguration?: ConfigurationDefaultsSchema
): Promise<object> {

    return {
        ...defaultConfiguration,
    };
}
