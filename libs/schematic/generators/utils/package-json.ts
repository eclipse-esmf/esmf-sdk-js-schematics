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

import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {addPackageJsonDependency, NodeDependency, NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {JSONFile} from '@schematics/angular/utility/json-file';
import {Ora} from 'ora';

interface NodeScript {
  name: string;
  command: string;
  overwrite?: boolean;
}

export const DEFAULT_DEPENDENCIES = [
  {type: NodeDependencyType.Dev, version: '^5.3.14', name: '@types/papaparse', overwrite: false},
  {type: NodeDependencyType.Default, version: '~19.2.8', name: '@angular/cdk', overwrite: false},
  {type: NodeDependencyType.Default, version: '~19.2.8', name: '@angular/material', overwrite: false},
  {type: NodeDependencyType.Default, version: '^7.5.1', name: '@jsverse/transloco', overwrite: false},
  {type: NodeDependencyType.Default, version: '^7.0.2', name: '@jsverse/transloco-utils', overwrite: false},
  {type: NodeDependencyType.Default, version: '^5.4.1', name: 'papaparse', overwrite: false},
  {type: NodeDependencyType.Default, version: '^1.0.1', name: 'path-browserify', overwrite: false},
];

export const REMOTE_HANDLING_DEPENDENCIES = [
  {type: NodeDependencyType.Default, version: '~0.10.0', name: 'rollun-ts-rql', overwrite: false},
  {type: NodeDependencyType.Default, version: '~4.2.0', name: 'crypto-js', overwrite: false},
];

export const DATE_QUICK_FILTER_DEPENDENCIES = [
  {type: NodeDependencyType.Default, version: '~19.2.8', name: '@angular/material-moment-adapter', overwrite: false},
];

export function addPackageJsonDependencies(skipImport: boolean, spinner: Ora, dependencies: NodeDependency[] = []): Rule {
  return (host: Tree, context: SchematicContext) => {
    dependencies
      .filter(dependency => !skipImport || dependency.type === NodeDependencyType.Peer)
      .forEach(dependency => {
        addPackageJsonDependency(host, dependency);
        spinner.succeed(`Added "${dependency.name}" as ${dependency.type}`);
      });

    return host;
  };
}

export function addPackageJsonScripts(scripts: NodeScript[]): Rule {
  return (host: Tree) => {
    scripts.forEach(script => addPackageJsonScript(host, script));
    return host;
  };
}

function addPackageJsonScript(tree: Tree, script: NodeScript, pkgJsonPath = '/package.json'): void {
  const json = new JSONFile(tree, pkgJsonPath);
  const {name, command, overwrite} = script;
  const path = ['scripts', name];
  if (overwrite || !json.get(path)) {
    json.modify(path, command);
  }
}
