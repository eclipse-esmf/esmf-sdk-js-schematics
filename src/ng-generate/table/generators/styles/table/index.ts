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
import {strings} from '@angular-devkit/core';

export function genrateTableStyle(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {

        const styleName = `table`;
        const stylePath = `src/assets/scss`;

        const globalStylePath = 'src/styles.scss';
        tree.exists(globalStylePath) ? tree.overwrite(globalStylePath, contentForGlobalStyles()) : tree.create(globalStylePath, contentForGlobalStyles());


        return mergeWith(
            apply(url('./generators/styles/table/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: styleName,
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                    customStyleImports: options.customStyleImports.map((styleImport: string) => `@import '${styleImport}';`).join(''),
                }),
                move(stylePath),
            ]),
            MergeStrategy.Overwrite
        );
    };
}

function contentForGlobalStyles() {
    return `@font-face { font-family: 'Material Icons'; font-style: normal;font-weight: 400; src: url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2) format('woff2');} .material-icons {font-family: 'Material Icons', serif;font-weight: normal;font-style: normal;font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none;display: inline-block;white-space: nowrap;word-wrap: normal;direction: ltr; -webkit-font-feature-settings: 'liga';-webkit-font-smoothing: antialiased; };
            html,
            body {
                margin: 0;
            }`
}
