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

import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {Aspect} from '@esmf/aspect-model-loader';
import * as fs from 'fs';
import * as path from 'path';
import {lastValueFrom, Subscriber} from 'rxjs';
import {TemplateHelper} from '../../utils/template-helper';
import {ComponentType, Schema} from '../components/shared/schema';

import {loader, reorderAspectModelUrnToLoad, writeConfigAndExit} from './utils';
import {virtualFs} from '@angular-devkit/core';
import {
  anotherFile,
  configFileName,
  createOrImport,
  importConfigFile,
  requestPath
} from './prompts-questions/shared/prompt-simple-questions';
import {tablePrompterQuestions} from './prompts-questions/table/prompt-questions';
import {pathDecision, requestAspectModelWithAspect} from './prompts-questions/shared/prompt-complex-questions';
import {formPrompterQuestions} from './prompts-questions/form/prompt-questions';
import {cardPrompterQuestions} from './prompts-questions/card/prompt-questions';
import {typesPrompterQuestions} from './prompts-questions/types/prompt-questions';
import {loadInquirer} from '../../utils/angular';
import {LOG_COLOR} from '../../utils/constants';

// Function to dynamically load inquirer-fuzzy-path and register the prompt
async function registerFuzzyPathPrompt(): Promise<any> {
  try {
    const inquirerFuzzyPath = await import('inquirer-fuzzy-path');
    const inquirerPromptSuggest = await import('inquirer-prompt-suggest');
    const inquirerSearchList = await import('inquirer-search-list');
    const inquirer = await loadInquirer();

    (inquirer as any).registerPrompt('fuzzypath', inquirerFuzzyPath);
    (inquirer as any).registerPrompt('suggest', inquirerPromptSuggest);
    (inquirer as any).registerPrompt('search-list', inquirerSearchList);

    return inquirer;
  } catch (err) {
    console.error('Failed to register fuzzy path prompt:', err);
  }
}

export let WIZARD_CONFIG_FILE = 'wizard.config.json';

type ImportConfig = {
  createOrImport: false;
  importConfigFile: string;
};

type CreateConfig = {
  createOrImport: true;
  pathToSource: string;
  configFileName: string;
  configFile: string;
  paths: string;
};

let generationType: ComponentType;

let fromImport = false;
let index = 1;
let allAnswers: any;
let inquirer: any;
export let aspect: Aspect;

/**
 * Returns a Rule for a schematic which prompts the user for input,
 * loads existing configurations, and writes the configuration to a file.
 *
 * @param {Subscriber<Tree>} subscriber - The subscriber to notify about the progress of the generation.
 * @param {Tree} tree - Represents the structure of the resources (files, modules, etc.).
 * @param {Schema} options - The options Schema object for the schematic.
 * @param {string} type - The type of the generated component.
 *
 * @throws {Error} - Will throw an error if an error occurs during execution.
 */
export async function generate(subscriber: Subscriber<Tree>, tree: Tree, options: Schema, type: ComponentType) {
  console.log(LOG_COLOR, 'Welcome to the TTL schematic UI generator, answer some questions to get you started:');

  inquirer = await registerFuzzyPathPrompt();
  generationType = type;
  initAnswers();

  runPrompts(subscriber, tree, new TemplateHelper(), options).finally(() => {
    // "path" is the default options property for schematics to determine where to generate files
    allAnswers.path = allAnswers.pathToSource;

    cleanUpOptionsObject(allAnswers);
    Object.assign(options, allAnswers);

    if (!fromImport) {
      WIZARD_CONFIG_FILE = allAnswers.configFile;
      writeConfigAndExit(subscriber, tree, allAnswers);
    }
  });
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
  //TODO this should be a combination of
  //  answerConfigurationFileConfig props &
  //  answerAspectModelWithMainAspect props &
  //  Generation specific props
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

    if (answerConfigurationFileConfig.createOrImport === true) {
      const answerAspectModelWithMainAspect = await getAspectModelWithMainAspect();
      aspect = await loadAspectModel(tree);

      switch (generationType) {
        case ComponentType.TABLE:
          return tablePrompterQuestions(
            answerConfigurationFileConfig,
            answerAspectModelWithMainAspect,
            templateHelper,
            options,
            aspect,
            combineAnswers,
            allAnswers,
          );
        case ComponentType.FORM:
          return formPrompterQuestions(
            answerConfigurationFileConfig,
            answerAspectModelWithMainAspect,
            templateHelper,
            options,
            aspect,
            combineAnswers,
            allAnswers,
          );
        case ComponentType.CARD:
          return cardPrompterQuestions(
            answerConfigurationFileConfig,
            answerAspectModelWithMainAspect,
            templateHelper,
            options,
            aspect,
            combineAnswers,
            allAnswers,
          );
        case ComponentType.TYPES:
          return typesPrompterQuestions(answerConfigurationFileConfig, answerAspectModelWithMainAspect, combineAnswers);
        default:
          throw new Error('Invalid component type');
      }
    }
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
  const answerGeneralConfig: ImportConfig | CreateConfig = await inquirer.prompt([
    createOrImport,
    requestPath,
    configFileName,
    importConfigFile,
    pathDecision(WIZARD_CONFIG_FILE),
  ]);

  if (answerGeneralConfig.createOrImport === false) {
    importFileConfig(answerGeneralConfig.importConfigFile, subscriber, tree);
  } else {
    addFileToConfig(answerGeneralConfig.paths, allAnswers); // allAnswers['aspectModelTFiles'] is mutated by the method
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
async function importFileConfig(configFilePath: string, subscriber: Subscriber<Tree>, tree: Tree) {
  if (!configFilePath) {
    console.log('Error loading config file. Try again with a different file!');
    throw new Error('EndPrompting');
  }

  try {
    const data = fs.readFileSync(configFilePath, 'utf8');

    WIZARD_CONFIG_FILE = path.basename(configFilePath);
    fromImport = true;

    await writeConfigAndExit(subscriber, tree, JSON.parse(data), true);
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
    await inquirer.prompt([pathDecision(WIZARD_CONFIG_FILE, true)]).then((answer: any) => {
      if (answer.paths) addFileToConfig(answer.paths, allAnswers);
    });

    // Recursive call to ask another file
    await askAnotherFile();
  }
}

/**
 * Asynchronously prompts the user for input and retrieves an aspect model along with its main aspect.
 *
 * @returns {Promise<{aspectModelUrnToLoad?: string}>} A promise that resolves with the user's input a list of required Aspect Models.
 *
 */
async function getAspectModelWithMainAspect(): Promise<{aspectModelUrnToLoad?: string}> {
  const answer: {aspectModelUrnToLoad?: string} = await inquirer.prompt([requestAspectModelWithAspect(allAnswers)]);

  if (answer.aspectModelUrnToLoad) {
    allAnswers.aspectModelTFiles = reorderAspectModelUrnToLoad(allAnswers.aspectModelTFiles, answer.aspectModelUrnToLoad);
  }

  return answer;
}

/**
 * Loads the aspect model.
 *
 * @param {Tree} tree - The tree of files.
 *
 * @returns {Promise<Aspect>} Returns a Promise that resolves to an Aspect.
 * If aspect model has already been loaded, it is returned as is.
 * If not, it tries to load it from TTL files, taking into account the possibility of having multiple TTL files.
 * It throws an error if loading fails.
 *
 * @throws Will throw an error if loading the aspect model fails.
 */
async function loadAspectModel(tree: Tree): Promise<Aspect> {
  if (aspect) return aspect;

  try {
    const ttlFileContents: string[] = allAnswers.aspectModelTFiles
      .filter((ttlFile: string) => ttlFile.endsWith('.ttl'))
      .map((ttlFile: string) => {
        const filePath = `${tree.root.path}${ttlFile.trim()}`;
        const fileData: any = tree.read(filePath);
        return virtualFs.fileBufferToString(fileData);
      });

    if (ttlFileContents.length > 1) {
      return await lastValueFrom(loader.load('', ...ttlFileContents));
    }

    return await lastValueFrom(loader.loadSelfContainedModel(ttlFileContents[0]));
  } catch (error) {
    console.error(error);
    throw error;
  }
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
      objectKey.startsWith('importConfigFile') ||
      objectKey.startsWith('pathToSource')
    ) {
      delete allAnswers[objectKey];
    }
  });
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
  });
}
