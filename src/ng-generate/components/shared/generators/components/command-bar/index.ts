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

import {apply, applyTemplates, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {classify} from '@angular-devkit/core/src/utils/strings';

type PropValue = {
    propertyValue: string;
    propertyName: string;
    isEnum?: boolean;
    enumWithEntities?: boolean;
    isDate?: boolean;
};

export function generateCommandBar(options: any, allProps: Array<Property>): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return mergeWith(
            apply(url('../shared/generators/components/command-bar/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    camelize: strings.camelize,
                    options: options,
                    name: options.name,
                    spinalCaseFunc: options.templateHelper.spinalCase,
                    propValues: getPropertiesToCreateFilters(options, allProps),
                }),
                move(options.path),
            ]),
            options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
        );
    };
}

function getPropertiesToCreateFilters(options: any, allProps: Array<Property>): PropValue[] {
    if (
        !options.templateHelper.isAddEnumQuickFilters(options.enabledCommandBarFunctions) &&
        !options.templateHelper.isAddDateQuickFilters(options.enabledCommandBarFunctions)
    ) {
        return [];
    }

    const propertyValues: PropValue[] = [];
    allProps.forEach((property: Property) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexPropObj = options.templateHelper.getComplexProperties(property, options);
            complexPropObj.properties.forEach((complexProp: Property) => {
                if (options.templateHelper.isEnumProperty(complexProp) || options.templateHelper.isDateTimeProperty(complexProp)) {
                    propertyValues.push({
                        propertyName: `${complexPropObj.complexProp}${classify(complexProp.name)}`,
                        propertyValue: `${complexPropObj.complexProp}.${complexProp.name}`,
                        isEnum: options.templateHelper.isEnumProperty(complexProp),
                        enumWithEntities: options.templateHelper.isEnumPropertyWithEntityValues(complexProp),
                        isDate: options.templateHelper.isDateTimeProperty(complexProp),
                    });
                }
            });
        } else {
            propertyValues.push({
                propertyName: property.name,
                propertyValue: property.name,
                isEnum: options.templateHelper.isEnumProperty(property),
                enumWithEntities: options.templateHelper.isEnumPropertyWithEntityValues(property),
                isDate: options.templateHelper.isDateTimeProperty(property),
            });
        }
    });

    return propertyValues;
}
