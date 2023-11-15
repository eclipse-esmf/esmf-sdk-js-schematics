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
import {
    generateDestroyedSubject,
    generateFormGroupReusable,
    generateFormValidators,
    generateGeneralStyle,
    generateSharedModule,
    generateTranslationModule,
} from '../shared/generators';
import {generateFormArrayReusable} from '../shared/generators/utils/form-array-reusable/index';
import {generateTranslationFiles} from '../../../utils/aspect-model';
import {wrapBuildComponentExecution} from '../../../utils/angular';

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
        ...genericGeneration(),
        ...formSpecificGeneration(),
        ...addAndUpdateConfigurationFilesRule(),
        ...utilsGeneration(),
        addDateTimePickerDependenciesRule(),
        addFormValidatorsDependenciesRule(),
        formatAllFilesRule(),
    ]);
}

function genericGeneration(): Array<Rule> {
    return [
        generateSharedModule(options),
        generateTranslationModule(options),
        generateGeneralStyle(options),
        generateTranslationFiles(options),
        wrapBuildComponentExecution(options),
    ];
}

function formSpecificGeneration(): Array<Rule> {
    return [generateFormComponent(options)];
}

function utilsGeneration(): Array<Rule> {
    return [
        generateFormControlReusable(options),
        generateFormGroupReusable(options),
        generateFormArrayReusable(options),
        generateDestroyedSubject(options),
        generateFormValidators(options),
    ];
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

function addFormValidatorsDependenciesRule(): Rule {
    const loadDependencies = [
        {
            type: NodeDependencyType.Default,
            version: '^0.0.2',
            name: 'charset-detector',
            overwrite: false,
        },
        {
            type: NodeDependencyType.Dev,
            version: '^0.0.2',
            name: '@types/charset-detector',
            overwrite: false,
        },
    ];

    return addPackageJsonDependencies(options.skipImport, options.spinner, loadDependencies);
}
