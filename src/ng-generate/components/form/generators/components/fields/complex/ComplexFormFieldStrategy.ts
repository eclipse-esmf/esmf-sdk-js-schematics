import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';
import {getFormFieldStrategy} from '../index';

export class ComplexFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/complex/files';
    hasChildren = true;

    static isTargetStrategy(child: Characteristic): boolean {
        return (child.dataType !== null && child.dataType?.isComplex) || false;
    }

    buildConfig(): FormFieldConfig {
        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            validators: [...this.getBaseValidatorsConfigs()],
            children: this.getChildConfigs(),
        };
    }

    getChildStrategies(): FormFieldStrategy[] {
        const untypedDataType = this.child.dataType as any;
        return untypedDataType?.properties
            ? untypedDataType.properties.map((p: Property) => this.getChildStrategy(p, p.characteristic))
            : [];
    }

    getChildStrategy(parent: Property, child: Characteristic): FormFieldStrategy {
        return getFormFieldStrategy(this.options, this.context, parent, child, parent.name);
    }
}
