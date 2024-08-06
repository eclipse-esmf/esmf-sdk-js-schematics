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
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {addModuleImportToModule} from '@angular/cdk/schematics';

export function generateFormFieldsModule(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const {classify, dasherize} = strings;
        const name = 'form-fields';

        const modulePath = `${options.path}/${dasherize(options.name)}.module.ts`;
        addModuleImportToModule(
            tree,
            '/src/app/shared/app-shared.module.ts',
            `${classify(name)}Module`,
            `${modulePath.replace('.ts', '')}`,
        );

        return mergeWith(
            apply(url(`../shared/generators/modules/${name}/files`), [
                applyTemplates({
                    classify,
                    dasherize,
                    options,
                    name,
                }),
                move(`src/app/shared/components/${name}`),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
        );
    };
}
