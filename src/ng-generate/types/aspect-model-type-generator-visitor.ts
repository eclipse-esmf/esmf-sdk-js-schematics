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

import {camelize, classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {Rule, Tree} from '@angular-devkit/schematics';
import {
    Aspect,
    BaseMetaModelElement,
    Characteristic,
    DefaultAspectModelVisitor,
    DefaultCollection,
    DefaultEntity,
    DefaultEntityInstance,
    DefaultEnumeration,
    DefaultProperty,
    Entity,
    Enumeration,
    Property,
} from '@esmf/aspect-model-loader';
import {TypesSchema} from './schema';
import {resolveJsPropertyType} from '../components/shared/utils';

export function visitAspectModel(options: TypesSchema): Rule {
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
    private readonly options: TypesSchema;

    constructor(options: TypesSchema) {
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
        lines.push(this.getJavaDoc(aspect));
        lines.push(`export interface ${aspect.name} {\n`);

        aspect.properties.forEach(property => {
            // Visit the property to eventually generate a new data type and return
            // the appropriate data type name.
            const dataType =
                property.characteristic instanceof DefaultCollection
                    ? `Array<${resolveJsPropertyType(property)}>`
                    : resolveJsPropertyType(property);
            const variableName = camelize(property.name);
            lines.push(this.getJavaDoc(property));
            lines.push(`${variableName}${property.isOptional ? '?' : ''}: ${dataType}${dataType.includes(';') ? '' : ';'}\n`);
        });

        lines.push(`}\n\n`);
        this.typeDefinitions = this.typeDefinitions.set(aspect.name, lines);

        return aspect;
    }

    visitCharacteristic(characteristic: Characteristic, context: void): BaseMetaModelElement {
        if (characteristic.dataType?.urn === 'http://www.w3.org/2001/XMLSchema#langString') {
            const lines = [];
            lines.push(`
            /**
             * Represents a text with multiple language support.
             */
            export interface MultiLanguageText {
                /** The actual text value. */
                value: string;
                /** The language code of the text. */
                language: string;
             }\n\n`);
            this.typeDefinitions = this.typeDefinitions.set(characteristic.name, lines);
        }

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
                    // TODO loader is not doing the right on instances we need more infos ... Type of Characteristic und th values itself ...
                    valuePayloadKey = instance.valuePayloadKey;

                    const props = instance.metaModelType.properties;
                    const instanceProps: any = [];
                    props.forEach(prop => {
                        instanceProps.push({name: prop.name, type: prop.effectiveDataType?.shortUrn});
                    });
                    const entityInstancePropsWithValues = this.getEntityInstanceValues(instance, instanceProps);
                    // TODO check this more in detail if this is right ...
                    instance.getDescription();

                    let values: string = '';
                    entityInstancePropsWithValues.forEach((item: any) => {
                        if (Array.isArray(item.value)) {
                            if (item.type === 'langString') {
                                let arr: string = '[';
                                item.value.forEach((val: any) => {
                                    arr += `{value: '${val.value}', language: '${val.language}'},`;
                                });
                                arr += '],';
                                values += arr;
                            }
                        } else {
                            values += `'${item.value}',`;
                        }
                    });
                    values = values.replace(/,([^,]*)$/, '$1');

                    lines.push(
                        `    static ${classify(instance.name)} = new ${classify(enumeration.name)}(${values}, '${
                            instance.descriptionKey ? `${instance.name}.${instance.descriptionKey}` : ''
                        }');\n`
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
            const dataTypeName = resolveJsPropertyType(property) || 'any';
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

    private getEntityInstanceValues(obj: DefaultEntityInstance, entityInstanceProps: any) {
        const stringWithValues: any = entityInstanceProps.map((prop: any) => {
            const propObject = (obj as any)[prop.name];
            return {value: propObject, name: prop.name, type: prop.type};
        });

        return stringWithValues;
    }
}
