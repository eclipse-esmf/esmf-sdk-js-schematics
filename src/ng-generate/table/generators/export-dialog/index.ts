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

export function generateExportDialog(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const filePathHtml = `src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component.html`;
        const filePathScss = `src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component.scss`;
        const filePathTs = `src/app/shared/components/export-confirmation-dialog/export-confirmation-dialog.component.ts`;

        if (tree.exists(filePathHtml) && tree.exists(filePathScss) && tree.exists(filePathTs)) {
            return noop();
        }

        // TODO check MergeStrategy.Overwrite with options.overwrite ..
        return mergeWith(
            apply(url('./generators/export-dialog/files'), [
                applyTemplates({
                    options: options,
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                }),
                move("src/app/shared/components/export-confirmation-dialog"),
            ]),
            MergeStrategy.Overwrite
        );
    };
}
