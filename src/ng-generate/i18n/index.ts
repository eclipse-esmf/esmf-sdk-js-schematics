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

import {chain, Rule} from '@angular-devkit/schematics';
import {Schema} from './schema';
import {addPackageJsonDependencies, addPackageJsonScripts} from '../../utils/package-json';
import {NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {generateTranslationModule} from '../../utils/aspect-model';
import {TemplateHelper} from '../../utils/template-helper';
import {formatGeneratedFiles} from '../../utils/file';
import ora from 'ora';

/**
 * generates translation files for aspect model.
 */
export default function (options: Schema): Rule {
    const spinner = ora().start();
    options.spinner = spinner;
    (options as any).templateHelper = new TemplateHelper();

    return chain([
        addPackageJsonDependencies(options.skipImport, spinner, [
            {type: NodeDependencyType.Default, version: '~13.0.0', name: '@ngx-translate/core', overwrite: false},
            {type: NodeDependencyType.Default, version: '~6.0.0', name: '@ngx-translate/http-loader', overwrite: true},
            {type: NodeDependencyType.Default, version: '~1.1.0', name: 'ngx-i18n-combine', overwrite: false},
        ]),
        addPackageJsonScripts([
            {
                name: 'combine-i18n',
                command: 'ngx-i18n-combine -i ./src/**/i18n/shared/components/**/*.translation.json -o ./src/assets/i18n/{en,de}.json',
            },
        ]),
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
    ]);
}
