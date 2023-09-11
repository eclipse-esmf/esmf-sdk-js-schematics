import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';

export class DateTimeFormFieldStrategy extends FormFieldStrategy {
    templateName = 'dateTime';

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return (
            urn === 'dateTime' ||
            urn === 'dataTimeStamp' ||
            urn === 'dayTimeDuration' ||
            urn === 'duration' ||
            urn === 'time' ||
            urn === 'yearMonthDuration'
        );
    }

    buildConfig(): FormFieldConfig {
        return {
            templateName: this.templateName,
            htmlTemplatePath: this.getTemplatePath(TemplateType.Html),
            tsTemplatePath: this.getTemplatePath(TemplateType.Ts),
            name: this.fieldName,
            validators: [...this.getBaseValidatorsConfigs()],
        };
    }
}
