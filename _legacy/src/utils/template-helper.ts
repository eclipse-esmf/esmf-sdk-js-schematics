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
import {classify, dasherize, underscore} from '@angular-devkit/core/src/utils/strings';
// TODO change this ...
import {ExcludedProperty, Schema, Values} from '../ng-generate/components/shared/schema';
import * as locale from 'locale-codes';

export class TemplateHelper {
    /**
     * Sets the template option values.
     * @param {Values} options The template options.
     * @returns {void}
     */
    setTemplateOptionValues(options: Values) {
        options.filterServiceName = `${classify(options.name)}FilterService`;
        options.hasSearchBar = this.hasSearchBar(options);
        options.hasFilters = this.hasFilters(options);
        options.typePath = this.getTypesPath(options.enableVersionSupport, options.aspectModelVersion, options.aspectModel);
        options.dateProperties = this.getDateProperties(options).filter((property: Property) => this.isDateProperty(property));
        options.dateTimeStampProperties = this.getDateProperties(options).filter((property: Property) =>
            this.isDateTimestampProperty(property),
        );
        options.timeProperties = this.getDateProperties(options).filter((property: Property) => this.isTimeProperty(property));
        options.isDateQuickFilter = this.isAddDateQuickFilters(options.enabledCommandBarFunctions);
        options.isEnumQuickFilter = this.isAddEnumQuickFilters(options.enabledCommandBarFunctions);
        options.selectedModelTypeName = this.resolveType(options.selectedModelElement).name;
        options.aspectModelTypeName = this.resolveType(options.aspectModel).name;
        options.localStorageKeyColumns = this.getLocalStorageKeyColumns(options);
        options.localStorageKeyConfig = this.getLocalStorageKeyConfig(options);
        options.versionedAccessPrefix = this.getVersionedAccessPrefix(options);
        options.translationPath = this.getTranslationPath(options);
        options.formatedAspectModelVersion = this.formatAspectModelVersion(options.aspectModelVersion);
        options.listAllProperties = this.getProperties(options);
        options.generationDisclaimerText = this.getGenerationDisclaimerText();
        options.localStoragePrefix = this.getLocalStoragePrefix();
        options.isAspectSelected = this.isAspectSelected(options);
    }

    /**
     * Checks if the given property is a dateTime property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} Whether the property is a date or time property.
     */
    isDateTimeProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return this.isDateProperty(property) || this.isTimeProperty(property) || this.isDateTimestampProperty(property);
    }

    /**
     * Checks if the given property is a dateTimeStamp property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} Whether the property is a date or time property.
     */
    isDateTimestampProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return property.effectiveDataType?.shortUrn === 'dateTime' || property.effectiveDataType?.shortUrn === 'dateTimeStamp';
    }

    /**
     * Checks if the given property is a date property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} Whether the property is a date or time property.
     */
    isDateProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return property.effectiveDataType?.shortUrn === 'date';
    }

    /**
     * Checks if the given property is a time property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} Whether the property is a date or time property.
     */
    isTimeProperty(property: Property) {
        if (!this.isDefaultScalarProperty(property)) {
            return false;
        }

        return property.effectiveDataType?.shortUrn === 'time';
    }

    /**
     * Checks if the given command bar functions include the `addCustomCommandBarActions` function.
     *
     * @param {string[]} commandBarFunctions A list of command bar functions.
     * @returns {boolean} True if the `addCustomCommandBarActions` function is included, False otherwise.
     */
    isAddCustomCommandBarActions(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addCustomCommandBarActions');
    }

    /**
     * Checks if the given command bar functions include the `addDateQuickFilters` function.
     *
     * @param {string[]} commandBarFunctions A list of command bar functions.
     * @returns {boolean} True if the `addDateQuickFilters` function is included, False otherwise.
     */
    isAddDateQuickFilters(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addDateQuickFilters');
    }

    /**
     * Checks if the given command bar functions include the `addEnumQuickFilters` function.
     *
     * @param {string[]} commandBarFunctions A list of command bar functions.
     * @returns {boolean} True if the `addEnumQuickFilters` function is included, False otherwise.
     */
    isAddEnumQuickFilters(commandBarFunctions: string[]) {
        return commandBarFunctions.includes('addEnumQuickFilters');
    }

    /**
     * Returns true if the given property is an enumeration property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} True if the property is an enumeration property.
     */
    isEnumProperty(property: Property) {
        return property.characteristic instanceof DefaultEnumeration;
    }

    /**
     * Returns true if the given property is an enumeration property with entity values.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} True if the property is an enumeration with entity values property.
     */
    isEnumPropertyWithEntityValues(property: Property) {
        if (property.characteristic instanceof DefaultEnumeration && property.characteristic.values?.[0] instanceof DefaultEntityInstance) {
            return false;
        }
        return this.isEnumProperty(property) && property.effectiveDataType instanceof DefaultEntity;
    }

    /**
     * Returns true if the given property is a string property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} True if the property is a string property.
     */
    isStringProperty(property: Property) {
        return property.effectiveDataType ? property.effectiveDataType?.urn.toString().indexOf('string') > -1 : false;
    }

    /**
     * Returns True if the property is a number property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} True if the property is a number property, False otherwise.
     */
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

    /**
     * Returns true if the given property is a multi string property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} True if the property is a multi string property.
     */
    isMultiStringProperty(property: Property) {
        return property.characteristic.name === 'MultiLanguageText';
    }

    /**
     * Returns true if the given property is a link property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} True if the property is a link property.
     */
    isLinkProperty(property: Property): boolean{
        return property.characteristic.name === 'ResourcePath'
    }

    /**
     * Gets all enum properties.
     *
     * @param {Schema} options The schema options.
     * @returns {Array<Property>} The array of enum properties.
     */
    getEnumProperties(options: Schema): Array<Property> {
        return this.getAllProperties(options).filter(
            property =>
                this.isEnumProperty(property) &&
                !options.excludedProperties.find(
                    (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === property.aspectModelUrn,
                ),
        );
    }

    /**
     * Checks if there are any custom command bar actions defined in the provided schema options.
     *
     * @param {Schema} options - The schema options containing potential custom command bar actions.
     * @returns {boolean} - Returns true if there are one or more custom command bar actions, otherwise false.
     */
    haveCustomCommandbarActions(options: Schema): boolean {
        return options.customCommandBarActions.length > 0;
    }

    /**
     * Gets all string properties.
     *
     * @param {Schema} options The schema options.
     * @returns {Array<Property>} The array of string properties.
     */
    getStringProperties(options: Schema): Array<Property> {
        return this.getAllProperties(options).filter(
            property =>
                this.isStringProperty(property) &&
                !options.excludedProperties.find(
                    (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === property.aspectModelUrn,
                ),
        );
    }

    /**
     * Gets all date properties.
     *
     * @param {Schema} options The schema options.
     * @returns {Array<Property>} The array of date properties.
     */
    getDateProperties(options: Schema): Array<Property> {
        return this.getAllProperties(options).filter(
            property =>
                this.isDateTimeProperty(property) &&
                !options.excludedProperties.find(
                    (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === property.aspectModelUrn,
                ),
        );
    }

    /**
     * Gets the payload key for the first value of an enum property that is an entity instance.
     *
     * @param {Property} property The property to get the payload key for.
     * @returns {string} The payload key for the first value of the property, or an empty string if the property is not an enum property or is not an entity instance.
     */
    getEnumEntityInstancePayloadKey(property: Property) {
        if (!(this.isEnumProperty(property) && property.effectiveDataType instanceof DefaultEntity)) {
            return '';
        }

        return ((property.characteristic as DefaultEnumeration).values?.[0] as DefaultEntityInstance).valuePayloadKey;
    }

    /**
     * Gets the properties for the selected model element.
     *
     * @param {Schema | any} options The options for the operation.
     * @param {boolean} generateLabelsForExcludedProps Whether to generate labels for excluded properties.
     * @returns {Array<Property>} The properties for the model element.
     */
    getProperties(options: Schema | any, generateLabelsForExcludedProps = false): Array<Property> {
        if (!generateLabelsForExcludedProps) {
            return this.resolveType(options.selectedModelElement).properties.filter(
                (prop: Property) =>
                    !options.excludedProperties.find(
                        (excludedProp: ExcludedProperty) => excludedProp.propToExcludeAspectModelUrn === prop.aspectModelUrn,
                    ),
            );
        }
        return this.resolveType(options.selectedModelElement).properties;
    }

    /**
     * Gets the properties of a complex property.
     *
     * @param {Property} complexProp The complex property.
     * @param {Schema} options The schema options.
     * @returns {Object} An object with the complex property name and the properties.
     */
    getComplexProperties(complexProp: Property, options: Schema): {complexProp: string; properties: Property[]} {
        const propsToShow = options.complexProps.find(cp => cp.prop === complexProp.name)?.propsToShow;
        const properties = this.getProperties({
            selectedModelElement: complexProp.effectiveDataType as DefaultEntity,
            excludedProperties: options.excludedProperties,
        }).filter((property: Property) => propsToShow?.find((prop: any) => prop.aspectModelUrn === property.aspectModelUrn));

        return {complexProp: complexProp.name, properties: properties};
    }

    /**
     * Recursively resolves all language codes from the given aspect model element.
     *
     * @param {Aspect | Entity} modelElement The aspect model element to start the resolution from.
     * @returns {Set<string>} The set of all language codes found.
     */
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

    /**
     * Resolves the type of the given aspect model element.
     *
     * @param {Aspect | Entity} modelElement - The aspect model element to resolve the type of.
     * @returns {Aspect | Entity} - The resolved type of the model element.
     */
    resolveType(modelElement: Aspect | Entity): Aspect | Entity {
        if (modelElement instanceof DefaultAspect && modelElement.isCollectionAspect) {
            const collectionProperty = modelElement.properties.find(prop => prop.characteristic instanceof DefaultCollection);
            if (collectionProperty?.effectiveDataType?.isComplex) {
                return collectionProperty.effectiveDataType as Entity;
            }
        }
        return modelElement;
    }

    /**
     * Replaces all dots in the version string with empty strings.
     *
     * @param {string} version The version string.
     * @returns {string} The version string with all dots replaced.
     */
    formatAspectModelVersion(version: string): string {
        return version.replace(/\./g, '');
    }

    /**
     * Returns the versioned access prefix for the given options.
     *
     * @param {Schema} options The options for the getVersionedAccessPrefix function.
     * @returns {string} The versioned access prefix.
     */
    getVersionedAccessPrefix(options: Schema): string {
        if (!options.enableVersionSupport) {
            return ``;
        }
        return `${options.selectedModelElement.name.toLowerCase()}.v${this.formatAspectModelVersion(options.aspectModelVersion)}.`;
    }

    /**
     * Converts a string to spinal case.
     *
     * @param text The string to convert.
     * @returns The converted string.
     */
    spinalCase(text: string): string {
        const regex = /\.[^/.]+$/;
        return text.replace(regex, '').replace(regex, '-').toLowerCase();
    }

    /**
     * Returns the path to the shared module.
     *
     * @returns The path to the shared module.
     */
    getSharedModulePath(): string {
        return 'src/app/shared/app-shared.module.ts';
    }

    /**
     * Returns whether the schema has a search bar.
     *
     * @param options The schema options.
     * @returns Whether the schema has a search bar.
     */
    hasSearchBar(options: Schema): boolean {
        return options.enabledCommandBarFunctions.includes('addSearchBar');
    }

    /**
     * Returns whether the schema has filters.
     *
     * @param options The schema options.
     * @returns Whether the schema has filters.
     */
    hasFilters(options: Schema): boolean {
        return (
            this.hasSearchBar(options) ||
            this.isAddDateQuickFilters(options.enabledCommandBarFunctions) ||
            this.isAddEnumQuickFilters(options.enabledCommandBarFunctions)
        );
    }

    private getGenerationDisclaimerText(): string {
        return 'Generated from ESMF JS SDK Angular Schematics - PLEASE DO NOT CHANGE IT';
    }

    /**
     * Returns the prefix for the local storage key.
     *
     * @returns {string} The prefix for the local storage key.
     */
    private getLocalStoragePrefix(): string {
        return `KEY_LOCAL_STORAGE_`;
    }

    /**
     * Checks if the given options indicate that the aspect is selected.
     *
     * @param {Schema} options The options object.
     * @returns {boolean} Whether or not the aspect is selected.
     */
    private isAspectSelected(options: Schema) {
        return options.selectedModelElementUrn === options.aspectModel.aspectModelUrn;
    }

    /**
     * Gets the local storage key for the columns of the given schema.
     *
     * @param {Schema} options The schema.
     * @returns {string} The local storage key.
     */
    private getLocalStorageKeyColumns(options: Schema): string {
        return `${this.getLocalStoragePrefix()}${underscore(options.name)}${
            options.enableVersionSupport ? `_${'v' + options.aspectModelVersion.replace(/\./g, '')}` : ''
        }_columns`.toUpperCase();
    }

    /**
     * Gets the local storage key for the config of the given schema.
     *
     * @param {Schema} options The schema.
     * @returns {string} The local storage key.
     */
    private getLocalStorageKeyConfig(options: Schema): string {
        return `${this.getLocalStoragePrefix()}${underscore(options.name)}${
            options.enableVersionSupport ? `_${'v' + options.aspectModelVersion.replace(/\./g, '')}` : ''
        }_config`.toUpperCase();
    }

    /**
     * Gets the translation path for the given options.
     *
     * @param {Schema} options The options object.
     * @returns {string} The translation path.
     */
    private getTranslationPath(options: Schema): string {
        const translationPath = `${this.getVersionedAccessPrefix(options)}${this.isAspectSelected(options) ? options.jsonAccessPath : ''}`;
        return `${translationPath.length ? translationPath : ''}`;
    }

    /**
     * Checks if the given property is a default scalar property.
     *
     * @param {Property} property The property to check.
     * @returns {boolean} Whether the property is a default scalar property.
     */
    private isDefaultScalarProperty(property: Property) {
        return property.effectiveDataType && property.effectiveDataType?.isScalar && property.effectiveDataType instanceof DefaultScalar;
    }

    /**
     * @function addLocalized
     * @param {Set<string>} languages - The set of languages to add localized strings for.
     * @returns {string[]} - An array of localized strings.
     */
    private addLocalized(languages: Set<string>): string[] {
        return Array.from(languages)
            .map(languageCode => locale.getByTag(languageCode).tag)
            .filter(e => !!e);
    }

    /**
     * Gets all the properties of the schema, including complex properties.
     @private
     @param {Schema} options The schema options.
     @returns {Array<Property>} The array of all properties, including complex properties.
     */
    private getAllProperties(options: Schema) {
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
     * Gets the path to the types file for the specified aspect model.
     *
     * @param {boolean} aspectModelVersionSupport Whether or not the aspect model supports versioned types.
     * @param {string} version The version of the aspect model.
     * @param {Aspect} aspectModel The aspect model.
     * @returns {string} The path to the types file.
     */
    private getTypesPath(aspectModelVersionSupport: boolean, version: string, aspectModel: Aspect): string {
        if (aspectModelVersionSupport) {
            return `../../../types/${dasherize(aspectModel.name)}/v${version.split('.').join('')}/${dasherize(aspectModel.name)}.types`;
        }
        return `../../types/${dasherize(aspectModel.name)}/${dasherize(aspectModel.name)}.types`;
    }
}
