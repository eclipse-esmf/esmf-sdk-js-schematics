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
import {strings} from "@angular-devkit/core";

export function generateSearchStringPipe(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        if (!options.enabledCommandBarFunctions.includes('addSearchBar')) {
            return noop;
        }

        const pipeName = 'search-string';
        const pipePath = 'src/app/shared/pipes';

        return mergeWith(
            apply(url('./generators/pipes/search-string/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: pipeName,
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                }),
                move(pipePath),
            ]),
            options.overwrite? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}
