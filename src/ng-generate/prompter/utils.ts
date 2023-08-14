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

import {AspectModelLoader, DefaultEntity, Property} from '@esmf/aspect-model-loader';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {Subscriber} from 'rxjs';
import fs from 'fs';
import {WIZARD_CONFIG_FILE} from './index';

interface PropertyDetail {
    name: string;
    aspectModelUrn: string;
}

interface ComplexProperty {
    prop: string;
    entityUrn: string;
    propsToShow: PropertyDetail[];
}

export const loader = new AspectModelLoader();

/**
 * Reorders the array of TTL files, placing the specified TTL file (aspectModelUrnToLoad) at the beginning.
 * If aspectModelUrnToLoad does not exist in the array, the original array is returned.
 *
 * @param {Array<string>} aspectModelTFiles - The array of TTL file URNs.
 * @param {string} aspectModelUrnToLoad - The URN of the TTL file to be moved to the beginning of the array.
 * @param {any} tree - A tree data structure (not currently used in this function).
 *
 * @returns {Array<string>} The reordered array of TTL file URNs.
 */
export function reorderAspectModelUrnToLoad(aspectModelTFiles: Array<string>, aspectModelUrnToLoad: string, tree: any): Array<string> {
    if (aspectModelTFiles.includes(aspectModelUrnToLoad)) {
        return [aspectModelUrnToLoad, ...aspectModelTFiles.filter((item: string) => item !== aspectModelUrnToLoad)];
    }

    return aspectModelTFiles;
}

/**
 * Takes a property and a list of complex properties, and returns an object
 * containing the property's name, its entity URN, and an array of properties
 * to show. Each of these properties to show is an object with name and aspectModelUrn properties.
 *
 * @param {Property} property - The property to handle.
 * @param {Array<string>} complexPropList - The list of complex properties.
 *
 * @returns {Object} The object with prop, entityUrn and propsToShow properties.
 */
export function handleComplexPropList(property: Property, complexPropList: Array<ComplexProperty>) {
    return {
        prop: property.name,
        entityUrn: (property.effectiveDataType as DefaultEntity).aspectModelUrn,
        propsToShow: complexPropList.map((property: any) => {
            const findByUrn = loader.findByUrn(property);
            const name = findByUrn ? findByUrn.name : property.split('#')[1];
            const aspectModelUrn = findByUrn ? findByUrn.aspectModelUrn : property;
            return {name, aspectModelUrn} as PropertyDetail;
        }),
    } as ComplexProperty;
}

/**
 * Writes a configuration to a file and then exits. If an error occurs during
 * the file writing process, it is thrown. Upon successful write, a message
 * is logged to the console and the subscriber are notified of completion.
 *
 * @param {Subscriber<Tree>} subscriber - The subscriber to notify of completion.
 * @param {Tree} tree - The tree to pass to the subscriber.
 * @param {any} config - The configuration to write to the file.
 * @param {boolean} [fromImport=false] - A flag to indicate if the operation is from an import.
 */
export function writeConfigAndExit(subscriber: Subscriber<Tree>, tree: Tree, config: any, fromImport = false) {
    fs.writeFile(WIZARD_CONFIG_FILE, JSON.stringify(config), 'utf8', error => {
        if (error) {
            console.log('Error during serialization process');
            throw error;
        }

        console.log(
            '\x1b[33m%s\x1b[0m',
            fromImport
                ? `The import was successful, the config used for your generation can be found here: ${WIZARD_CONFIG_FILE}`
                : `New config file was generated based on your choices, it can be found here: ${WIZARD_CONFIG_FILE}`
        );

        subscriber.next(tree);
        subscriber.complete();
    });
}
