import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

export interface Response<T> {
  items: T[];
  currentPage: number;
  itemCount: number;
  totalItems: number;
  totalPages: number;
}

interface Payload {
  query: string;

  [key: string]: string | number | boolean;
}

@Injectable()
export class EsmfRemoteTableService<T> {
  private http = inject(HttpClient);

  requestData(remoteAPI: string, body: Payload) {
    const strippedUrlParts: string[] = remoteAPI.split('?');
    if (strippedUrlParts && strippedUrlParts.length === 2) {
      const queryParams = new URLSearchParams(strippedUrlParts[1]);
      queryParams.forEach((value, key) => {
        body[key] = value;
      });
    }
    return this.http.post<Response<T>>(strippedUrlParts[0], body);
  }
}
