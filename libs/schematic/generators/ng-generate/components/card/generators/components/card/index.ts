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

import {strings} from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url
} from '@angular-devkit/schematics';
import {Property} from '@esmf/aspect-model-loader';
import {generateCommandBar} from '../../../../shared/generators/index';
import {templateInclude} from '../../../../shared/include';
import {Schema} from '../../../../shared/schema';
import {getEnumProperties, getEnumPropertyDefinitions} from '../../../../shared/utils';

let sharedOptions: any = {};
let allProps: Array<Property> = [];

export function generateCardComponent(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    allProps = options.listAllProperties;

    return chain([...(options.addCommandBar ? [generateCommandBar(options, allProps)] : []), generateCard(options, _context)])(
      tree,
      _context,
    );
  };
}

function generateCard(options: Schema, _context: SchematicContext): Rule {
  sharedOptions = options;

  return mergeWith(
    apply(url('./generators/components/card/files'), [
      templateInclude(_context, applyTemplate, options, '../shared/methods'),
      move(sharedOptions.path),
    ]),
    sharedOptions.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error,
  );
}

function applyTemplate(): Rule {
  return applyTemplates({
    classify: strings.classify,
    dasherize: strings.dasherize,
    camelize: strings.camelize,
    options: sharedOptions,
    name: sharedOptions.name,
    selectedModelElementUrn: sharedOptions.selectedModelElement.aspectModelUrn,
    aspectModelElementUrn: sharedOptions.aspectModel.aspectModelUrn,
    enumProperties: getEnumProperties(sharedOptions),
    enumPropertyDefinitions: getEnumPropertyDefinitions(sharedOptions, allProps),
  });
}
