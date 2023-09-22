import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

const DEFAULT_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ';
const typesConfigs = [
    {
        type: 'dateTime',
        format: 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ',
    },
    {
        type: 'dateTimeStamp',
        format: 'YYYY-MM-DDTHH:mm:ss.SSSSSZ',
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class DateTimeFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/dateTime/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn ? supportedTypes.includes(urn) : false;
    }

    buildConfig(): FormFieldConfig {
        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            validators: [...this.getBaseValidatorsConfigs()],
            dataFormat: this.getDataFormat(),
        };
    }

    getDataFormat(): string {
        const urn = DateTimeFormFieldStrategy.getShortUrn(this.child);
        const format = typesConfigs.find(dt => dt.type === urn)?.format;
        return format || DEFAULT_FORMAT;
    }
}
