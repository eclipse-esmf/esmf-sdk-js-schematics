import {TranslocoTestingModule, TranslocoTestingOptions} from '@jsverse/transloco';

/**
 * Returns a configured instance of TranslocoTestingModule for testing purposes.
 *
 * @param {TranslocoTestingOptions} options - Configuration options for the TranslocoTestingModule.
 * @param {Record<string, {Translation}>} options.langs - An object of languages to be used in the testing module.
 * The translations may be loaded from a file, e.g.: `import * as en from '../assets/i18n/en.json';`
 *
 * @returns {TranslocoTestingModule} - A configured instance of TranslocoTestingModule.
 */
export function getTranslocoTestingModule(options: TranslocoTestingOptions = {}): TranslocoTestingModule {
  if (!options.langs) {
    throw new Error('Please provide a map of languages to be used in the testing module.');
  }
  return TranslocoTestingModule.forRoot({
    langs: {en: {}, de: {}},
    translocoConfig: {
      availableLangs: ['en', 'de'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}
