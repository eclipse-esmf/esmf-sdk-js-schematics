import {InjectionToken, Optional, Provider, SkipSelf} from '@angular/core';
import {MatPaginatorSelectConfig} from '@angular/material/paginator';

export const EsmfPaginatorSelectConfigInjector = new InjectionToken<MatPaginatorSelectConfig>('EsmfPaginatorSelectConfig');

export const EsmfPaginatorSelectConfigProvider: Provider = {
  provide: EsmfPaginatorSelectConfigInjector,
  useFactory: (customConfig?: MatPaginatorSelectConfig) => customConfig || {disableOptionCentering: true},
  deps: [[new Optional(), new SkipSelf(), EsmfPaginatorSelectConfigInjector]],
};
