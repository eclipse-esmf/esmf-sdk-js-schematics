import {Pipe, PipeTransform} from '@angular/core';

type ValueFn = (value: string | undefined) => {description?: string};

@Pipe({name: 'esmfShowDescription'})
export class EsmfShowDescriptionPipe implements PipeTransform {
  transform<T = unknown>(value: T, getByValueFn: ValueFn, onlyDesc = false): string {
    const valueStr = value ? value.toString() : undefined;

    const description = getByValueFn(valueStr)?.description;
    const resultParts: string[] = valueStr && !onlyDesc ? [valueStr] : [];
    if (description) {
      resultParts.push(description);
    }

    return resultParts.join(' - ');
  }
}
