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

import {apply, applyTemplates, chain, MergeStrategy, mergeWith, move, Rule, SchematicContext, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {DefaultCollection, DefaultEither, DefaultEnumeration, DefaultList, Property} from '@esmf/aspect-model-loader';
import {templateInclude} from '../../../../shared/include';
import {getEnumPropertyDefinitions, getTableColumValues, resolveDateTimeFormat, resolveJsPropertyType} from '../../../../shared/utils';
import {Schema} from '../../../../shared/schema';
import {FormFieldBuilder} from '../../../../shared/methods/form/field-types/FormFieldBuilder';

let sharedOptions: any = {};

export function generateFormComponent(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        sharedOptions = options;
        // TODO: Revert back?
        // sharedOptions['allProps'] = options.listAllProperties.filter((property: Property) => (property.characteristic instanceof DefaultSingleEntity) || property.characteristic instanceof DefaultList || (<Characteristic>property.characteristic)?.dataType?.isScalar);
        sharedOptions['allProps'] = options.listAllProperties;
        sharedOptions['listProps'] = options.listAllProperties.filter(
            (property: Property) => property.characteristic instanceof DefaultList
        );

        sharedOptions['fieldsConfigs'] = FormFieldBuilder.buildFieldsConfigs(options.listAllProperties);

        sharedOptions['tableColumValues'] = getTableColumValues;
        sharedOptions['resolveDateTimeFormat'] = resolveDateTimeFormat;
        sharedOptions['enumeration'] = DefaultEnumeration;
        sharedOptions['collection'] = DefaultCollection;
        sharedOptions['either'] = DefaultEither;

        return chain([generateForm(options, _context)])(tree, _context);
    };
}

function generateForm(options: Schema, _context: SchematicContext): Rule {
    sharedOptions = options;

    // TODO remove elementChar case and clarify with Andreas T. we only say for now list .. DataType really simple remove all elementChar ...
    return mergeWith(
        apply(url('./generators/components/form/files'), [
            templateInclude(_context, applyTemplate, sharedOptions, '../shared/methods'),
            move(sharedOptions.path),
        ]),
        sharedOptions.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
    );
}

function applyTemplate(): Rule {
    return applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        options: sharedOptions,
        name: sharedOptions.name,
        enumPropertyDefinitions: getEnumPropertyDefinitions(sharedOptions, sharedOptions.listProps),
        // resolveJsPropertyType: resolveJsPropertyType,
    });
}
