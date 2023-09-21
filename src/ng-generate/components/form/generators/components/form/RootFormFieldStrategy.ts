import {Characteristic, Property} from '@esmf/aspect-model-loader';
import {FormFieldConfig, FormFieldStrategy} from '../fields/FormFieldStrategy';
import {apply, applyTemplates, MergeStrategy, mergeWith, move, Rule, SchematicContext, url} from '@angular-devkit/schematics';
import {templateInclude} from '../../../../shared/include';
import {strings} from '@angular-devkit/core';
import {getFormFieldStrategy} from '../fields/index';

export class RootFormFieldStrategy {
    options: any;

    constructor(options: any, public context: SchematicContext) {
        this.options = {...options};
    }

    buildConfig(): FormFieldConfig {
        // TODO: Handle
        return {
            name: '',
            nameDasherized: '',
            validators: [],
            children: this.getChildConfigs(),
        };
    }

    private getChildConfigs() {
        return this.getChildStrategies().map(strategy => strategy.buildConfig());
    }

    private getChildStrategies(): FormFieldStrategy[] {
        return this.options.listAllProperties.map((property: Property) => this.getChildStrategy(property, property.characteristic));
    }

    private getChildStrategy(parent: Property, child: Characteristic): FormFieldStrategy {
        return getFormFieldStrategy(this.options, this.context, parent, child, child.name);
    }

    generate(): Rule[] {
        this.options.fieldConfig = this.buildConfig();

        return [
            mergeWith(
                apply(url('./generators/components/form/files'), [
                    templateInclude(this.context, this.applyTemplate(), this.options, '../shared/methods'),
                    move(this.options.path),
                ]),
                this.options.overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error
            ),
            ...this.getChildStrategies().map(strategy => strategy.generate()),
        ];
    }

    applyTemplate(): Rule {
        return () => {
            return applyTemplates({
                classify: strings.classify,
                dasherize: strings.dasherize,
                options: this.options,
                name: this.options.name,
            });
        };
    }
}
