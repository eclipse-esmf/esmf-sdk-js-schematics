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
import {strings} from "@angular-devkit/core";
import {DefaultSingleEntity, Property} from "@esmf/aspect-model-loader";

let sharedOptions: any = {};

export function dataSource(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        sharedOptions = options;

        return mergeWith(
            apply(url('./generators/data-source/files'), [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    options: sharedOptions,
                    name: sharedOptions.name,
                    getGenerationDisclaimerText: sharedOptions.templateHelper.getGenerationDisclaimerText(),
                    aspectModelName: sharedOptions.templateHelper.resolveType(sharedOptions.aspectModel).name,
                    getTypesPath: sharedOptions.templateHelper.getTypesPath(sharedOptions.enableVersionSupport, sharedOptions.aspectModelVersion, sharedOptions.aspectModel),
                    getSorting: getSorting(),
                }),
                move(sharedOptions.path),
            ]),
            MergeStrategy.Overwrite
        );
    };
}

function getSorting(): string {
   return sharedOptions.templateHelper.getProperties(sharedOptions)
        .flatMap((prop: Property) => getSortingProperties(prop)). join('');
}

function getSortingProperties(prop: Property): string[] {
    const properties: string[] = [];

    if (prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity) {
        const complexProps = sharedOptions.templateHelper.getComplexProperties(prop, sharedOptions);
        properties.push(...complexProps.properties
            .filter(isNotExcludedAndScalarOrEnum)
            .map((complexProp: Property) => getCompareLogicForProperty(complexProp, `${complexProps.complexProp}.${complexProp.name}`))
        );
    }

    if (isNotExcludedAndScalarOrEnum(prop)) {
        properties.push(getCompareLogicForProperty(prop));
    }

    return properties;
}

function isNotExcludedAndScalarOrEnum(prop: Property): boolean {
    const isExcluded = sharedOptions.excludedProperties.some((excludedProp: any) => excludedProp.propToExcludeAspectModelUrn === prop.aspectModelUrn);
    const isScalarOrEnumWithEntityValues = (prop.effectiveDataType && prop.effectiveDataType.isScalar) ||
        sharedOptions.templateHelper.isEnumPropertyWithEntityValues(prop);

    return !isExcluded && isScalarOrEnumWithEntityValues;
}

function getCompareLogicForProperty(prop: Property, propName: string = !sharedOptions.templateHelper.isAspectSelected(sharedOptions) ? `${sharedOptions.jsonAccessPath}${prop.name}` : prop.name) {
    const isEnumPropertyWithEntityValues = sharedOptions.templateHelper.isEnumPropertyWithEntityValues(prop);
    const isEnumProperty = sharedOptions.templateHelper.isEnumProperty(prop);
    const isStringProperty = sharedOptions.templateHelper.isStringProperty(prop);
    const isMultiStringProperty = sharedOptions.templateHelper.isMultiStringProperty(prop);

    if (isEnumPropertyWithEntityValues) {
        const valuePayloadKey = sharedOptions.templateHelper.getEnumEntityInstancePayloadKey(prop);
        return `case '${propName}': return this.compare(a.${propName}.${valuePayloadKey}.toString(),b.${propName}.${valuePayloadKey}.toString(), isSortingAsc);`;
    } else if (isEnumProperty && isStringProperty) {
        return `case '${propName}': return this.compare(a.${propName}.toString(),b.${propName}.toString(), isSortingAsc);`;
    } else if (isMultiStringProperty) {
        return `case '${propName}': return this.compare(a.${propName} ? a.${propName}[this.translateService.currentLang] : '', b.${propName} ? b.${propName}[this.translateService.currentLang] : '', isSortingAsc);`;
    } else {
        return `case '${propName}': return this.compare(a.${propName}, b.${propName}, isSortingAsc);`;
    }
}
