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

import {dasherize} from '@angular-devkit/core/src/utils/strings';
import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask, RunSchematicTask} from '@angular-devkit/schematics/tasks';
import {JSONFile} from '@schematics/angular/utility/json-file';
import {
    addToAppModule,
    addToAppSharedModule,
    addToComponentModule,
    wrapBuildComponentExecution
} from '../../../utils/angular';
import {generateTranslationFiles, loadAspectModel, loadRDF, validateUrns} from '../../../utils/aspect-model';
import {formatGeneratedFiles, loadAndApplyConfigFile} from '../../../utils/file';
import {
    addPackageJsonDependencies,
    DATE_QUICK_FILTER_DEPENDENCIES,
    DEFAULT_DEPENDENCIES,
    REMOTE_HANDLING_DEPENDENCIES
} from '../../../utils/package-json';
import {TemplateHelper} from '../../../utils/template-helper';
import {ComponentType, Schema, Values} from './schema';
import ora from 'ora';
import {
    generateCustomService,
    generateFilterService,
    generateGeneralService,
    generateGeneralStyle,
    generateHorizontalOverflowDirective,
    generateSharedModule,
    generateShowDescriptionPipe,
    generateTranslationModule,
    generateValidateInputDirective
} from './generators';
import {APP_SHARED_MODULES, cardModules, formModules, tableModules, updateSharedModule} from '../../../utils/modules';
import {WIZARD_CONFIG_FILE} from '../../prompter/index';

export let options: Schema;

/**
 * Generates a component using provided schema options.
 *
 * The function conditionally loads a configuration file if provided,
 * creates several tasks related to the component generation process,
 * and adds a package installation task if `skipInstall` is not set.
 *
 * @param {SchematicContext} context - Context of the schematics project.
 * @param {Schema} schema - Schema options for component generation.
 * @param {ComponentType} componentType - Component type to generate.
 * Can include a config file path, and a flag to skip package installation.
 *
 * @returns Rule - A rule function that manipulates the original tree.
 * In this case, it performs the component generation and related tasks.
 */
export function generateComponent(context: SchematicContext, schema: Schema, componentType: ComponentType) {
    options = schema;

    let prompterTaskId = null;
    if (options.configFile === undefined || options.configFile === '') {
        options.configFile = WIZARD_CONFIG_FILE;

        prompterTaskId = context.addTask(new RunSchematicTask(`${componentType}-prompter`, options));
    }

    const generateTypesTaskId = context.addTask(new RunSchematicTask('types', options), prompterTaskId ? [prompterTaskId] : []);

    if (componentType !== ComponentType.TYPES) {
        const componentGenId = context.addTask(new RunSchematicTask(`${componentType}-generation`, options), [generateTypesTaskId]);

        if (!options.skipInstall) {
            context.addTask(new NodePackageInstallTask(), [componentGenId]);
        }
    }
}

/**
 * Prepares the options for the schema, applying defaults where necessary,
 * and loading and applying the configuration file.
 * @param {Schema} schema - The options to prepare.
 * @param {ComponentType} componentType - Component type to generate.
 *
 * @returns {Schema} - The prepared options.
 */
export function prepareOptions(schema: Schema, componentType: ComponentType): Schema {
    options = schema;
    options.componentType = componentType;

    options.spinner = ora().start();
    options.templateHelper = new TemplateHelper();

    const defaultOptions = {
        skipImport: false,
    };

    if (options.configFile === 'wizard.config.json') {
        options.configFile = WIZARD_CONFIG_FILE;
    }

    options = {
        ...defaultOptions,
        ...options,
    };

    loadAndApplyConfigFile(options.configFile, options);

    if (options.aspectModelTFilesString) {
        options.aspectModelTFiles = options.aspectModelTFilesString.split(',');
    }

    validateUrns(options);

    if (options.jsonAccessPath.length > 0 && !options.jsonAccessPath.endsWith('.')) {
        options.jsonAccessPath = `${options.jsonAccessPath}.`;
    }

    options.path = !options.path ? 'src/app/shared/components' : '';

    return options;
}

/**
 * Returns a rule that loads an RDF schema.
 *
 * @returns {Rule} - The rule for loading the RDF schema.
 */
export function loadRdfRule(): Rule {
    return loadRDF(options);
}

/**
 * Returns a rule that loads an Aspect Model schema.
 *
 * @returns {Rule} - The rule for loading the Aspect Model schema.
 */
export function loadAspectModelRule(): Rule {
    return loadAspectModel(options);
}

/**
 * Sets custom actions and filters based on options.
 *
 * @returns {Rule} - The rule for setting custom actions and filters.
 */
export function setCustomActionsAndFiltersRule(): Rule {
    return () => {
        if (!options.addCommandBar) return;

        const propertiesCheck = [
            {properties: options.templateHelper.getStringProperties(options), function: 'addSearchBar'},
            {properties: options.templateHelper.getDateProperties(options), function: 'addDateQuickFilters'},
            {properties: options.templateHelper.getEnumProperties(options), function: 'addEnumQuickFilters'},
        ];

        options.enabledCommandBarFunctions = options.enabledCommandBarFunctions.filter(func =>
            propertiesCheck.some(item => item.function === func && item.properties.length > 0),
        );

        if (options.templateHelper.haveCustomCommandbarActions(options)) {
            options.enabledCommandBarFunctions.push('addCustomCommandBarActions');
        }
    };
}

/**
 * Sets the component name if it equals the specified type.
 * @param {ComponentType} componentType - The type to compare the component name to.
 *
 * @returns {Rule} - The rule for setting the component name.
 */
export function setComponentNameRule(componentType: ComponentType): Rule {
    return (tree: Tree, context: SchematicContext) => {
        if (options.name === componentType) {
            options.name = `${options.selectedModelElement?.name}-${options.name}`;
            context.logger.info('Option name set.');
        }
    };
}

/**
 * Inserts version into the selector.
 *
 * @returns {Rule} - The rule for inserting version into the selector.
 */
export function insertVersionIntoSelectorRule(): Rule {
    return (tree: Tree) => {
        const {prefix, name, enableVersionSupport, aspectModelVersion} = options;
        const prefixPart = prefix ? `${prefix}-` : '';
        const namePart = dasherize(name).toLowerCase();
        const versionPart = enableVersionSupport ? `-v${aspectModelVersion.replace(/\./g, '')}` : '';

        options.selector = `${prefixPart}${namePart}${versionPart}`;

        return tree;
    };
}

/**
 * Inserts version into the path.
 *
 * @returns {Rule} - The rule for inserting version into the path.
 */
export function insertVersionIntoPathRule(): Rule {
    return (tree: Tree) => {
        let pathSuffix = `/${dasherize(options.name).toLowerCase()}`;

        if (options.enableVersionSupport) {
            pathSuffix += `/v${options.aspectModelVersion.replace(/\./g, '')}`;
        }

        options.path += pathSuffix;

        return tree;
    };
}

/**
 * Sets values for the template options.
 *
 * @returns {Rule} - The rule for setting values for the template options.
 */
export function setTemplateOptionValuesRule(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        options.templateHelper.setTemplateOptionValues(options as Values);
        context.logger.info('Template option values set.');
        return tree;
    };
}

/**
 * Returns a set of rules to generate the general files.
 *
 * @returns {Array<Rule>} - The rules for generating the general files.
 */
export function generateGeneralFilesRules(): Array<Rule> {
    return [
        generateSharedModule(options),
        generateTranslationModule(options),
        generateFilterService(options),
        generateGeneralStyle(options),
        generateTranslationFiles(options),
        wrapBuildComponentExecution(options),
        generateGeneralService(options),
        generateCustomService(options),
        generateValidateInputDirective(options),
        generateHorizontalOverflowDirective(options),
        generateShowDescriptionPipe(options),
    ];
}

/**
 * Returns a set of rules to add and update configuration files.
 *
 * @returns {Array<Rule>} - The rules for adding and updating configuration files.
 */
export function addAndUpdateConfigurationFilesRule(): Rule[] {
    const componentModule =
        options.componentType === ComponentType.TABLE
            ? addToComponentModule(options.skipImport, options, tableModules(options))
            : options.componentType === ComponentType.CARD
              ? addToComponentModule(options.skipImport, options, cardModules(options))
              : options.componentType === ComponentType.FORM
                ? addToComponentModule(options.skipImport, options, formModules(options))
                : ({} as Rule);

    return [
        addPackageJsonDependencies(options.skipImport, options.spinner, loadDependencies()),
        updateConfigFiles(options),
        addToAppModule(options.skipImport, [
            {
                name: 'BrowserAnimationsModule',
                fromLib: '@angular/platform-browser/animations',
            },
        ]),
        componentModule,
        addToAppSharedModule(false, APP_SHARED_MODULES),
        updateSharedModule(options),
    ];
}

/**
 * Updates config files and sets allowedCommonJsDependencies if required.
 * @param {any} options - The options for updating config files.
 *
 * @returns {Rule} - The rule for updating config files.
 */
function updateConfigFiles(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const angularJson = JSON.parse(getJSONAsString('/angular.json', tree));
        const projectName = getProjectName(angularJson, tree);
        const angularBuildOptions = angularJson['projects'][projectName]['architect']['build']['options'];

        if (options.enableRemoteDataHandling) {
            updateDependencies(angularBuildOptions, tree);
        }

        addStylePreprocessorOptions(angularBuildOptions);
        addOptionalMaterialTheme(angularBuildOptions, options.getOptionalMaterialTheme);

        tree.overwrite('/angular.json', JSON.stringify(angularJson, null, 2));

        return tree;
    };
}

/**
 * Updates the given project's dependencies.
 * @param {object} angularBuildOptions - The Angular build options for the project.
 * @param {Tree} tree - The tree of files in the project.
 */
function updateDependencies(angularBuildOptions: any, tree: Tree) {
    angularBuildOptions['allowedCommonJsDependencies'] = ['rollun-ts-rql', 'crypto', 'moment', 'papaparse'];
    const tsConfigJson = getTsConfigJson(tree);
    tsConfigJson['compilerOptions']['paths'] = {
        path: ['node_modules/path-browserify'],
        crypto: ['node_modules/crypto-js'],
    };
    tree.overwrite('/tsconfig.json', JSON.stringify(tsConfigJson, null, 2));
}

/**
 * Retrieves the tsconfig.json file as a JavaScript object.
 * @param {Tree} tree - The tree of files in the project.
 *
 * @returns {object} The contents of the tsconfig.json file.
 */
function getTsConfigJson(tree: Tree) {
    let tsFileContent = getJSONAsString('/tsconfig.json', tree);
    // removing /** */ comments from file to parse javascript object
    tsFileContent = tsFileContent.replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');
    return JSON.parse(tsFileContent);
}

/**
 * Optionally adds the default Material theme to the project's styles.
 * @param {object} angularBuildOptions - The Angular build options for the project.
 * @param {function} getOptionalMaterialTheme - Function to get optional Material theme.
 */
function addOptionalMaterialTheme(angularBuildOptions: any, getOptionalMaterialTheme: any) {
    const defaultMaterialTheme = 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
    if (getOptionalMaterialTheme && !angularBuildOptions['styles'].includes(defaultMaterialTheme)) {
        angularBuildOptions['styles'].push(defaultMaterialTheme);
    }
}

/**
 * Adds preprocessor options to the styles in the project.
 * @param {object} angularBuildOptions - The Angular build options for the project.
 */
function addStylePreprocessorOptions(angularBuildOptions: any): void {
    const KEY_STYLE_PREPROCESSOR_OPT = 'stylePreprocessorOptions';
    const KEY_INCLUDE_PATH = 'includePaths';
    const SCSS_PATH = 'src/assets/scss';

    if (!angularBuildOptions[KEY_STYLE_PREPROCESSOR_OPT]) {
        angularBuildOptions[KEY_STYLE_PREPROCESSOR_OPT] = {};
        angularBuildOptions[KEY_STYLE_PREPROCESSOR_OPT][KEY_INCLUDE_PATH] = [];
    }

    const optionIncludePaths = angularBuildOptions[KEY_STYLE_PREPROCESSOR_OPT][KEY_INCLUDE_PATH];
    if (optionIncludePaths && !optionIncludePaths.find((entry: string) => entry === SCSS_PATH)) {
        optionIncludePaths.push(SCSS_PATH);
    } else {
        angularBuildOptions[KEY_STYLE_PREPROCESSOR_OPT][KEY_INCLUDE_PATH] = [SCSS_PATH];
    }
}

/**
 * Retrieves the name of the project from the given Angular configuration object.
 * @param {object} angularJson - The contents of the angular.json file for the project.
 * @param {Tree} tree - The tree of files in the project.
 *
 * @returns {string} The name of the project.
 */
function getProjectName(angularJson: any, tree: Tree): string {
    if (angularJson['defaultProject']) {
        return angularJson['defaultProject'];
    }

    return Object.keys(JSON.parse(getJSONAsString('/angular.json', tree))['projects'])[0];
}

/**
 * Reads a JSON file and returns its content as a string.
 * @param {string} path - The path to the JSON file.
 * @param {Tree} tree - The tree of files in the project.
 *
 * @returns {string} The contents of the JSON file as a string.
 */
function getJSONAsString(path: string, tree: Tree): string {
    return new JSONFile(tree, path)['content'];
}

/**
 * Loads dependencies based on project options.
 *
 * @returns {Array<string>} The list of dependencies to be loaded.
 */
function loadDependencies() {
    const dependencies = [...DEFAULT_DEPENDENCIES];

    if (options.enableRemoteDataHandling) {
        dependencies.push(...REMOTE_HANDLING_DEPENDENCIES);
    }

    if (options.enabledCommandBarFunctions?.includes('addDateQuickFilters') || options.skipImport) {
        dependencies.push(...DATE_QUICK_FILTER_DEPENDENCIES);
    }

    return dependencies;
}

/**
 * Returns a rule that formats all files.
 *
 * @returns {Rule} - The rule for formatting all files.
 */
export function formatAllFilesRule(): Rule {
    const optionsPath = options.path || '';
    const paths = [
        optionsPath,
        optionsPath.replace('app', 'assets/i18n'),
        'src/app/shared/directives',
        'src/app/shared/pipes',
        'src/app/shared/services',
        `src/app/shared/components/${options.name}`,
        'src/assets/scss',
        'src/app/shared',
    ];

    const rules = paths.map(path => formatGeneratedFiles({getPath: () => path}, options));
    rules.push(formatGeneratedFiles({getPath: () => 'src/app/shared'}, options, ['app-shared.module.ts']));

    return chain(rules);
}
