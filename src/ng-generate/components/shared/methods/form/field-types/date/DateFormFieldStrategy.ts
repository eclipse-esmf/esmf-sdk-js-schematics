import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class DateFormFieldStrategy extends FormFieldStrategy {
    templateName = 'date';

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn === 'date' || urn === 'gDay' || urn === 'gMonth' || urn === 'gMonthDay' || urn === 'gYearMonth';
    }

    buildConfig(): FormFieldConfig {
        return {
            templateName: this.templateName,
            htmlTemplatePath: this.getTemplatePath(TemplateType.Html),
            tsTemplatePath: this.getTemplatePath(TemplateType.Ts),
            name: this.fieldName,
            validators: [...this.getBaseValidatorsConfigs()],
            validatorsHtmlTemplatePath: this.validatorsHtmlTemplatePath,
        };
    }
}
