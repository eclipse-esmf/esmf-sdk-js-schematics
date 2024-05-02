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

import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import {Aspect, AspectModelLoader} from '@esmf/aspect-model-loader';
import {AspectModelTypeGeneratorVisitor} from '../../src/ng-generate/types/aspect-model-type-generator-visitor';
import {TemplateHelper} from '../../src/utils/template-helper';
import {lastValueFrom} from 'rxjs';

const loader = new AspectModelLoader();
let visitor: AspectModelTypeGeneratorVisitor;

const readFile = util.promisify(fs.readFile);

beforeEach(function () {
    visitor = new AspectModelTypeGeneratorVisitor({
        excludedProperties: [],
        complexProps: [],
        jsonAccessPath: '',
        customColumns: [],
        addRowCheckboxes: false,
        customRowActions: [],
        addCommandBar: true,
        selectedModelElement: {
            name: 'Movement',
        },
        selectedModelElementUrn: 'urn:samm:org.esmf.digitaltwin:2.1.0#Movement',
        enabledCommandBarFunctions: [],
        enableRemoteDataHandling: true,
        enableVersionSupport: false,
        overwrite: true,
        templateHelper: new TemplateHelper(),
    } as any);
});

describe('Generation of types from aspect model', (): void => {
    it('works for movement.ttl', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/movement.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect 'Movement'
        expect(generatedTypeDefinitions).toMatch(/export interface Movement/);
        expect(generatedTypeDefinitions).toMatch(/isMoving\s*:\s*boolean\s*;/);
        expect(generatedTypeDefinitions).toMatch(/speedLimitWarning\s*:\s*TrafficLight\s*;/);
        expect(generatedTypeDefinitions).toMatch(/position\s*:\s*SpatialPosition\s*;/);

        // Check the definition for the enum 'WarningLevel'
        expect(generatedTypeDefinitions).toMatch(/export enum TrafficLight/);
        expect(generatedTypeDefinitions).toMatch(/Green\s*=\s*'green'\s*,/);
        expect(generatedTypeDefinitions).toMatch(/Yellow\s*=\s*'yellow'\s*,/);
        expect(generatedTypeDefinitions).toMatch(/Red\s*=\s*'red'\s*,/);

        // Check the type definition for entity 'SpatialPosition'
        expect(generatedTypeDefinitions).toMatch(/export interface SpatialPosition/);
        expect(generatedTypeDefinitions).toMatch(/latitude\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/longitude\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/altitude\s*\?:\s*number\s*;/);
    });

    it('works for built-in SAMM-C characteristics', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-sammc-characteristics.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestSAMMCCharacteristics/);
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*boolean\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*string\s*;/);
        expect(generatedTypeDefinitions).toMatch(/c\s*:\s*Date\s*;/);
    });

    it('works for XSD Core types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-xsd-core-types.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestXSDCoreTypes/);

        // see https://eclipse-esmf.github.io/samm-specification/2.1.0/index.html
        // Core Types
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*string\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*boolean\s*;/);
        expect(generatedTypeDefinitions).toMatch(/c\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/d\s*:\s*number\s*;/);
    });

    it('works for XSD Floating-Point Number types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-xsd-floating-point-number-types.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestXSDFloatingPointNumberTypes/);

        // see https://eclipse-esmf.github.io/samm-specification/2.1.0/index.html
        // IEEE Floating-Point number types
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*number\s*;/);
    });

    it('works for XSD Time and Date types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-xsd-time-and-date-types.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestXSDTimeAndDateTypes/);

        // see https://eclipse-esmf.github.io/samm-specification/2.1.0/index.html
        // Time and Date types
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*Date\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*Date\s*;/);
        expect(generatedTypeDefinitions).toMatch(/c\s*:\s*Date\s*;/);
        expect(generatedTypeDefinitions).toMatch(/d\s*:\s*Date\s*;/);
    });

    it('works for XSD Limited-range Integer Number types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-xsd-limited-range-integer-number-types.ttl')
            .then(models => {
                return loader.load('', ...models).toPromise();
            })
            .then((aspect: Aspect) => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestXSDLimitedIntegerNumberTypes/);

        // see https://eclipse-esmf.github.io/samm-specification/2.1.0/index.html
        // Limited-range Integer Numbers
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/c\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/d\s*:\s*number\s*;/);

        expect(generatedTypeDefinitions).toMatch(/ua\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/ub\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/uc\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/ud\s*:\s*number\s*;/);

        expect(generatedTypeDefinitions).toMatch(/pi\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/nni\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/ni\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/npi\s*:\s*number\s*;/);
    });

    it('works for XSD Miscellaneous types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-xsd-miscellaneous-types.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestXSDMiscellaneousTypes/);

        // see https://eclipse-esmf.github.io/samm-specification/2.1.0/index.html
        // Miscellaneous Types
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*string\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*string\s*;/);
        expect(generatedTypeDefinitions).toMatch(/c\s*:\s*string\s*;/);
    });

    it('works for enumeration types', async function () {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-enumeration-types.ttl')
            .then(models => {
                return loader.load('', ...models).toPromise();
            })
            .then((aspect: Aspect) => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface MultiLanguageText/);
        expect(generatedTypeDefinitions).toMatch(/export interface TestEnumerationTypes/);

        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*EnumerationOfStrings\s*;/);
        expect(generatedTypeDefinitions).toMatch(/b\s*:\s*EnumerationOfIntegers\s*;/);

        expect(generatedTypeDefinitions).toMatch(/export enum EnumerationOfStrings/);
        expect(generatedTypeDefinitions).toMatch(/Complete\s*=\s*'Complete'\s*,/);
        expect(generatedTypeDefinitions).toMatch(/In_Progress\s*=\s*'In Progress'\s*,/);

        expect(generatedTypeDefinitions).toMatch(/export enum EnumerationOfIntegers/);
        expect(generatedTypeDefinitions).toMatch(/NUMBER_2\s*=\s*2\s*,/);
        expect(generatedTypeDefinitions).toMatch(/NUMBER_13\s*=\s*13\s*,/);
        expect(generatedTypeDefinitions).toMatch(/NUMBER_19\s*=\s*19\s*,/);

        expect(generatedTypeDefinitions).toMatch(
            /static StatusInProgress\s*=\s*new PartStatus\('inprogress', \{value: 'In Progress', language: 'en'}, 'StatusInProgress.partStatusAttributeDescription'\);/
        );
        expect(generatedTypeDefinitions).toMatch(
            /static StatusCancelled\s*=\s*new PartStatus\('cancelled', \{value: 'Cancelled', language: 'en'}, 'StatusCancelled.partStatusAttributeDescription'\);/
        );
        expect(generatedTypeDefinitions).toMatch(
            /static StatusInactive\s*=\s*new PartStatus\('inactive', \{value: 'Cancelled', language: 'en'}, 'StatusInactive.partStatusAttributeDescription'\);/
        );
    });

    it('works for entity types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-entity-types.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        // TODO should not have MultiLanguage inside because it not have langString ...
        expect(generatedTypeDefinitions).toMatch(/export interface TestEntityTypes/);
        expect(generatedTypeDefinitions).toMatch(/a\s*:\s*EntityCharacteristic\s*;/);

        expect(generatedTypeDefinitions).toMatch(/export interface EntityCharacteristic/);
        expect(generatedTypeDefinitions).toMatch(/x\s*:\s*string\s*;/);
        expect(generatedTypeDefinitions).toMatch(/y\s*:\s*boolean\s*;/);
        expect(generatedTypeDefinitions).toMatch(/z\s*:\s*number\s*;/);
    });

    it('works for entity instances', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-entity-instances.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface MultiLanguageText/);
        expect(generatedTypeDefinitions).toMatch(/export interface TestEntityInstances/);
        expect(generatedTypeDefinitions).toMatch(/export class Enumeration/);
        // TODO should not have the language because not langString characteristic but i dont know how for the moment ...
        expect(generatedTypeDefinitions).toMatch(/static Code101\s*=\s*new Enumeration\('101', 'Starting', 'Code101.description'\);/);
        expect(generatedTypeDefinitions).toMatch(/static Code102\s*=\s*new Enumeration\('102', 'Ready', 'Code102.description'\);/);
        expect(generatedTypeDefinitions).toMatch(/step\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/export interface Entity/);
        expect(generatedTypeDefinitions).toMatch(/description\s*:\s*string\s*;/);
    });

    it('works for entity instances with langString', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-entity-instances-with-langString.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface MultiLanguageText/);
        expect(generatedTypeDefinitions).toMatch(/export interface TestEntityInstancesWithLangString/);
        expect(generatedTypeDefinitions).toMatch(/export class Enumeration/);
        // TODO should have the language inside but i dont know how for the moment ...
        // expect(generatedTypeDefinitions).toMatch(/static Code101\s*=\s*new Enumeration\('101', 'Starting', 'Code101.description'\);/);
        // expect(generatedTypeDefinitions).toMatch(/static Code102\s*=\s*new Enumeration\('102', 'Ready', 'Code102.description'\);/);
        expect(generatedTypeDefinitions).toMatch(/step\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/export interface Entity/);
        expect(generatedTypeDefinitions).toMatch(/description\s*:\s*string\s*;/);
    });

    it('works for entity instances with collection of langString', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-entity-instances-with-collection-of-langString.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface MultiLanguageText/);
        expect(generatedTypeDefinitions).toMatch(/export interface TestEntityInstancesWithLangString/);
        expect(generatedTypeDefinitions).toMatch(/export class Enumeration/);
        // TODO should have the language inside and in some case also the Array but i dont know how for the moment ...
        // expect(generatedTypeDefinitions).toMatch(/static Code101\s*=\s*new Enumeration\('101', 'Starting', 'Code101.description'\);/);
        // expect(generatedTypeDefinitions).toMatch(/static Code102\s*=\s*new Enumeration\('102', 'Ready', 'Code102.description'\);/);
        expect(generatedTypeDefinitions).toMatch(/step\s*:\s*number\s*;/);
        expect(generatedTypeDefinitions).toMatch(/export interface Entity/);
        expect(generatedTypeDefinitions).toMatch(/description\s*:\s*string\s*;/);
    });

    it('works for collection types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-collection-types.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        // Check the interface definition for the aspect
        expect(generatedTypeDefinitions).toMatch(/export interface TestCollectionTypes/);
        expect(generatedTypeDefinitions).toMatch(/productTypesList\s*:\s*Array<ProductType>\s*;/);
        expect(generatedTypeDefinitions).toMatch(/productTypesSet\s*:\s*Array<ProductType>\s*;/);
        expect(generatedTypeDefinitions).toMatch(/productTypesSortedSet\s*:\s*Array<ProductType>\s*;/);
        expect(generatedTypeDefinitions).toMatch(/measurements\s*:\s*Array<number>\s*;/);

        expect(generatedTypeDefinitions).toMatch(/export interface ProductType/);
        expect(generatedTypeDefinitions).toMatch(/productClass\s*:\s*string\s*;/);
    });

    it('works for either types', async function (): Promise<void> {
        const generatedTypeDefinitions = await readModelsFromFS('test/models/test-sammc-characteristics.ttl')
            .then((models: string[]): Promise<Aspect> => {
                return lastValueFrom(loader.load('', ...models));
            })
            .then((aspect: Aspect): string => {
                visitor.visit(aspect);
                return visitor.getGeneratedTypeDefinitions();
            });

        expect(generatedTypeDefinitions.includes('either1: string | Array<number>')).toBeTruthy();
        expect(generatedTypeDefinitions.includes('either2: Array<number> | Right')).toBeTruthy();
    });
});

async function readModelsFromFS(commaSeparatedListOfFilenames: string): Promise<string[]> {
    const promises: Promise<string>[] = [];
    commaSeparatedListOfFilenames.split(',').forEach((filename: string) => {
        promises.push(readModel(filename.trim()));
    });

    return await Promise.all(promises);
}

function readModel(filename: string): Promise<string> {
    return readFile(path.join(filename.trim()), {encoding: 'utf8'});
}
