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

import {camelize, classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {Rule, Tree} from '@angular-devkit/schematics';
import {
    Aspect,
    BaseMetaModelElement,
    Characteristic,
    DefaultAspectModelVisitor,
    DefaultCollection,
    DefaultEither,
    DefaultEntity,
    DefaultEntityInstance,
    DefaultEnumeration,
    DefaultProperty,
    DefaultScalar,
    Entity,
    Enumeration,
    Property,
    Type,
} from '@esmf/aspect-model-loader';
import {Schema} from './schema';

export function visitAspectModel(options: Schema): Rule {
    return async (tree: Tree) => {
        const visitor = new AspectModelTypeGeneratorVisitor(options);
        const aspect: Aspect = options.aspectModel;
        const aspectName = dasherize(aspect.name);
        const aspectModelVersion = 'v' + options.aspectModelVersion.replace(/\./g, '');

        visitor.visit(aspect);
        const generatedTypeDefinitions = visitor.getGeneratedTypeDefinitions();

        if (
            tree.exists(
                `src/app/shared/types/${aspectName}${options.enableVersionSupport ? '/' + aspectModelVersion : ''}/${aspectName}.types.ts`
            )
        ) {
            tree.overwrite(
                `src/app/shared/types/${aspectName}${options.enableVersionSupport ? '/' + aspectModelVersion : ''}/${aspectName}.types.ts`,
                generatedTypeDefinitions
            );
        } else {
            tree.create(
                `src/app/shared/types/${aspectName}${options.enableVersionSupport ? '/' + aspectModelVersion : ''}/${aspectName}.types.ts`,
                generatedTypeDefinitions
            );
        }
    };
}

export class AspectModelTypeGeneratorVisitor extends DefaultAspectModelVisitor<BaseMetaModelElement, void> {
    // Key = Name of the generated data type
    // Value = Array of lines that define the data type
    private typeDefinitions = new Map<string, string[]>();
    private readonly options: Schema;

    constructor(options: Schema) {
        super();
        this.options = options;
    }

    getGeneratedTypeDefinitions(): string {
        let typeDefinitionsAsString = '';
        for (const lines of this.typeDefinitions.values()) {
            typeDefinitionsAsString = typeDefinitionsAsString.concat(...lines);
        }

        return typeDefinitionsAsString;
    }

    visitAspect(aspect: Aspect, context: void): BaseMetaModelElement {
        const lines = [];

        lines.push('/** Generated form ESMF JS SDK Angular Schematics - PLEASE DO NOT CHANGE IT **/\n\n');
        lines.push(`export interface MultiLanguageText {
                        /** key defines the locale. Value is the translated text for that locale. */
                        [key: string]: string;
                    }\n\n`);
        lines.push(this.getJavaDoc(aspect));
        lines.push(`export interface ${aspect.name} {\n`);

        aspect.properties.forEach(property => {
            // Visit the property to eventually generate a new data type and return
            // the appropriate data type name.
            const dataType = this.resolveJsPropertyType(property);
            const variableName = camelize(property.name);
            lines.push(this.getJavaDoc(property));
            lines.push(`${variableName}${property.isOptional ? '?' : ''}: ${dataType}${dataType.includes(';') ? '' : ';'}\n`);
        });

        lines.push(`}\n\n`);
        this.typeDefinitions = this.typeDefinitions.set(aspect.name, lines);

        return aspect;
    }

    visitCharacteristic(characteristic: Characteristic, context: void): BaseMetaModelElement {
        if (characteristic instanceof DefaultEnumeration) {
            this.visitEnumeration(characteristic);
        }

        return characteristic;
    }

    visitEnumeration(enumeration: Enumeration): BaseMetaModelElement {
        const lines = [];

        lines.push(this.getJavaDoc(enumeration));

        let dataTypeEntityProperty: Property | undefined;
        if (enumeration.dataType) {
            if (enumeration.dataType.isComplex) {
                const dataTypeEntity = enumeration.dataType as Entity;
                // Find the property that actually specifies the property name to generate the enum values from
                dataTypeEntityProperty = dataTypeEntity.properties.find(property => {
                    return !property.isNotInPayload && !property.isOptional;
                });

                if (!dataTypeEntityProperty) {
                    throw new Error(`Not able to find value property in ${dataTypeEntity.name}`);
                }
            }
        }

        if (dataTypeEntityProperty !== undefined && enumeration.dataType && enumeration.dataType.isComplex) {
            lines.push(`export class ${classify(enumeration.name)} {\n`);

            const versionedAccessPrefix = (this.options as any).templateHelper.getVersionedAccessPrefix(this.options as any)
                ? `${(this.options as any).templateHelper.getVersionedAccessPrefix(this.options as any)}.`
                : ``;
            let valuePayloadKey = '';
            enumeration.values.forEach((instance: DefaultEntityInstance) => {
                if (dataTypeEntityProperty) {
                    valuePayloadKey = instance.valuePayloadKey;
                    lines.push(
                        `    static ${classify(instance.name)} = new ${classify(enumeration.name)}('${instance.value}', '${
                            instance.getDescription() || ''
                        }', '${instance.descriptionKey ? `${instance.name}.${instance.descriptionKey}` : ''}');\n`
                    );
                }
            });

            lines.push(`
                constructor(public ${valuePayloadKey}: string, public description: string, private translationKey: string){};\n
             
                /** Gets all defined values from ${classify(enumeration.name)} */
                public static values(): Array<{iProcedureAndStepNo: string; description: string | undefined}> {
                    return [
                       ${enumeration.values
                           .map(
                               (instance: DefaultEntityInstance) =>
                                   `{ ${valuePayloadKey}: ${classify(enumeration.name)}.${classify(instance.name)}.${valuePayloadKey}, 
                                   description: ${classify(enumeration.name)}.${classify(instance.name)}.${instance.descriptionKey} }`
                           )
                           .join(',')}
                    ]
                }
                
                /** Gets a list of value and related translations key */
                public static getValueDescriptionList(propertyName: string): Array<{value:string, translationKey:string | undefined}> {
                    return [
                       ${enumeration.values
                           .map(
                               (instance: DefaultEntityInstance) =>
                                   `{ value: '${
                                       instance.value
                                   }', translationKey: '${versionedAccessPrefix}' + propertyName + '.' + ${classify(
                                       enumeration.name
                                   )}.${classify(instance.name)}.translationKey }`
                           )
                           .join(',')}
                    ]
                }
    
                /** Gets get the instance according to the given value or undefined if no instance exists */
                public static getByValue(value: string): ${classify(enumeration.name)} | undefined {
                    ${enumeration.values
                        .map(
                            (instance: DefaultEntityInstance) =>
                                `if(value === '${instance.value}') return ${classify(enumeration.name)}.${classify(instance.name)}`
                        )
                        .join('; ')}
                    
                    return undefined;
                }
                
                  public static isEnumeration(): boolean {
                    return true;
                  }  
                
            `);
        } else {
            lines.push(`export enum ${enumeration.name} {\n`);
            enumeration.values.forEach(value => {
                if (typeof value === 'string') {
                    const variableName = this.sanitizeVariableName(value);
                    lines.push(`    ${variableName} = '${value}',\n`);
                } else if (typeof value === 'number') {
                    const variableName = this.sanitizeVariableName(`${value}`);
                    lines.push(`    NUMBER${variableName} = ${value},\n`);
                }
            });
        }

        lines.push(`}\n\n`);

        this.typeDefinitions = this.typeDefinitions.set(enumeration.name, lines);

        return enumeration;
    }

    visitEntity(entity: DefaultEntity, context: any): BaseMetaModelElement {
        const lines = [];

        lines.push(this.getJavaDoc(entity));
        lines.push(`export interface ${entity.name} ${entity.extends ? `extends ${entity.extends?.name}` : ''} {\n`);

        entity.getOwnProperties().forEach((property: Property): void => {
            const dataTypeName = this.resolveJsPropertyType(property) || 'any';
            let variableName = '';
            if (property.name) {
                variableName = camelize(property.name);
            }

            if (dataTypeName) {
                lines.push(this.getJavaDoc(property));
                lines.push(`${variableName}${property.isOptional ? '?' : ''}: ${dataTypeName}${dataTypeName.includes(';') ? '' : ';'}\n`);
            }
        });

        lines.push(`}\n\n`);

        this.typeDefinitions = this.typeDefinitions.set(entity.name, lines);

        return entity;
    }

    private resolveJsPropertyType(property: Property): string {
        if (property.characteristic instanceof DefaultEither) {
            const leftJsType = this.resolveJsCharacteristicType(
                property.characteristic.left,
                property.characteristic.effectiveLeftDataType
            );
            const rightJsType = this.resolveJsCharacteristicType(
                property.characteristic.right,
                property.characteristic.effectiveRightDataType
            );
            return `${leftJsType} | ${rightJsType}`;
        }

        return this.resolveJsCharacteristicType(property.characteristic, property.effectiveDataType);
    }

    private resolveJsCharacteristicType(characteristic: Characteristic, dataType: Type | undefined): string {
        if (dataType === null) {
            return '';
        }

        // In case of a multi-language text it has the data type langString but actual it must be handled as a
        // map where the key ist the local and the value is the corresponding text
        if (characteristic.name === 'MultiLanguageText') {
            // Plain JSON object that has properties like 'en' or 'de'
            return 'MultiLanguageText;';
        }

        // In case of enumeration, an enum is created. Use this enum as data type for the property.
        if (characteristic instanceof DefaultEnumeration) {
            return classify(characteristic.name);
        }

        if (dataType && dataType.isScalar) {
            const defaultScalarType = dataType as DefaultScalar;
            return this.processScalarType(defaultScalarType, this.determinePrefix(characteristic));
        } else {
            return classify(`${(dataType as Entity).name}${this.determinePrefix(characteristic)}`);
        }
    }

    private determinePrefix(characteristic: Characteristic) {
        let dataTypePostfix = '';
        if (characteristic instanceof DefaultCollection) {
            dataTypePostfix = '[]';
        }
        return dataTypePostfix;
    }

    private processScalarType(defaultScalarType: DefaultScalar, dataTypePostfix?: string): string {
        switch (defaultScalarType.shortUrn) {
            case 'decimal':
            case 'integer':
            case 'double':
            case 'float':
            case 'byte':
            case 'short':
            case 'int':
            case 'long':
            case 'unsignedByte':
            case 'unsignedLong':
            case 'unsignedInt':
            case 'unsignedShort':
            case 'positiveInteger':
            case 'nonNegativeInteger':
            case 'negativeInteger':
            case 'nonPositiveInteger':
                return 'number' + dataTypePostfix;
            case 'langString':
            case 'hexBinary':
            case 'base64Binary':
            case 'curie':
            case 'anyUri':
                return 'string' + dataTypePostfix;
            case 'date':
            case 'time':
            case 'dateTime':
            case 'dateTimeStamp':
                return 'Date' + dataTypePostfix;
            default:
                return defaultScalarType.shortUrn + dataTypePostfix;
        }
    }

    private getJavaDoc(element: Aspect | Property | Characteristic | Entity) {
        const description = element.getDescription('en');
        if (description === undefined) {
            return '';
        }
        if (element instanceof DefaultProperty) {
            return `/** ${description} */\n`;
        }
        return `/** 
                 * ${description} 
                 */\n`;
    }

    private sanitizeVariableName(name: string): string {
        // Convert the first character to upper case
        if (name.length > 1) {
            name = name[0].toUpperCase() + name.substring(1);
        } else {
            name = name.toUpperCase();
        }

        // Well, there is a bunch of possibilities how to choose an enum value that
        // is not a valid identifier in TypeScript. There are just TOO MANY rules to address them all.
        // Let's hope the aspect model designer are NOT choosing enum values that cause problems.

        // No whitespace allowed in variable name
        name = name.replace(/\s+/g, '_');

        // Variable name must not start with digit(s). Prefix them with '_'.
        name = name.replace(/^(\d+)/, '_$1');

        return name;
    }
}
