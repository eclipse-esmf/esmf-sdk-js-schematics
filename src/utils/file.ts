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
import * as fs from 'fs';
import {DefaultSchema} from '../ng-generate/default-schema';

/* eslint-disable @typescript-eslint/no-var-requires */
const prettier = require('prettier');

// this resolves the config provided by the schematics lib
const defaultPrettierConfigPath = require.resolve('../../.prettierrc');

export const WIZARD_CONFIG_FILE = 'wizard-config.json';

export function loadAndApplyConfigFile(configFile: string, options: any): void {
    try {
        if (options.configFile && options.configFile !== '') {
            const data = fs.readFileSync(configFile, 'utf8');
            Object.assign(options, JSON.parse(data));
        }
    } catch (error) {
        // nothing to do. the file is missing.
    }
}

/**
 * Provide the path to the desired folder.
 */
export interface FolderPathProvider {
    getPath(options: DefaultSchema): string;
}

/**
 * Trigger the formation of the file in the given folder.
 * @param folderProvider Function which returns the path to the folder which includes the files
 * @param fileFilter name of files to format
 */
export function formatGeneratedFiles(folderProvider: FolderPathProvider, options: DefaultSchema, fileFilter?: Array<string>): Rule {
    return async (tree: Tree, context: SchematicContext) => {
        try {
            const folderPath = folderProvider.getPath(options);
            const workingDir = process.cwd();
            let prettierConfigPath = `${workingDir}/.prettierrc`;
            if (!fs.existsSync(prettierConfigPath)) {
                options.spinner.info('Using the prettier config file .prettierrc from the schematics project.');
                prettierConfigPath = defaultPrettierConfigPath;
            }

            await prettier.resolveConfig(prettierConfigPath).then((prettierOptions: {filepath?: any}) => {
                // Options may be null if no file was found
                if (!prettierOptions) {
                    prettierOptions = {};
                    options.spinner.info('No prettier config file .prettierrc found. Using defaults.');
                }

                const dir = tree.getDir(folderPath);
                dir.visit(visitor => {
                    const fileEntry = tree.get(visitor);
                    if (fileEntry && (fileFilter === undefined || fileFilter.find(fileName => fileEntry.path.includes(fileName)))) {
                        prettierOptions.filepath = visitor; // Infer the parser from the file extension
                        const srcFile = fileEntry.content.toString();
                        const dstFile = prettier.format(srcFile, prettierOptions);
                        tree.overwrite(visitor, dstFile);
                        options.spinner.succeed(`Prettier ${visitor}`);
                    }
                });
            });
        } catch (err) {
            options.spinner.fail(`Error error while trying to format the generated files (${err})`);
        }
    };
}

/**
 * Used to handle a specific generation file. If it exists and overwrite is active the file is only updated.
 */
export function createOrOverwrite(tree: Tree, path: string, isOverWrite: boolean, content: string) {
    if (tree.exists(path) && isOverWrite) {
        tree.overwrite(path, content);
    } else {
        tree.create(path, content);
    }
}
