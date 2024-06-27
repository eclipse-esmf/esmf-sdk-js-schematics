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
import * as fs from 'fs';
import {DefaultSchema} from '../ng-generate/default-schema';
import {format, resolveConfig} from 'prettier';

// this resolves the config provided by the schematics lib
const defaultPrettierConfigPath = require.resolve('../../.prettierrc');

export function loadAndApplyConfigFile(configFile: string, options: any): void {
    try {
        if (configFile && configFile !== '') {
            const data = fs.readFileSync(configFile, 'utf8');
            Object.assign(options, JSON.parse(data));
        }
    } catch (error) {
        console.error('File cannot be found: ' + configFile, error);
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
 * @param options Default schema operations
 * @param fileFilter name of files to format
 */
export function formatGeneratedFiles(folderProvider: FolderPathProvider, options: DefaultSchema, fileFilter?: Array<string>): Rule {
    return async (tree: Tree, context: SchematicContext) => {
        try {
            const folderPath = folderProvider.getPath(options);
            const prettierConfigPath = resolvePrettierConfigPath(options);
            const prettierOptions = await resolvePrettierOptions(prettierConfigPath, options);

            tree.getDir(folderPath).visit(async visitor => {
                const fileEntry = tree.get(visitor);
                if (fileEntry && (fileFilter === undefined || fileFilter.find(fileName => fileEntry.path.includes(fileName)))) {
                    await formatFile(fileEntry, visitor, prettierOptions, options, tree);
                }
            });
        } catch (err) {
            options.spinner.fail(`Error error while trying to format the generated files (${err})`);
        }
    };
}

function resolvePrettierConfigPath(options: DefaultSchema) {
    let prettierConfigPath = `${process.cwd()}/.prettierrc`;

    if (!fs.existsSync(prettierConfigPath)) {
        options.spinner.info('Using the prettier config file .prettierrc from the schematics project.');
        prettierConfigPath = defaultPrettierConfigPath;
    }
    return prettierConfigPath;
}

async function resolvePrettierOptions(prettierConfigPath: string, options: DefaultSchema) {
    let prettierOptions = await resolveConfig(prettierConfigPath);

    if (!prettierOptions) {
        prettierOptions = {};
        options.spinner.info('No prettier config file .prettierrc found. Using defaults.');
    }

    return prettierOptions;
}

async function formatFile(fileEntry: any, visitor: any, prettierOptions: any, options: DefaultSchema, tree: Tree) {
    if (visitor.includes('.ts') || visitor.includes('.json')) {
        prettierOptions.filepath = visitor; // Infer the parser from the file extension
        const srcFile = fileEntry.content.toString();
        await format(srcFile, prettierOptions).then((formattedCode: string) => {
            tree.overwrite(visitor, formattedCode);
        });
        options.spinner.succeed(`Prettier ${visitor}`);
    }
}
