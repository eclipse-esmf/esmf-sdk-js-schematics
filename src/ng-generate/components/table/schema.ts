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

import {Values} from '../shared/schema';
import data from './schema.json';

export interface TableSchema extends Values {
    customRowActions: string[];
    addRowCheckboxes: boolean;
    customColumns: Array<string>;
}

export interface ITableDefaultsSchema {
    // defaultTestValue: boolean; this value should be defined in schema.json
}

export class TableDefaultsSchema implements ITableDefaultsSchema {
    // defaultTestValue = data.properties.defaultTestValue.default;
}
