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

import {Schema as ComponentSchema} from '@schematics/angular/component/schema';
import {DefaultSchema} from '../../default-schema';
import {Property} from '@esmf/aspect-model-loader';

export enum ComponentType {
    TABLE = 'table',
    CARD = 'card',
}
export interface ExcludedProperty {
    /**
     * Name of the parent property which include the child property. Empty if the property
     * is on the root, and it is not part of a complex Entity
     **/
    prop: string;

    /**
     * URN of the field to exclude
     */
    propToExcludeAspectModelUrn: string;
}

export interface ComplexEntityProperty {
    /**
     * Name of the parent property which include the child property. Empty if the property
     * is on the root, and it is not part of a complex Entity
     **/
    prop: string;
    /**
     * Properties of teh complex entity to show
     */
    propsToShow: {
        name: string;
        aspectModelUrn: string;
    };
}

export interface Schema extends ComponentSchema, DefaultSchema {
    name: string;
    defaultSortingCol: string;
    addCommandBar: boolean;
    enableRemoteDataHandling: boolean;
    customRemoteService: boolean;
    enabledCommandBarFunctions: string[];
    chooseLanguageForSearch: string;
    customCommandBarActions: string[];
    enableVersionSupport: boolean;
    excludedProperties: ExcludedProperty[];
    getExcludedPropLabels: boolean;
    jsonAccessPath: string;
    customStyleImports: [];
    overwrite: boolean;
    complexProps: Array<{prop: string; propsToShow: ComplexEntityProperty[]}>;
    skipInstall: boolean;
    getOptionalMaterialTheme: boolean;
    skipImport: boolean;
    componentType: ComponentType;
}

export interface Values extends Schema {
    filterServiceName: string;
    hasSearchBar: boolean;
    hasFilters: boolean;
    typePath: string;
    dateProperties: Property[];
    dateTimeStampProperties: Array<Property>;
    timeProperties: Array<Property>;
    generationDisclaimerText: string;
    isDateQuickFilter: boolean;
    isEnumQuickFilter: boolean;
    selectedModelTypeName: string;
    aspectModelTypeName: string;
    localStorageKeyColumns: string;
    localStoragePrefix: string;
    localStorageKeyConfig: string;
    versionedAccessPrefix: string;
    translationPath: string;
    isAspectSelected: boolean;
    formatedAspectModelVersion: string;
    listAllProperties: Array<Property>;
}
