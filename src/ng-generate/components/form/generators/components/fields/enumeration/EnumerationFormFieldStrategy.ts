import {Characteristic, DefaultEnumeration} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class EnumerationFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/enumeration/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultEnumeration;
    }

    buildConfig(): FormFieldConfig {
        const typedChild = this.child as DefaultEnumeration;

        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            values: typedChild.values,
            validators: [...this.getBaseValidatorsConfigs()],
            readOnlyForm: this.readOnlyForm,
        };
    }
}
