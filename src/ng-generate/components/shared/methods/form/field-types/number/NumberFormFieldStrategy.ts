import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class NumberFormFieldStrategy extends FormFieldStrategy {
    templateName = 'number';

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return (
            urn === 'byte' ||
            urn === 'float' ||
            urn === 'decimal' ||
            urn === 'double' ||
            urn === 'integer' ||
            urn === 'int' ||
            urn === 'positiveInteger' ||
            urn === 'long' ||
            urn === 'negativeInteger' ||
            urn === 'nonPositiveInteger' ||
            urn === 'nonNegativeInteger' ||
            urn === 'short' ||
            urn === 'unsignedInt' ||
            urn === 'unsignedByte' ||
            urn === 'unsignedLong' ||
            urn === 'unsignedShort'
        );
    }

    buildConfig(): FormFieldConfig {
        const untypedChild = this.child as any;

        return {
            templateName: this.templateName,
            htmlTemplatePath: this.getTemplatePath(TemplateType.Html),
            tsTemplatePath: this.getTemplatePath(TemplateType.Ts),
            name: this.fieldName,
            exampleValue: this.parent.exampleValue || '',
            unitName: untypedChild.unit?.name || '',
            validators: [...this.getBaseValidatorsConfigs()],
            validatorsHtmlTemplatePath: this.validatorsHtmlTemplatePath,
        };
    }
}
