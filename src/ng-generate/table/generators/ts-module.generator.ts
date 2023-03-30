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
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';

export class TsModuleGenerator {
    private readonly options: Schema;
    private readonly name: string;

    constructor(options: Schema) {
        this.options = options;
        this.name = options.templateHelper.resolveType(this.options.aspectModel).name;
    }

    generate(): string {
        return `
            /** ${this.options.templateHelper.getGenerationDisclaimerText()} **/ 
            import {NgModule} from '@angular/core';
            import {${classify(this.options.name)}Component} from './${dasherize(this.options.name)}.component';
            import {${classify(this.options.name)}ColumnMenuComponent} from './${dasherize(this.options.name)}-column-menu.component';
            import {AppSharedModule} from 'src/app/shared/app-shared.module';
            
            @NgModule({
                declarations: [${classify(this.options.name)}Component, ${classify(this.options.name)}ColumnMenuComponent],
                imports: [AppSharedModule],
                providers: [],
                exports: [ ${classify(this.options.name)}Component ],
            })
            export class ${classify(this.options.name)}Module {}
        `;
    }
}
