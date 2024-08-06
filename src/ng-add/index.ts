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

import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {addPackageJsonDependencies, DEFAULT_DEPENDENCIES} from '../utils/package-json';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';

export function add(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        return chain([addPackageJsonDependencies(options.skipImport, options, DEFAULT_DEPENDENCIES)])(tree, context);
    };
}
