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
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from "@angular-devkit/core";
import {DefaultEntityInstance, DefaultEnumeration, Property} from "@esmf/aspect-model-loader";
import {dasherize} from "@angular-devkit/core/src/utils/strings";

let sharedOptions: any = {};

export function languageTranslationAsset(options: any, assetsPath: string, language: string): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        sharedOptions = options;

        const langFileName = `${language}.${dasherize(options.name)}`;

        return mergeWith(
            apply(url('./generators/language/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: sharedOptions,
                    name: langFileName,
                    hasSearchBar: sharedOptions.hasSearchBar,
                    aspectModelName: sharedOptions.aspectModel.name,
                    selectedModelElementName: sharedOptions.selectedModelElement.name,
                    hasDateQuickFilter: sharedOptions.templateHelper.isAddDateQuickFilters(sharedOptions.enabledCommandBarFunctions),
                    hasEnumQuickFilter: sharedOptions.templateHelper.isAddEnumQuickFilters(sharedOptions.enabledCommandBarFunctions),
                    isAspectSelected: sharedOptions.templateHelper.isAspectSelected(sharedOptions),
                    formatAspectModelVersion: sharedOptions.templateHelper.formatAspectModelVersion(sharedOptions.aspectModelVersion),
                    getPreferredName: sharedOptions.aspectModel.getPreferredName(language),
                    getDescription: sharedOptions.aspectModel.getDescription(language),
                    getProperties: getProperties(language),
                    getBlockTransCustomColumns: getBlockTransCustomColumns(),
                    getBlockTransRowActions: getBlockTransRowActions(),
                    getBlockCustomCommandBarActions: getBlockCustomCommandBarActions(),
                }),
                move(assetsPath),
            ]),
            MergeStrategy.Overwrite
        );
    };
}

function getProperties(language: string) {
    return sharedOptions.templateHelper
        .getProperties(sharedOptions, sharedOptions.getExcludedPropLabels)
        .map((property: Property) => {
            return `
                "${property.name}.preferredName": "${property.getPreferredName(language) || property.name}",
                "${property.name}.description": "${property.getDescription(language)}",
                ${getBlockEntityInstance(property, language)}
                ${getBlockTransEntity(property, language)}`;
        })
        .join('')
}

function getBlockTransEntity(property: Property, lang: string): string {
    if (property.effectiveDataType?.isComplex) {
        return (property.effectiveDataType as any).properties
            .map((effProp: Property) => {
                const {name} = effProp;
                const preferredName = effProp.getPreferredName(lang) || name;
                const description = effProp.getDescription(lang);
                const blockEntityInstance = getBlockEntityInstance(effProp, lang, property.name);

                return `
                    "${property.name}.${name}.preferredName": "${preferredName}",
                    "${property.name}.${name}.description": "${description}",
                    ${blockEntityInstance}`;
            })
            .join('');
    }
    return '';
}

function getBlockEntityInstance(property: Property, lang: string, parentPropertyName = ''): string {
    const {characteristic} = property;
    if (!(characteristic instanceof DefaultEnumeration) || !characteristic.dataType?.isComplex || !characteristic.values) {
        return '';
    }

    const entityInstanceToString = (entityInstance: DefaultEntityInstance) =>
        `,"${parentPropertyName ? parentPropertyName + '.' : ''}${property.name}.${entityInstance.name}.${entityInstance.descriptionKey}": "${entityInstance.getDescription(lang) || ''}"`;

    return characteristic.values.map(entityInstanceToString).join('');
}

function getBlockTransCustomColumns(): string {
    return sharedOptions.customColumns
        .map((cc: string) => `"customColumn.${cc}": "${cc}"`)
        .join(', ');
}

function getBlockTransRowActions(): string {
    const customRowActions = sharedOptions.customRowActions.map((cr: string, i: number, arr: string[]) => {
        const crReplaced = cr.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-').toLowerCase();
        const prefix = i === 0 ? ', ' : '';
        const suffix = i < arr.length - 1 ? ',' : '';
        return `${prefix}"${crReplaced}.customRowAction": "${crReplaced}"${suffix}`;
    });

    return customRowActions.join('');
}

function getBlockCustomCommandBarActions(): string {
    const transformActionName = (action: string) => {
        return action.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-').toLowerCase();
    };

    const actions = sharedOptions.customCommandBarActions.map(transformActionName);

    const actionStrings = actions.map((action: string, index: number) => {
        const trailingComma = index < actions.length - 1 ? ',' : '';
        return `", ${action}.customCommandBarAction": "${action}"${trailingComma}`;
    });

    return `${actionStrings.join('')}`;
}
