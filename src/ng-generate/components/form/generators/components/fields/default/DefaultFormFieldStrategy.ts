import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class DefaultFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/default/files';
    hasChildren = false;

    static isTargetStrategy(): boolean {
        return true;
    }

    buildConfig(): FormFieldConfig {
        const untypedChild = this.child as any;

        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            exampleValue: this.parent.exampleValue || '',
            unitName: untypedChild.unit?.name || '',
            validators: [...this.getBaseValidatorsConfigs()],
            readOnlyForm: this.readOnlyForm,
        };
    }
}
