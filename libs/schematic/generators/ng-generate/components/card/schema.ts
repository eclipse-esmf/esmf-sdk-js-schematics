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

import {Values} from '../shared/schema';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CardSchema extends Values {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConfigurationDefaultsSchema {}

// class to define default values that are not asked in the prompter
//  defaultValue = data.properties.defaultValue.default;
export class CardDefaultsSchema implements ConfigurationDefaultsSchema {}
