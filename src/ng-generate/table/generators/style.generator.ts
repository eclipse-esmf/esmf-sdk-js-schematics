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

export class StyleGenerator {
    static getStyle(options: Schema): string {
        return `
        /** ${options.templateHelper.getGenerationDisclaimerText()} **/ 
        
        ${options.customStyleImports.map(styleImport => `@import '${styleImport}';`).join('')}
        
        $gray-100: #f5f5f5;
        $gray-300: #e0e0e0;
        
        .js-sdk-component-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        
            .mat-table-container {
                position: relative;
                height: 90%;
                overflow-y: auto;
        
                .full-width-table {
                    width: 100%;
        
                    .mat-row:not([data-test='no-data-table-row']):not(.selected-row):hover {
                        background: $gray-100;
                    }
        
                    .selected-row {
                        background: var(--selected-row-highlight-color, $gray-300);
                    }
        
                    .mat-cell {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 100px;
                        white-space: nowrap;
                        font-size: inherit;
                        padding-right: 30px;
                        position: relative;
        
                        &:hover {
                            .copy-to-clipboard {
                                opacity: 1;
                                transition: all 0.2s ease-in;
                            }
                        }
                    }
        
                    .mat-header-cell {
                        position: relative;
        
                        &.table-header-number {
                            ::ng-deep .mat-sort-header-container {
                                justify-content: flex-end;
                                padding-right: 15px;
                            }
                        }
                    }
        
                    .table-cell-number {
                        text-align: right;
                    }
        
                    .mat-column-customRowActions {
                        padding-right: 0;
                        padding-left: 8px;
                    }
        
                    .mat-column-columnsMenu {
                        width: 35px;
                        padding-right: 0;
        
                        .mat-table-menu-button {
                            height: 40px;
                            width: 35px;
                        }
                    }
        
                    .mat-column-checkboxes {
                        max-width: 50px;
                        padding-right: 8px;
                    }
                }
            }
        
            .toolbar {
                font-size: inherit;
                align-items: center;
                margin-bottom: 20px;
        
                .mat-form-field {
                    height: 100%;
                    padding-top: 10px;
                    margin-right: 8px;
                }
        
                .search-input {
                    margin-right: 8px;
                }
        
                .command-bar-number-of-items {
                    margin-right: 10px;
                }
            }
        
            .copy-to-clipboard {
                position: absolute;
                right: 0;
                top: -5px;
                opacity: 0;
                transition: all 0.2s ease-in;
        
                mat-icon {
                    font-size: 12px;
                }
            }
        
            .chip-text {
                max-width: 200px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        
            ::ng-deep .mat-chip-list-wrapper {
                margin: 0;
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: center;
                
                .mat-chip {
                    flex: 0 0 auto;
                }
            }
            
            .scrollable-chips-container {
                display: flex;
                align-content: center;
                position: relative;
        
                .chip-list-container {
                    display: flex;
                    overflow: hidden;
                    scroll-behavior: smooth;
                }
            }
        }
        
        ::ng-deep {
            .advanced-search-option-description {
                position: relative;
                float: left;
                font-size: 10px;
                line-height: 1;
                top: -12px;
                white-space: break-spaces;
            }
  
            & .resizing {
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                cursor: e-resize;
            }
        
            & .handle {
                width: 15px;
                position: absolute;
                top: 0;
                right: 0;
                height: 100%;
                cursor: col-resize;
                opacity: 0;
                transition: all 0.2s ease-in;
        
                &:after {
                    content: '';
                    display: block;
                    width: 1px;
                    height: 100%;
                    z-index: 1;
                    background: linear-gradient(0, rgba(255, 255, 255, 1) 0%, rgba(157, 157, 157, 1) 49%, rgba(255, 255, 255, 1) 100%);
                    transition: all 0.5ms ease-in;
                }
            }
        
            .mat-menu-panel {
                max-width: max-content !important;
            }
        
            .mat-list-item-content {
                flex-direction: row !important;
            }
        
            .mat-pseudo-checkbox {
                margin-right: 10px;
            }
        }
        
        .spacer {
            flex: 1 1 auto;
        }
        
        .selection-title {
            padding: 8px 0 16px 16px;
            margin: 0;
        }
        
        .menu-actions-container {
            display: flex;
            align-items: center;
            align-content: space-around;
            padding: 16px 16px 8px 16px;
            min-width: 450px;
        
            .column-menu {
                &-restore-btn {
                    align-self: flex-start;
                }
        
                &-cancel-btn {
                    cursor: pointer;
                    margin: 0 8px;
                }
            }
            
            .config-menu {
                &-cancel-btn {
                    cursor: pointer;
                    margin: 0 8px;
                }
            }
        }
        
        .list-content {
            display:flex; align-items: center;
            justify-content: space-between;
            padding-left:8px;
        }

        .bg-transparent {
            background: initial;
        }

        
        .filter-options-container {
            overflow-y: auto; 
            min-height: 100px; 
            max-height: 200px;
        }
        
        .filter-actions-container {
            text-align:right;
            padding: 6px;
        
            .filter-apply-btn {
                margin-left: 10px;
            }
        }
        
        `;
    }
}
