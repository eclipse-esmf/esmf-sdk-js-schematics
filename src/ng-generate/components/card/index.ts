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

import {CardSchema} from "./schema";
import {chain, Rule, SchematicContext} from "@angular-devkit/schematics";
import {Tree} from "@angular-devkit/schematics/src/tree/interface";
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
    setTemplateOptionValuesRule
} from "../shared/index";
import {ComponentType, Schema} from "../shared/schema";
import {generateCardComponent} from "./generators/components/card";

export default function (cardSchema: CardSchema): Rule {
    return (tree: Tree, context: SchematicContext) => {
        generateComponent(context, cardSchema, ComponentType.CARD);
    };
}

export function generateCard(cardSchema: Schema): Rule {
    prepareOptions(cardSchema);

    return chain([
        loadRdfRule(),
        loadAspectModelRule(),
        setCustomActionsAndFiltersRule(),
        setComponentNameRule(ComponentType.CARD),
        insertVersionIntoSelectorRule(),
        insertVersionIntoPathRule(),
        setTemplateOptionValuesRule(),
        ...generateGeneralFilesRules(),
        ...cardSpecificGeneration(),
        ...addAndUpdateConfigurationFilesRule(),
        formatAllFilesRule()
    ]);
}

function cardSpecificGeneration(): Array<Rule> {
    return [
        generateCardComponent(options),
        // generateHighlightDirective(options)
    ]
}

