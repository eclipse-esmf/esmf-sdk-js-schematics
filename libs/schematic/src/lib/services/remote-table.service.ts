import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

export interface Response<T> {
  items: T[];
  currentPage: number;
  itemCount: number;
  totalItems: number;
  totalPages: number;
}

export interface Payload {
  query: string;

  [key: string]: string | number | boolean;
}

@Injectable()
export class EsmfRemoteTableService<T> {
  private http = inject(HttpClient);

  requestData(remoteAPI: string, body: Payload) {
    return this.http.post<Response<T>>(remoteAPI, body);
  }
}
