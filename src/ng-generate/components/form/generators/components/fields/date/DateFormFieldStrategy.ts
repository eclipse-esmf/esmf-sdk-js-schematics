import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class DateFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/date/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn === 'date' || urn === 'gDay' || urn === 'gMonth' || urn === 'gYear' || urn === 'gMonthDay' || urn === 'gYearMonth';
    }

    buildConfig(): FormFieldConfig {
        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            validators: [...this.getBaseValidatorsConfigs()],
            readOnlyForm: this.readOnlyForm,
        };
    }
}
