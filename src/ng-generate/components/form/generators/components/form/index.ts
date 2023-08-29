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
import {strings} from '@angular-devkit/core';
import {Characteristic, DefaultEnumeration, DefaultSingleEntity, Property} from "@esmf/aspect-model-loader";

let allProps: Array<Property> = [];

export function generateFormComponent(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        allProps = options.listAllProperties.filter((property: Property) => (property.characteristic instanceof DefaultSingleEntity) || (<Characteristic>property.characteristic)?.dataType?.isScalar);

        return mergeWith(
            apply(url('./generators/components/form/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: options,
                    name: options.name,
                    allProps: allProps,
                    inputType: getInputType,
                    dateTypeValidation: getDateTypeValidation,
                    Enumeration: DefaultEnumeration
                }),
                move(options.path),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}

function getInputType(property: Property) {
    const urn = property.characteristic.dataType?.shortUrn;

    if (urn === 'string' || urn === 'longString' || urn === 'hexBinary' || urn === 'curie' || urn === 'base64Binary') {
        return 'text';
    }

    if (urn === 'byte' || urn === 'float' || urn === 'decimal' || urn === 'double' || urn === 'integer' || urn === 'int'
        || urn === 'positiveInteger' || urn === 'long' || urn === 'negativeInteger' || urn === 'nonPositiveInteger'
        || urn === 'nonNegativeInteger' || urn === 'short' || urn === 'unsignedInt' || urn === 'unsignedByte' || urn === 'unsignedLong' || urn === 'unsignedShort') {
        return 'number';
    }

    if (urn === 'date' || urn === 'dateTime' || urn === 'dataTimeStamp' || urn === 'dayTimeDuration' || urn === 'duration'
        || urn === 'gDay' || urn === 'gMonth' || urn === 'gMonthDay' || urn === 'gYearMonth' || urn === 'time'
        || urn === 'yearMonthDuration') {
        return 'date';
    }

    return urn;
}

function getDateTypeValidation(property: Property) {
    const urn = property.characteristic.dataType?.shortUrn;

    if (urn === 'byte') {
        return [-128, 127];
    }

    if (urn === 'short') {
        return [-32768, 32767];
    }

    if (urn === 'integer' || urn === 'int') {
        return [-2147483648, 2147483647];
    }

    if (urn === 'unsignedByte') {
        return [0, 255];
    }

    if (urn === 'unsignedShort') {
        return [0, 65535];
    }

    if (urn === 'unsignedInt') {
        return [0, 4294967295];
    }

    if (urn === 'positiveInteger' || urn === 'int') {
        return [1, 2147483647];
    }

    if (urn === 'negativeInteger' || urn === 'int') {
        return [-2147483648, -1];
    }

    if (urn === 'nonPositiveInteger' || urn === 'int') {
        return [0, 2147483647];
    }

    if (urn === 'nonNegativeInteger' || urn === 'int') {
        return [-2147483648, 0];
    }

    return [];
}
