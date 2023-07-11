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
    Aspect,
    Characteristic,
    DefaultAspect,
    DefaultCharacteristic,
    DefaultCollection,
    DefaultEntity,
    DefaultEntityInstance,
    DefaultEnumeration,
    DefaultPropertyInstanceDefinition,
    DefaultScalar,
    DefaultSingleEntity,
    Entity,
    Property,
} from '@esmf/aspect-model-loader';
import {dasherize, underscore} from '@angular-devkit/core/src/utils/strings';
import {ExcludedProperty, Schema} from '../ng-generate/table/schema';
import * as locale from 'locale-codes';

export class TemplateHelper {
    isAspectSelected(options: Schema | any) {
        return options.selectedModelElementUrn === options.aspectModel.aspectModelUrn;
    }

    isDateTimeProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return this.isDateProperty(property) || this.isTimeProperty(property) || this.isDateTimestampProperty(property);
    }

    isDateTimestampProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return property.effectiveDataType?.shortUrn === 'dateTime' || property.effectiveDataType?.shortUrn === 'dateTimeStamp';
    }

    isDateProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return property.effectiveDataType?.shortUrn === 'date';
    }

    isTimeProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return property.effectiveDataType?.shortUrn === 'time';
    }

    isAddCommandBarFunctionSearch(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addSearchBar');
    }

    isAddCustomCommandBarActions(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addCustomCommandBarActions');
    }

    isAddDateQuickFilters(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addDateQuickFilters');
    }

    isAddEnumQuickFilters(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addEnumQuickFilters');
    }

    isEnumProperty(property: Property) {
        return property.characteristic instanceof DefaultEnumeration;
    }

    isEnumPropertyWithEntityValues(property: Property) {
        return this.isEnumProperty(property) && property.effectiveDataType instanceof DefaultEntity;
    }

    isStringProperty(property: Property) {
        return property.effectiveDataType ? property.effectiveDataType?.urn.toString().indexOf('string') > -1 : false;
    }

    isNumberProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        if (!property.effectiveDataType) {
            return false;
        }

        const numberShortUrns = [
            'decimal',
            'integer',
            'double',
            'float',
            'short',
            'int',
            'long',
            'unsignedLong',
            'unsignedInt',
            'unsignedShort',
            'positiveInteger',
            'nonNegativeInteger',
            'negativeInteger',
            'nonPositiveInteger',
        ];

        return numberShortUrns.includes(property.effectiveDataType.shortUrn);

    }

    isMultiStringProperty(property: Property) {
        return property.characteristic.name === 'MultiLanguageText';
    }

    getEnumProperties(options: Schema | any): Array<Property> {
        return this.getAllProperties(options).filter(
            property =>
                this.isEnumProperty(property) &&
                !options.excludedProperties.find(
                    (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === property.aspectModelUrn
                )
        );
    }

    getStringProperties(options: Schema | any): Array<Property> {
        return this.getAllProperties(options).filter(
            property =>
                this.isStringProperty(property) &&
                !options.excludedProperties.find(
                    (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === property.aspectModelUrn
                )
        );
    }

    getDateProperties(options: Schema | any): Array<Property> {
        return this.getAllProperties(options).filter(
            property =>
                this.isDateTimeProperty(property) &&
                !options.excludedProperties.find(
                    (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === property.aspectModelUrn
                )
        );
    }

    getEnumEntityInstancePayloadKey(property: Property) {
        if (this.isEnumProperty(property) && property.effectiveDataType instanceof DefaultEntity) {
            return ((property.characteristic as DefaultEnumeration).values[0] as DefaultEntityInstance).valuePayloadKey;
        }

        return '';
    }

    /**
     * Gets a flat list of properties. A property with a complex type will be resolved to
     * the chosen property of the underlying element.
     */
    getAllProperties(options: Schema | any) {
        const properties = this.getProperties(options);
        const resolvedProperties: Array<Property> = [];
        properties
            .filter(prop => prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity)
            .forEach(prop => {
                resolvedProperties.push(...this.getComplexProperties(prop, options).properties);
            });

        return [
            ...properties.filter(prop => !(prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity)),
            ...resolvedProperties,
        ];
    }

    /**
     * Gets a list of properties for the selected model element.
     */
    getProperties(options: Schema | any, generateLabelsForExcludedProps = false): Array<Property> {
        if (!generateLabelsForExcludedProps) {
            return this.resolveType(options.selectedModelElement).properties.filter(
                (prop: Property) =>
                    !options.excludedProperties.find(
                        (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === prop.aspectModelUrn
                    )
            );
        }
        return this.resolveType(options.selectedModelElement).properties;
    }

    /**
     * Gets the resolved properties of the complex object.
     */
    getComplexProperties(complexProp: Property, options: Schema): { complexProp: string; properties: Property[] } {
        const propsToShow = options.complexProps.find(cp => cp.prop === complexProp.name)?.propsToShow;
        const properties = this.getProperties({
            selectedModelElement: complexProp.effectiveDataType as DefaultEntity,
            excludedProperties: options.excludedProperties,
        }).filter((property: Property) => propsToShow?.find((prop: any) => prop.aspectModelUrn === property.aspectModelUrn));

        return {complexProp: complexProp.name, properties: properties};
    }

    resolveAllLanguageCodes(modelElement: Aspect | Entity): Set<string> {
        const allLanguageCodes: Set<string> = new Set();

        const processElement = (element: Aspect | Entity | Property | Characteristic) => {
            const {localesPreferredNames, localesDescriptions} = element;

            localesPreferredNames.forEach(code => allLanguageCodes.add(code));
            localesDescriptions.forEach(code => allLanguageCodes.add(code));

            this.addLocalized(allLanguageCodes);

            if (element instanceof DefaultAspect && element.properties.length >= 1) {
                element.properties.forEach(processElement);
            }

            if (element instanceof DefaultPropertyInstanceDefinition) {
                const characteristic = element.characteristic;
                if (characteristic) {
                    processElement(characteristic);
                }
            }

            if (element instanceof DefaultCharacteristic && element.dataType && element.dataType.isComplex) {
                processElement(<Entity>element.dataType);
            }

            if (element instanceof DefaultEntity && element.isComplex && element.properties) {
                element.properties.forEach(processElement);
            }
        };

        processElement(modelElement);

        return allLanguageCodes;
    }

    addLocalized(languages: Set<string>): string[] {
        return Array.from(languages)
            .map(languageCode => locale.getByTag(languageCode).tag)
            .filter(e => !!e);
    }

    resolveType(modelElement: Aspect | Entity): Aspect | Entity {
        if (modelElement instanceof DefaultAspect && modelElement.isCollectionAspect) {
            const collectionProperty = modelElement.properties.find(prop => prop.characteristic instanceof DefaultCollection);
            if (collectionProperty?.effectiveDataType?.isComplex) {
                return collectionProperty.effectiveDataType as Entity;
            }
        }
        return modelElement;
    }

    getTypesPath(aspectModelVersionSupport: boolean, version: string, aspectModel: Aspect): string {
        if (aspectModelVersionSupport) {
            return `../../../types/${dasherize(aspectModel.name)}/v${version.split('.').join('')}/${dasherize(aspectModel.name)}.types`;
        }
        return `../../types/${dasherize(aspectModel.name)}/${dasherize(aspectModel.name)}.types`;
    }

    formatAspectModelVersion(version: string): string {
        return version.replace(/\./g, '');
    }

    /**
     * Gets prefix for accessing the i18n properties e.g. 'movement.v321.edit.customCommandBarAction'.
     * In this example the prefix is 'movement.v321'.
     */
    getVersionedAccessPrefix(options: Schema): string {
        if (!options.enableVersionSupport) {
            return ``;
        }
        return `${options.selectedModelElement.name.toLowerCase()}.v${this.formatAspectModelVersion(options.aspectModelVersion)}`;
    }

    spinalCase(text: string): string {
        const regex = /\.[^/.]+$/;
        return text.replace(regex, '').replace(regex, '-').toLowerCase();
    }

    getGenerationDisclaimerText(): string {
        return 'Generated from ESMF JS SDK Angular Schematics - PLEASE DO NOT CHANGE IT';
    }

    getLocalStoragePrefix(): string {
        return `KEY_LOCAL_STORAGE_`;
    }

    getLocalStorageKeyColumns(options: Schema): string {
        return `${this.getLocalStoragePrefix()}${underscore(options.name)}${
            options.enableVersionSupport ? `_${'v' + options.aspectModelVersion.replace(/\./g, '')}` : ''
        }_columns`.toUpperCase();
    }

    getLocalStorageKeyConfig(options: Schema): string {
        return `${this.getLocalStoragePrefix()}${underscore(options.name)}${
            options.enableVersionSupport ? `_${'v' + options.aspectModelVersion.replace(/\./g, '')}` : ''
        }_config`.toUpperCase();
    }

    getSharedModulePath(): string {
        return 'src/app/shared/app-shared.module.ts';
    }

    getTranslationPath(options: Schema): string {
        const translationPath = `${this.getVersionedAccessPrefix(options)}${this.isAspectSelected(options) ? options.jsonAccessPath : ''}`;
        return `${translationPath.length ? translationPath + '.' : ''}`;
    }

    private isDefaultScalarProperty(property: Property) {
        return property.effectiveDataType && property.effectiveDataType?.isScalar && property.effectiveDataType instanceof DefaultScalar;
    }
}
