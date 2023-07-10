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
import {classify, dasherize} from "@angular-devkit/core/src/utils/strings";
import {addModuleImportToModule} from "@angular/cdk/schematics";

export function module(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        options.module = `${dasherize(options.name)}.module.ts`;
        const modulePath = `${options.path}/${dasherize(options.name)}.module.ts`;
        addModuleImportToModule(tree, '/src/app/app.module.ts', `${classify(options.name)}Module`, `${modulePath.replace('.ts', '')}`);
        return mergeWith(
            apply(url('./generators/module/files'), [
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
