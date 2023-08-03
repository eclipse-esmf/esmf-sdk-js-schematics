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

import {Property} from "@esmf/aspect-model-loader";
import {classify} from "@angular-devkit/core/src/utils/strings";
import {Schema} from "./schema";


/**
 * Gets enum properties from provided options and converts them into a string.
 *
 * @param {Schema} options - The options object which should contain 'templateHelper' that provides methods for manipulating templates.
 * @returns {string} - A string of comma-separated, classified enum property names.
 */
export function getEnumProperties(options: Schema): string {
    return options.templateHelper.getEnumProperties(options)
        .map((property: Property) => classify(property.characteristic.name)).join(',')
}
