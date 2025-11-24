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
    chain,
    MergeStrategy,
    mergeWith,
    move,
    noop,
    Rule,
    SchematicContext,
    Tree,
    url,
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {Schema} from '../../../schema';
import {parseSourceFile} from '@angular/cdk/schematics';

export function generateTranslationModule(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        if (isTranslocoProviderDefined(tree, 'src/app/shared/app-shared.module.ts')) {
            return noop();
        }

        return chain([generateModuleDefinition(options, _context), generateProviderDefinition(options, _context)])(tree, _context);
    };
}

function isTranslocoProviderDefined(tree: Tree, modulePath: string): boolean {
    return tree.exists(modulePath) && parseSourceFile(tree, modulePath).text.includes(transLocoProviderInformation());
}

function generateModuleDefinition(options: Schema, _context: SchematicContext): Rule {
    return mergeWith(
        apply(url('../shared/generators/modules/translation/module-files'), [
            applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                options: options,
                providerInfo: transLocoProviderInformation(),
                name: 'app-shared',
            }),
            move('src/app/shared'),
        ]),
        options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
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
        options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
    );
}

function transLocoProviderInformation(): string {
    return `provideTransloco({
      config: {
        availableLangs: ['en'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TransLocoHttpLoader,
    })`;
}
