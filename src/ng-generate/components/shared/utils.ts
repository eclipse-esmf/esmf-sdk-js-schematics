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
    Characteristic,
    DefaultCollection,
    DefaultEither,
    DefaultEnumeration,
    DefaultScalar,
    DefaultSingleEntity,
    Entity,
    Property,
    Type,
} from '@esmf/aspect-model-loader';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {Schema} from './schema';

/**
 * Gets enum properties from provided options and converts them into a string.
 *
 * @param {Schema} options - The options object which should contain 'templateHelper' that provides methods for manipulating templates.
 * @returns {string} - A string of comma-separated, classified enum property names.
 */
export function getEnumProperties(options: Schema): string {
    return options.templateHelper
        .getEnumProperties(options)
        .map((property: Property) => classify(property.characteristic.name))
        .join(',');
}

/**
 * Generates enum property definitions for an array of properties.
 *
 * @param {Schema} options - The Schema options object.
 * @param {Array<Property>} allProps - The array of Property objects.
 * @return {string} The enum property definitions string.
 */
export function getEnumPropertyDefinitions(options: Schema, allProps: Array<Property>): string {
    return allProps
        .map((property: Property) => {
            if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
                return generateComplexEnumDef(options, property);
            } else {
                return generateSimpleEnumDef(options, property);
            }
        })
        .join('');
}

/**
 * Generates an enum definition string for a complex property.
 *
 * @param {Schema} options - The Schema options object.
 * @param {Property} property - The complex Property object.
 * @return {string} The enum definition string for the complex property.
 */
function generateComplexEnumDef(options: Schema, property: Property): string {
    const complexProps = options.templateHelper.getComplexProperties(property, options);
    return complexProps.properties
        .map((complexProp: Property) => {
            const propKey = generateKey(`${complexProps.complexProp}_${complexProp.name}`);
            return `${propKey} = '${complexProps.complexProp}.${complexProp.name}',`;
        })
        .join('');
}

/**
 * Generates an enum definition string for a simple property.
 *
 * @param {Schema} options - The Schema options object.
 * @param {Property} property - The simple Property object.
 * @return {string} The enum definition string for the simple property.
 */
function generateSimpleEnumDef(options: Schema, property: Property): string {
    const propKey = generateKey(property.name);
    return `${propKey} = '${options.jsonAccessPath}${property.name.trim()}',`;
}

/**
 * Generates a standardized key from a given property name.
 *
 * @param {string} name - The property name.
 * @return {string} The standardized key.
 */
function generateKey(name: string): string {
    return dasherize(name).replace(/-/g, '_').toUpperCase();
}

/**
 * Retrieves table column values based on the provided properties and schema options.
 *
 * @param {Array<Property>} allProps - Array of all properties for the table columns.
 * @param {Schema} options - Schema options object that contains additional information.
 * @returns {Array<{property: Property; index: number; complexPrefix: string}>} - Returns an array of objects containing property details, index, and complexPrefix.
 */
export function getTableColumValues(
    allProps: Array<Property>,
    options: Schema
): Array<{
    property: Property;
    index: number;
    complexPrefix: string;
}> {
    return allProps.flatMap((property: Property, index: number) => {
        if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
            const complexPropObj = options.templateHelper.getComplexProperties(property, options);
            return complexPropObj.properties.map((complexProp: Property, index: number) => {
                return {property: complexProp, index: index, complexPrefix: `${complexPropObj.complexProp}.`};
            });
        }

        return [{property: property, index: index, complexPrefix: ''}];
    });
}

/**
 * Resolves the datetime format based on the provided schema options and property.
 *
 * @param {Schema} options - Schema options object that contains additional information.
 * @param {Property} property - Property object to determine the datetime format.
 * @returns {string} - Returns the datetime format as a string.
 */
export function resolveDateTimeFormat(options: Schema, property: Property): string {
    if (options.templateHelper.isTimeProperty(property)) {
        return 'tableTimeFormat';
    }
    if (options.templateHelper.isDateTimestampProperty(property)) {
        return 'tableDateTimeFormat';
    }
    if (options.templateHelper.isDateProperty(property)) {
        return 'tableDateFormat';
    }
    return '';
}

/**
 * Generates custom row actions based on the provided options.
 *
 * @param {any} options - An object containing various custom options.
 * @returns {string} - Returns the custom row actions as a string.
 */
// TODO refactor this and put it into template file
export function getCustomRowActions(options: any): string {
    return options.customRowActions.length > 0
        ? `  <ng-container data-test="custom-row-actions" matColumnDef="customRowActions" [stickyEnd]="setStickRowActions">
      <th data-test="custom-actions-header" 
          mat-header-cell 
          *matHeaderCellDef 
          [style.min-width.px]="customRowActionsLength <= visibleRowActionsIcons ? ${options.customRowActions.length * 30 + 15} : 80">
            {{ '${options.templateHelper.getVersionedAccessPrefix(options)}customRowActions.preferredName' | translate}}
      </th>
      <td data-test="custom-actions-row" mat-cell *matCellDef="let row">
      <ng-container data-test="custom-actions-container" *ngIf="customRowActionsLength <= visibleRowActionsIcons; else customActionsButton">
      ${options.customRowActions
          .map((action: string) => {
              const formattedAction = action.replace(/\.[^/.]+$/, '');
              const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
              const commonParts = `data-test="custom-action-icon" *ngIf="is${classify(
                  formattedActionKebab
              )}Visible" (click)="executeCustomAction($event, '${formattedActionKebab}', row)" style="cursor: pointer;" matTooltip="{{ '${options.templateHelper.getVersionedAccessPrefix(
                  options
              )}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${options.templateHelper.getVersionedAccessPrefix(
                  options
              )}${formattedActionKebab}.customRowAction' | translate }}"`;
              return `${action.lastIndexOf('.') > -1 ? `<mat-icon svgIcon="${formattedAction}" ${commonParts}></mat-icon>` : ''}${
                  action.lastIndexOf('.') === -1 ? `<mat-icon ${commonParts} class="material-icons">${action}</mat-icon>` : ''
              }
            `;
          })
          .join('')}
      </ng-container>
      <ng-template #customActionsButton data-test="custom-actions-button-container">
        <button data-test="custom-actions-button" 
                mat-icon-button [matMenuTriggerFor]="customActionsMenu" 
                aria-label="Context menu for custom actions"
                (click)="$event.preventDefault(); $event.stopPropagation()">
                <mat-icon class="material-icons">more_vert</mat-icon>
        </button>
      </ng-template>
      <mat-menu #customActionsMenu data-test="custom-actions-menu">
              ${options.customRowActions
                  .map((action: string): string => {
                      const formattedAction = action.replace(/\.[^/.]+$/, '');
                      const formattedActionKebab = formattedAction.replace(/\s+/g, '-').toLowerCase();
                      const classifiedAction = classify(formattedActionKebab);
                      const commonParts = `style="cursor: pointer;" matTooltip="{{ '${options.templateHelper.getVersionedAccessPrefix(
                          options
                      )}${formattedActionKebab}.customRowAction' | translate }}" aria-hidden="false" attr.aria-label="{{ '${options.templateHelper.getVersionedAccessPrefix(
                          options
                      )}${formattedActionKebab}.customRowAction' | translate }}"`;
                      const iconTemplate =
                          action.lastIndexOf('.') === -1
                              ? `<mat-icon data-test="custom-action-icon" ${commonParts} class="material-icons">${formattedAction}</mat-icon>`
                              : `<mat-icon data-test="custom-action-icon" svgIcon="${formattedAction}" ${commonParts}></mat-icon>`;
                      return `
                      <button mat-menu-item *ngIf="is${classifiedAction}Visible" data-test="custom-action-button" (click)="executeCustomAction($event, '${formattedActionKebab}', row)">
                          ${iconTemplate}
                          <span data-test="custom-action-text" style="vertical-align: middle">{{ '${options.templateHelper.getVersionedAccessPrefix(
                              options
                          )}${formattedActionKebab}.customRowAction' | translate}}</span>
                      </button>
                     `;
                  })
                  .join('')}
      </mat-menu>
      </td>
    </ng-container>`
        : '';
}

export function resolveJsPropertyType(property: Property): string {
    if (property.characteristic instanceof DefaultEither) {
        const leftJsType = resolveJsCharacteristicType(property.characteristic.left, property.characteristic.effectiveLeftDataType);
        const rightJsType = resolveJsCharacteristicType(property.characteristic.right, property.characteristic.effectiveRightDataType);
        return `${leftJsType} | ${rightJsType}`;
    }

    if (property.characteristic instanceof DefaultCollection) {
        if (property.characteristic.elementCharacteristic) {
            return resolveJsCharacteristicType(
                property.characteristic.elementCharacteristic,
                property.characteristic.elementCharacteristic.dataType
            );
        }
    }

    return resolveJsCharacteristicType(property.characteristic, property.effectiveDataType);
}

function resolveJsCharacteristicType(characteristic: Characteristic, dataType: Type | undefined): string {
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
        const scalarType = processScalarType(defaultScalarType);

        if (characteristic instanceof DefaultCollection) {
            return `${scalarType}[]`;
        }

        return scalarType;
    } else {
        return classify(`${(dataType as Entity).name}`);
    }
}

function processScalarType(defaultScalarType: DefaultScalar): string {
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
            return 'number';
        case 'langString':
        case 'hexBinary':
        case 'base64Binary':
        case 'curie':
        case 'anyUri':
        case 'anyURI':
        case 'dayTimeDuration':
        case 'duration':
        case 'gDay':
        case 'gMonth':
        case 'gYear':
        case 'gMonthDay':
        case 'gYearMonth':
        case 'yearMonthDuration':
            return 'string';
        case 'date':
        case 'time':
        case 'dateTime':
        case 'dateTimeStamp':
            return 'Date';
        default:
            return defaultScalarType.shortUrn;
    }
}
