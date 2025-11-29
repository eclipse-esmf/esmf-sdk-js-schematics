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

import {chain, Rule, SchematicContext} from '@angular-devkit/schematics';
import ora from 'ora';
import {loadAspectModel, loadRDF} from '../../utils/aspect-model';
import {formatGeneratedFiles, loadAndApplyConfigFile} from '../../utils/file';
import {TemplateHelper} from '../../utils/template-helper';
import {buildTypesFilePath, visitAspectModel} from './aspect-model-type-generator-visitor';
import {TypesSchema} from './schema';
import {generateComponent} from '../components/shared/index';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {ComponentType} from '../components/shared/schema';
import {LOG_COLOR} from '../../utils/constants';

export default function (options: TypesSchema): Rule {
  if (options && options.configFile !== undefined) {
    console.log(LOG_COLOR, 'Start generating types...');
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
            return buildTypesFilePath(options);
          },
        },
        options
      ),
    ]);
  } else {
    return (tree: Tree, context: SchematicContext) => {
      generateComponent(context, options, ComponentType.TYPES);
    };
  }
}
