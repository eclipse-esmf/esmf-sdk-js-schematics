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

import {virtualFs} from '@angular-devkit/core';
import {dasherize} from '@angular-devkit/core/src/utils/strings';
import {Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {Aspect, AspectModelLoader, DefaultCollection, DefaultEntity, Entity} from '@esmf/aspect-model-loader';
import {Observable, Subscriber} from 'rxjs';
import {TsGenerator} from '../ng-generate/table/generators/ts.generator';
import {Schema as tableSchema} from '../ng-generate/table/schema';
import {Schema as typeSchema} from '../ng-generate/types/schema';
import {createOrOverwrite} from './file';
import {addToAppSharedModule} from './angular';

/**
 * A rule that reads the comma-separated list of files specified as options.aspectModelTFiles
 * and provides them as strings in array options.ttl.
 */
export function loadRDF(options: tableSchema | typeSchema): Rule {
    const func = (tree: Tree, context: SchematicContext) => {
        if (options.aspectModelTFiles === undefined || options.aspectModelTFiles.length <= 0) {
            throw new SchematicsException(
                `No ttl files provided, please provide the ttl files you want to load using the cli param 'aspectModelTFilesString=ttl-file1,ttl-file2'.`
            );
        }

        return new Observable<Tree>((subscriber: Subscriber<Tree>) => {
            if (!Array.isArray(options.aspectModelTFiles)) {
                options.aspectModelTFiles = (options.aspectModelTFiles as string).split(',');
            }
            options.aspectModelTFiles.forEach((aspectModel, index, aspectModels) => {
                const path = `${tree.root.path}${aspectModel.trim()}`;
                const data = tree.read(path);
                if (!data) {
                    throw new SchematicsException(`TTL file not found under '${path}'.`);
                }
                if (!options.ttl) {
                    options.ttl = [];
                }
                options.ttl.push(virtualFs.fileBufferToString(data));
                if (aspectModels.length > 1) {
                    options.spinner.succeed(`Loaded RDF ${index + 1}/${aspectModels.length} from "${path}"`);
                } else {
                    options.spinner.succeed(`Loaded RDF from "${path}"`);
                }
            });
            subscriber.next(tree);
            subscriber.complete();
        });
    };

    return func as unknown as Rule;
}

/**
 * A rule that interprets the provided strings in array options.ttl as RDF and
 * provides the aspect in options.aspectModel.
 */
export function loadAspectModel(options: tableSchema | typeSchema): Rule {
    const func = (tree: Tree, context: SchematicContext) => {
        return new Observable<Tree>((subscriber: Subscriber<Tree>) => {
            const loader = new AspectModelLoader();
            if (options.ttl.length > 1) {
                loader.load('', ...options.ttl).subscribe((aspect: Aspect) => {
                    options.aspectModel = aspect;
                    const prefixPart = aspect.aspectModelUrn.split(':');
                    options.aspectModelVersion = prefixPart[prefixPart.length - 1].split('#')[0];
                    options.selectedModelElement = getSelectedModelElement(loader, aspect, options);
                    options.spinner.succeed(`Loaded Aspect Model "${options.aspectModel.aspectModelUrn}"`);
                    subscriber.next(tree);
                    subscriber.complete();
                });
            } else {
                loader.loadSelfContainedModel(options.ttl[0]).subscribe((aspect: Aspect) => {
                    options.aspectModel = aspect;
                    const prefixPart = aspect.aspectModelUrn.split(':');
                    options.aspectModelVersion = prefixPart[prefixPart.length - 1].split('#')[0];
                    options.selectedModelElement = getSelectedModelElement(loader, aspect, options);
                    options.spinner.succeed(`Loaded Aspect Model "${options.aspectModel.aspectModelUrn}"`);
                    subscriber.next(tree);
                    subscriber.complete();
                });
            }
        });
    };

    return func as unknown as Rule;
}

export function getSelectedModelElement(loader: AspectModelLoader, aspect: Aspect, options: tableSchema | typeSchema): Aspect | Entity {
    const element = loader.findByUrn(options.selectedModelElementUrn);
    if (!element) {
        let collectionElement;
        if (aspect.isCollectionAspect) {
            collectionElement = aspect.properties.find(property => property.characteristic instanceof DefaultCollection);
        }
        return collectionElement && collectionElement.effectiveDataType?.isComplex
            ? (collectionElement.effectiveDataType as Entity)
            : aspect;
    }
    if (element instanceof DefaultEntity) {
        return element as Entity;
    } else {
        return element as Aspect;
    }
}

export function generateTranslationModule(options: tableSchema | typeSchema): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const translationModuleContent = TsGenerator.generateAppSharedModule(options as any);

        if (!tree.exists('src/app/shared/app-shared.module.ts')) {
            tree.create('src/app/shared/app-shared.module.ts', translationModuleContent);
            addToAppSharedModule([{name: 'AppSharedModule', fromLib: './app/shared/app-shared.module'}], false);
        }
    };
}

export function generateTranslationFiles(options: tableSchema): Rule {
    return async () => {
        return (tree: Tree, _context: SchematicContext) => {
            const element = options.selectedModelElement as Aspect | Entity;
            const languages = new Map<string, string>();

            element.properties.forEach(property => {
                property.localesPreferredNames.forEach((locale: string) => languages.set(locale, locale));
                property.localesDescriptions.forEach((locale: string) => languages.set(locale, locale));
            });

            let assetsPath = 'src/assets/i18n/shared/components';
            if (options.enableVersionSupport) {
                const dasherizedAspectModelVersion = `v${options.aspectModelVersion.replace(/\./g, '')}`;
                assetsPath = `${assetsPath}/${dasherize(options.name).toLowerCase()}/${dasherizedAspectModelVersion}`;
            } else {
                assetsPath = `${assetsPath}/${dasherize(options.name).toLowerCase()}`;
            }

            languages.forEach(lang => {
                const langFileName = `${lang}.${dasherize(options.name)}.translation.json`;
                createOrOverwrite(tree, assetsPath + '/' + langFileName, options.overwrite, options.languageGenerator.generate(lang));
            });

            return tree;
        };
    };
}
