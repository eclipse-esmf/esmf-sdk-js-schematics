import {classify} from '@angular-devkit/core/src/utils/strings';
import {DefaultSingleEntity, Property} from '@esmf/aspect-model-loader';
import {Schema} from '../schema';

export class TsDatasourceGenerator {
    private readonly options: Schema;
    private readonly name: string;
    private readonly isRemote: boolean;

    constructor(options: Schema) {
        this.options = options;
        this.isRemote = options.enableRemoteDataHandling;
        this.name = options.templateHelper.resolveType(this.options.aspectModel).name;
    }

    generate(): string {
        return `
        /** ${this.options.templateHelper.getGenerationDisclaimerText()} **/ 
        import { DataSource } from '@angular/cdk/collections';
        import { MatPaginator } from '@angular/material/paginator';
        import { MatSort } from '@angular/material/sort';
        import { Observable, BehaviorSubject } from 'rxjs';
        import {${this.name}} from '${this.options.templateHelper.getTypesPath(
            this.options.enableVersionSupport,
            this.options.aspectModelVersion,
            this.options.aspectModel
        )}';
        ${!this.isRemote ? "import {TranslateService} from '@ngx-translate/core'" : ''};
        
        /**
         * Data source for the ${classify(this.options.name)} view. This class should
         * encapsulate all logic for fetching and manipulating the displayed
         * data (including sorting, pagination, and filtering).
         */
        export class ${classify(this.options.name)}DataSource extends DataSource<${this.name}> {
        
          paginator: MatPaginator | undefined;
          sort: MatSort | undefined;
        
         ${this.isRemote ? `remoteAPI: string | undefined;` : ''} 

          private _data: Array<${this.name}> = new Array<${this.name}>();
          private _dataSubject = new BehaviorSubject<Array< ${this.name}>>([]);
        
          constructor(${!this.isRemote ? 'private translateService: TranslateService' : ''}  ) {
            super();
          }
        
          /**
           * Connect this data source to the table. The table will
           * only update when the returned stream emits new items.
           * @returns A stream of the items to be rendered.
           */
          connect(): Observable<Array<${this.name}>> {
            return this._dataSubject.asObservable();
          }
          
          get displayedData(): Array<${this.name}> {
            return this._dataSubject.value;
          }
    
          get data(): Array<${this.name}> {
            return this._data;
          }
        
          /**
           * Called when the table is being destroyed. Use this function, to clean up
           * any open connections or free any held resources that were set up during connect.
           */
          disconnect(): void {
            this._dataSubject.complete();
          }
        
          setDataSubject(data: Array<${this.name}>): void {
            this._dataSubject.next(data);
          }
        
          setData(data: Array<${this.name}>) {
            this._data = [];
            this.addData(data);
          }
        
          addData(data: Array<${this.name}>) {
            this._data.push(...data);
            this.setDataSubject(${!this.isRemote ? `this.getPagedData(this.sortData(this._data))` : `this._data`});
          }
        
          get length(): number {
            return this._data.length;
          }
  
          ${this.getDataFetching()}
          ${this.getSorting()}
        }`;
    }

    private getDataFetching() {
        if (!this.isRemote) {
            return ` 
            private getPagedData(data: Array<${classify(
                this.options.templateHelper.resolveType(this.options.aspectModel).name
            )}>): Array<${classify(this.options.templateHelper.resolveType(this.options.aspectModel).name)}> {
                if (this.paginator) {
                  const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
                  return data.slice(startIndex, startIndex + this.paginator.pageSize);
                } else {
                  return data;
                }
            }`;
        }
        return '';
    }

    private getSorting() {
        if (!this.isRemote) {
            const properties: string[] = [];
            this.options.templateHelper.getProperties(this.options).forEach((prop: Property) => {
                if (prop.effectiveDataType?.isComplex && prop.characteristic instanceof DefaultSingleEntity) {
                    const complexProps = this.options.templateHelper.getComplexProperties(prop, this.options);
                    complexProps.properties.forEach((complexProp: Property): void => {
                        if (
                            !this.options.excludedProperties.find(
                                excludedProp => excludedProp.propToExcludeAspectModelUrn === complexProp.aspectModelUrn
                            ) &&
                            ((prop.effectiveDataType && prop.effectiveDataType.isScalar) ||
                                this.options.templateHelper.isEnumPropertyWithEntityValues(prop))
                        ) {
                            properties.push(
                                this.getCompareLogicForProperty(complexProp, `${complexProps.complexProp}.${complexProp.name}`)
                            );
                        }
                    });
                }
                if (
                    !this.options.excludedProperties.find(
                        excludedProp => excludedProp.propToExcludeAspectModelUrn === prop.aspectModelUrn
                    ) &&
                    ((prop.effectiveDataType && prop.effectiveDataType.isScalar) ||
                        this.options.templateHelper.isEnumPropertyWithEntityValues(prop))
                ) {
                    properties.push(this.getCompareLogicForProperty(prop));
                }
            });

            return `
                  sortData(data = this._data): ${this.name}[] {
                    if (!this.sort || !this.sort.active || this.sort.direction === '') {
                      return data;
                    }
                
                    return data.sort((a: ${this.name}, b: ${this.name}): number => {
                      const isSortingAsc = this.sort?.direction === 'asc';
                      switch (this.sort?.active.trim()) {
                      ${properties.join('')}
                        default: return 0;
                      }
                    });
                  }
                
                  private compare(a: string | number | boolean | Date | undefined, b: string | number | boolean | Date | undefined, isSortingAsc: boolean): number {
                    if (a === undefined) {
                        return -1 * (isSortingAsc ? 1 : -1);
                    }
                    if (b === undefined) {
                      return 1 * (isSortingAsc ? 1 : -1);
                    }
                    if (typeof a == "boolean") {
                      return (a === b ? 0 : a ? -1 : 1) * (isSortingAsc ? 1 : -1);
                    }
                    return (a < b ? -1 : 1) * (isSortingAsc ? 1 : -1);
                  }`;
        }
        return '';
    }

    private getCompareLogicForProperty(
        prop: Property,
        propName: string = !this.options.templateHelper.isAspectSelected(this.options)
            ? `${this.options.jsonAccessPath}${prop.name}`
            : prop.name
    ) {
        if (this.options.templateHelper.isEnumPropertyWithEntityValues(prop)) {
            const valuePayloadKey = this.options.templateHelper.getEnumEntityInstancePayloadKey(prop);
            return `case '${propName}': return this.compare(a.${propName}.${valuePayloadKey}.toString(),b.${propName}.${valuePayloadKey}.toString(), isSortingAsc);`;
        } else if (this.options.templateHelper.isEnumProperty(prop) && this.options.templateHelper.isStringProperty(prop)) {
            return `case '${propName}': return this.compare(a.${propName}.toString(),b.${propName}.toString(), isSortingAsc);`;
        } else if (this.options.templateHelper.isMultiStringProperty(prop)) {
            return `case '${propName}': return this.compare(a.${propName} ? a.${propName}[this.translateService.currentLang] : '', b.${propName} ? b.${propName}[this.translateService.currentLang] : '', isSortingAsc);`;
        } else {
            return `case '${propName}': return this.compare(a.${propName}, b.${propName}, isSortingAsc);`;
        }
    }
}
