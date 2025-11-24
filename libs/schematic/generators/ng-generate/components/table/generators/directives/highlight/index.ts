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
import {apply, applyTemplates, MergeStrategy, mergeWith, move, noop, Rule, url} from '@angular-devkit/schematics';

export function generateHighlightDirective(options: any): Rule {
  return () => {
    if (!options.hasSearchBar) {
      return noop;
    }

    return mergeWith(
      apply(url('./generators/directives/highlight/files'), [
        applyTemplates({
          classify: strings.classify,
          dasherize: strings.dasherize,
          options: options,
          name: 'highlight',
        }),
        move('src/app/shared/directives'),
      ]),
      options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
    );
  };
}
