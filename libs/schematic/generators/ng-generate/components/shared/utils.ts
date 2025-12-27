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

import {
  Characteristic,
  DefaultCollection,
  DefaultEither,
  DefaultEnumeration,
  DefaultScalar,
  DefaultSingleEntity,
  DefaultTrait,
  Entity,
  Property,
  Samm,
  Type,
} from '@esmf/aspect-model-loader';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {Schema} from './schema';
import {isArrayOfStrings} from '../../../utils/type-guards';
import {normalizeActionName} from '../../../utils/config-helper';

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
      return `${propKey}: '${complexProps.complexProp}.${complexProp.name}',`;
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
  return `${propKey}: '${property.name.trim()}',`;
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
  isEnumeration: boolean;
}> {
  return allProps.flatMap((property: Property, index: number) => {
    const isEnumeration = property.characteristic && property.characteristic instanceof DefaultEnumeration;
    if (property.effectiveDataType?.isComplex && property.characteristic instanceof DefaultSingleEntity) {
      const complexPropObj = options.templateHelper.getComplexProperties(property, options);
      return complexPropObj.properties.map((complexProp: Property, index: number) => {
        return {
          property: complexProp,
          index: index,
          complexPrefix: `${complexPropObj.complexProp}.`,
          isEnumeration,
        };
      });
    }

    return [{property: property, index: index, complexPrefix: '', isEnumeration}];
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

function buildRowActionIconTemplate(isCustomIcon: boolean, action: string, attributes: string): string {
  return isCustomIcon
    ? `<mat-icon ${attributes} svgIcon="${action}"></mat-icon>`
    : `<mat-icon ${attributes} class="material-icons">${action}</mat-icon>`;
}

/**
 * Generates custom row actions based on the provided options.
 *
 * @param {any} options - An object containing various custom options.
 * @returns {string} - Returns the custom row actions as a string.
 */
// TODO refactor this and put it into template file
export function getCustomRowActions(options: any): string {
  const customRowActions = options.customRowActions;

  if(!isArrayOfStrings(customRowActions) || customRowActions.length === 0) {
    return '';
  }

  const actions = customRowActions.map(action => {
    const formattedAction = normalizeActionName(action).trim();

    return {
      isCustomIcon: action.lastIndexOf('.') > -1,
      formattedAction,
      classifiedAction: classify(formattedAction),
      translationKey: `customRowAction.${formattedAction}.title`,
      notAvailableTranslationKey: `customRowAction.${formattedAction}.notAvailable`,
    };
  });

  const actionsCellWidth = actions.length * 30 + 15;

  return `
    <ng-container data-test="custom-row-actions" matColumnDef="customRowActions" [stickyEnd]="setStickRowActions">
      <th data-test="custom-actions-header"
          mat-header-cell
          *matHeaderCellDef
          [style.min-width.px]="customRowActionsLength <= visibleRowActionsIcons ? ${actionsCellWidth} : 80">
            {{ 'esmf.schematic.table.customRowActions.title' | transloco}}
      </th>
      <td data-test="custom-actions-row" mat-cell *matCellDef="let row">
        @if(customRowActionsLength <= visibleRowActionsIcons) {
          ${actions
            .map(({isCustomIcon, formattedAction, classifiedAction, translationKey}) => {
              const iconAttributes = `
                data-test="custom-action-icon"
                style="cursor: pointer;"
                matTooltip="{{ t('${translationKey}') }}"
                aria-hidden="false"
                attr.aria-label="{{ t('${translationKey}') }}"
                (click)="executeCustomAction($event, '${formattedAction}', row)"
              `;

              return `
                @if(is${classifiedAction}Visible) {
                  ${buildRowActionIconTemplate(isCustomIcon, formattedAction, iconAttributes)}
                }
              `;
            })
            .join('')}
        } @else {
          <button data-test="custom-actions-button"
                  mat-icon-button [matMenuTriggerFor]="customActionsMenu"
                  aria-label="Context menu for custom actions"
                  (click)="$event.preventDefault(); $event.stopPropagation()">
                  <mat-icon class="material-icons">more_vert</mat-icon>
          </button>
        }
        <mat-menu #customActionsMenu data-test="custom-actions-menu">
                ${actions
                  .map(({isCustomIcon, formattedAction, classifiedAction, translationKey, notAvailableTranslationKey}) => {
                    const commonParts = `
                      data-test="custom-action-icon"
                      style="cursor: pointer;"
                      aria-hidden="false"
                    `;

                    return `
                        @if(is${classifiedAction}Visible) {
                          <button mat-menu-item
                                  [disabled]="!isAvailableRowAction('${formattedAction}', row)"
                                  [matTooltipDisabled]="isAvailableRowAction('${formattedAction}', row)"
                                  [matTooltip]="t('${notAvailableTranslationKey}')"
                                  (click)="executeCustomAction($event, '${formattedAction}', row)"
                                  data-test="custom-action-button"
                          >
                            ${buildRowActionIconTemplate(isCustomIcon, formattedAction, commonParts)}
                            <span data-test="custom-action-text" style="vertical-align: middle">{{ t('${translationKey}')}}</span>
                          </button>
                       }
                    `;
                  })
                  .join('')}
        </mat-menu>
      </td>
    </ng-container>
  `;
}

export function resolveJsPropertyType(property: Property): string {
  const characteristic =
    property.characteristic instanceof DefaultTrait ? property.characteristic.baseCharacteristic : property.characteristic;

  if (characteristic instanceof DefaultEither) {
    let leftJsType = resolveJsCharacteristicType(characteristic.left, characteristic.effectiveLeftDataType);
    let rightJsType = resolveJsCharacteristicType(characteristic.right, characteristic.effectiveRightDataType);

    if (characteristic.left instanceof DefaultCollection) {
      leftJsType = `Array<${leftJsType}>`;
    }

    if (characteristic.right instanceof DefaultCollection) {
      rightJsType = `Array<${rightJsType}>`;
    }

    return leftJsType !== rightJsType ? `${leftJsType} | ${rightJsType}` : leftJsType;
  }

  if (property.characteristic instanceof DefaultCollection) {
    if (property.characteristic.elementCharacteristic) {
      return resolveJsCharacteristicType(
        property.characteristic.elementCharacteristic,
        property.characteristic.elementCharacteristic.dataType
      );
    }

    if (isLangString(property.characteristic.dataType?.urn)) {
      return `Array<${resolveJsCharacteristicType(property.characteristic, property.effectiveDataType)}>`;
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
    return processScalarType(defaultScalarType);
  } else {
    return classify(`${(dataType as Entity).name}`);
  }
}

function processScalarType(defaultScalarType: DefaultScalar): string {
  return processType(defaultScalarType.shortUrn);
}

export function processType(shortUrn: string): string {
  switch (shortUrn) {
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
    case 'langString':
      return 'MultiLanguageText';
    case 'date':
    case 'time':
    case 'dateTime':
    case 'dateTimeStamp':
      return 'Date';
    default:
      return shortUrn;
  }
}

export function isLangString(urn: string | undefined): boolean {
  return urn === Samm.RDF_LANG_STRING || urn === Samm.XML_LANG_STRING;
}
