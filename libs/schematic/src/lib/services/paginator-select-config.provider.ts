import {InjectionToken, Optional, Provider, SkipSelf} from '@angular/core';
import {MatPaginatorSelectConfig} from '@angular/material/paginator';

export const PaginatorSelectConfigInjector = new InjectionToken<MatPaginatorSelectConfig>('PaginatorSelectConfig');

export const PaginatorSelectConfigProvider: Provider = {
  provide: PaginatorSelectConfigInjector,
  useFactory: (customConfig?: MatPaginatorSelectConfig) => customConfig || {disableOptionCentering: true},
  deps: [[new Optional(), new SkipSelf(), PaginatorSelectConfigInjector]],
};
