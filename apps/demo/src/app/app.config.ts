import {ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {provideTransloco} from '@jsverse/transloco';
import {TranslocoHttpLoader} from './transloco-http-loader.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(appRoutes),
    provideTransloco({
      config: {
        availableLangs: ['en', 'de'], // Example languages
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        // reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: false,
        },
        fallbackLang: 'en',
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
