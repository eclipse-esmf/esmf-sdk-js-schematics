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
        lines.push(`export interface MultiLanguageText {
                        /** key defines the locale. Value is the translated text for that locale. */
                        [key: string]: string;
                    }\n\n`);
        lines.push(this.getJavaDoc(aspect));
        lines.push(`export interface ${aspect.name} {\n`);

        this.options.spinner.succeed(`aspect.properties.length ${aspect.properties.length}`);
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
        if (characteristic instanceof DefaultEnumeration) {
            this.visitEnumeration(characteristic);
        }

        return characteristic;
    }

    visitEnumeration(enumeration: Enumeration): BaseMetaModelElement {
        const lines = [];

        lines.push(this.getJavaDoc(enumeration));

        if (enumeration.values[0] instanceof DefaultEntityInstance) {
            if (enumeration.dataType?.urn) {
                const entityInstancesNamesWithValues:any[] = [];
                if (enumeration.values.length > 0) {
                    const entityInstances = enumeration.values as DefaultEntityInstance[];
                    entityInstances.forEach((entityInstance: DefaultEntityInstance) => {                       
                        entityInstancesNamesWithValues.push({name:entityInstance.name, value: this.getEntityInstanceValues(entityInstance)});
                    });
                }
                lines.push(`export enum ${enumeration.name}  {\n`);
                entityInstancesNamesWithValues.forEach(item => {
                    lines.push(`${item.name} = '${item.value}' ,\n`);
                })
                lines.push(`}\n\n`);
                this.typeDefinitions = this.typeDefinitions.set(enumeration.name, lines);
            }
        } else {
            this.getValues(enumeration, lines);
            this.typeDefinitions = this.typeDefinitions.set(enumeration.name, lines);
        }

        return enumeration;
    }

    getEntityInstanceValues(obj: any) {
        const defaultEntityInheritedProps = ['_metaModelType', '_name', '_descriptions', 'type'];

        const filteredProps = Object.getOwnPropertyNames(obj).filter(prop => !defaultEntityInheritedProps.includes(prop));
        const stringWithValues:any = [];
        filteredProps.forEach(prop => {
            const propObject = obj[prop];
            if(Array.isArray(propObject)) {
                if(propObject.length === 1){
                    stringWithValues.push(propObject[0].value);
                }else{
                    // we want only English: 'en' if English is not present we select another language 
                    const filteredItem = propObject.filter(item => item.language === "en" || item.language.startsWith('en-'));
                    if(filteredItem){
                        stringWithValues.push(filteredItem[0].value);
                    }else{
                        stringWithValues.push(propObject[0].value);
                    }                  
                }             
            } else {
                stringWithValues.push(propObject);
            }
        });

        return stringWithValues.join(' : ');
    }

    extractTextAfterChar(inputString: string, char: any) {
        const parts = inputString.split(char);
        return parts.length > 1 ? parts[1] : 'Character not found.';
    }

    visitEntity(entity: DefaultEntity, context: any): BaseMetaModelElement {
        const lines = [];

        this.options.spinner.succeed(`in visitEntity ++++++++++++++ ${entity.name}`);

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

    private getValues(enumeration: Enumeration, lines: Array<any>) {
        let dataTypeEntityProperty: Property | undefined;
        if (enumeration.dataType) {
            this.options.spinner.succeed(`enumeration.dataType.urn ${enumeration.dataType.urn}`);
            if (enumeration.dataType.isComplex) {
                this.options.spinner.succeed(`enumeration.dataType.isComplex ${enumeration.dataType.isComplex}`);
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
            this.options.spinner.succeed(`blaaaaaaaaaa ${dataTypeEntityProperty.name}`);
            this.options.spinner.succeed(`enumeration.name ${enumeration.name} ${enumeration.getPreferredName}`);
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
