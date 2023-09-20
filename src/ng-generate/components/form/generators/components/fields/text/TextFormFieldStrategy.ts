import {Characteristic} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../FormFieldStrategy';
import {strings} from '@angular-devkit/core';

export class TextFormFieldStrategy extends FormFieldStrategy {
    pathToFiles = './generators/components/fields/text/files';
    hasChildren = false;

    static isTargetStrategy(child: Characteristic): boolean {
        const urn = this.getShortUrn(child);
        return urn === 'string' || urn === 'anyURI' || urn === 'hexBinary' || urn === 'curie' || urn === 'base64Binary';
    }

    buildConfig(): FormFieldConfig {
        const untypedChild = this.child as any;

        return {
            name: this.fieldName,
            nameDasherized: strings.dasherize(this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1)),
            exampleValue: this.parent.exampleValue || '',
            unitName: untypedChild.unit?.name || '',
            validators: [...this.getBaseValidatorsConfigs()],
            readOnlyForm: this.readOnlyForm,
        };
    }
}
