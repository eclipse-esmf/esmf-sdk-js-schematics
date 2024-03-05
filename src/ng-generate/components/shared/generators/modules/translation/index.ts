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
    chain,
    MergeStrategy,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {Schema} from "../../../schema";

export function generateTranslationFiles(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return chain([
            generateModuleDefinition(options, _context),
            generateProviderDefinition(options, _context),
        ])(tree, _context);
    };
}

function generateModuleDefinition(options: Schema, _context: SchematicContext): Rule {
    return mergeWith(
        apply(url('../shared/generators/modules/translation/module-files'), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                options: options,
                name: 'app-shared',
            }),
            move('src/app/shared'),
        ]),
        options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
    );
}

function generateProviderDefinition(options: Schema, _context: SchematicContext): Rule {
    return mergeWith(
        apply(url('../shared/generators/modules/translation/provider-files'), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                options: options,
                name: 'trans-loco-http-loader',
            }),
            move('src/app/shared'),
        ]),
        options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
    );
}
