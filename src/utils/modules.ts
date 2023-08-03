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

import {SchematicContext, Tree} from '@angular-devkit/schematics';
import {classify, dasherize} from "@angular-devkit/core/src/utils/strings";
import {Schema} from "../ng-generate/components/shared/schema";
import {addToDeclarationsArray, addToExportsArray} from "./angular";
import {TableSchema} from "../ng-generate/components/table/schema";

const generalComponentsModules = (options: Schema) => [
    {name: 'MatPaginatorModule', fromLib: '@angular/material/paginator'},
    {name: 'MatButtonModule', fromLib: '@angular/material/button'},
    {name: 'MatMenuModule', fromLib: '@angular/material/menu'},
    {name: 'HttpClientModule', fromLib: '@angular/common/http'},
    {name: 'MatIconModule', fromLib: '@angular/material/icon'},
    {name: 'MatTooltipModule', fromLib: '@angular/material/tooltip'},
    {name: 'NgIf', fromLib: '@angular/common'},
    {name: 'NgFor', fromLib: '@angular/common'},
    {name: 'NgClass', fromLib: '@angular/common'},
    {name: 'MatDialogModule', fromLib: '@angular/material/dialog'},
    {
        name: 'MatToolbarModule',
        fromLib: '@angular/material/toolbar',
        skip: () => !options.addCommandBar || options.skipImport
    },
    {
        name: 'MatFormFieldModule',
        fromLib: '@angular/material/form-field',
        skip: () => !options.addCommandBar || options.skipImport
    },
    {
        name: 'MatInputModule',
        fromLib: '@angular/material/input',
        skip: () => !options.addCommandBar || options.skipImport
    },
    {
        name: 'MatChipsModule',
        fromLib: '@angular/material/chips',
        skip: () => !options.addCommandBar || options.skipImport
    },
    {
        name: 'ReactiveFormsModule',
        fromLib: '@angular/forms',
        skip: () => !options.addCommandBar || options.skipImport
    },
    {
        name: 'MatSelectModule',
        fromLib: '@angular/material/select',
        skip: () => !options.addCommandBar || options.skipImport
    },
    {
        name: 'MatOptionModule',
        fromLib: '@angular/material/core',
        skip: () => !options.enabledCommandBarFunctions?.includes('addEnumQuickFilters') || options.skipImport
    },
    {
        name: 'MatDatepickerModule',
        fromLib: '@angular/material/datepicker',
        skip: () => !options.enabledCommandBarFunctions?.includes('addDateQuickFilters') || options.skipImport
    }
];


export const tableModules = (options: Schema) => [
    ...generalComponentsModules(options),
    {name: 'MatTableModule', fromLib: '@angular/material/table'},
    {name: 'MatSortModule', fromLib: '@angular/material/sort'},
    {name: 'ClipboardModule', fromLib: '@angular/cdk/clipboard'},
    {name: 'MatListModule', fromLib: '@angular/material/list'},
    {name: 'DragDropModule', fromLib: '@angular/cdk/drag-drop'},
    {name: 'NgTemplateOutlet', fromLib: '@angular/common'},
    {name: 'DatePipe', fromLib: '@angular/common'},
    {
        name: 'MatCheckboxModule',
        fromLib: '@angular/material/checkbox',
        skip: () => !(options as TableSchema).addRowCheckboxes || options.skipImport
    },
    {
        name: 'MatMomentDateModule',
        fromLib: '@angular/material-moment-adapter',
        skip: () => options.templateHelper.getDateProperties(options).length < 1 || options.skipImport
    },
];

export const cardModules = (options: Schema) => [
    ...generalComponentsModules(options),
    {name: 'MatCardModule', fromLib: '@angular/material/card'},
    {name: 'NgForOf', fromLib: '@angular/common'},
    {name: 'SlicePipe', fromLib: '@angular/common'},
];

export const APP_SHARED_MODULES = [
    {name: 'MatButtonModule', fromLib: '@angular/material/button'},
    {name: 'MatDialogModule', fromLib: '@angular/material/dialog'},
    {name: 'MatCheckboxModule', fromLib: '@angular/material/checkbox'},
    {name: 'MatIconModule', fromLib: '@angular/material/icon'},
    {name: 'FormsModule', fromLib: '@angular/forms'},
    {name: 'NgIf', fromLib: '@angular/common'},
]

export function updateSharedModule(options: Schema) {
    return (tree: Tree, _context: SchematicContext): Tree => {

        const generatePath = (type: string, name: string, extraPath = '') => {
            let base = '';
            switch (type) {
                case 'component':
                    base = `./components/${name}`;
                    break;
                case 'directive':
                    base = './directives';
                    break;
                case 'pipe':
                    base = './pipes';
                    break;
            }
            return `${base}/${dasherize(name)}.${type}`;
        };

        const generateClassName = (type: string, name: string) => `${classify(name)}${classify(type)}`;

        const processItem = async (type: string, name: string, extraPath = '') => {
            const path = generatePath(type, name, extraPath);
            const className = generateClassName(type, name);
            await addToDeclarationsArray(options, tree, className, path, options.templateHelper.getSharedModulePath());
            await addToExportsArray(options, tree, className, path, options.templateHelper.getSharedModulePath());
        };

        processItem('component', 'export-confirmation-dialog');

        ['horizontal-overflow', 'resize-column', 'validate-input'].forEach(directive => processItem('directive', directive));
        if (options.templateHelper.hasSearchBar(options)) {
            processItem('directive', 'highlight');
        }

        processItem('pipe', 'show-description');

        return tree;
    }
}
