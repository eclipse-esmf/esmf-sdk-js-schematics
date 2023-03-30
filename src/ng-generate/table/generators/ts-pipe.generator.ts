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

export class TsPipeGenerator {
    static generateShowDescriptionPipe(options: Schema): string {
        return `
        /** ${options.templateHelper.getGenerationDisclaimerText()} **/
        import {Pipe, PipeTransform} from "@angular/core";

        @Pipe({name: 'showDescription'})
        export class ShowDescriptionPipe implements PipeTransform {
            transform(value: any, getByValueFn: any, onlyDesc?: boolean): any {
                return onlyDesc
                    ? \`\${getByValueFn(value.toString())?.description}\` || ''
                    : \`\${value} - \${getByValueFn(value.toString())?.description}\` || '';
            }
        }
        `;
    }
}
