import {Characteristic, DefaultEither} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class EitherFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/either/files';
    hasChildren = true;

    static isTargetStrategy(child: Characteristic): boolean {
        return child instanceof DefaultEither;
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
        const typedChild = this.child as DefaultEither;
        return [this.getChildStrategy(typedChild.left), this.getChildStrategy(typedChild.right)];
    }
}
