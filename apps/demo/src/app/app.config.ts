import {ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {appRoutes} from './app.routes';
import {provideTransloco} from '@jsverse/transloco';
import {TranslocoHttpLoader} from './transloco-http-loader.service';
import {provideHttpClient} from '@angular/common/http';
import {EsmfPaginatorSelectConfigProvider} from '@esmf/semantic-ui-schematics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'de'], // Example languages
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        // reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: true,
        },
        fallbackLang: 'en',
      },
      loader: TranslocoHttpLoader,
    }),
    EsmfPaginatorSelectConfigProvider,
  ],
};
