import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from './FormFieldStrategy';
import {FORM_FIELD_DEFAULT_STRATEGY, FORM_FIELD_STRATEGIES, FormFieldDefaultStrategy, FormFieldStrategies} from './form-field-strategies';

export class FormFieldBuilder {
    static strategies: FormFieldStrategies = FORM_FIELD_STRATEGIES;
    static defaultStrategy: FormFieldDefaultStrategy = FORM_FIELD_DEFAULT_STRATEGY;

    static buildFieldsConfigs(options: any): FormFieldConfig[] {
        return options.listAllProperties.map((property: any) => this.buildFieldConfig(options, property, property.characteristic));
    }

    static buildFieldConfig(
        options: any,
        parent: Property,
        child: Characteristic,
        forceParams: {name?: string; parentFieldsNames?: string[]} = {}
    ): FormFieldConfig {
        // TODO: Handle
        // if (property.characteristic instanceof options.collection)

        const strategy = this.strategies.find(strategy => strategy.isTargetStrategy(child)) ?? this.defaultStrategy;
        const formFieldStrategy: FormFieldStrategy = new strategy(options, parent, child, forceParams);
        return formFieldStrategy.buildConfig();
    }

    // An example of validation to consider in the future
    static getDateTypeValidation(characteristic: Characteristic) {
        const urn = characteristic.dataType?.shortUrn;

        if (urn === 'byte') {
            return [-128, 127];
        }

        if (urn === 'short') {
            return [-32768, 32767];
        }

        if (urn === 'integer' || urn === 'int') {
            return [-2147483648, 2147483647];
        }

        if (urn === 'unsignedByte') {
            return [0, 255];
        }

        if (urn === 'unsignedShort') {
            return [0, 65535];
        }

        if (urn === 'unsignedInt') {
            return [0, 4294967295];
        }

        if (urn === 'positiveInteger' || urn === 'int') {
            return [1, 2147483647];
        }

        if (urn === 'negativeInteger' || urn === 'int') {
            return [-2147483648, -1];
        }

        if (urn === 'nonPositiveInteger' || urn === 'int') {
            return [0, 2147483647];
        }

        if (urn === 'nonNegativeInteger' || urn === 'int') {
            return [-2147483648, 0];
        }

        return [];
    }
}
