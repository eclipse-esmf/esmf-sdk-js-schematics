import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class DefaultFormFieldStrategy extends FormFieldStrategy {
    templateName = 'default';

    static isTargetStrategy(): boolean {
        return true;
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
        };
    }
}
