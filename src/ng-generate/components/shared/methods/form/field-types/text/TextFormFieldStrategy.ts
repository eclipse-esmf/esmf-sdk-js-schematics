import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class TextFormFieldStrategy extends FormFieldStrategy {
    templateName = 'text';

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn === 'string' || urn === 'anyURI' || urn === 'hexBinary' || urn === 'curie' || urn === 'base64Binary';
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
            readOnlyForm: this.readOnlyForm,
        };
    }
}
