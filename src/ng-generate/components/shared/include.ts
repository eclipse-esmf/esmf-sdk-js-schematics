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

import {applyContentTemplate, FileEntry, Rule, SchematicContext, SchematicsException, Tree, url} from '@angular-devkit/schematics';
import {basename, dirname} from 'path';
import {strings} from '@angular-devkit/core';
import {Schema} from './schema';

/**
 * Type definition for the function to include a template.
 */
type IncludeFunction = (path: string, data?: Schema) => string;

/**
 * Context for the template include function.
 */
interface IncludeContext {
    includeBaseDirectory?: string;
    context: SchematicContext;
    include: IncludeFunction;
    data: Schema;
}

/**
 * Prepares the context for including templates and binds the necessary context.
 *
 * @param {SchematicContext} context - The schematic context.
 * @param {Rule} applyTemplate - Rule to apply the template.
 * @param {Schema} options - Schema data.
 * @param {string} [includeBaseDirectory] - Base directory for includes.
 * @returns {Rule} Bound template rule.
 */
export function templateInclude(context: SchematicContext, applyTemplate: Rule, options: Schema, includeBaseDirectory?: string): Rule {
    const includeContext = createIncludeContext(context, options, includeBaseDirectory);
    (options as any).include = includeContext.include;

    return applyTemplate.bind(includeContext);
}

/**
 * Creates the include context with the provided parameters.
 *
 * @param {SchematicContext} context - The schematic context.
 * @param {Schema} data - Schema data.
 * @param {string} [includeBaseDirectory] - Base directory for includes.
 * @returns {IncludeContext} Formed include context.
 */
function createIncludeContext(context: SchematicContext, data: Schema, includeBaseDirectory?: string): IncludeContext {
    const includeContext: Partial<IncludeContext> = {context, data};

    includeContext.includeBaseDirectory = includeBaseDirectory;
    includeContext.include = include.bind(includeContext);

    return includeContext as IncludeContext;
}

/**
 * Includes and applies the content template from the provided filepath.
 *
 * @this {IncludeContext}
 * @param {string} filepath - Path to the file.
 * @param {Schema} [templateData] - Data for the template.
 * @returns {string} Processed template content.
 */
export function include(this: IncludeContext, filepath: string, templateData: Schema = this.data): string {
    const {directory, filename} = getDirectoryAndFilename(filepath, this.includeBaseDirectory);
    const tree = createTreeFromSource(this.context, directory);

    validateTreeContainsFile(tree, filename);

    const result = generateContentTemplate(templateData, tree.get(filename)!);

    return result.content.toString();
}

/**
 * Determines the directory and filename from the given filepath.
 *
 * @param {string} filepath - Full path to the file.
 * @param {string} [includeBaseDirectory] - Base directory for includes.
 * @returns {Object} Directory and filename details.
 */
function getDirectoryAndFilename(
    filepath: string,
    includeBaseDirectory?: string,
): {
    directory: string;
    filename: string;
} {
    return {
        directory: includeBaseDirectory || dirname(filepath),
        filename: includeBaseDirectory ? filepath : basename(filepath),
    };
}

/**
 * Creates a tree from a source directory.
 *
 * @param {SchematicContext} context - The schematic context.
 * @param {string} directory - The directory path.
 * @returns {Tree} The generated tree.
 */
function createTreeFromSource(context: SchematicContext, directory: string): Tree {
    return url(directory)(context) as Tree;
}

/**
 * Validates that the tree contains the specified filename.
 *
 * @param {Tree} tree - The tree to check.
 * @param {string} filename - The filename to validate.
 */
function validateTreeContainsFile(tree: Tree, filename: string) {
    if (!tree.exists(filename)) {
        throw new SchematicsException(`Template file: "${filename}" not found.`);
    }
}

/**
 * Generates a content template from provided data and file.
 *
 * @param {Schema} templateData - Data for the template.
 * @param {FileEntry} file - The file to generate content for.
 * @returns {FileEntry} Processed file.
 */
function generateContentTemplate(templateData: Schema, file: FileEntry): FileEntry {
    const result = applyContentTemplate({
        classify: strings.classify,
        dasherize: strings.dasherize,
        camelize: strings.camelize,
        options: {...templateData},
        name: templateData.name,
    })(file);

    if (!result) {
        throw new SchematicsException('Problem generating content template.');
    }

    return result;
}
