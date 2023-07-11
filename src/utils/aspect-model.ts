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
    Property
} from '@esmf/aspect-model-loader';
import {Observable, Subscriber} from 'rxjs';
import {Schema as tableSchema} from '../ng-generate/table/schema';
import {Schema as typeSchema} from '../ng-generate/types/schema';
import {generateLanguageTranslationAsset} from "../ng-generate/table/generators/language/index";

export type PropValue = {
    propertyValue: string;
    propertyName: string;
    characteristic: string;
    enumWithEntities: boolean;
    property: Property;
    complexPropObj?: { complexProp: string; properties: Property[] };
};

/**
 * A rule that reads the comma-separated list of files specified as options.aspectModelTFiles
 * and provides them as strings in array options.ttl.
 */
export function loadRDF(options: tableSchema | typeSchema): Rule {
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

            options.spinner.succeed(`Loaded RDF ${aspectModelTFiles.length > 1 ? index + 1 + '/' + aspectModelTFiles.length : ''} from "${path}"`);

            return virtualFs.fileBufferToString(data);
        });

        return tree;
    };
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
    const element = loader.findByUrn(options.selectedModelElementUrn) || findCollectionElement(aspect);

    return (element instanceof DefaultEntity) ? element as Entity : element as Aspect;
}

function findCollectionElement(aspect: Aspect): Aspect | Entity | undefined {
    if (!aspect.isCollectionAspect) return undefined;
    const collectionElement = aspect.properties.find(property => property.characteristic instanceof DefaultCollection);
    return collectionElement?.effectiveDataType?.isComplex ? collectionElement.effectiveDataType as Entity : aspect;
}

export function generateTranslationFiles(options: tableSchema): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const element = options.selectedModelElement as Aspect | Entity;

        const languages = new Set([
            ...element.properties.flatMap(property => property.localesPreferredNames),
            ...element.properties.flatMap(property => property.localesDescriptions),
        ]);

        const baseAssetsPath = 'src/assets/i18n/shared/components';
        const aspectModelPath = `/${dasherize(options.name).toLowerCase()}`;
        const versionPath = options.enableVersionSupport ? `/v${options.aspectModelVersion.replace(/\./g, '')}` : '';
        const assetsPath = `${baseAssetsPath}${aspectModelPath}${versionPath}`;

        const translationRules = Array.from(languages, language => generateLanguageTranslationAsset(options, assetsPath, language));

        return chain(translationRules)(tree, _context);
    };
}

export function getAllEnumProps(options: any, allEnumProps: PropValue[]): PropValue[] {
    if (allEnumProps) {
        return allEnumProps;
    }

    const properties = options.templateHelper.getProperties(options);
    const isEnumProperty = options.templateHelper.isEnumProperty;
    const isEnumPropertyWithEntityValues = options.templateHelper.isEnumPropertyWithEntityValues;
    const getEnumEntityInstancePayloadKey = options.templateHelper.getEnumEntityInstancePayloadKey;

    return properties.reduce((acc: PropValue[], property: Property) => {
        const isEnum = isEnumProperty(property);

        // Handle complex properties
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity && isEnum) {
            const complexPropObj = options.templateHelper.getComplexProperties(property, options);
            const complexEnumProps = complexPropObj.properties
                .filter((complexProp: any) => isEnumProperty(complexProp) &&
                    !options.excludedProperties.find((excludedProperty: any) => excludedProperty.propToExcludeAspectModelUrn === complexProp.aspectModelUrn))
                .map((complexProp: any) => ({
                    propertyValue: `${complexPropObj.complexProp}.${complexProp.name}${isEnumPropertyWithEntityValues(complexProp) ? '.' + getEnumEntityInstancePayloadKey(complexProp) : ''}`,
                    propertyName: `${complexPropObj.complexProp}${classify(complexProp.name)}`,
                    characteristic: complexProp.characteristic?.name,
                    enumWithEntities: isEnumPropertyWithEntityValues(complexProp),
                    property: complexProp,
                    complexPropObj: complexPropObj,
                }));

            acc.push(...complexEnumProps);
        }

        // Handle scalar properties
        if (isEnum) {
            acc.push({
                propertyName: property.name,
                propertyValue: `${property.name}${isEnumPropertyWithEntityValues(property) ? '.' + getEnumEntityInstancePayloadKey(property) : ''}`,
                characteristic: property.characteristic?.name,
                enumWithEntities: isEnumPropertyWithEntityValues(property),
                property: property,
            });
        }

        return acc;
    }, []);
}
