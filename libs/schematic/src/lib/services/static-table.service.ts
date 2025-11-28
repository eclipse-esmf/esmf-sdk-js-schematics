import {Injectable} from '@angular/core';

@Injectable()
export class EsmfStaticTableService<T> {
  flatten(csvArray: T[]): T[] {
    return csvArray.map((item: T): T => {
      return this.flattenObj(item);
    });
  }

  private flattenObj(obj: any): any {
    const result: any = {};

    for (const key in obj) {
      if (typeof obj[key].constructor.isEnumeration === 'function' && obj[key]?.constructor?.isEnumeration()) {
        const enumerationValues = obj[key].constructor.values().find((v: any) => Object.keys(v).every(k => v[k] === obj[key][k]));

        result[key] = Object.values(enumerationValues).join('-');
      } else if (typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
        const childObj = this.flattenObj(obj[key]);

        for (const childObjKey in childObj) {
          result[`${key}.${childObjKey}`] = childObj[childObjKey];
        }
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
}
