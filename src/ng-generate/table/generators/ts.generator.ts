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
import {TsComponentGenerator} from './ts-component.generator';
import {TsDirectiveGenerator} from './ts-directive.generator';
import {TsStorageServiceGenerator} from './ts-storage-service.generator';
import {TsColumnMenuGenerator} from './ts-column-menu.generator';
import {TsPipeGenerator} from './ts-pipe.generator';
import {TsConfigMenuGenerator} from "./ts-config-menu.generator";

export class TsGenerator {
    constructor(private options: Schema) {
    }

    generateService(): string {
        return new TsApiServiceGenerator(this.options).generate();
    }

    generateCustomService(): string {
        return new TsApiServiceGenerator(this.options).generateCustom();
    }

    // TODO can be removed
    generateComponent(): string {
        return new TsComponentGenerator(this.options).generate();
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

    generateColumnMenu(): string {
        return new TsColumnMenuGenerator(this.options).generate();
    }

    generateConfigMenu(): string {
        return new TsConfigMenuGenerator(this.options).generate();
    }
}
