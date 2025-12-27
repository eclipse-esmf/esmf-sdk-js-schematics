import {inject, Injectable} from '@angular/core';
import {Translation, TranslocoLoader} from '@jsverse/transloco';
import {HttpClient} from '@angular/common/http';
import {forkJoin, map} from 'rxjs';

@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    return forkJoin({
      app: this.http.get<Translation>(`/assets/i18n/${lang}.json`),
      vendor: this.http.get<Translation>(`/assets/i18n/${lang}.vendor.json`),
    }).pipe(map(({vendor, app}) => ({...vendor, ...app})));
  }
}
