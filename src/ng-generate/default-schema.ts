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

import {Aspect, Entity} from '@esmf/aspect-model-loader';
import * as ora from 'ora';
import {TemplateHelper} from '../utils/template-helper';

export interface DefaultSchema {
    spinner: ora.Ora;
    ttl: Array<string>;
    aspectModel: Aspect;
    aspectModelVersion: string;
    enableVersionSupport: boolean;
    selectedModelElement: Aspect | Entity;
    aspectModelTFiles: string[];
    aspectModelTFilesString: string;
    aspectModelUrnToLoad: string;
    selectedModelElementUrn: string;
    configFile: string;
    templateHelper: TemplateHelper;
}
