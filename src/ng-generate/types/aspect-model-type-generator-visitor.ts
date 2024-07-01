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
    DefaultCharacteristic,
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
import {isLangString, processType, resolveJsPropertyType} from '../components/shared/utils';
import {MultiLanguageText} from '@esmf/aspect-model-loader/dist/instantiator/characteristic/characteristic-instantiator-util';

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
                `src/app/shared/types/${aspectName}${options.enableVersionSupport ? '/' + aspectModelVersion : ''}/${aspectName}.types.ts`,
            )
        ) {
            tree.overwrite(
                `src/app/shared/types/${aspectName}${options.enableVersionSupport ? '/' + aspectModelVersion : ''}/${aspectName}.types.ts`,
                generatedTypeDefinitions,
            );
        } else {
            tree.create(
                `src/app/shared/types/${aspectName}${options.enableVersionSupport ? '/' + aspectModelVersion : ''}/${aspectName}.types.ts`,
                generatedTypeDefinitions,
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
        if (isLangString(characteristic.dataType?.urn)) {
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

            let instanceProps: Array<any> = [];

            enumeration.values.forEach((instance: DefaultEntityInstance) => {
                if (dataTypeEntityProperty) {
                    instanceProps = instance.metaModelType.properties.map(prop => ({
                        name: prop.name,
                        characteristic: prop.characteristic,
                        dataType: prop.effectiveDataType?.urn,
                    }));

                    const entityInstancePropsWithValues = this.getEntityInstanceValues(instance, instanceProps);

                    let values: string = '';
                    entityInstancePropsWithValues.forEach(
                        (item: {
                            name: string;
                            value: string | MultiLanguageText | Array<MultiLanguageText>;
                            characteristic: Characteristic;
                            dataType: string | undefined;
                        }) => {
                            if (item.characteristic instanceof DefaultCollection && isLangString(item.dataType)) {
                                const arr: string = (item.value as Array<MultiLanguageText>)
                                    .map(val => `{value: '${val.value}', language: '${val.language}'}`)
                                    .join(',');
                                values += `([${arr}] as Array<MultiLanguageText>),`;
                            } else if (isLangString(item.dataType)) {
                                const multiLanguageText = item.value as MultiLanguageText;
                                values += `{value: '${multiLanguageText.value}', language: '${multiLanguageText.language}'},`;
                            } else {
                                const dataType = item.dataType?.split('#')[1];
                                if (dataType && processType(dataType) === 'number') {
                                    values += `${item.value}, `;
                                } else {
                                    values += `'${item.value}', `;
                                }
                            }
                        },
                    );

                    values = values.replace(/,([^,]*)$/, '$1');

                    lines.push(`static ${classify(instance.name)} = new ${classify(enumeration.name)}(${values});\n`);
                }
            });

            const constructorValues = instanceProps
                .map((prop: any) => {
                    if (prop.characteristic instanceof DefaultCollection && isLangString(prop.dataType)) {
                        return `public ${prop.name}: Array<MultiLanguageText>`;
                    } else if (isLangString(prop.dataType)) {
                        return `public ${prop.name}: MultiLanguageText`;
                    }

                    return `public ${prop.name}: ${processType(prop.dataType.split('#')[1])}`;
                })
                .join(', ');

            const typeValues = instanceProps
                .map((prop: any) => {
                    if (prop.characteristic instanceof DefaultCollection && isLangString(prop.dataType)) {
                        return `${prop.name}: Array<MultiLanguageText>`;
                    } else if (isLangString(prop.dataType)) {
                        return `${prop.name}: MultiLanguageText`;
                    }

                    return `${prop.name}: ${processType(prop.dataType.split('#')[1])}`;
                })
                .join(', ');

            lines.push(`
                constructor(${constructorValues}){}\n
             
                /** Gets all defined values from ${classify(enumeration.name)} */
                public static values(): Array<{${typeValues}}> {
                    return [
                       ${enumeration.values
                           .map(
                               (instance: DefaultEntityInstance) =>
                                   `{${instanceProps
                                       .map(
                                           (prop: any) =>
                                               `${prop.name}: ${classify(enumeration.name)}.${classify(instance.name)}.${prop.name}`,
                                       )
                                       .join(',')}}`,
                           )
                           .join(',')}
                    ]
                }

                /** Gets get the instance according to the given value or undefined if no instance exists */
                public static getByValue(value: string): ${classify(enumeration.name)} | undefined {
                    ${enumeration.values
                        .map(
                            (instance: DefaultEntityInstance) =>
                                `if(value === '${instance.value}') return ${classify(enumeration.name)}.${classify(instance.name)}`,
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

    private getEntityInstanceValues(
        entityInstance: DefaultEntityInstance,
        entityInstanceProps: Array<{
            name: string;
            characteristic: Characteristic;
            dataType: string | undefined;
        }>,
    ): Array<{
        value: string | MultiLanguageText | Array<MultiLanguageText>;
        name: string;
        characteristic: DefaultCharacteristic;
        dataType: string;
    }> {
        return entityInstanceProps.map((prop: any) => {
            const propObject = (entityInstance as any)[prop.name];
            return {name: prop.name, value: propObject, characteristic: prop.characteristic, dataType: prop.dataType};
        });
    }
}
