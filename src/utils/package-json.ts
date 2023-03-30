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

import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {JSONFile} from '@schematics/angular/utility/json-file';
import {addPackageJsonDependency, NodeDependency, NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {Ora} from 'ora';

export const DEFAULT_DEPENDENCIES = [
    {type: NodeDependencyType.Dev, version: '~14.2.6', name: '@angular/cdk', overwrite: false},
    {type: NodeDependencyType.Dev, version: '^5.3.1', name: '@types/papaparse', overwrite: false},
    {type: NodeDependencyType.Default, version: '~14.2.6', name: '@angular/material', overwrite: false},
    {type: NodeDependencyType.Default, version: '~14.0.0', name: '@ngx-translate/core', overwrite: false},
    {type: NodeDependencyType.Default, version: '~7.0.0', name: '@ngx-translate/http-loader', overwrite: false},
    {type: NodeDependencyType.Default, version: '^5.3.1', name: 'papaparse', overwrite: false},
];

export function addPackageJsonDependencies(skipImport: boolean, spinner: Ora, dependencies: NodeDependency[] = []): Rule {
    return (host: Tree, context: SchematicContext) => {
        dependencies.forEach(dependency => {
            // Skip anything except peer dependencies if the user won't import dependencies
            if (skipImport && dependency.type !== NodeDependencyType.Peer) {
                spinner.info(`Skip adding "${dependency.name}" as ${dependency.type}`);
                return;
            }
            addPackageJsonDependency(host, dependency);
            spinner.succeed(`Added "${dependency.name}" as ${dependency.type}`);
        });

        return host;
    };
}

export function addPackageJsonScripts(scripts: NodeScript[]): Rule {
    return (host: Tree, context: SchematicContext) => {
        scripts.forEach(script => {
            addPackageJsonScript(host, script);
        });

        return host;
    };
}

interface NodeScript {
    name: string;
    command: string;
    overwrite?: boolean;
}

function addPackageJsonScript(tree: Tree, script: NodeScript, pkgJsonPath = '/package.json'): void {
    const json = new JSONFile(tree, pkgJsonPath);
    const {name, command, overwrite} = script;
    const path = ['scripts', name];
    if (overwrite || !json.get(path)) {
        json.modify(path, command);
    }
}
