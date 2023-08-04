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

import {DefaultSingleEntity, Property} from "@esmf/aspect-model-loader";
import {classify, dasherize} from "@angular-devkit/core/src/utils/strings";
import {Schema} from "./schema";


/**
 * Gets enum properties from provided options and converts them into a string.
 *
 * @param {Schema} options - The options object which should contain 'templateHelper' that provides methods for manipulating templates.
 * @returns {string} - A string of comma-separated, classified enum property names.
 */
export function getEnumProperties(options: Schema): string {
    return options.templateHelper.getEnumProperties(options)
        .map((property: Property) => classify(property.characteristic.name)).join(',')
}

/**
 * Generates enum property definitions for an array of properties.
 *
 * @param {Schema} options - The Schema options object.
 * @param {Array<Property>} allProps - The array of Property objects.
 * @return {string} The enum property definitions string.
 */
export function getEnumPropertyDefinitions(options: Schema, allProps: Array<Property>): string {
    return allProps.map((property: Property) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            return generateComplexEnumDef(options, property);
        } else {
            return generateSimpleEnumDef(options, property);
        }
    }).join('')
}

/**
 * Generates an enum definition string for a complex property.
 *
 * @param {Schema} options - The Schema options object.
 * @param {Property} property - The complex Property object.
 * @return {string} The enum definition string for the complex property.
 */
function generateComplexEnumDef(options: Schema, property: Property): string {
    const complexProps = options.templateHelper.getComplexProperties(property, options);
    return complexProps.properties.map((complexProp: Property) => {
        const propKey = generateKey(`${complexProps.complexProp}_${complexProp.name}`);
        return `${propKey} = '${complexProps.complexProp}.${complexProp.name}',`;
    }).join('');
}

/**
 * Generates an enum definition string for a simple property.
 *
 * @param {Schema} options - The Schema options object.
 * @param {Property} property - The simple Property object.
 * @return {string} The enum definition string for the simple property.
 */
function generateSimpleEnumDef(options: Schema, property: Property): string {
    const propKey = generateKey(property.name);
    return `${propKey} = '${options.jsonAccessPath}${property.name.trim()}',`;
}

/**
 * Generates a standardized key from a given property name.
 *
 * @param {string} name - The property name.
 * @return {string} The standardized key.
 */
function generateKey(name: string): string {
    return dasherize(name).replace(/-/g, '_').toUpperCase();
}
