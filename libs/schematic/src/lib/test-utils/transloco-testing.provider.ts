import {TRANSLOCO_SCOPE} from '@jsverse/transloco';

/**
 * Provides a list of configured translations-related providers for testing purposes.
 *
 * @param scope - Translation scope to be used in tests.
 * @returns - A list of configured providers.
 */
export function getTranslocoTestingProviders(scope = '') {
  return [{provide: TRANSLOCO_SCOPE, useValue: [{scope}]}];
}
