import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

const typesConfigs = [
    {
        type: 'gDay',
        hint: "Examples: '---04', '---04+03:00'",
    },
    {
        type: 'gMonth',
        hint: "Examples: '--04', '--04+03:00'",
    },
    {
        type: 'gYear',
        hint: "Examples: '2000', '2000+03:00'",
    },
    {
        type: 'gMonthDay',
        hint: "Examples: '--01-01', '--01-01+03:00'",
    },
    {
        type: 'gYearMonth',
        hint: "Examples: '2000-01', '2000-01+03:00'",
    },
];
const supportedTypes = typesConfigs.map(dt => dt.type);

export class DatePartialFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/duration/files';
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
            hint: this.getHint(),
        };
    }

    getHint(): string | undefined {
        const urn = DatePartialFormFieldStrategy.getShortUrn(this.child);
        return typesConfigs.find(dt => dt.type === urn)?.hint;
    }
}
