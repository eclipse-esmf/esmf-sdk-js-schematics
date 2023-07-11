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
import {DefaultSingleEntity, Property} from "@esmf/aspect-model-loader";
import {classify} from "@angular-devkit/core/src/utils/strings";
import {getAllEnumProps, PropValue} from "../../../../utils/aspect-model";

export function service(options: any): Rule {
     return (tree: Tree, _context: SchematicContext) => {
        return mergeWith(
            apply(url('./generators/service/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: options.name,
                    aspectModelType: options.templateHelper.resolveType(options.aspectModel).name,
                    aspectModelName: options.aspectModel.name,
                    getTypesPath: options.templateHelper.getTypesPath(options.enableVersionSupport, options.aspectModelVersion, options.aspectModel),
                    getGenerationDisclaimerText: options.templateHelper.getGenerationDisclaimerText(),
                }),
                move(options.path),
            ]),
            MergeStrategy.Overwrite
        );
    };
}
