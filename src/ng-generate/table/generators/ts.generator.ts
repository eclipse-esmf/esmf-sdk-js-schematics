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

import {Schema} from '../schema';
import {TsApiServiceGenerator} from './ts-api-service.generator';
import {TsDirectiveGenerator} from './ts-directive.generator';
import {TsStorageServiceGenerator} from './ts-storage-service.generator';
import {TsPipeGenerator} from './ts-pipe.generator';

export class TsGenerator {
    constructor(private options: Schema) {
    }

    generateService(): string {
        return new TsApiServiceGenerator(this.options).generate();
    }

    generateCustomService(): string {
        return new TsApiServiceGenerator(this.options).generateCustom();
    }

    generateResizeDirective(): string {
        return TsDirectiveGenerator.generateResizeDirective(this.options);
    }

    generateValidateInputDirective(): string {
        return TsDirectiveGenerator.generateValidateInputDirective(this.options);
    }

    generateShowDescriptionPipe(): string {
        return TsPipeGenerator.generateShowDescriptionPipe(this.options);
    }

    generateSearchStringPipe(): string {
        return TsPipeGenerator.generateSearchStringPipe(this.options);
    }

    generateHorizontalOverflowDirective(): string {
        return TsDirectiveGenerator.generateHorizontalOverflowDirective(this.options);
    }

    generateStorageService(): string {
        return new TsStorageServiceGenerator().generate(this.options);
    }
}
