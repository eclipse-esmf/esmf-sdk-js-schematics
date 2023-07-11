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

import {dasherize} from '@angular-devkit/core/src/utils/strings';
import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask, RunSchematicTask} from '@angular-devkit/schematics/tasks';
import {JSONFile} from '@schematics/angular/utility/json-file';
import {
    addToAppModule,
    addToAppSharedModule,
    addToComponentModule,
    wrapBuildComponentExecution,
} from '../../utils/angular';
import {generateTranslationFiles, loadAspectModel, loadRDF} from '../../utils/aspect-model';
import {formatGeneratedFiles, loadAndApplyConfigFile} from '../../utils/file';
import {
    addPackageJsonDependencies,
    DATE_QUICK_FILTER_DEPENDENCIES,
    DEFAULT_DEPENDENCIES,
    REMOTE_HANDLING_DEPENDENCIES
} from '../../utils/package-json';
import {TemplateHelper} from '../../utils/template-helper';
import {Schema} from './schema';
import ora from 'ora';
import {WIZARD_CONFIG_FILE} from '../table-prompter/index';
import {generateTable} from "./generators/components/table/index";
import {generateExportDialog} from "./generators/components/export-dialog/index";
import {generateSharedModule} from "./generators/modules/shared";
import {generateTranslationModule} from "./generators/modules/translation/index";
import {generateDataSource} from "./generators/data-source/index";
import {generateFilterService} from "./generators/services/filter/index";
import {generateConfigMenu} from "./generators/components/config-menu/index";
import {generateColumnMenu} from "./generators/components/column-menu/index";
import {generateTableService} from "./generators/services/table/index";
import {generateCustomService} from "./generators/services/custom/index";
import {generateResizeDirective} from "./generators/directives/resize/index";
import {generateValidateInputDirective} from "./generators/directives/validate-input/index";
import {generateHorizontalOverflowDirective} from "./generators/directives/horizontal-overflow/index";
import {generateShowDescriptionPipe} from "./generators/pipes/show-description/index";
import {generateSearchStringPipe} from "./generators/pipes/search-string/index";
import {generateStorageService} from "./generators/services/storage/index";
import {genrateTableStyle} from "./generators/styles/table/index";
import {APP_SHARED_MODULES, COMPONENT_MODULES, updateSharedModule} from "../../utils/modules";

export default function (options: Schema): Rule {
    return (tree: Tree, context: SchematicContext): void => {
        let generateTypesTaskId;
        if (options.configFile && options.configFile !== '') {
            loadAndApplyConfigFile(options.configFile, options);
            generateTypesTaskId = context.addTask(new RunSchematicTask('types', options));
        } else {
            options.configFile = WIZARD_CONFIG_FILE;
            const prompterTaskId = context.addTask(new RunSchematicTask('table-prompter', options));
            generateTypesTaskId = context.addTask(new RunSchematicTask('types', options), [prompterTaskId]);
        }
        const tableGenId = context.addTask(new RunSchematicTask('table-generation', options), [generateTypesTaskId]);

        if (!options.skipInstall) {
            // used to install all dependencies at the end
            context.addTask(new NodePackageInstallTask(), [tableGenId]);
        }
    };
}

/**
 * Scaffolds a new table component.
 */
export function generate(options: Schema): Rule {
    options.spinner = ora().start();

    const defaultOptions = {
        skipImport: false,
    };

    if (options.configFile !== WIZARD_CONFIG_FILE) {
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

    options.templateHelper = new TemplateHelper();

    validateURNs(options);

    if (!options.path) {
        options.path = `src/app/shared/components`;
    }

    if (options.jsonAccessPath.length > 0 && !options.jsonAccessPath.endsWith('.')) {
        options.jsonAccessPath = `${options.jsonAccessPath}.`;
    }

    return chain([
        // load the ttl files
        loadRDF(options),
        // serialize RDf into aspect model object
        loadAspectModel(options),
        setCustomActionsAndFilters(options),
        setTableName(options),
        insertVersionIntoSelector(options),
        insertVersionIntoPath(options),
        generateSharedModule(options),
        generateTranslationModule(options),
        addPackageJsonDependencies(options.skipImport, options.spinner, loadDependencies(options)),
        updateConfigFiles(options),
        addToAppModule(options.skipImport, [{
            name: 'BrowserAnimationsModule',
            fromLib: '@angular/platform-browser/animations'
        }]),
        addToComponentModule(options.skipImport, options, COMPONENT_MODULES(options)),
        addToAppSharedModule(false, APP_SHARED_MODULES),
        generateTable(options),
        generateExportDialog(options),
        generateDataSource(options),
        generateFilterService(options),
        genrateTableStyle(options),
        generateTranslationFiles(options),
        wrapBuildComponentExecution(options),
        generateTableService(options),
        generateCustomService(options),
        generateStorageService(options),
        generateColumnMenu(options),
        generateConfigMenu(options),
        generateResizeDirective(options),
        generateValidateInputDirective(options),
        generateHorizontalOverflowDirective(options),
        generateShowDescriptionPipe(options),
        generateSearchStringPipe(options),
        updateSharedModule(options),
        formatAllFiles(options)
    ]);
}

function setCustomActionsAndFilters(options: Schema): Rule {
    return () => {
        if (!options.addCommandBar) {
            return;
        }

        const propertiesCheck = [
            {properties: options.templateHelper.getStringProperties(options), function: 'addSearchBar'},
            {properties: options.templateHelper.getDateProperties(options), function: 'addDateQuickFilters'},
            {properties: options.templateHelper.getEnumProperties(options), function: 'addEnumQuickFilters'}
        ];

        propertiesCheck.forEach(item => {
            if (item.properties.length <= 0) {
                options.enabledCommandBarFunctions = options.enabledCommandBarFunctions.filter(func => func !== item.function);
            }
        });
    };
}

function validateURNs(options: Schema): void {
    // if there is only one definition ('... a samm:Aspect') this one will be used
    if (options.aspectModelUrnToLoad && options.aspectModelUrnToLoad !== '') {
        if (!options.aspectModelUrnToLoad.includes('#')) {
            options.spinner?.fail(`Aspect URN to be loaded ${options.aspectModelUrnToLoad} is not valid.`);
        }
    }

    // if defined, validate URN otherwise the default (all properties 'samm:properties ( ... ) '
    // of the Aspect definition '... a samm:Aspect') is used
    if (options.selectedModelElementUrn && options.selectedModelElementUrn !== '') {
        if (!options.selectedModelElementUrn.includes('#')) {
            options.spinner?.fail(`URN ${options.selectedModelElementUrn} is not valid.`);
        }
    }
}

function setTableName(options: Schema): Rule {
    return async () => {
        if (options.name === 'table') {
            options.name = `${options.selectedModelElement?.name}-${options.name}`;
        }
    };
}

function insertVersionIntoSelector(options: Schema): Rule {
    return (tree: Tree) => {
        const prefixPart = options.prefix ? `${options.prefix}-` : '';
        const namePart = dasherize(options.name).toLowerCase();
        const versionPart = options.enableVersionSupport ? `-v${options.aspectModelVersion.replace(/\./g, '')}` : '';

        options.selector = `${prefixPart}${namePart}${versionPart}`;

        return tree;
    };
}

function insertVersionIntoPath(options: Schema): Rule {
    return (tree: Tree) => {
        let pathSuffix = `/${dasherize(options.name).toLowerCase()}`;

        if (options.enableVersionSupport) {
            const aspectModelVersion = 'v' + options.aspectModelVersion.replace(/\./g, '');
            pathSuffix += `/${aspectModelVersion}`;
        }

        options.path += pathSuffix;

        return tree;
    };
}

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

function updateDependencies(angularBuildOptions: any, tree: Tree) {
    angularBuildOptions['allowedCommonJsDependencies'] = ['rollun-ts-rql', 'crypto', 'moment', 'papaparse'];
    const tsConfigJson = getTsConfigJson(tree);
    tsConfigJson['compilerOptions']['paths'] = {
        path: ['node_modules/path-browserify'],
        crypto: ['node_modules/crypto-js'],
    };
    tree.overwrite('/tsconfig.json', JSON.stringify(tsConfigJson, null, 2));
}

function getTsConfigJson(tree: Tree) {
    let tsFileContent = getJSONAsString('/tsconfig.json', tree);
    // removing /** */ comments from file to parse javascript object
    tsFileContent = tsFileContent.replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');
    return JSON.parse(tsFileContent);
}

function addOptionalMaterialTheme(angularBuildOptions: any, getOptionalMaterialTheme: any) {
    const defaultMaterialtheme = 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
    if (getOptionalMaterialTheme && !angularBuildOptions['styles'].includes(defaultMaterialtheme)) {
        angularBuildOptions['styles'].push(defaultMaterialtheme);
    }
}


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

function getProjectName(angularJson: any, tree: Tree): string {
    if (angularJson['defaultProject']) {
        return angularJson['defaultProject'];
    }

    return Object.keys(JSON.parse(getJSONAsString('/angular.json', tree))['projects'])[0];
}

function getJSONAsString(path: string, tree: Tree): string {
    return new JSONFile(tree, path)['content'];
}

function loadDependencies(options: Schema) {
    const dependencies = [...DEFAULT_DEPENDENCIES];

    if (options.enableRemoteDataHandling) {
        dependencies.push(...REMOTE_HANDLING_DEPENDENCIES);
    }

    if (!options.enabledCommandBarFunctions?.includes('addDateQuickFilters') || options.skipImport) {
        dependencies.push(...DATE_QUICK_FILTER_DEPENDENCIES);
    }

    return dependencies;
}

function formatAllFiles(options: Schema): Rule {
    const optionsPath = options.path || '';
    const paths = [
        optionsPath,
        optionsPath.replace('app', 'assets/i18n'),
        'src/app/shared/directives',
        'src/app/shared/pipes',
        'src/app/shared/services',
        `src/app/shared/components/${options.name}`,
        'src/assets/scss',
        'src/app/shared'
    ];

    const rules = paths.map(path => formatGeneratedFiles({ getPath: () => path }, options));
    rules.push(formatGeneratedFiles({ getPath: () => 'src/app/shared' }, options, ['app-shared.module.ts']));

    return chain(rules);
}
