import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class DateTimeFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/dateTime/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return (
            urn === 'dateTime' ||
            urn === 'dateTimeStamp' ||
            urn === 'dayTimeDuration' ||
            urn === 'duration' ||
            urn === 'time' ||
            urn === 'yearMonthDuration'
        );
    }

    buildConfig(): FormFieldConfig {
        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            validators: [...this.getBaseValidatorsConfigs()],
        };
    }
}
