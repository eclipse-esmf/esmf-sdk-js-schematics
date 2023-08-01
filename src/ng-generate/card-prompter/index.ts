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

import {Rule, SchematicContext} from '@angular-devkit/schematics';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {DefaultSingleEntity,} from '@esmf/aspect-model-loader';
import * as fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import {Observable, Subscriber} from 'rxjs';
import {TemplateHelper} from '../../utils/template-helper';
import {Schema} from '../table/schema';
import {
    pathDecision,
    requestAspectModelUrnToLoad,
    requestChooseLanguageForSearchAction,
    requestCustomCommandBarActions, requestCustomRowActions,
    requestDefaultSortingCol,
    requestEnableCommandBarFunctions,
    requestExcludedProperties,
    requestGenerateLabelsForExcludedProps,
    requestJSONPathSelectedModelElement,
    requestOptionalMaterialTheme,
    requestOverwriteFiles, requestRowCheckboxes,
    requestSelectedModelElement,
    requestSelectedPropertyElement,
} from "./prompts-with-function";

import {aspect, loadAspectModel, loader, writeConfigAndExit} from "./utils";
import {
    anotherFile,
    configFileName,
    createOrImport,
    importConfigFile,
    requestAddCommandBar,
    requestAspectModelVersionSupport,
    requestCustomColumnNames,
    requestCustomService,
    requestCustomStyleImports,
    requestEnableRemoteDataHandling,
    requestSetViewEncapsulation
} from "./prompts-without-function";

// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));
// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'));
// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

export let WIZARD_CONFIG_FILE = 'wizard.config.json';

const type = 'card';

let fromImport = false;
let index = 1;
let allAnswers: any;

/**
 * Returns a Rule for a schematic which prompts the user for input,
 * loads existing configurations, and writes the configuration to a file.
 *
 * @param {Schema} options - The options Schema object for the schematic.
 *
 * @returns {Rule} - Returns a Rule that creates an Observable
 * that executes the prompting and writing of configurations.
 *
 * @throws {Error} - Will throw an error if an error occurs during execution.
 */
export default function (options: Schema): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return new Observable<Tree>((subscriber: Subscriber<Tree>) => {
            console.log('\x1b[33m%s\x1b[0m', 'Welcome to the TTL schematic UI generator, answer some questions to get you started:');

            initAnswers();

            runPrompts(subscriber, tree, new TemplateHelper(), options)
                .finally(() => {
                    cleanUpOptionsObject(allAnswers);
                    Object.assign(options, allAnswers);

                    if (!fromImport) {
                        WIZARD_CONFIG_FILE = allAnswers.configFile;
                        writeConfigAndExit(subscriber, tree, allAnswers);
                    }
                });
        });
    };
}

/**
 * Initializes the `allAnswers` object with default values.
 *
 * This function is used at the start of the program to ensure that
 * `allAnswers` is defined and has a consistent shape. The properties
 * of this object will be populated with user input as the program progresses.
 *
 */
function initAnswers() {
    allAnswers = {
        aspectModelTFiles: [],
        excludedProperties: [],
        configFile: WIZARD_CONFIG_FILE,
        complexProps: [],
    };
}

/**
 * Executes series of prompts, gathers user input and combines it into a single answers object.
 *
 * @param {Subscriber<Tree>} subscriber - Subscriber from the parent Observable, used for handling errors.
 * @param {Tree} tree - The Tree object that represents the file system tree.
 * @param {TemplateHelper} templateHelper - A helper object used to manage templates.
 * @param {Schema} options - The options provided to the schematic.
 *
 * @returns {Promise<void>} A Promise that resolves when all the prompts are done and the answers are combined.
 *
 * @throws Will throw an error if an operation fails.
 */
async function runPrompts(subscriber: Subscriber<Tree>, tree: Tree, templateHelper: TemplateHelper, options: Schema) {
    try {
        const answerConfigurationFileConfig = await getConfigurationFileConfig(subscriber, tree);
        const answerAspectModel = await getAspectModel(tree);
        const answerSelectedModelElement = await getSelectedModelElement();
        const answerPropertyElement = await getPropertyElement(templateHelper);
        const answerUserSpecificConfig = await getUserSpecificConfigs(tree, templateHelper, options);

        combineAnswers(answerConfigurationFileConfig, answerAspectModel, answerSelectedModelElement, answerPropertyElement, answerUserSpecificConfig);
    } catch (error) {
        console.error('An error occurred:', error);
        subscriber.error(error);
    }
}

/**
 * Prompts the user with questions related to the configuration file and handles
 * the user's responses.
 *
 * If the user chooses to import a configuration file, this function will handle
 * the importing of the configuration file and then subscribe to the tree.
 *
 * If the user chooses to provide file paths, this function will add the files
 * to the configuration and ask the user if they want to add more files.
 *
 * @param {Subscriber<Tree>} subscriber - The subscriber to the tree.
 * @param {Tree} tree - The tree that is being observed.
 * @returns {Promise<Object>} A promise that resolves to the answers from the user.
 */
async function getConfigurationFileConfig(subscriber: Subscriber<Tree>, tree: Tree) {
    const answerGeneralConfig = await inquirer.prompt([createOrImport, configFileName, importConfigFile, pathDecision(WIZARD_CONFIG_FILE)]);
    if (answerGeneralConfig.importConfigFile) importFileConfig(answerGeneralConfig.importConfigFile, subscriber, tree);
    if (answerGeneralConfig.paths) {
        addFileToConfig(answerGeneralConfig.paths, allAnswers);
        await askAnotherFile();
    }
    return answerGeneralConfig;
}

/**
 * This function adds a TTL file to a list of TTL files within the user's answers.
 *
 * @param {string} aspectModel - The name of the TTL file to be added to the configuration.
 * @param {object} allAnswers - An object containing all the answers given by the user so far in the inquirer prompts. This object includes the list of TTL files to which we want to add.
 *
 * @throws {Error} Throws an error if the provided TTL file name is not a string or if it is already included in the list of TTL files.
 */
function addFileToConfig(aspectModel: string, allAnswers: any) {
    if (!aspectModel) {
        console.log('Error loading ttl. Try again with different file!');
        throw new Error('Error loading ttl. Try again with different file!');
    }

    if (allAnswers.aspectModelTFiles.includes(aspectModel)) {
        console.log('File was already added');
    } else {
        allAnswers.aspectModelTFiles.push(aspectModel);
    }

    anotherFile.name = `anotherFile${++index}`;
}

/**
 * Imports configuration from a file, reads the data and uses it to configure the application.
 *
 * @param {string} configFilePath - The path to the configuration file to be imported.
 * @param {Subscriber<Tree>} subscriber - The subscriber to the observable in the main function.
 * @param {Tree} tree - The tree representation of the project structure.
 *
 * @throws {Error} If an error occurs while loading the config file, an error will be thrown.
 */
function importFileConfig(configFilePath: string, subscriber: Subscriber<Tree>, tree: Tree) {
    if (!configFilePath) {
        console.log('Error loading config file. Try again with a different file ! ');
        throw new Error('EndPrompting');
    }

    try {
        const data = fs.readFileSync(configFilePath, 'utf8');
        WIZARD_CONFIG_FILE = path.basename(configFilePath);
        fromImport = true;
        writeConfigAndExit(subscriber, tree, JSON.parse(data), true);
    } catch (err) {
        console.log('Error loading config file. Try again with a different file!');
        throw new Error('Error loading config file. Try again with a different file!');
    }
}

/**
 * Asks the user if they want to add another file, and if so, it prompts for the file path.
 * This function will recursively call itself as long as the user wants to add more files.
 *
 * @returns {Promise<void>} A Promise that resolves when the user does not want to add another file.
 * @throws {Error} If there is an issue with the Inquirer prompts or accessing the file paths.
 */
async function askAnotherFile() {
    const anotherFileAnswer = await inquirer.prompt([anotherFile]);

    if (anotherFileAnswer[`anotherFile${index}`]) {
        await inquirer.prompt([pathDecision(WIZARD_CONFIG_FILE, true)])
            .then(answer => {
                if (answer.paths) addFileToConfig(answer.paths, allAnswers);
            });

        // Recursive call to ask another file
        await askAnotherFile();
    }
}

/**
 * Prompts the user for the Aspect Model URN and then loads the Aspect Model.
 *
 * @param {Tree} tree - The worktree of files in the current project.
 * @returns {Promise<any>} - A Promise that resolves with the user's answer to the Aspect Model URN prompt.
 */
async function getAspectModel(tree: Tree): Promise<any> {
    const answerAspectModel = await inquirer.prompt([requestAspectModelUrnToLoad(allAnswers)]);
    await loadAspectModel(allAnswers, tree);
    return answerAspectModel;
}

/**
 * This function retrieves the selected model element by prompting the user
 * to choose from a list of available options.
 *
 * @returns {Promise} The selected model element.
 */
async function getSelectedModelElement() {
    return await inquirer.prompt([requestSelectedModelElement(type, aspect)]);
}

/**
 * This function retrieves a property element based on a model element selection.
 * If a complex property is detected, it prompts the user to select from the complex properties
 * associated with the selected model element.
 *
 * @param {TemplateHelper} templateHelper - The helper class to provide methods related to the template.
 *
 * @returns {Promise<Object>} An empty object after all prompts have been completed.
 */
async function getPropertyElement(templateHelper: TemplateHelper) {
    if (!allAnswers.selectedModelElementUrn || allAnswers.selectedModelElementUrn === '') {
        allAnswers.selectedModelElementUrn = templateHelper.resolveType(aspect).aspectModelUrn;
    }
    for (const property of templateHelper.getProperties({
        selectedModelElement: loader.findByUrn(allAnswers.selectedModelElementUrn),
        excludedProperties: []
    })) {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            await inquirer.prompt([requestSelectedPropertyElement(type, property)]);
        }
    }

    return {};
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
async function getUserSpecificConfigs(tree: Tree, templateHelper: TemplateHelper, options: Schema) {
    const firstBatchAnswers = await inquirer.prompt([
        requestJSONPathSelectedModelElement(aspect, allAnswers, tree),
        requestExcludedProperties(type, aspect, allAnswers, templateHelper),
    ]);

    const secondBatchAnswers = await inquirer.prompt([
        requestGenerateLabelsForExcludedProps(firstBatchAnswers),
        requestDefaultSortingCol(aspect, allAnswers, templateHelper),
        requestCustomColumnNames,
        requestRowCheckboxes(type),
        requestCustomRowActions(type),
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

    return {...firstBatchAnswers, ...secondBatchAnswers};
}

/**
 * This function combines the answers from different inquirer.prompt() calls
 * into a single `allAnswers` object.
 *
 * @param {...any[]} answers - An array of answer objects, each being the result of an inquirer.prompt() call.
 */
function combineAnswers(...answers: any[]) {
    const assign = Object.assign({}, ...answers);
    Object.keys(assign).forEach(key => {
        allAnswers[key] = assign[key];
    })
}


/**
 * Removes all temporary entries e.g. paths<xyz> or anotherFile<xyz> from the answers object
 *
 * @param allAnswers - An answer objects, being the result of all inquirer.prompt() calls.
 */
function cleanUpOptionsObject(allAnswers: any) {
    Object.keys(allAnswers).forEach((objectKey: any) => {
        if (
            objectKey.startsWith('paths') ||
            objectKey.startsWith('anotherFile') ||
            objectKey.startsWith('createOrImport') ||
            objectKey.startsWith('importConfigFile')
        ) {
            delete allAnswers[objectKey];
        }
    });
}
