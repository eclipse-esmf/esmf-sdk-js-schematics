import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy, TemplateType} from '../FormFieldStrategy';
import {FormFieldBuilder} from '../FormFieldBuilder';

export class ComplexFormFieldStrategy extends FormFieldStrategy {
    templateName = 'complex';

    static isTargetStrategy(child: Characteristic): boolean {
        return (child.dataType !== null && child.dataType?.isComplex) || false;
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
        };
    }

    private getChildConfigs(): FormFieldConfig[] {
        const untypedDataType = this.child.dataType as any;
        return untypedDataType?.properties
            ? untypedDataType.properties.map((p: Property) => this.buildChildConfig(p, p.characteristic))
            : [];
    }

    private buildChildConfig(parent: Property, child: Characteristic): FormFieldConfig {
        return FormFieldBuilder.buildFieldConfig(parent, child, {
            parentFieldsNames: this.getFieldNamesChain(),
        });
    }
}
