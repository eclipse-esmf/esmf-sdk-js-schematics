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
    addAndUpdateConfigurationFilesRule,
    formatAllFilesRule,
    generateComponent,
    generateGeneralFilesRules,
    insertVersionIntoPathRule,
    insertVersionIntoSelectorRule,
    loadAspectModelRule,
    loadRdfRule,
    options,
    prepareOptions,
    setComponentNameRule,
    setCustomActionsAndFiltersRule,
    setTemplateOptionValuesRule,
} from '../shared/index';
import {ComponentType, Schema} from '../shared/schema';
import {generateFormComponent} from './generators/components/form/index';
import {addPackageJsonDependencies} from '../../../utils/package-json';
import {NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {generateFormControlReusable} from '../shared/generators/utils/form-control-reusable/index';
import {generateDestroyedSubject, generateFormGroupReusable} from '../shared/generators';

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
        setCustomActionsAndFiltersRule(),
        setComponentNameRule(ComponentType.FORM),
        insertVersionIntoSelectorRule(),
        insertVersionIntoPathRule(),
        setTemplateOptionValuesRule(),
        ...generateGeneralFilesRules(),
        ...formSpecificGeneration(),
        ...addAndUpdateConfigurationFilesRule(),
        ...utilsGeneration(),
        addDateTimePickerDependenciesRule(),
        formatAllFilesRule(),
    ]);
}

function formSpecificGeneration(): Array<Rule> {
    return [generateFormComponent(options)];
}

function utilsGeneration(): Array<Rule> {
    return [generateFormControlReusable(options), generateFormGroupReusable(options), generateDestroyedSubject(options)];
}

// TODO: Move to date-related controls generation?
function addDateTimePickerDependenciesRule(): Rule {
    const loadDependencies = [
        {
            type: NodeDependencyType.Default,
            version: '^16.0.1',
            name: '@angular-material-components/datetime-picker',
            overwrite: false,
        },
        {
            type: NodeDependencyType.Default,
            version: '^16.0.1',
            name: '@angular-material-components/moment-adapter',
            overwrite: false,
        },
    ];

    return addPackageJsonDependencies(options.skipImport, options.spinner, loadDependencies);
}
