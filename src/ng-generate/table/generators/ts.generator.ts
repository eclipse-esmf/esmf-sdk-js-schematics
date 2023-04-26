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
import {TsDatasourceGenerator} from './ts-datasource.generator';
import {TsApiServiceGenerator} from './ts-api-service.generator';
import {TsComponentGenerator} from './ts-component.generator';
import {TsDirectiveGenerator} from './ts-directive.generator';
import {TsFilterServiceGenerator} from './ts-filter-service.generator';
import {TsStorageServiceGenerator} from './ts-storage-service.generator';
import {TsModuleGenerator} from './ts-module.generator';
import {TsColumnMenuGenerator} from './ts-column-menu.generator';
import {TsPipeGenerator} from './ts-pipe.generator';
import {TsConfigMenuGenerator} from "./ts-config-menu.generator";

export class TsGenerator {
    constructor(private options: Schema) {
    }

    generateDataSource() {
        return new TsDatasourceGenerator(this.options).generate();
    }

    generateService(): string {
        return new TsApiServiceGenerator(this.options).generate();
    }

    generateCustomService(): string {
        return new TsApiServiceGenerator(this.options).generateCustom();
    }

    generateComponent(): string {
        return new TsComponentGenerator(this.options).generate();
    }

    generateFilterService(): string | null {
        return new TsFilterServiceGenerator(this.options).generate();
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

    generateModule(): string {
        return new TsModuleGenerator(this.options).generate();
    }

    generateColumnMenu(): string {
        return new TsColumnMenuGenerator(this.options).generate();
    }

    generateConfigMenu(): string {
        return new TsConfigMenuGenerator(this.options).generate();
    }

    static generateAppSharedModule(options: Schema): string {
        return `
        /** ${options.templateHelper.getGenerationDisclaimerText()} **/ 
        import { HttpClient } from '@angular/common/http';
        import { NgModule } from '@angular/core';
        import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
        import { TranslateHttpLoader } from '@ngx-translate/http-loader';
        
        export function HttpLoaderFactory(http: HttpClient) {
            return new TranslateHttpLoader(http);
        }
        
        @NgModule({
            imports: [TranslateModule.forRoot({
                defaultLanguage:'en',
                loader: {
                    provide: TranslateLoader,
                    useFactory: HttpLoaderFactory,
                    deps: [HttpClient]
                }
            })],
            exports: [TranslateModule]
        })
        export class AppSharedModule { }`;
    }
}
