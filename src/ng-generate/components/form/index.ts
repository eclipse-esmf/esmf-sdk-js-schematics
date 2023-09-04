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

import {FormSchema} from './schema';
import {chain, Rule, SchematicContext} from '@angular-devkit/schematics';
import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {
    formatAllFilesRule,
    generateComponent,
    insertVersionIntoPathRule,
    insertVersionIntoSelectorRule,
    loadAspectModelRule,
    loadRdfRule,
    options,
    prepareOptions,
    setComponentNameRule,
    setTemplateOptionValuesRule,
} from '../shared/index';
import {ComponentType, Schema} from '../shared/schema';
import {generateFormComponent} from "./generators/components/form/index";
import {addPackageJsonDependencies} from "../../../utils/package-json";
import {NodeDependencyType} from "@schematics/angular/utility/dependencies";

export default function (formSchema: FormSchema): Rule {
    return (tree: Tree, context: SchematicContext) => {
        generateComponent(context, formSchema, ComponentType.FORM);
    };
}

export function generateForm(formSchema: Schema): Rule {
    prepareOptions(formSchema, ComponentType.FORM);

    return chain([
        loadRdfRule(),
        loadAspectModelRule(),
        // setCustomActionsAndFiltersRule(),
        setComponentNameRule(ComponentType.FORM),
        insertVersionIntoSelectorRule(),
        insertVersionIntoPathRule(),
        setTemplateOptionValuesRule(),
        // ...generateGeneralFilesRules(),
        ...formSpecificGeneration(),
        // ...addAndUpdateConfigurationFilesRule(),
        // TODO reactivate addDateTimePickerDependenciesRule()
        // addDateTimePickerDependenciesRule(),
        formatAllFilesRule(),
    ]);
}

function formSpecificGeneration(): Array<Rule> {
    return [generateFormComponent(options)];
}

function addDateTimePickerDependenciesRule(): Rule {
    const loadDependencies =
        [
            {
                type: NodeDependencyType.Default,
                version: '^16.0.1',
                name: '@angular-material-components/datetime-picker',
                overwrite: false
            },
            {
                type: NodeDependencyType.Default,
                version: '^16.0.1',
                name: '@angular-material-components/moment-adapter',
                overwrite: false
            },
        ];

    // Todo update component module file with NgxMatTimepickerModule, NgxMatDatetimePickerModule, NgxMatMomentModule and declarations/export -> MovementFormComponent
    return addPackageJsonDependencies(options.skipImport, options.spinner, loadDependencies);
}
