import {Characteristic, DefaultEither} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';
import {FormFieldBuilder} from '../FormFieldBuilder';

export class EitherFormFieldStrategy extends FormFieldStrategy {
    templateName = 'either';

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultEither;
    }

    buildConfig(): FormFieldConfig {
        return {
            templateName: this.templateName,
            htmlTemplatePath: this.getTemplatePath(TemplateType.Html),
            tsTemplatePath: this.getTemplatePath(TemplateType.Ts),
            name: this.fieldName,
            validators: [...this.getBaseValidatorsConfigs()],
            validatorsHtmlTemplatePath: this.validatorsHtmlTemplatePath,
            children: this.getChildConfigs(),
            readOnlyForm: this.readOnlyForm,
        };
    }

    private getChildConfigs(): FormFieldConfig[] {
        const typedChild = this.child as DefaultEither;
        return [this.buildChildConfig(typedChild.left), this.buildChildConfig(typedChild.right)];
    }

    private buildChildConfig(child: Characteristic): FormFieldConfig {
        return FormFieldBuilder.buildFieldConfig(this.options, this.parent, child, {
            name: child.name,
            parentFieldsNames: this.getFieldNamesChain(),
        });
    }
}
