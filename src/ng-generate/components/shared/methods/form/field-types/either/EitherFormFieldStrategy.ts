import {Characteristic, DefaultEither, Property} from '@esmf/aspect-model-loader';
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
            children: this.getChildConfigs(),
        };
    }

    private getChildConfigs(): FormFieldConfig[] {
        const typedChild = this.child as DefaultEither;

        return [
            FormFieldBuilder.buildFieldConfig(this.parent, typedChild.left, {name: typedChild.left.name}),
            FormFieldBuilder.buildFieldConfig(this.parent, typedChild.right, {name: typedChild.right.name}),
        ];
    }
}
