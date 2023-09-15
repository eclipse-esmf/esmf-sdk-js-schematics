import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class TextAreaFormFieldStrategy extends FormFieldStrategy {
    templateName = 'textArea';

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn === 'langString';
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
