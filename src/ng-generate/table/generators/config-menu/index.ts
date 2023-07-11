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
    noop,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {addToDeclarationsArray, addToExportsArray} from "../../../../utils/angular";
import {classify} from "@angular-devkit/core/src/utils/strings";

export function generateConfigMenu(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        if (!options.enabledCommandBarFunctions.includes('addSearchBar')) {
            return noop();
        }

        return mergeWith(
            apply(url('./generators/config-menu/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: options.name,
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                }),
                move(options.path),
            ]),
            MergeStrategy.Overwrite
        );
    };
}