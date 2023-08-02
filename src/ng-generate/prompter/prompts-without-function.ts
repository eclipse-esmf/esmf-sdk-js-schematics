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

import {Question} from "inquirer";
import {ViewEncapsulation} from "@schematics/angular/component/schema";

interface FuzzyPathQuestion extends Question {
    excludeFilter?: (nodePath: string) => boolean;
    excludePath?: (nodePath: string) => boolean;
    itemType?: 'file' | 'directory' | 'any';
    rootPath?: string;
    suggestOnly?: boolean;
    depthLimit?: number;
}

export const createOrImport = {
    type: 'confirm',
    name: 'createOrImport',
    message: 'Do you want to create a new config (No for loading a pre-existing config file)?',
    default: false,
}

export const configFileName: Question = {
    type: 'input',
    name: 'configFileName',
    message: 'Please enter a name for your config file. It will be automatically appended to (<config-file-name>-wizard.config.json):',
    validate: (input: string) => (input.length === 0 ? 'The config file name cannot be empty. Please provide a valid name.' : true),
    when: answer => answer.createOrImport
};

export const importConfigFile: FuzzyPathQuestion = {
    type: 'fuzzypath',
    name: 'importConfigFile',
    excludeFilter: (nodePath: string) => !nodePath.endsWith('wizard.config.json'),
    excludePath: (nodePath: string) => nodePath.startsWith('node_modules'),
    itemType: 'file',
    message: 'Choose the path to an existing wizard config file which ends with "wizard.config.json". Start writing file name for suggestions:',
    rootPath: './',
    suggestOnly: false,
    depthLimit: 5,
    when: answer => !answer.createOrImport
};

export const anotherFile: Question = {
    type: 'confirm',
    name: 'anotherFile',
    message: 'Do you want to import another .ttl file?',
    default: false,
};

export const requestCustomColumnNames = {
    type: 'suggest',
    name: 'customColumns',
    message: "To add custom columns to show individual content. Use keys and adapt column naming in the translation files afterwards. Use ','  to enter multiple (e.g. special-chart, slider):",
    suggestions: ['chart', 'slider'],
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
};

export const requestAddCommandBar = {
    type: 'confirm',
    name: 'addCommandBar',
    message: 'Do you want to add a command bar with additional functionality like a search or quick filters?',
    default: false,
};

export const requestEnableRemoteDataHandling = {
    type: 'confirm',
    name: 'enableRemoteDataHandling',
    message: 'Do you want filtering, sorting and pagination to be done using a remote API?',
    default: false,
};

export const requestCustomService = {
    type: 'confirm',
    name: 'customRemoteService',
    message: 'Do you want to create a persistent custom service that extends the remote API default service?',
    when: (answers: any) => answers.enableRemoteDataHandling,
    default: false,
};

export const requestAspectModelVersionSupport = {
    type: 'confirm',
    name: 'enableVersionSupport',
    message: 'Do you want to support different model versions?',
    default: true,
};

export const requestCustomStyleImports = {
    type: 'input',
    name: 'customStyleImports',
    message: `To import custom styles, enter the path and the name of the style files, e.g. ~mylib/scss/app.scss,assets/styles/app-common.scss.`,
    filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
    default: null,
};

export const requestSetViewEncapsulation = {
    type: 'list',
    name: 'viewEncapsulation',
    message: 'Do you want to specify view encapsulation strategy?',
    choices: [ViewEncapsulation.None, ViewEncapsulation.Emulated, ViewEncapsulation.ShadowDom],
    default: ViewEncapsulation.None,
};
