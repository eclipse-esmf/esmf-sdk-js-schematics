import {EsmfAbstractTableDataSource} from './abstract-table-data-source.service';

export class EsmfStaticTableDataSource<T> extends EsmfAbstractTableDataSource<T> {
  addData(data: T[]) {
    this.setDataSubject(this.getPagedData(this.sortData(data)));
  }

  sortData(data: T[]): T[] {
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a: T, b: T): number => {
      const isSortingAsc = this.sort?.direction === 'asc';
      const sortProp = this.sort?.active.trim();

      if(Object.prototype.hasOwnProperty.call(a, sortProp) && Object.prototype.hasOwnProperty.call(b, sortProp)) {
        return this.compare(a[sortProp], b[sortProp], isSortingAsc);
      } else {
        return 0;
      }
    });
  }

  private getPagedData(data: T[]): T[] {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      return data.slice(startIndex, startIndex + this.paginator.pageSize);
    } else {
      return data;
    }
  }

  private compare(
    a: string | number | boolean | Date | undefined,
    b: string | number | boolean | Date | undefined,
    isSortingAsc: boolean
  ): number {
    if (a === undefined || b === undefined) {
      return (a === undefined ? -1 : 1) * (isSortingAsc ? 1 : -1);
    }

    if (typeof a === 'boolean') {
      return (a === b ? 0 : a ? -1 : 1) * (isSortingAsc ? 1 : -1);
    }

    return (a < b ? -1 : 1) * (isSortingAsc ? 1 : -1);
  }
}
