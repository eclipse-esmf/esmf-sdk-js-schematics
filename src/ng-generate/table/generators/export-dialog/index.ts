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

export function generateExportDialog(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const filePathHtml = `src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component.html`;
        const filePathScss = `src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component.scss`;
        const filePathTs = `src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component.ts`;

        if (tree.exists(filePathHtml) && tree.exists(filePathScss) && tree.exists(filePathTs)) {
            return noop();
        }

        const componentName = 'export-confirmation-dialog';
        const componentPath = 'src/app/shared/components/export-confirmation-dialog';

        // TODO check MergeStrategy.Overwrite with options.overwrite ..
        return mergeWith(
            apply(url('./generators/export-dialog/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: componentName,
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                }),
                move(componentPath),
            ]),
            MergeStrategy.Overwrite
        );
    };
}
