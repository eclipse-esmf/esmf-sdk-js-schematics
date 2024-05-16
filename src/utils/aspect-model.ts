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
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {
    Aspect,
    AspectModelLoader,
    DefaultCollection,
    DefaultEntity,
    DefaultSingleEntity,
    Entity,
    Property,
} from '@esmf/aspect-model-loader';
import {Observable, Subscriber} from 'rxjs';
import {Schema} from '../ng-generate/components/shared/schema';
import {generateLanguageTranslationAsset} from '../ng-generate/components/shared/generators/language/index';

export type PropValue = {
    propertyValue: string;
    propertyName: string;
    characteristic: string;
    enumWithEntities: boolean;
    property: Property;
    complexPropObj?: {complexProp: string; properties: Property[]};
};

export type DatePicker = {
    propertyUrn: string;
    datePicker: {
        type: string;
    };
};

export const assetsPath = 'assets/i18n/shared/components';
export const baseAssetsPath = `src/${assetsPath}`;

/**
 * A rule that reads the comma-separated list of files specified as options.aspectModelTFiles
 * and provides them as strings in array options.ttl.
 */
export function loadRDF(options: Schema): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const aspectModelTFiles = Array.isArray(options.aspectModelTFiles)
            ? options.aspectModelTFiles
            : (options.aspectModelTFiles as string).split(',');

        if (!aspectModelTFiles.length) {
            throw new SchematicsException(
                `No ttl files provided, please provide the ttl files you want to load using the cli param 'aspectModelTFilesString=ttl-file1,ttl-file2'.`
            );
        }

        options.ttl = aspectModelTFiles.map((aspectModel, index) => {
            const path = `${tree.root.path}${aspectModel.trim()}`;
            const data = tree.read(path);

            if (!data) {
                throw new SchematicsException(`TTL file not found under '${path}'.`);
            }

            options.spinner.succeed(
                `Loaded RDF ${aspectModelTFiles.length > 1 ? index + 1 + '/' + aspectModelTFiles.length : ''} from "${path}"`
            );

            return virtualFs.fileBufferToString(data);
        });

        return tree;
    };
}

/**
 * A rule that interprets the provided strings in array options.ttl as RDF and
 * provides the aspect in options.aspectModel.
 */
export function loadAspectModel(options: Schema): Rule {
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

export function validateUrns(options: Schema): void {
    // if defined, validate URN otherwise the default (all properties 'samm:properties ( ... ) '
    // of the Aspect definition '... a samm:Aspect' is used
    if (options.selectedModelElementUrn && options.selectedModelElementUrn !== '') {
        if (!options.selectedModelElementUrn.includes('#')) {
            options.spinner?.fail(`URN ${options.selectedModelElementUrn} is not valid.`);
        }
    }
}

export function getSelectedModelElement(loader: AspectModelLoader, aspect: Aspect, options: Schema): Aspect | Entity {
    const element = loader.findByUrn(options.selectedModelElementUrn) || findCollectionElement(aspect);

    return element instanceof DefaultEntity ? (element as Entity) : (element as Aspect);
}

function findCollectionElement(aspect: Aspect): Aspect | Entity | undefined {
    if (!aspect.isCollectionAspect) return undefined;
    const collectionElement = aspect.properties.find(property => property.characteristic instanceof DefaultCollection);
    return collectionElement?.effectiveDataType?.isComplex ? (collectionElement.effectiveDataType as Entity) : aspect;
}

export function generateTranslationFiles(options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const element = options.selectedModelElement as Aspect | Entity;

        const languages = new Set([
            ...element.properties.flatMap(property => property.localesPreferredNames),
            ...element.properties.flatMap(property => property.localesDescriptions),
        ]);

        if (!languages.size) {
            languages.add('en');
        }

        const aspectModelPath = `/${dasherize(options.name).toLowerCase()}`;
        const versionPath = options.enableVersionSupport ? `/v${options.aspectModelVersion.replace(/\./g, '')}` : '';
        const assetsPath = `${baseAssetsPath}${aspectModelPath}${versionPath}`;

        const translationRules = Array.from(languages, language => generateLanguageTranslationAsset(options, assetsPath, language));

        return chain(translationRules)(tree, _context);
    };
}

export function getAllEnumProps(options: any): PropValue[] {
    const enumProps: PropValue[] = [];
    options.templateHelper.getProperties(options).forEach((property: Property) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexPropObj = options.templateHelper.getComplexProperties(property, options);
            complexPropObj.properties.forEach((complexProp: Property) => {
                if (
                    options.templateHelper.isEnumProperty(complexProp) &&
                    !options.excludedProperties.find(
                        (excludedProperty: any) => excludedProperty.propToExcludeAspectModelUrn === complexProp.aspectModelUrn
                    )
                ) {
                    const propertyName = `${complexPropObj.complexProp}${classify(complexProp.name)}`;
                    const propertyValue = `${complexPropObj.complexProp}.${complexProp.name}${
                        options.templateHelper.isEnumPropertyWithEntityValues(complexProp)
                            ? '.' + options.templateHelper.getEnumEntityInstancePayloadKey(complexProp)
                            : ''
                    }`;

                    enumProps.push({
                        propertyValue: propertyValue,
                        propertyName: propertyName,
                        characteristic: complexProp.characteristic?.name,
                        enumWithEntities: options.templateHelper.isEnumPropertyWithEntityValues(complexProp),
                        property: complexProp,
                        complexPropObj: complexPropObj,
                    });
                }
            });
        } else if (options.templateHelper.isEnumProperty(property)) {
            enumProps.push({
                propertyName: property.name,
                propertyValue: `${property.name}${
                    options.templateHelper.isEnumPropertyWithEntityValues(property)
                        ? '.' + options.templateHelper.getEnumEntityInstancePayloadKey(property)
                        : ''
                }`,
                characteristic: property.characteristic?.name,
                enumWithEntities: options.templateHelper.isEnumPropertyWithEntityValues(property),
                property: property,
            });
        }
    });
    return enumProps;
}
