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

export class TsConfigMenuGenerator {
    private readonly options: Schema;
    private readonly name: string;

    constructor(options: Schema) {
        this.options = options;
        this.name = options.templateHelper.resolveType(this.options.aspectModel).name;
    }

    generate(): string {
        return `
            /** ${this.options.templateHelper.getGenerationDisclaimerText()} **/
            import {Component, EventEmitter, Output} from '@angular/core';
            import {JSSdkLocalStorageService} from "${this.options.enableVersionSupport ? `../` : ``}../../services/storage.service";
            import {Config} from './${dasherize(this.options.name)}.component';

            @Component({
                selector: '${dasherize(this.options.name)}-config-menu',
                styleUrls: ['./${dasherize(this.options.name)}.component.scss'],
                template: \` ${this.getTableMenu()} \`,
            })
            export class ${classify(this.options.name)}ConfigMenuComponent {
                @Output() configChangedEvent = new EventEmitter<Array<Config>>();
                
                keyLocalStorage: string = '';
                closeConfigMenu: boolean = false;
                configs: Array<Config> = [];
            
                constructor(private storageService: JSSdkLocalStorageService) {}
            
                closeMenu(): void {
                  this.closeConfigMenu = true;
                }
            
                stopMenuClosing(event: MouseEvent): void {
                  if (this.closeConfigMenu) {
                    return;
                  }
                  event.stopPropagation();
                }
            
                configClick(event: MouseEvent, config: Config): void {
                  config.selected = !config.selected;
                  event.preventDefault();
                  event.stopPropagation();
                }
            
                colorChange(event: Event, config: Config) {
                  config.color = (event.target as HTMLInputElement).value;
                  event.preventDefault();
                  event.stopPropagation();
                }
            
                /**
                 * Store columns locally and update displayed columns afterwards
                 */
                storeConfig(): void {
                  this.closeConfigMenu = true;
                  this.storageService.setItem(this.keyLocalStorage, this.configs);
                  this.configChangedEvent.emit(this.configs);
                }
              }
        `;
    }

    private getTableMenu(): string {
        return `
            <div class="mat-h3 selection-title" (click)="$event.stopPropagation()">{{ 'settings.title' | translate }}</div>

            <mat-divider></mat-divider>
            <mat-selection-list cdkDropList data-test="config-selection-list" class="selection-list">
              <mat-list-option cdkDrag data-test="configuration-list-option" *ngFor="let config of configs" [selected]="config.selected" (click)="configClick($event, config)">
                <div class="list-content">
                  <div class="list-text">
                    <div data-test="config-option-name">{{ config.name | translate }}</div>
                    <div class="mat-small" data-test="config-option-desc">{{ config.desc | translate }}</div>
                  </div>
                  <div class="list-text">
                    <input #colorPicker type="color" name="color-picker" id="color-picker" value='{{config.color}}' (click)="$event.stopPropagation()" (change)="colorChange($event, config)">
                  </div>
                </div>
              </mat-list-option>
            </mat-selection-list>

            <mat-divider></mat-divider>

            <div data-test="config-menu-actions-container" class="menu-actions-container" (click)="stopMenuClosing($event)">
              <span class="spacer"></span>
              <button
                data-test="config-menu-cancel-button"
                mat-stroked-button
                color="accent"
                class="config-menu-cancel-btn"
                (click)="closeMenu()">
                <mat-icon data-test="config-menu-cancel-icon" class="material-icons">close</mat-icon>
                <span data-test="config-menu-cancel-text">{{ 'cancel' | translate }}</span>
              </button>
        
              <button
                data-test="config-menu-apply-button"
                mat-raised-button
                color="primary"
                class="config-menu-apply-btn"
                (click)="storeConfig()">
                <mat-icon data-test="config-menu-apply-icon" class="material-icons">check</mat-icon>
                <span data-test="config-menu-apply-text">{{ 'apply' | translate }}</span>
              </button>
            </div>
        `;
    }
}
