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

import {
    apply,
    applyTemplates,
    MergeStrategy,
    mergeWith,
    move,
    noop,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';

export function generateFormArrayReusable(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const tsPath = 'src/app/shared/utils/form-array-reusable.ts';

        if (!options.overwrite && tree.exists(tsPath)) {
            return noop();
        }

        return mergeWith(
            apply(url('../shared/generators/utils/form-array-reusable/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: 'form-array-reusable',
                }),
                move('src/app/shared/utils'),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
        );
    };
}
