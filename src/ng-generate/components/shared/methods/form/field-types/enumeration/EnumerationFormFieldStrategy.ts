import {Characteristic, DefaultEnumeration} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class EnumerationFormFieldStrategy extends FormFieldStrategy {
    templateName = 'enumeration';

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultEnumeration;
    }

    buildConfig(): FormFieldConfig {
        const typedChild = this.child as DefaultEnumeration;

        return {
            templateName: this.templateName,
            htmlTemplatePath: this.getTemplatePath(TemplateType.Html),
            tsTemplatePath: this.getTemplatePath(TemplateType.Ts),
            name: this.fieldName,
            values: typedChild.values,
            validators: [...this.getBaseValidatorsConfigs()],
            validatorsHtmlTemplatePath: this.validatorsHtmlTemplatePath,
            readOnlyForm: this.readOnlyForm,
        };
    }
}
