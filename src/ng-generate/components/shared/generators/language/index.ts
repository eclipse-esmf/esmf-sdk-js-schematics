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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {DefaultEntityInstance, DefaultEnumeration, Property} from '@esmf/aspect-model-loader';
import {dasherize} from '@angular-devkit/core/src/utils/strings';

let sharedOptions: any = {};

export function generateLanguageTranslationAsset(options: any, assetsPath: string, language: string): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        sharedOptions = options;

        return mergeWith(
            apply(url('../shared/generators/language/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: sharedOptions,
                    name: `${language}.${dasherize(options.name)}`,
                    aspectModelName: sharedOptions.aspectModel.name,
                    selectedModelElementName: sharedOptions.selectedModelElement.name,
                    preferredName: sharedOptions.aspectModel.getPreferredName(language),
                    description: sharedOptions.aspectModel.getDescription(language),
                    properties: getProperties(language),
                    blockTransCustomColumns: getBlockTransCustomColumns(),
                    blockTransRowActions: getBlockTransRowActions(),
                    blockCustomCommandBarActions: getBlockCustomCommandBarActions(),
                }),
                move(assetsPath),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
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
        .join('');
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

    if (characteristic instanceof DefaultEnumeration && characteristic.values?.[0] instanceof DefaultEntityInstance) {
        return '';
    }

    if (!(characteristic instanceof DefaultEnumeration) || !characteristic.dataType?.isComplex || !characteristic.values) {
        return '';
    }

    const entityInstanceToString = (entityInstance: DefaultEntityInstance) =>
        `,"${parentPropertyName ? parentPropertyName + '.' : ''}${property.name}.${entityInstance.name}.${
            entityInstance.descriptionKey
        }": "${entityInstance.getDescription(lang) || ''}"`;

    return characteristic.values.map(entityInstanceToString).join('');
}

function getBlockTransCustomColumns(): string {
    const customColumns = sharedOptions.customColumns?.map((cc: string) => `"customColumn.${cc}": "${cc}"`).join(', ');

    return customColumns?.length > 0 ? `${customColumns},` : '';
}

function getBlockTransRowActions(): string {
    const customRowActions = sharedOptions.customRowActions
        ?.map((cr: string, i: number, arr: string[]) => {
            const crReplaced = cr
                .replace(/\.[^/.]+$/, '')
                .replace(/\s+/g, '-')
                .toLowerCase();
            return `"${crReplaced}.customRowAction": "${crReplaced}"`;
        })
        .join(', ');

    return customRowActions?.length > 0 ? `${customRowActions},` : '';
}

function getBlockCustomCommandBarActions(): string {
    const transformActionName = (action: string) => {
        return action
            .replace(/\.[^/.]+$/, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
    };

    const actions = sharedOptions.customCommandBarActions.map(transformActionName);

    const actionStrings = actions.map((action: string, index: number) => `"${action}.customCommandBarAction": "${action}"`);

    return actionStrings.length > 0 ? `${actionStrings},` : '';
}
