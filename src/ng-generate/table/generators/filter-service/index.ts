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
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from "@angular-devkit/core";
import {DefaultSingleEntity, Property} from "@esmf/aspect-model-loader";

let sharedOptions: any = {};

export function filterService(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        sharedOptions = options;

        return mergeWith(
            apply(url('./generators/filter-service/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: sharedOptions,
                    name: sharedOptions.name,
                    getGenerationDisclaimerText: sharedOptions.templateHelper.getGenerationDisclaimerText(),
                }),
                move(sharedOptions.path),
            ]),
            MergeStrategy.Overwrite
        );
    };
}
