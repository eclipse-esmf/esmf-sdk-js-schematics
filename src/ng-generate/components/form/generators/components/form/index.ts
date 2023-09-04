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
import {
    Characteristic, DefaultCollection,
    DefaultEnumeration,
    DefaultList,
    DefaultSingleEntity, Entity,
    Property
} from "@esmf/aspect-model-loader";
import {templateInclude} from "../../../../shared/include";
import {
    getEnumPropertyDefinitions,
    getTableColumValues,
    resolveDateTimeFormat,
    resolveJsPropertyType
} from "../../../../shared/utils";

let sharedOptions: any = {};

export function generateFormComponent(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        sharedOptions = options;
        sharedOptions['allProps'] = options.listAllProperties.filter((property: Property) => (property.characteristic instanceof DefaultSingleEntity) || property.characteristic instanceof DefaultList || (<Characteristic>property.characteristic)?.dataType?.isScalar);
        sharedOptions['listProps'] = options.listAllProperties.filter((property: Property) => (property.characteristic instanceof DefaultList));

        sharedOptions['tableColumValues'] = getTableColumValues;
        sharedOptions['resolveDateTimeFormat'] = resolveDateTimeFormat;
        sharedOptions['inputType'] = getInputType;
        sharedOptions['dateTypeValidation'] = getDateTypeValidation;
        sharedOptions['enumeration'] = DefaultEnumeration;
        sharedOptions['collection'] = DefaultCollection;

        // TODO remove elementChar case and clarify with Andreas T. we only say for now list .. DataType really simple remove all elementChar ...
        return mergeWith(
            apply(url('./generators/components/form/files'), [
                templateInclude(_context, applyTemplate, sharedOptions, '../shared/methods'),
                move(sharedOptions.path),
            ]),
            sharedOptions.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}

function applyTemplate(): Rule {
    return applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        options: sharedOptions,
        name: sharedOptions.name,
        enumPropertyDefinitions: getEnumPropertyDefinitions(sharedOptions, sharedOptions.listProps),
        resolveJsPropertyType: resolveJsPropertyType,
    });
}

function getInputType(property: Property) {
    const urn = property.characteristic.dataType?.shortUrn;

    if (urn === 'string' || urn === 'anyUri' || urn === 'hexBinary' || urn === 'curie' || urn === 'base64Binary') {
        return 'text';
    }

    if (urn === 'langString') {
        return 'textArea'
    }

    if (urn === 'byte' || urn === 'float' || urn === 'decimal' || urn === 'double' || urn === 'integer' || urn === 'int'
        || urn === 'positiveInteger' || urn === 'long' || urn === 'negativeInteger' || urn === 'nonPositiveInteger'
        || urn === 'nonNegativeInteger' || urn === 'short' || urn === 'unsignedInt' || urn === 'unsignedByte' || urn === 'unsignedLong' || urn === 'unsignedShort') {
        return 'number';
    }

    if (urn === 'date' || urn === 'gDay' || urn === 'gMonth' || urn === 'gMonthDay' || urn === 'gYearMonth') {
        return 'date';
    }

    if (urn === 'dateTime' || urn === 'dataTimeStamp' || urn === 'dayTimeDuration' || urn === 'duration' || urn === 'time' || urn === 'yearMonthDuration') {
        return 'dateTime'
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
