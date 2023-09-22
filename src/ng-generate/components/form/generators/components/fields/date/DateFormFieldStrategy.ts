import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

const DEFAULT_FORMAT = 'yyyy-MM-DD';
const typesConfigs = [
    {
        type: 'date',
        format: 'yyyy-MM-DD',
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class DateFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/date/files';
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
        const urn = DateFormFieldStrategy.getShortUrn(this.child);
        const format = typesConfigs.find(dt => dt.type === urn)?.format;
        return format || DEFAULT_FORMAT;
    }
}
