import {Characteristic, Property} from '@esmf/aspect-model-loader';

export interface ValidatorConfig {
    definition: string;
    errorCode: string;
    errorMessage: string;
}

export interface FormFieldConfig {
    templateName: string;
    htmlTemplatePath: string;
    tsTemplatePath: string;
    name: string;
    validators: ValidatorConfig[];
    exampleValue?: string;
    values?: any[];
    unitName?: string;
    children?: FormFieldConfig[];
}

export enum TemplateType {
    Ts = 'ts',
    Html = 'html',
}

export class FormFieldStrategy {
    templateName: string;
    fieldName: string;

    static isTargetStrategy(child: Characteristic): boolean {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    static getShortUrn(child: Characteristic): string | undefined {
        return child.dataType?.shortUrn;
    }

    constructor(public parent: Property, public child: Characteristic, public forceParams: {name?: string} = {}) {
        this.fieldName = this.forceParams.name || parent.name;
    }

    getTemplatePath(type: TemplateType): string {
        return `/form/field-types/${this.templateName}/${this.templateName}.${type}.template`;
    }

    getBaseValidatorsConfigs(): ValidatorConfig[] {
        const validatorsConfigs = [];

        if (!this.parent.isOptional) {
            validatorsConfigs.push({
                definition: 'Validators.required',
                errorCode: 'required',
                errorMessage: `${this.fieldName} is required.`,
            });
        }

        return validatorsConfigs;
    }

    // TODO: Type
    buildConfig(): FormFieldConfig {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }
}
