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

export class TsStorageServiceGenerator {
    generate(options: Schema): string {
        return `
            /** ${options.templateHelper.getGenerationDisclaimerText()} **/ 
            import {Injectable} from '@angular/core';
            
            /**
             * Manage user settings based on the local storage of the browser.
             */
            export abstract class BrowserStorage {
                abstract getItem<T = any>(key: string): T;
                abstract removeItem(key: string): void;
                abstract setItem<T = any>(key: string, item: T): void;
            }
            
            @Injectable({
                providedIn: 'root',
            })
            export class JSSdkLocalStorageService implements BrowserStorage {
                /** 
                 * Prefix for keys to avoid overwriting of values of a app having the same key. 
                 */ 
                readonly KEY_PREFIX = 'JSSDK_';
            
                getItem<T = any>(key: string): T {
                    const item = localStorage.getItem(\`\${this.KEY_PREFIX}\${key}\`);
                    return item ? JSON.parse(item) : undefined;
                }
            
                removeItem(key: string): void {
                    localStorage.removeItem(key);
                }
            
                setItem<T = any>(key: string, item: T): void {
                    localStorage.setItem(\`\${this.KEY_PREFIX}\${key}\`, JSON.stringify(item));
                }
            }

        `;
    }
}
