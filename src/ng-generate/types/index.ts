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
import {chain, Rule, SchematicContext} from '@angular-devkit/schematics';
import ora from 'ora';
import {loadAspectModel, loadRDF} from '../../utils/aspect-model';
import {formatGeneratedFiles, loadAndApplyConfigFile} from '../../utils/file';
import {TemplateHelper} from '../../utils/template-helper';
import {visitAspectModel} from './aspect-model-type-generator-visitor';
import {TypesSchema} from './schema';
import {generateComponent} from '../components/shared';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {ComponentType} from '../components/shared/schema';

export default function (options: TypesSchema): Rule {
    if (options && options.configFile !== undefined) {
        options.spinner = ora().start();
        options.templateHelper = new TemplateHelper();

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
                options,
            ),
        ]);
    } else {
        return (tree: Tree, context: SchematicContext) => {
            generateComponent(context, options, ComponentType.TYPES);
        };
    }
}
