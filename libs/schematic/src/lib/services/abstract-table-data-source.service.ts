import {DataSource} from '@angular/cdk/collections';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {BehaviorSubject, Observable} from 'rxjs';

export abstract class EsmfAbstractTableDataSource<T> extends DataSource<T> {
  paginator: MatPaginator | undefined;
  sort: MatSort | undefined;

  remoteAPI: string | undefined;
  private _dataSubject = new BehaviorSubject<T[]>([]);

  private _data: T[] = [];

  get data(): T[] {
    return this._data;
  }

  get displayedData(): T[] {
    return this._dataSubject.value;
  }

  get length(): number {
    return this._data.length;
  }

  /**
   * Connect this data source to the table. The table will
   * only update when the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<T[]> {
    return this._dataSubject.asObservable();
  }

  /**
   * Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    this._dataSubject.complete();
  }

  setDataSubject(data: T[]): void {
    this._dataSubject.next(data);
  }

  setData(data: T[]) {
    this._data = [];
    data.forEach(item => {
      this._data.push(JSON.parse(JSON.stringify(item)));
    });

    this.addData(this._data);
  }

  abstract addData(data: T[]): void;
}
