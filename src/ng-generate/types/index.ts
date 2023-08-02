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
import {chain, Rule} from '@angular-devkit/schematics';
import ora from 'ora';
import {loadAspectModel, loadRDF} from '../../utils/aspect-model';
import {formatGeneratedFiles, loadAndApplyConfigFile} from '../../utils/file';
import {TemplateHelper} from '../../utils/template-helper';
import {visitAspectModel} from './aspect-model-type-generator-visitor';
import {WIZARD_CONFIG_FILE} from "../prompter/index";
import {TypesSchema} from "./schema";

export default function (options: TypesSchema): Rule {
    options.spinner = ora().start();
    options.templateHelper = new TemplateHelper();

    if(options.configFile !== WIZARD_CONFIG_FILE) {
        options.configFile = WIZARD_CONFIG_FILE;
    }

    loadAndApplyConfigFile(options.configFile, options);

    if (options.aspectModelTFilesString) {
        options.aspectModelTFiles = options.aspectModelTFilesString.split(',');
    }

    return chain([
        loadRDF(options),
        loadAspectModel(options),
        visitAspectModel(options),
        formatGeneratedFiles(
            {
                getPath(options: TypesSchema) {
                    return `src/app/shared/types/${dasherize(options.aspectModel.name).toLowerCase()}`;
                },
            },
            options
        ),
    ]);
}
