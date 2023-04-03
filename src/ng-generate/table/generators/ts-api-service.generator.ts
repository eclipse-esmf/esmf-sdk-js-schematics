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

import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {Schema} from '../schema';

export class TsApiServiceGenerator {
    private readonly options: Schema;
    private readonly name: string;
    private readonly isRemote: boolean;
    private readonly customServiceName: string;
    private readonly serviceName: string;
    private type: string;

    constructor(options: Schema) {
        this.options = options;
        this.isRemote = options.enableRemoteDataHandling;
        this.name = options.templateHelper.resolveType(this.options.aspectModel).name;
        this.customServiceName = `Custom${classify(this.options.name)}Service`;
        this.serviceName = `${classify(this.options.name)}Service`;
    }

    generate(): string {
        this.type = classify(this.options.templateHelper.resolveType(this.options.aspectModel).name);
        const aspectClassName = classify(this.options.aspectModel.name);
        return `
            /** ${this.options.templateHelper.getGenerationDisclaimerText()} **/ 
            import {HttpClient} from '@angular/common/http';
            import {Observable} from 'rxjs';
            import {${this.type}} from '${this.options.templateHelper.getTypesPath(
            this.options.enableVersionSupport,
            this.options.aspectModelVersion,
            this.options.aspectModel
        )}';
            import {Injectable} from '@angular/core';
            
            export interface ${aspectClassName}Response {
                items: ${this.type}[];
                totalItems?: number;
            }

            export interface Generic${aspectClassName}Payload {
                [key: string]: string | number | boolean;
            }

            export type ${aspectClassName}Payload<T extends Generic${aspectClassName}Payload = Generic${aspectClassName}Payload> = T & {
                query: string
            }
            
            @Injectable({
                providedIn: 'root'
            })
            export class ${this.serviceName} {
            
              ${this.generateConstructor()}

              ${this.options.enableRemoteDataHandling ? this.generateRequestDataFn() : ``}
              
              ${this.generateDownloadCsvFn()}
            }
        `;
    }

    generateConstructor(): string {
        return `constructor(protected http: HttpClient) {}`;
    }

    generateRequestDataFn(): string {
        return `
        requestData(remoteAPI: string, body: ${classify(this.options.aspectModel.name)}Payload): Observable<${
            this.options.aspectModel.name
        }Response> {
            const strippedUrlParts: string[] = remoteAPI.split('?');
            if (strippedUrlParts && strippedUrlParts.length === 2) {
                const queryParams = new URLSearchParams(strippedUrlParts[1]);
                queryParams.forEach((value, key) => {
                    body[key] = value;
                });
            }
            return this.http.post<${this.options.aspectModel.name}Response>(strippedUrlParts[0], body);
        }`;
    }

    generateDownloadCsvFn(): string {
        return `
        downloadCsv(csvArray: any): void {
            if (!csvArray.length) {
                throw new Error('Empty file. Please try again with data.');
            }
            const a = document.createElement('a');
            const blob = new Blob([csvArray], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
        
            a.href = url;
            a.download = '${dasherize(this.name)}.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        }
    
        flatten(csvArray: ${this.type}[]): ${this.type}[] {
            return csvArray.map((item: ${this.type}): ${this.type} => {
                return this.flattenObj(item);
            });
        }
        
        private flattenObj(obj: any): any {
            const result: any = {};
        
            for (let key in obj) {
              if (typeof obj[key].constructor.isEnumeration === 'function' && obj[key]?.constructor?.isEnumeration()) {
                const enumerationValues = obj[key].constructor.values().find((v: any) =>
                  Object.keys(v).every(k => v[k] === obj[key][k])
                )
        
                result[key] = Object.values(enumerationValues).join('-');
              } else if (typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
                    const childObj = this.flattenObj(obj[key]);
    
                    for (let childObjKey in childObj) {
                        result[\`\${key}.\${childObjKey}\`] = childObj[childObjKey];
                    }
                } else {
                    result[key] = obj[key];
                }
            }
            return result;
        }      
        `;
    }

    generateCustom(): string {
        return `
            import {Injectable} from '@angular/core';
            import {HttpClient} from '@angular/common/http';
            import { ${this.serviceName} } from './${dasherize(this.options.name)}.service';
            
            /**
             * Custom service which extend the original API service for fetching
             * ${this.options.selectedModelElement.name} data from the configured 
             * remote API.
             *
             * If you need to override or to extend the current functionality,
             * this is the right place to do. All modifications are preserved while
             * generating the table component again, also in combination with
             * the cli parameter '--force'.
             */
            @Injectable({
                providedIn: 'root'
            })
            export class ${this.customServiceName} extends ${this.serviceName} {
                constructor(http: HttpClient) {
                    super(http);
                }
            }
        `;
    }
}
