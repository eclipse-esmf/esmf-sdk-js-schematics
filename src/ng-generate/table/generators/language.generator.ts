import {DefaultEntityInstance, DefaultEnumeration, Property} from '@esmf/aspect-model-loader';
import {Schema} from '../schema';
import {TemplateHelper} from '../../../utils/template-helper';

export class LanguageGenerator {
    private readonly hasSearchBar: boolean;
    private readonly hasDateQuickFilter: boolean;
    private readonly hasEnumQuickFilter: boolean;

    constructor(private options: Schema) {
        this.hasSearchBar = this.options.templateHelper.isAddCommandBarFunctionSearch(this.options.enabledCommandBarFunctions);
        this.hasDateQuickFilter = this.options.templateHelper.isAddDateQuickFilters(this.options.enabledCommandBarFunctions);
        this.hasEnumQuickFilter = this.options.templateHelper.isAddEnumQuickFilters(this.options.enabledCommandBarFunctions);
    }

    /**
     * Generates a specific language file.
     * @param lang language code passed as string.
     * @returns translation string for i18n file.
     */
    generate(lang: string): string {
        return `{
                ${!this.options.templateHelper.isAspectSelected(this.options) ? this.getBlockFullAspectVersion(lang) : ``}                  
                ${
                    this.options.enableVersionSupport
                        ? ` "${this.options.selectedModelElement.name.toLowerCase()}.v${this.options.templateHelper.formatAspectModelVersion(
                              this.options.aspectModelVersion
                          )}": {`
                        : ``
                }
                ${new TemplateHelper()
                    .getProperties(this.options)
                    .map((prop: Property, i) => {
                        return `${i > 0 ? ', ' : ''} 
                                ${this.getBlockTransProperty(prop, lang)}
                                ${this.getBlockTransEntity(prop, lang)}`;
                    })
                    .join('')}
               
               
                ${this.getBlockTransCustomColumns()}
                ${this.getBlockTransRowActions()}
                ${this.getBlockCustomCommandBarActions()}
                ${LanguageGenerator.getActionsColumnName()}
                ${this.options.templateHelper.isAspectSelected(this.options) ? `,${this.getBlockAspectDetails(lang)}` : ``}      
            
            ${this.options.enableVersionSupport ? `}` : ``}
            
            ${this.getBlockTransSearchBar()}
            ${this.getBlockTransQuickFilter()}
            ${LanguageGenerator.getBlockTransRowCheckboxes()}
            ${LanguageGenerator.getValidationMessage()}
            ${LanguageGenerator.getTableTransActions()}
            ${LanguageGenerator.getScrollActions()}
             ,
            "cancel": "Cancel",
            "apply": "Apply",
            "restoreDefaults": "Restore Defaults",
            "columns": "Columns",
            "export": "Export",
        }`;
    }

    private getBlockAspectDetails(lang: string): string {
        return `"preferredName": "${this.options.aspectModel.getPreferredName(lang)}",
                "description": "${this.options.aspectModel.getDescription(lang)}"`;
    }

    private getBlockFullAspectVersion(lang: string): string {
        return `
            ${
                this.options.enableVersionSupport
                    ? ` "${this.options.aspectModel.name.toLowerCase()}.v${this.options.templateHelper.formatAspectModelVersion(
                          this.options.aspectModelVersion
                      )}": {`
                    : ``
            }
            ${this.getBlockAspectDetails(lang)}
            ${this.options.enableVersionSupport ? `},` : ``}
        `;
    }

    private getBlockTransEntity(prop: Property, lang: string): string {
        if (prop.effectiveDataType && prop.effectiveDataType.isComplex) {
            return `${(prop.effectiveDataType as any).properties
                .map((effProp: Property) => {
                    return `,
                            "${prop.name}.${effProp.name}.preferredName": "${effProp.getPreferredName(lang) || effProp.name}", 
                            "${prop.name}.${effProp.name}.description": "${effProp.getDescription(lang)}"
                            ${this.getBlockEntityInstance(effProp, lang, prop.name)}
                            `;
                })
                .join('')}
            `;
        }
        return '';
    }

    private getBlockEntityInstance(prop: Property, lang: string, parentPropName = ''): string {
        if (
            prop.characteristic instanceof DefaultEnumeration &&
            prop.characteristic.dataType &&
            prop.characteristic.dataType.isComplex &&
            prop.characteristic.values
        ) {
            return prop.characteristic.values
                .map((entityInstance: DefaultEntityInstance) => {
                    return `,"${parentPropName !== '' ? parentPropName + '.' : parentPropName}${prop.name}.${entityInstance.name}.${
                        entityInstance.descriptionKey
                    }": "${entityInstance.getDescription(lang) || ''}"`;
                })
                .join('');
        }

        return '';
    }

    private getBlockTransProperty(prop: Property, lang: string): string {
        return `"${prop.name}.preferredName": "${prop.getPreferredName(lang) || prop.name}",
                "${prop.name}.description": "${prop.getDescription(lang)}"
                ${this.getBlockEntityInstance(prop, lang)}
                `;
    }

    private getBlockTransCustomColumns(): string {
        return `${this.options.customColumns
            .map((cc, i, arr) => {
                return `${i === 0 ? ', ' : ''} 
                        "customColumn.${cc}": "${cc}"${i < arr.length - 1 ? `,` : ``}`;
            })
            .join('')}
        `;
    }

    private getBlockTransRowActions(): string {
        return `${this.options.customRowActions
            .map((cr, i, arr) => {
                const crReplaced = cr
                    .replace(/\.[^/.]+$/, '')
                    .replace(/\s+/g, '-')
                    .toLowerCase();
                return `${i === 0 ? ', ' : ''}
                        "${crReplaced}.customRowAction": "${crReplaced}"${i < arr.length - 1 ? `,` : ``}`;
            })
            .join('')}
        `;
    }

    private getBlockCustomCommandBarActions(): string {
        return `${this.options.customCommandBarActions
            .map((ccb, i, arr) => {
                const ccbReplaced = ccb
                    .replace(/\.[^/.]+$/, '')
                    .replace(/\s+/g, '-')
                    .toLowerCase();
                return `${i === 0 ? ', ' : ''}
                        "${ccbReplaced}.customCommandBarAction": "${ccbReplaced}"${i < arr.length - 1 ? `,` : ``}`;
            })
            .join('')}
        `;
    }

    private static getActionsColumnName(): string {
        return `, "customRowActions.preferredName": "Actions", "customRowActions.description": "Custom row actions"`;
    }

    private getBlockTransSearchBar(): string {
        if (this.hasSearchBar) {
            return `,
                    "search": "Search"
                    `;
        }
        return '';
    }

    private static getBlockTransRowCheckboxes() {
        return `,
                "exportData": {
                    "title": "Export data",
                    "description": {
                        "caseOne": "Export the maximum of {{maxExportPages}} pages from all {{allColumns}} columns.",
                        "caseTwo": {
                            "singular": "Export the maximum of {{maxExportPages}} pages from the displayed {{displayedColumns}} column.",
                            "plural": "Export the maximum of {{maxExportPages}} pages from the displayed {{displayedColumns}} columns.",
                        },
                        "caseThree": {
                            "singular": "Export all data from the selected {{displayedColumns}} column of the current page.",
                            "plural": "Export all data from the selected {{displayedColumns}} columns of the current page.",
                        },
                        "caseFour": "Export all data from all {{allColumns}} columns of the current page.",
                        "default": "Export data.",
                    },
                    "exportAllPages": "export the maximum of {{maxExportPages}} pages",
                    "exportAllColumns": "export all data from all {{allColumns}} columns",
                }`;
    }

    private getBlockTransQuickFilter(): string {
        if (this.hasEnumQuickFilter || this.hasDateQuickFilter) {
            return `,
                    "date": {
                        "start": "Start date",
                        "end": "End date"
                    }`;
        }
        return '';
    }

    private static getValidationMessage() {
        return `,
                "validation": {
                    "invalidInput": "Input can only contain",
                    "blankSpace": "Input can only contain blank space between characters",
                    "empty_string_columns_array": "You have to select at least one column to search in"
                }`;
    }

    private static getTableTransActions() {
        return `,
                "tableActions": {
                    "openColumnsMenu": "Open columns menu",
                    "refreshData": "Refresh data",
                    "exportData": "Export data"
                }`;
    }

    private static getScrollActions() {
        return `,
                  "scroll": {
                    "left": "Scroll left",
                    "right": "Scroll right"
                }`;
    }
}
