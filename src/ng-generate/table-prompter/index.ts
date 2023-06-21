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

/* eslint-disable @typescript-eslint/no-var-requires */

import {virtualFs} from '@angular-devkit/core';
import {Rule, SchematicContext} from '@angular-devkit/schematics';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {
    Aspect,
    AspectModelLoader,
    DefaultAspect,
    DefaultEntity,
    DefaultProperty,
    DefaultSingleEntity,
    Entity,
    Property,
} from '@esmf/aspect-model-loader';
import * as fs from 'fs';
import inquirer, {Answers, Question, QuestionAnswer} from 'inquirer';
import {Observable, Subject, Subscriber} from 'rxjs';
import {TemplateHelper} from '../../utils/template-helper';
import {Schema} from '../table/schema';
import * as locale from 'locale-codes';

inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));
inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'));
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

export let WIZARD_CONFIG_FILE = 'wizard.config.json';

const loader = new AspectModelLoader();

let aspect: Aspect;

let fromImport = false;

export default function (options: Schema): Rule {
    const func = (tree: Tree, context: SchematicContext) => {
        return new Observable<Tree>((subscriber: Subscriber<Tree>) => {
            console.log('\x1b[33m%s\x1b[0m', 'Welcome to the TTL schematic UI generator, answer some questions to get you started:');
            const allAnswers: any = {
                aspectModelTFiles: [],
                excludedProperties: [],
                configFile: WIZARD_CONFIG_FILE,
                complexProps: [],
            };

            // use .next(...) on this subject to add questions to prompter dynamically
            const promptSubj = new Subject();
            getTtlPaths(promptSubj, allAnswers, subscriber, tree).subscribe(
                (answer: Answers) => {
                    if (answer.name.includes('anotherFile') && !answer.answer) {
                        // adding files is completed, start questions flow ...
                        loadSourceProcessResult(allAnswers, tree, options, promptSubj);
                    } else if (answer.name === 'aspectModelUrnToLoad') {
                        // add answers to the allAnswers object
                        const itemIndex = allAnswers.aspectModelTFiles.indexOf(answer.answer);
                        if (itemIndex) {
                            // move the selected item to be the first element
                            allAnswers.aspectModelTFiles.splice(itemIndex, 1);
                            allAnswers.aspectModelTFiles.unshift(answer.answer);
                        }
                        waitUntilAspectLoaded(allAnswers, tree).then((aspect: Aspect) => {
                            allAnswers[answer.name] = aspect.aspectModelUrn;
                        });
                    } else if ((answer.name as string).includes('complexPropList')) {
                        // handles complex property decision
                        const newEntry = {
                            prop: answer.name.replace('complexPropList', '').split(',')[0],
                            entityUrn: answer.name.replace('entityUrn', '').split(',')[1],
                            propsToShow: answer.answer.map((answer: any) => {
                                const property = loader.findByUrn(answer);
                                const name = !property ? answer.split('#')[1] : property.name;
                                const aspectModelUrn = !property ? answer : property.aspectModelUrn;
                                return {
                                    name: name,
                                    aspectModelUrn: aspectModelUrn,
                                };
                            }),
                        };
                        allAnswers.complexProps.push(newEntry);
                    } else {
                        if (answer.name === 'selectedModelElementUrn' && answer.answer === '') {
                            answer.answer = new TemplateHelper().resolveType(aspect);
                        }

                        // copy the answer into the answers object
                        allAnswers[answer.name] = answer.answer;
                    }
                },
                (err: Error) => {
                    console.log('Error: ', err);
                },
                () => {
                    cleanUpOptionsObject(allAnswers);
                    Object.assign(options, allAnswers);
                    if (!fromImport) {
                        writeConfigAndExit(subscriber, tree, allAnswers);
                    }
                }
            );
        });
    };

    return func as unknown as Rule;
}

function writeConfigAndExit(subscriber: Subscriber<Tree>, tree: Tree, config: any, fromImport = false) {
    fs.writeFile(WIZARD_CONFIG_FILE, JSON.stringify(config), 'utf8', (err: any) => {
        if (err) {
            console.log('Error during serialization process');
            throw err;
        } else {
            console.log(
                '\x1b[33m%s\x1b[0m',
                fromImport
                    ? `The import was successful, the config used for your generation can be found here: ${WIZARD_CONFIG_FILE}`
                    : `New config file was generated based on your choices, it can be found here: ${WIZARD_CONFIG_FILE}`
            );

            subscriber.next(tree);
            subscriber.complete();
        }
    });
}

function getTtlPaths(promptSubj: Subject<any>, allAnswers: Schema, subscriber: Subscriber<Tree>, tree: Tree): Observable<QuestionAnswer> {
    let index = 1;
    // questions
    const createOrImport = {
        type: 'confirm',
        name: 'createOrImport',
        message: 'Do you want to create a new config (No for loading a pre-existing config file)?',
        default: false,
    };

    const configFileName = {
        type: 'input',
        name: 'nameOfConfigFile',
        message: 'Please enter a name for your config file. It will be automatically appended to (<config-file-name>-wizard.config.json):',
        validate: function (input: string) {
            return input.length === 0 ? 'The config file name cannot be empty. Please provide a valid name.' : true;
        }
    };

    const importConfigFile = {
        type: 'fuzzypath',
        name: 'importConfigFile',
        excludeFilter: (nodePath: any) => !nodePath.endsWith('wizard.config.json'),
        excludePath: (nodePath: any) => nodePath.startsWith('node_modules'),
        itemType: 'file',
        message: 'Choose the path to an existing wizard config file which includes (wizard.config.json). Start writing file name for suggestions:',
        rootPath: './',
        suggestOnly: false,
        depthLimit: 5,
    };

    const pathDecision = {
        type: 'fuzzypath',
        name: 'paths',
        excludeFilter: (nodePath: any) => !nodePath.endsWith('.ttl'),
        excludePath: (nodePath: any) => nodePath.startsWith('node_modules'),
        itemType: 'file',
        message: 'Choose the path to a .ttl file. Start writing file name for suggestions:',
        rootPath: './',
        suggestOnly: false,
        depthLimit: 5,
    };

    const anotherFile = {
        type: 'confirm',
        name: 'anotherFile',
        message: 'Do you want to import another .ttl file?',
        default: false,
    };
    // listener
    const process = inquirer.prompt(promptSubj as any).ui.process;
    process.subscribe(
        (singleAnswer: { name: string; answer: any }) => {
            switch (true) {
                case singleAnswer.name === createOrImport.name: {
                    if (singleAnswer.answer) {
                        promptSubj.next(configFileName);
                    } else {
                        promptSubj.next(importConfigFile);
                    }
                    break;
                }
                case singleAnswer.name === configFileName.name: {
                    if (singleAnswer.answer !== WIZARD_CONFIG_FILE) {
                        WIZARD_CONFIG_FILE = `${singleAnswer.answer}-${WIZARD_CONFIG_FILE}`;
                    }
                    promptSubj.next(pathDecision);
                    break;
                }
                case singleAnswer.name === importConfigFile.name: {
                    const configFileName = singleAnswer.answer;
                    if (!configFileName) {
                        console.log('Error loading config file. Try again with a different file ! ');
                        promptSubj.complete();
                    }
                    try {
                        const data = fs.readFileSync(configFileName, 'utf8');
                        fromImport = true;
                        promptSubj.complete();
                        writeConfigAndExit(subscriber, tree, JSON.parse(data), true);
                    } catch (err) {
                        console.log('Error loading config file. Try again with a different file ! ');
                        promptSubj.complete();
                        console.error(err);
                    }

                    break;
                }
                case singleAnswer.name === anotherFile.name:
                    if (singleAnswer.answer) {
                        pathDecision.name = `${pathDecision.name}${++index}`;
                        promptSubj.next(pathDecision);
                    }
                    break;
                case singleAnswer.name === pathDecision.name: {
                    const ttlFileName = singleAnswer.answer;
                    if (!ttlFileName) {
                        console.log('Error loading ttl. Try again with different file! ');
                        promptSubj.complete();
                    }

                    if (allAnswers.aspectModelTFiles.includes(ttlFileName)) {
                        console.log('File was already added');
                    } else {
                        allAnswers.aspectModelTFiles.push(ttlFileName);
                    }
                    anotherFile.name = `${anotherFile.name}${++index}`;
                    promptSubj.next(anotherFile);
                    break;
                }
            }
        },
        err => {
            console.log('Error: ', err);
        },
        () => {
        }
    );

    promptSubj.next(createOrImport);
    return process as any;
}

/**
 * Removes all temporary entries e.g. paths<xyz> or anotherFile<xyz> from the
 * answers object
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

async function waitUntilAspectLoaded(allAnswers: any, tree: Tree): Promise<Aspect> {
    return await loadAspect(allAnswers, tree).then();
}

function loadAspect(allAnswers: any, tree: Tree): Promise<Aspect> {
    return new Promise((resolve, reject) => {
        if (aspect) {
            resolve(aspect);
            return;
        }
        const ttlContent: Array<string> = [];
        allAnswers.aspectModelTFiles.forEach((ttlFile: any) => {
            if (typeof ttlFile === 'string' && ttlFile.endsWith('.ttl')) {
                const path = `${tree.root.path}${ttlFile.trim()}`;
                const data: any = tree.read(path);
                ttlContent.push(virtualFs.fileBufferToString(data));
            }
        });
        if (ttlContent.length > 1) {
            loader.load(allAnswers.aspectModelUrnToLoad, ...ttlContent).subscribe(
                loadedAspect => {
                    aspect = loadedAspect;
                    resolve(loadedAspect);
                },
                error => reject(error)
            );
        } else {
            loader.loadSelfContainedModel(ttlContent[0]).subscribe(
                loadedAspect => {
                    aspect = loadedAspect;
                    resolve(loadedAspect);
                },
                error => reject(error)
            );
        }
    });
}

/**
 *  Handles loading and processing the source files. Choosing which to turn into components, selecting among complex properties, etc.
 */
function loadSourceProcessResult(allAnswers: any, tree: Tree, options: Schema, promptSubj: Subject<any>): void {
    const requestAspectModelUrnToLoad = {
        type: 'list',
        name: 'aspectModelUrnToLoad',
        message: 'Choose the .ttl file which includes the Aspect to load:',
        when: () => allAnswers.aspectModelTFiles?.length > 1,
        choices: allAnswers.aspectModelTFiles,
        default: '',
    };

    const requestSelectedModelElement = {
        type: 'search-list',
        name: 'selectedModelElementUrn',
        message: 'Choose a specific Entity or Aspect to show as table:',
        choices: () => {
            return new Promise<Array<any>>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        resolve([
                            {name: `${aspect.aspectModelUrn} (Aspect)`, value: `${aspect.aspectModelUrn}`},
                            ...loader
                                .filterElements((entry: DefaultEntity) => entry instanceof DefaultEntity)
                                .map(entry => {
                                    return {name: `${entry.aspectModelUrn} (Entity)`, value: `${entry.aspectModelUrn}`};
                                })
                                .sort(),
                        ]);
                    })
                    .catch(error => reject(error));
            });
        },
        when: () => {
            return new Promise<boolean>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        resolve(
                            !aspect.isCollectionAspect &&
                            loader.filterElements((entry: DefaultEntity) => entry instanceof DefaultEntity).length >= 1
                        );
                    })
                    .catch(error => reject(error));
            });
        },
        size: 5,
        default: '',
    };

    const afterModelElementSelect = {
        type: 'input',
        name: 'afterModelElementSelect',
        message: '',
        when: () => {
            return new Promise<boolean>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        afterElementSelect(aspect, promptSubj, allAnswers, tree, options);
                        // never show this question, just used to execute code after model is selected
                        resolve(false);
                    })
                    .catch(error => reject(error));
            });
        },
    };
    [requestAspectModelUrnToLoad, requestSelectedModelElement, afterModelElementSelect].forEach(boolQ => promptSubj.next(boolQ));
}

function afterElementSelect(aspect: Aspect, promptSubj: Subject<any>, allAnswers: any, tree: Tree, options: Schema) {
    const templateHelper = new TemplateHelper();
    if (!allAnswers.selectedModelElementUrn || allAnswers.selectedModelElementUrn === '') {
        allAnswers.selectedModelElementUrn = templateHelper.resolveType(aspect).aspectModelUrn;
    }
    templateHelper
        .getProperties({
            selectedModelElement: loader.findByUrn(allAnswers.selectedModelElementUrn),
            excludedProperties: [],
        })
        .forEach(prop => {
            if (prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity) {
                const requestSelectedModelElement = {
                    type: 'checkbox',
                    name: `complexPropList${prop.name},entityUrn${(prop.effectiveDataType as DefaultEntity).aspectModelUrn}`,
                    message: `Property ${prop.name} has a complex value(${prop.effectiveDataType.shortUrn}). Choose which object properties to display in the table:`,
                    choices: (prop.effectiveDataType as DefaultEntity).properties.map(innerProp => innerProp.aspectModelUrn),
                    default: [],
                };
                promptSubj.next(requestSelectedModelElement);
            }
        });
    getUserConfigQuestions(allAnswers, tree, options).forEach(boolQ => promptSubj.next(boolQ));
    promptSubj.complete();
}

/**
 * Asks questions to user regarding desired configs when generating the new component.
 */
function getUserConfigQuestions(allAnswers: any, tree: Tree, options: Schema): Question[] {
    const requestJSONPathSelectedModelElement = {
        type: 'list',
        name: 'jsonAccessPath',
        message: `Choose the access path in the JSON payload to show data for ${allAnswers.selectedModelElementUrn}`,
        when: () => {
            return new Promise<boolean>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        const isAspect = loader.findByUrn(allAnswers.selectedModelElementUrn) instanceof DefaultAspect;
                        const elementsPathSegments: Array<Array<string>> = loader.determineAccessPath(
                            loader.findByUrn(allAnswers.selectedModelElementUrn)
                        );
                        if (!aspect.isCollectionAspect && elementsPathSegments.length <= 1) {
                            allAnswers.jsonAccessPath = elementsPathSegments[0].join('.');
                        }
                        resolve(!isAspect && !aspect.isCollectionAspect && elementsPathSegments.length > 1);
                    })
                    .catch(error => reject(error));
            });
        },
        choices: () => {
            return new Promise<Array<string>>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(() => {
                        resolve(
                            loader
                                .determineAccessPath(
                                    (loader.findByUrn(allAnswers.selectedModelElementUrn) as Entity | Aspect).properties[0]
                                )
                                .map((pathSegments: Array<string>) =>
                                    pathSegments.length > 1 ? pathSegments.slice(0, pathSegments.length - 1) : pathSegments
                                )
                                .map((pathSegments: Array<string>) => pathSegments.join('.'))
                                .sort()
                        );
                    })
                    .catch(error => reject(error));
            });
        },
    };

    const requestExcludedProperties = {
        type: 'checkbox',
        name: 'excludedProperties',
        message: `Choose the properties to hide in the table:`,
        when: () => {
            return new Promise<boolean>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        let selectedElement: Aspect | Entity = aspect;
                        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
                            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
                        }
                        resolve(new TemplateHelper().resolveType(selectedElement).properties.length > 1);
                    })
                    .catch(error => reject(error));
            });
        },
        choices: () => {
            return new Promise<Array<any>>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        let selectedElement: Aspect | Entity = aspect;
                        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
                            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
                        }
                        const allProperties: Array<any> = [];
                        new TemplateHelper()
                            .getProperties({
                                selectedModelElement: selectedElement,
                                excludedProperties: [],
                                complexProps: allAnswers.complexProps,
                            })
                            .forEach((property: DefaultProperty) => {
                                if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                                    const complexProperties = new TemplateHelper().getComplexProperties(property, allAnswers);
                                    complexProperties.properties.forEach((complexProp: Property) => {
                                        allProperties.push({
                                            name: `${complexProp.aspectModelUrn}`,
                                            value: {
                                                prop: `${complexProperties.complexProp}`,
                                                propToExcludeAspectModelUrn: `${complexProp.aspectModelUrn}`,
                                            },
                                        });
                                    });
                                } else {
                                    allProperties.push({
                                        name: `${property.aspectModelUrn}`,
                                        value: {
                                            prop: '',
                                            propToExcludeAspectModelUrn: `${property.aspectModelUrn}`,
                                        },
                                    });
                                }
                            });
                        resolve(allProperties);
                    })
                    .catch(error => reject(error));
            });
        },
    };

    const requestGenerateLabelsForExcludedProps = {
        type: 'confirm',
        name: 'getExcludedPropLabels',
        message: 'Do you want to generate translation labels for excluded properties?',
        when: (answers: any) => answers.excludedProperties.length > 0,
        default: false,
    };

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

    const requestDefaultSortingCol = {
        type: 'list',
        name: 'defaultSortingCol',
        message: 'Choose the column on which default sorting is applied:',
        default: false,
        when: () => {
            return new Promise<boolean>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        let selectedElement: Aspect | Entity = aspect;
                        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
                            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
                        }
                        resolve(new TemplateHelper().resolveType(selectedElement).properties.length > 1);
                    })
                    .catch(error => reject(error));
            });
        },
        choices: () => {
            return new Promise<Array<string>>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        let selectedElement: Aspect | Entity = aspect;
                        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
                            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
                        }
                        const columns: string[] = [];
                        new TemplateHelper()
                            .getProperties({
                                selectedModelElement: selectedElement,
                                excludedProperties: [],
                                complexProps: allAnswers.complexProps,
                            })
                            .forEach((property: DefaultProperty) => {
                                if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                                    const complexProperties = new TemplateHelper().getComplexProperties(property, allAnswers);
                                    complexProperties.properties.forEach((complexProp: Property) => {
                                        columns.push(`${complexProperties.complexProp}.${complexProp.name}`);
                                    });
                                } else {
                                    columns.push(`${property.name}`);
                                }
                            });

                        resolve(columns.sort());
                    })
                    .catch(error => reject(error));
            });
        },
    };

    const requestCustomColumnNames = {
        type: 'suggest',
        name: 'customColumns',
        message:
            "To add custom columns to show individual content. Use keys and adapt column naming in the translation files afterwards. Use ','  to enter multiple (e.g. special-chart, slider):",
        suggestions: ['chart', 'slider'],
        filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
    };

    const requestAddCommandBar = {
        type: 'confirm',
        name: 'addCommandBar',
        message: 'Do you want to add a command bar with additional functionality like a search or quick filters?',
        default: false,
    };

    const requestEnableCommandBarFunctions = {
        type: 'checkbox',
        name: 'enabledCommandBarFunctions',
        message: 'Select functionality of the command bar:',
        when: (answers: any) => answers.addCommandBar,
        choices: () => {
            return new Promise<any>((resolve, reject) => {
                loadAspect(allAnswers, tree)
                    .then(aspect => {
                        const templateHelper = new TemplateHelper();
                        let selectedElement: Aspect | Entity = aspect;
                        if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
                            selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
                        }
                        const options = {
                            selectedModelElement: selectedElement,
                            excludedProperties: allAnswers.excludedProperties,
                            complexProps: allAnswers.complexProps,
                        };
                        const choices = [
                            {
                                name: 'Custom action buttons',
                                value: 'addCustomCommandBarActions',
                            },
                        ];
                        if (templateHelper.getStringProperties(options).length > 0) {
                            choices.push({
                                name: 'Search for string properties',
                                value: 'addSearchBar',
                            });
                        }
                        if (templateHelper.getDateProperties(options).length > 0) {
                            choices.push({
                                name: 'Quick filters for properties of type date',
                                value: 'addDateQuickFilters',
                            });
                        }
                        if (templateHelper.getEnumProperties(options).length > 0) {
                            choices.push({
                                name: 'Quick filters for properties of type enumeration',
                                value: 'addEnumQuickFilters',
                            });
                        }
                        resolve(choices);
                    })
                    .catch(error => reject(error));
            });
        },
        default: [],
    };

    const requestChooseLanguageForSearchAction = {
        type: 'list',
        name: 'chooseLanguageForSearch',
        message: 'Which language should be used for the search functionality?',
        when: (answers: any) =>
            answers.addCommandBar && new TemplateHelper().isAddCommandBarFunctionSearch(answers.enabledCommandBarFunctions),
        choices: () => {
            loadAspect(allAnswers, tree).then(aspect => {
                const templateHelper = new TemplateHelper();
                let selectedElement: Aspect | Entity = aspect;
                if (allAnswers.selectedModelElementUrn && allAnswers.selectedModelElementUrn.length > 0) {
                    selectedElement = loader.findByUrn(allAnswers.selectedModelElementUrn) as Aspect | Entity;
                }

                const languageCodes = templateHelper.resolveAllLanguageCodes(selectedElement);
                const choices = [{name: 'English', value: 'en'}];


                languageCodes.forEach(code => {
                    if (code !== 'en') {
                        choices.push({name: locale.getByTag(code).name, value: code});
                    }
                });

                return choices
            })
        },
        default: 'en',
    };

    const requestCustomCommandBarActions = {
        type: 'suggest',
        name: 'customCommandBarActions',
        message: `To add custom action buttons on the command bar, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,fa fa-edit):`,
        when: (answers: any) =>
            answers.addCommandBar && new TemplateHelper().isAddCustomCommandBarActions(answers.enabledCommandBarFunctions),
        suggestions: ['edit', 'delete', 'add', 'remove'],
        filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
    };

    const requestEnableRemoteDataHandling = {
        type: 'confirm',
        name: 'enableRemoteDataHandling',
        message: 'Do you want filtering, sorting and pagination to be done using a remote API?',
        default: false,
    };

    const requestCustomService = {
        type: 'confirm',
        name: 'customRemoteService',
        message: 'Do you want to create a persistent custom service that extends the remote API default service?',
        when: (answers: any) => answers.enableRemoteDataHandling,
        default: false,
    };

    const requestAspectModelVersionSupport = {
        type: 'confirm',
        name: 'enableVersionSupport',
        message: 'Do you want to support different model versions?',
        default: true,
    };

    const requestCustomStyleImports = {
        type: 'input',
        name: 'customStyleImports',
        message: `To import custom styles, enter the path and the name of the style files, e.g. ~mylib/scss/app.scss,assets/styles/app-common.scss.`,
        filter: (input: string) => (input ? Array.from(new Set(input.split(','))) : []),
        default: null,
    };

    const requestOverwriteFiles = {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite older files(same as running command with --overwrite)?',
        when: () => !options.overwrite,
        default: true,
    };

    return [
        requestJSONPathSelectedModelElement,
        requestExcludedProperties,
        requestGenerateLabelsForExcludedProps,
        requestDefaultSortingCol,
        requestCustomColumnNames,
        requestRowCheckboxes,
        requestCustomRowActions,
        requestAddCommandBar,
        requestEnableCommandBarFunctions,
        requestChooseLanguageForSearchAction,
        requestCustomCommandBarActions,
        requestEnableRemoteDataHandling,
        requestCustomService,
        requestAspectModelVersionSupport,
        requestCustomStyleImports,
        requestOverwriteFiles,
    ];
}
