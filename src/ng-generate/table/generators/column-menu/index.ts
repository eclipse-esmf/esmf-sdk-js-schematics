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

export function generateColumnMenu(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return mergeWith(
            apply(url('./generators/column-menu/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: options.name,
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                    getVersionedAccessPrefix: options.templateHelper.getVersionedAccessPrefix(options),
                }),
                move(options.path),
            ]),
            MergeStrategy.Overwrite
        );
    };
}

function getVersionedAccessPrefix(options: any): string {
    return options.templateHelper.getVersionedAccessPrefix(options)
        ? `${options.templateHelper.getVersionedAccessPrefix(options)}.`
        : ``
}
