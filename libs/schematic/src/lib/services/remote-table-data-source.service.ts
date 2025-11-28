import {EsmfAbstractTableDataSource} from './abstract-table-data-source.service';

export class EsmfRemoteTableDataSource<T> extends EsmfAbstractTableDataSource<T> {
  addData(data: T[]) {
    this.setDataSubject(data);
  }
}
