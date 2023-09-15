import {Characteristic, Property} from '@esmf/aspect-model-loader';

export interface ValidatorConfig {
    definition: string;
    errorCode: string;
    errorMessage: string;
    pathToControl: string[];
}

export interface FormFieldConfig {
    templateName: string;
    htmlTemplatePath: string;
    tsTemplatePath: string;
    name: string;
    validators: ValidatorConfig[];
    validatorsHtmlTemplatePath: string;
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
    validatorsHtmlTemplatePath = `/form/validation-errors.html.template`;
    templateName: string;
    fieldName: string;
    parentFieldsNames: string[];

    static isTargetStrategy(child: Characteristic): boolean {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }

    static getShortUrn(child: Characteristic): string | undefined {
        return child.dataType?.shortUrn;
    }

    constructor(
        public parent: Property,
        public child: Characteristic,
        public forceParams: {name?: string; parentFieldsNames?: string[]} = {}
    ) {
        this.fieldName = this.forceParams.name ?? parent.name;
        this.parentFieldsNames = forceParams.parentFieldsNames ?? [];
    }

    getTemplatePath(type: TemplateType): string {
        return `/form/field-types/${this.templateName}/${this.templateName}.${type}.template`;
    }

    getBaseValidatorsConfigs(): ValidatorConfig[] {
        const validatorsConfigs: ValidatorConfig[] = [];

        if (!this.parent.isOptional) {
            validatorsConfigs.push({
                definition: 'Validators.required',
                errorCode: 'required',
                errorMessage: `${this.fieldName} is required.`,
                pathToControl: this.getFieldNamesChain(),
            });
        }

        return validatorsConfigs;
    }

    getFieldNamesChain(): string[] {
        return [...this.parentFieldsNames, this.fieldName];
    }

    buildConfig(): FormFieldConfig {
        throw new Error('An implementation of the method has to be provided by a derived class');
    }
}
