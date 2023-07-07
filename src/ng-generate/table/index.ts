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
import {generateTranslationFiles, generateTranslationModule, loadAspectModel, loadRDF} from '../../utils/aspect-model';
import {createOrOverwrite, formatGeneratedFiles, loadAndApplyConfigFile} from '../../utils/file';
import {addPackageJsonDependencies, DEFAULT_DEPENDENCIES} from '../../utils/package-json';
import {TemplateHelper} from '../../utils/template-helper';
import {HtmlGenerator} from './generators/html.generator';
import {LanguageGenerator} from './generators/language.generator';
import {StyleGenerator} from './generators/style.generator';
import {TsGenerator} from './generators/ts.generator';
import {Schema} from './schema';
import {TsComponentGenerator} from './generators/ts-component.generator';
import {addModuleImportToModule} from '@angular/cdk/schematics';
import ora from 'ora';
import {WIZARD_CONFIG_FILE} from '../table-prompter/index';

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
    options.htmlGenerator = new HtmlGenerator(options);
    options.tsGenerator = new TsGenerator(options);
    options.languageGenerator = new LanguageGenerator(options);

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
        generateModule(options),
        generateTranslationModule(options),
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
        addToAppModule(options.skipImport, [{name: 'BrowserAnimationsModule', fromLib: '@angular/platform-browser/animations'}]),
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
        generateComponentFiles(options),
        generateStyles(options),
        generateTranslationFiles(options),
        wrapBuildComponentExecution(options),
        generateAPIService(options),
        generateCustomAPIService(options),
        generateColumnMenu(options),
        generateConfigMenu(options),
        generateResizeDirective(options),
        generateValidateInputDirective(options),
        generateShowDescriptionPipe(options),
        generateHighlightDirective(options),
        generateHorizontalOverflowDirective(options),
        generateStorageService(options),
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

function generateComponentFiles(options: Schema): Rule {
    return async () => {
        return (tree: Tree, _context: SchematicContext): Tree => {
            const dashComponentName = dasherize(options.name);
            // contents
            const dataSourceContent = options.tsGenerator.generateDataSource();
            const componentTsContent = options.tsGenerator.generateComponent();
            const filterServiceContent = options.tsGenerator.generateFilterService();
            const htmlContent = options.htmlGenerator.generate();
            const styleContent = StyleGenerator.getComponentStyle(options);
            // paths
            const dataSourcePath = `${options.path}/${dashComponentName}-datasource.ts`;
            const componentTsPath = `${options.path}/${dashComponentName}.component.ts`;
            const filterServicePath = `${options.path}/${dashComponentName}.filter.service.ts`;
            const htmlPath = `${options.path}/${dashComponentName}.component.html`;
            const stylePath = `${options.path}/${dashComponentName}.component.${options.style || 'css'}`;

            createOrOverwrite(tree, dataSourcePath, options.overwrite, dataSourceContent);
            createOrOverwrite(tree, componentTsPath, options.overwrite, componentTsContent);
            if (filterServiceContent) {
                createOrOverwrite(tree, filterServicePath, options.overwrite, filterServiceContent);
            }
            createOrOverwrite(tree, htmlPath, options.overwrite, htmlContent);
            createOrOverwrite(tree, stylePath, options.overwrite, styleContent);

            generateExportConfirmationModalComponent(options, tree);
            return tree;
        };
    };
}

function generateModule(options: Schema): Rule {
    return (tree: Tree, context: SchematicContext): Tree => {
        options.module = `${dasherize(options.name)}.module.ts`;
        const moduleContent = options.tsGenerator.generateModule();
        const modulePath = `${options.path}/${dasherize(options.name)}.module.ts`;
        createOrOverwrite(tree, `${modulePath}`, options.overwrite, moduleContent);
        addModuleImportToModule(tree, '/src/app/app.module.ts', `${classify(options.name)}Module`, `${modulePath.replace('.ts', '')}`);
        return tree;
    };
}

function generateColumnMenu(options: Schema): Rule {
    return (tree: Tree, context: SchematicContext): Tree => {
        const componentContent = options.tsGenerator.generateColumnMenu();
        const componentPath = `${options.path}/${dasherize(options.name)}-column-menu.component.ts`;
        createOrOverwrite(tree, `${componentPath}`, options.overwrite, componentContent);
        addToDeclarationsArray(options, tree, `${classify(options.name)}ColumnMenuComponent`, `${componentPath.replace('.ts', '')}`).then();
        return tree;
    };
}

function generateConfigMenu(options: Schema): Rule {
    return (tree: Tree, context: SchematicContext) => {
        if (options.enabledCommandBarFunctions.includes('addSearchBar')) {
            const componentContent = options.tsGenerator.generateConfigMenu();
            const componentPath = `${options.path}/${dasherize(options.name)}-config-menu.component.ts`;
            createOrOverwrite(tree, `${componentPath}`, options.overwrite, componentContent);
            addToDeclarationsArray(
                options,
                tree,
                `${classify(options.name)}ConfigMenuComponent`,
                `${componentPath.replace('.ts', '')}`
            ).then();
            return tree;
        }
    };
}

function generateStyles(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext): Tree => {
        const styleContent = StyleGenerator.getStyle(options);
        const stylePath = `src/assets/scss/table.component.${options.style || 'css'}`;
        createOrOverwrite(tree, stylePath, options.overwrite, styleContent);

        const contentForGlobalStyles =
            "@font-face { font-family: 'Material Icons'; font-style: normal;font-weight: 400; src: url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2) format('woff2');} .material-icons {font-family: 'Material Icons', serif;font-weight: normal;font-style: normal;font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none;display: inline-block;white-space: nowrap;word-wrap: normal;direction: ltr; -webkit-font-feature-settings: 'liga';-webkit-font-smoothing: antialiased; };";

        createOrOverwrite(tree, 'src/styles.css', options.overwrite, contentForGlobalStyles);

        return tree;
    };
}

function generateExportConfirmationModalComponent(options: Schema, tree: Tree) {
    const componentName = 'ExportConfirmationDialog';
    const componentTsContent = TsComponentGenerator.getExportComponentDialog(options);
    const componentHtmlContent = options.htmlGenerator.generateExportDialogContent();
    const componentStyleContent = StyleGenerator.getExportComponentStyle();
    const componentPath = 'src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component';

    createOrOverwrite(tree, `${componentPath}.html`, options.overwrite, componentHtmlContent);
    createOrOverwrite(tree, `${componentPath}.ts`, options.overwrite, componentTsContent);
    createOrOverwrite(tree, `${componentPath}.scss`, options.overwrite, componentStyleContent);
    addToDeclarationsArray(options, tree, componentName, componentPath, options.templateHelper.getSharedModulePath()).then();
    addToExportsArray(options, tree, componentName, componentPath, options.templateHelper.getSharedModulePath()).then();
}

function generateAPIService(options: Schema): Rule {
    return async () => {
        return (tree: Tree, _context: SchematicContext) => {
            const content = options.tsGenerator.generateService();
            const targetPath = options.path + `/${dasherize(options.name)}.service.ts`;
            createOrOverwrite(tree, targetPath, options.overwrite, content);
            return tree;
        };
    };
}

function generateResizeDirective(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext): Tree => {
        const directiveName = 'ResizeColumnDirective';
        const directiveContent = options.tsGenerator.generateResizeDirective();
        const directivePath = `src/app/shared/directives/resize-column.directive`;
        createOrOverwrite(tree, `${directivePath}.ts`, options.overwrite, directiveContent);
        addToDeclarationsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
        addToExportsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
        return tree;
    };
}

function generateValidateInputDirective(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext): Tree => {
        const directiveName = 'ValidateInputDirective';
        const directiveContent = options.tsGenerator.generateValidateInputDirective();
        const directivePath = `src/app/shared/directives/validate-input.directive`;
        createOrOverwrite(tree, `${directivePath}.ts`, options.overwrite, directiveContent);
        addToDeclarationsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
        addToExportsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
        return tree;
    };
}

function generateHighlightDirective(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        if (options.enabledCommandBarFunctions.includes('addSearchBar')) {
            const directiveName = 'HighlightDirective';
            const directiveContent = options.tsGenerator.generateHighlightDirective();
            const directivePath = 'src/app/shared/directives/highlight.directive';
            createOrOverwrite(tree, `${directivePath}.ts`, options.overwrite, directiveContent);
            addToDeclarationsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
            addToExportsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
            return tree;
        }
    };
}

function generateShowDescriptionPipe(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext): Tree => {
        const pipeName = 'ShowDescriptionPipe';
        const pipeContent = options.tsGenerator.generateShowDescriptionPipe();
        const pipePath = 'src/app/shared/pipes/show-description.pipe';
        createOrOverwrite(tree, `${pipePath}.ts`, options.overwrite, pipeContent);
        addToDeclarationsArray(options, tree, pipeName, pipePath, options.templateHelper.getSharedModulePath()).then();
        addToExportsArray(options, tree, pipeName, pipePath, options.templateHelper.getSharedModulePath()).then();
        return tree;
    };
}

function generateHorizontalOverflowDirective(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext): Tree => {
        const directiveName = 'HorizontalOverflowDirective';
        const content = options.tsGenerator.generateHorizontalOverflowDirective();
        const directivePath = `src/app/shared/directives/horizontal-overflow.directive`;
        createOrOverwrite(tree, `${directivePath}.ts`, options.overwrite, content);
        addToDeclarationsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
        addToExportsArray(options, tree, directiveName, directivePath, options.templateHelper.getSharedModulePath()).then();
        return tree;
    };
}

function generateStorageService(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext): Tree => {
        const content = options.tsGenerator.generateStorageService();
        const targetPath = `src/app/shared/services/storage.service.ts`;
        createOrOverwrite(tree, targetPath, options.overwrite, content);
        return tree;
    };
}

function generateCustomAPIService(options: Schema): Rule {
    return async () => {
        if (!options.enableRemoteDataHandling || !options.customRemoteService) {
            return;
        }
        return (tree: Tree, _context: SchematicContext) => {
            const content = options.tsGenerator.generateCustomService();
            const targetPath = options.path + `/custom-${dasherize(options.name)}.service.ts`;
            if (!tree.exists(targetPath)) {
                tree.create(targetPath, content);
            }
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
