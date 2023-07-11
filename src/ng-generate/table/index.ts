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

import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask, RunSchematicTask} from '@angular-devkit/schematics/tasks';
import {NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {JSONFile} from '@schematics/angular/utility/json-file';
import {
    addToAppModule,
    addToAppSharedModule,
    addToComponentModule,
    addToDeclarationsArray,
    addToExportsArray,
    wrapBuildComponentExecution,
} from '../../utils/angular';
import {generateTranslationFiles, loadAspectModel, loadRDF} from '../../utils/aspect-model';
import {formatGeneratedFiles, loadAndApplyConfigFile} from '../../utils/file';
import {addPackageJsonDependencies, DEFAULT_DEPENDENCIES} from '../../utils/package-json';
import {TemplateHelper} from '../../utils/template-helper';
import {Schema} from './schema';
import ora from 'ora';
import {WIZARD_CONFIG_FILE} from '../table-prompter/index';
import {tableGeneration} from "./generators/table/index";
import {generateExportDialog} from "./generators/export-dialog/index";
import {module} from "./generators/module";
import {translationModule} from "./generators/translation-module/index";
import {dataSource} from "./generators/data-source/index";
import {filterService} from "./generators/filter-service/index";
import {generateConfigMenu} from "./generators/config-menu/index";
import {generateColumnMenu} from "./generators/column-menu/index";
import {service} from "./generators/service/index";
import {customService} from "./generators/custom-service/index";
import {resizeDirective} from "./generators/resize-directive/index";
import {validateInputDirective} from "./generators/validate-input-directive/index";
import {horizontalOverflowDirective} from "./generators/horizontal-overflow-directive/index";
import {showDescriptionPipe} from "./generators/show-description-pipe/index";
import {searchStringPipe} from "./generators/search-string-pipe/index";
import {storageService} from "./generators/storage-service/index";
import {tableStyle} from "./generators/table-style/index";

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
export function generateTable(options: Schema): Rule {
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
        loadRDF(options as Schema),
        // serialize RDf into aspect model object
        loadAspectModel(options as Schema),
        setCustomActionsAndFilters(options),
        setTableName(options),
        insertVersionIntoSelector(options as Schema),
        insertVersionIntoPath(options as Schema),
        //generateModule(options),
        module(options),
        translationModule(options),
        // generateTranslationModule(options),
        addPackageJsonDependencies(
            options.skipImport,
            options.spinner,
            options.enableRemoteDataHandling
                ? [
                    ...DEFAULT_DEPENDENCIES,
                    {
                        type: NodeDependencyType.Default,
                        version: '~0.9.4',
                        name: 'rollun-ts-rql',
                        overwrite: false,
                    },
                    {
                        type: NodeDependencyType.Default,
                        version: '~4.1.1',
                        name: 'crypto-js',
                        overwrite: false,
                    },
                ]
                : DEFAULT_DEPENDENCIES
        ),
        addPackageJsonDependencies(
            !options.enabledCommandBarFunctions?.includes('addDateQuickFilters') ||
            (options.skipImport !== undefined && options.skipImport),
            options.spinner,
            [
                {
                    type: NodeDependencyType.Default,
                    version: '~2.29.4',
                    name: 'moment',
                    overwrite: false,
                },
                {
                    type: NodeDependencyType.Default,
                    version: '~14.2.6',
                    name: '@angular/material-moment-adapter',
                    overwrite: false,
                },
            ]
        ),
        updateConfigFiles(options),
        addToAppModule(options.skipImport, [{
            name: 'BrowserAnimationsModule',
            fromLib: '@angular/platform-browser/animations'
        }]),
        addToComponentModule(options.skipImport, options, [
            {name: 'MatTableModule', fromLib: '@angular/material/table'},
            {name: 'MatPaginatorModule', fromLib: '@angular/material/paginator'},
            {name: 'MatSortModule', fromLib: '@angular/material/sort'},
            {name: 'MatButtonModule', fromLib: '@angular/material/button'},
            {name: 'MatMenuModule', fromLib: '@angular/material/menu'},
            {name: 'HttpClientModule', fromLib: '@angular/common/http'},
            {name: 'ClipboardModule', fromLib: '@angular/cdk/clipboard'},
            {name: 'MatIconModule', fromLib: '@angular/material/icon'},
            {name: 'MatTooltipModule', fromLib: '@angular/material/tooltip'},
            {name: 'MatListModule', fromLib: '@angular/material/list'},
            {name: 'DragDropModule', fromLib: '@angular/cdk/drag-drop'},
            {name: 'NgTemplateOutlet', fromLib: '@angular/common'},
            {name: 'DatePipe', fromLib: '@angular/common'},
            {name: 'NgIf', fromLib: '@angular/common'},
            {name: 'NgFor', fromLib: '@angular/common'},
            {name: 'NgClass', fromLib: '@angular/common'},
        ]),
        addToComponentModule(!options.addRowCheckboxes || options.skipImport, options, [
            {name: 'MatCheckboxModule', fromLib: '@angular/material/checkbox'},
            {name: 'MatDialogModule', fromLib: '@angular/material/dialog'},
        ]),
        addToComponentModule(
            {
                skip() {
                    return !options.addCommandBar || (options.skipImport as boolean);
                },
            },
            options,
            [
                {name: 'MatToolbarModule', fromLib: '@angular/material/toolbar'},
                {name: 'MatFormFieldModule', fromLib: '@angular/material/form-field'},
                {name: 'FormsModule', fromLib: '@angular/forms'},
                {name: 'MatInputModule', fromLib: '@angular/material/input'},
                {name: 'ReactiveFormsModule', fromLib: '@angular/forms'},
                {name: 'MatIconModule', fromLib: '@angular/material/icon'},
                {name: 'MatChipsModule', fromLib: '@angular/material/chips'},
                {name: 'MatCheckboxModule', fromLib: '@angular/material/checkbox'},
                {name: 'MatSelectModule', fromLib: '@angular/material/select'},
            ]
        ),
        addToComponentModule(
            {
                skip() {
                    return options.templateHelper.getDateProperties(options).length < 1 || (options.skipImport as boolean);
                },
            },
            options,
            [{name: 'MatMomentDateModule', fromLib: '@angular/material-moment-adapter'}]
        ),
        addToComponentModule(
            {
                skip() {
                    return !options.enabledCommandBarFunctions?.includes('addDateQuickFilters') || (options.skipImport as boolean);
                },
            },
            options,
            [
                {name: 'MatDatepickerModule', fromLib: '@angular/material/datepicker'},
                {name: 'ReactiveFormsModule', fromLib: '@angular/forms'},
            ]
        ),
        addToComponentModule(
            {
                skip() {
                    return !options.enabledCommandBarFunctions?.includes('addEnumQuickFilters') || (options.skipImport as boolean);
                },
            },
            options,
            [
                {name: 'MatSelectModule', fromLib: '@angular/material/select'},
                {name: 'MatOptionModule', fromLib: '@angular/material/core'},
            ]
        ),
        addToAppSharedModule(false, [
            {name: 'MatButtonModule', fromLib: '@angular/material/button'},
            {name: 'MatDialogModule', fromLib: '@angular/material/dialog'},
            {name: 'MatCheckboxModule', fromLib: '@angular/material/checkbox'},
            {name: 'MatIconModule', fromLib: '@angular/material/icon'},
            {name: 'FormsModule', fromLib: '@angular/forms'},
            {name: 'NgIf', fromLib: '@angular/common'},
        ]),
        tableGeneration(options),
        generateExportDialog(options),
        addExportComponentToSharedModule(options),
        dataSource(options),
        filterService(options),
        tableStyle(options),
        generateTranslationFiles(options),
        wrapBuildComponentExecution(options),
        service(options),
        customService(options),
        generateColumnMenu(options),
        generateConfigMenu(options),
        addMenuComponentsToSharedModule(options),
        resizeDirective(options),
        validateInputDirective(options),
        horizontalOverflowDirective(options),
        addDirectivesToSharedModule(options),
        showDescriptionPipe(options),
        searchStringPipe(options),
        addPipesToSharedModule(options),
        storageService(options),
        formatGeneratedFiles(
            {
                getPath(options: Schema) {
                    return `${options.path}`;
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath(options: Schema) {
                    return options.path ? options.path.replace('app', 'assets/i18n') : '';
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/app/shared/directives`;
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/app/shared/pipes`;
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/app/shared/services`;
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/app/shared/components/export-confirmation-dialog`;
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/assets/scss`;
                },
            },
            options
        ),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/app/shared`;
                },
            },
            options,
            ['app-shared.module.ts']
        ),
    ]);
}

function setCustomActionsAndFilters(options: Schema): Rule {
    return () => {
        if (options.addCommandBar) {
            if (options.templateHelper.getStringProperties(options).length <= 0) {
                options.enabledCommandBarFunctions = options.enabledCommandBarFunctions.filter(func => func !== 'addSearchBar');
            }
            if (options.templateHelper.getDateProperties(options).length <= 0) {
                options.enabledCommandBarFunctions = options.enabledCommandBarFunctions.filter(func => func !== 'addDateQuickFilters');
            }
            if (options.templateHelper.getEnumProperties(options).length <= 0) {
                options.enabledCommandBarFunctions = options.enabledCommandBarFunctions.filter(func => func !== 'addEnumQuickFilters');
            }
        }
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
        if (options.enableVersionSupport) {
            const aspectModelVersion = 'v' + options.aspectModelVersion.replace(/\./g, '');

            if (options.prefix) {
                options.selector = `${options.prefix}-${dasherize(options.name).toLowerCase()}-${aspectModelVersion}`;
            } else {
                options.selector = `${dasherize(options.name).toLowerCase()}-${aspectModelVersion}`;
            }
        } else {
            if (options.prefix) {
                options.selector = `${options.prefix}-${dasherize(options.name).toLowerCase()}`;
            } else {
                options.selector = `${dasherize(options.name).toLowerCase()}`;
            }
        }

        return tree;
    };
}

function insertVersionIntoPath(options: Schema): Rule {
    return (tree: Tree) => {
        if (options.enableVersionSupport) {
            const aspectModelVersion = 'v' + options.aspectModelVersion.replace(/\./g, '');
            options.path = `${options.path}/${dasherize(options.name).toLowerCase()}/${aspectModelVersion}`;
        } else {
            options.path = `${options.path}/${dasherize(options.name).toLowerCase()}`;
        }

        return tree;
    };
}

function addExportComponentToSharedModule(options: Schema) {
    return async () => {
        return (tree: Tree, _context: SchematicContext): Tree => {
            const componentName = 'export-confirmation-dialog';
            const componentPath = `./components/${dasherize(componentName)}/${dasherize(componentName)}.component`;

            addToDeclarationsArray(options, tree, `${classify(componentName)}Component`, componentPath, options.templateHelper.getSharedModulePath()).then();
            addToExportsArray(options, tree, `${classify(componentName)}Component`, componentPath, options.templateHelper.getSharedModulePath()).then();
            return tree;
        };
    };
}

function addMenuComponentsToSharedModule(options: Schema) {
    return async () => {
        return (tree: Tree, _context: SchematicContext): Tree => {
            if (options.enabledCommandBarFunctions.includes('addSearchBar')) {
                const componentName = 'config-menu';
                const configComponentPath = `${options.path}/${dasherize(options.name)}-config-menu.component.ts`;

                addToDeclarationsArray(options, tree, `${classify(options.name)}${classify(componentName)}Component`, `${configComponentPath.replace('.ts', '')}`).then();
            }

            const columnComponentPath = `${options.path}/${dasherize(options.name)}-column-menu.component.ts`;
            addToDeclarationsArray(options, tree, `${classify(options.name)}ColumnMenuComponent`, `${columnComponentPath.replace('.ts', '')}`).then();

            return tree;
        };
    };
}

function addDirectivesToSharedModule(options: Schema) {
    return async () => {
        return (tree: Tree, _context: SchematicContext): Tree => {
            const horizontalOverflowDirective = 'horizontal-overflow';
            const resizeColumnDirective = 'resize-column';
            const validateInputDirective = 'validate-input';

            const directives = [horizontalOverflowDirective, resizeColumnDirective, validateInputDirective];

            directives.forEach(value => {
                addToDeclarationsArray(options, tree, `${classify(value)}Directive`, `./directives/${dasherize(value)}.directive`, options.templateHelper.getSharedModulePath()).then();
                addToExportsArray(options, tree, `${classify(value)}Directive`, `./directives/${dasherize(value)}.directive`, options.templateHelper.getSharedModulePath()).then();
            });
            return tree;
        };
    };
}

function addPipesToSharedModule(options: Schema) {
    return async () => {
        return (tree: Tree, _context: SchematicContext): Tree => {
            const pipes = ['show-description'];

            if (options.enabledCommandBarFunctions.includes('addSearchBar')) {
                pipes.push('search-string');
            }

            pipes.forEach(value => {
                addToDeclarationsArray(options, tree, `${classify(value)}Pipe`, `./pipes/${dasherize(value)}.pipe`, options.templateHelper.getSharedModulePath()).then();
                addToExportsArray(options, tree, `${classify(value)}Pipe`, `./pipes/${dasherize(value)}.pipe`, options.templateHelper.getSharedModulePath()).then();
            });
            return tree;
        };
    };
}

function updateConfigFiles(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const angularJson = JSON.parse(getJSONAsString('/angular.json', tree));
        const projectName = getProjectName(angularJson, tree);
        const angularBuildOptions = angularJson['projects'][projectName]['architect']['build']['options'];

        if (options.enableRemoteDataHandling) {
            angularBuildOptions['allowedCommonJsDependencies'] = ['rollun-ts-rql', 'crypto', 'moment', 'papaparse'];

            let tsFileContent = getJSONAsString('/tsconfig.json', tree);
            // removing /** */ comments from file to parse javascript object
            tsFileContent = tsFileContent.replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');
            const tsConfigJson = JSON.parse(tsFileContent);
            const tsConfigJsonCompilerOptions = tsConfigJson['compilerOptions'];
            tsConfigJsonCompilerOptions['paths'] = {
                path: ['node_modules/path-browserify'],
                crypto: ['node_modules/crypto-js'],
            };
            tree.overwrite('/tsconfig.json', JSON.stringify(tsConfigJson, null, 2));
        }

        addStylePreprocessorOptions(angularBuildOptions);

        const defaultMaterialtheme = 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
        if (options.getOptionalMaterialTheme) {
            if (!angularBuildOptions['styles'].includes(defaultMaterialtheme)) {
                angularBuildOptions['styles'].push(defaultMaterialtheme);
            }
        }

        tree.overwrite('/angular.json', JSON.stringify(angularJson, null, 2));
        return tree;
    };
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
    const jsonFile = new JSONFile(tree, path);
    return jsonFile['content'];
}
