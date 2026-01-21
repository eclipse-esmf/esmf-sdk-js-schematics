/*
 * Copyright (c) 2024 Robert Bosch Manufacturing Solutions GmbH
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

import {
  Characteristic,
  DefaultPropertyInstanceDefinition,
  DefaultStructuredValue,
  Property
} from '@esmf/aspect-model-loader';
import {DefaultProperty} from '@esmf/aspect-model-loader/dist/aspect-meta-model/default-property';
import {GenericValidator, ValidatorConfig} from '../../validators/validatorsTypes';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {getFormFieldStrategy} from '../index';

export class StructuredValueFormFieldStrategy extends FormFieldStrategy {
  pathToFiles = './generators/components/fields/structuredValue/files';
  hasChildren = true;

  declare child: DefaultStructuredValue;

  static isTargetStrategy(child: Characteristic): boolean {
    return child instanceof DefaultStructuredValue;
  }

  buildConfig(): FormFieldConfig {
    return {
      ...this.getBaseFormFieldConfig(),
      deconstructionRule: this.child.deconstructionRule,
      validators: this.getValidatorsConfigs(),
      children: this.getChildConfigs(),
    };
  }

  getDataTypeValidatorsConfigs(): ValidatorConfig[] {
    return [this.deconstructionRuleGroupValidatorConfig(this.child)];
  }

  getChildStrategies(): FormFieldStrategy[] {
    const instantiatedElements = this.child.elements.filter(
      element => element instanceof DefaultPropertyInstanceDefinition,
    ) as DefaultPropertyInstanceDefinition[];
    return instantiatedElements.map(element => this.getChildStrategy(element, element.characteristic));
  }

  getChildStrategy(parent: Property, child: Characteristic): FormFieldStrategy {
    return getFormFieldStrategy(this.options, this.context, parent, child, parent.name);
  }

  deconstructionRuleGroupValidatorConfig(element: DefaultStructuredValue): ValidatorConfig {
    const elements = element.elements.filter(el => el && typeof el !== 'string') as DefaultProperty[];
    const rules = element.deconstructionRule.split('@').map(rule => `/${rule}/`);
    const deconstructionRulesConfigs = rules.map((rule, i) => `{ name: "${elements[i]?.name ?? ''}", rule: ${rule} }`);

    return {
      name: GenericValidator.DeconstructionRule,
      definition: `FormValidators.deconstructionRuleValidator([
            ${deconstructionRulesConfigs.join(',\n')}
        ])`,
      isDirectGroupValidator: true,
    };
  }
}
