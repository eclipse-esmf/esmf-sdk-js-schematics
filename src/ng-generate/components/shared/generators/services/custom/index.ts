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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, noop, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {dasherize} from '@angular-devkit/core/src/utils/strings';

export function generateCustomService(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const targetPath = `${options.path}/custom-${dasherize(options.name)}.service.ts`;

        if (tree.exists(targetPath) || !(options.enableRemoteDataHandling && options.customRemoteService)) {
            return noop();
        }

        return mergeWith(
            apply(url('../shared/generators/services/custom/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: options.name,
                }),
                move(options.path),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}
