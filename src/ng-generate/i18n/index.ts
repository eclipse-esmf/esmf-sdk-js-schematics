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

import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {Schema} from './schema';
import {addPackageJsonDependencies, addPackageJsonScripts} from '../../utils/package-json';
import {NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {TemplateHelper} from '../../utils/template-helper';
import {formatGeneratedFiles} from '../../utils/file';
import ora from 'ora';
import {generateTranslationModule} from '../components/shared/generators';
import {NodePackageInstallTask} from "@angular-devkit/schematics/tasks";

/**
 * Updates the project with dependencies, scripts, and modules required for translation functionality.
 *
 * @param {Schema} options - The options configured for the schematics command.
 *
 * @returns {Rule} - The rule to be applied to the Tree.
 */
export default function (options: Schema): Rule {
    const spinner = ora().start();
    options.spinner = spinner;
    (options as any).templateHelper = new TemplateHelper();
    return chain([
        addPackageJsonDependencies(options.skipImport, spinner, dependencies),
        addPackageJsonScripts(scripts),
        generateTranslationModule(options),
        formatGeneratedFiles(
            {
                getPath() {
                    return `src/app/shared`;
                },
            },
            options,
            ['app-shared.module.ts']
        ),
        installPackages()
    ]);
}

const dependencies = [
    {type: NodeDependencyType.Default, version: '~13.0.0', name: '@ngx-translate/core', overwrite: false},
    {type: NodeDependencyType.Default, version: '~8.0.0', name: '@ngx-translate/http-loader', overwrite: true},
    {type: NodeDependencyType.Default, version: '~1.1.0', name: 'ngx-i18n-combine', overwrite: false},
];

const scripts = [
    {
        name: 'combine-i18n',
        command: 'ngx-i18n-combine -i ./src/**/i18n/shared/components/**/*.translation.json -o ./src/assets/i18n/{en,de}.json',
    },
];

function installPackages(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        return tree;
    };
}
