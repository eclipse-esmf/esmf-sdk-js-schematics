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

import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {RootFormField} from './RootFormFieldStrategy';

export function generateFormComponent(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const rootFormField = new RootFormField(options, _context);
        const rules = rootFormField.generate();
        return chain(rules)(tree, _context);
    };
}
