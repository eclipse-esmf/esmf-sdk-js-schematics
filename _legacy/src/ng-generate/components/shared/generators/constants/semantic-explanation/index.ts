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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {Values} from '../../../schema';
import {getTableColumValues} from '../../../utils';

export function generateSemanticExplanation(options: Values): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return mergeWith(
            apply(url('../shared/generators/constants/semantic-explanation/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: {
                        ...options,
                        tableColumns: getTableColumValues(options.listAllProperties, options),
                    },
                    name: options.name,
                }),
                move('src/app/shared/constants'),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}
