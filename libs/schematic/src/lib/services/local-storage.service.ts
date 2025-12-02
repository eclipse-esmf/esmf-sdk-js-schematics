import {Injectable} from '@angular/core';

/**
 * Manage user settings based on the local storage of the browser.
 */
export abstract class BrowserStorage {
  abstract getItem<T>(key: string): T;
  abstract removeItem(key: string): void;
  abstract setItem<T>(key: string, item: T): void;
}

@Injectable({
  providedIn: 'root',
})
export class EsmfLocalStorageService extends BrowserStorage {
  /**
   * Prefix for keys to avoid overwriting of values of an app having the same key.
   */
  readonly KEY_PREFIX = 'JSSDK_';

  getItem<T>(key: string): T {
    const item = localStorage.getItem(this.buildKey(key));
    return item ? JSON.parse(item) : undefined;
  }

  removeItem(key: string) {
    localStorage.removeItem(this.buildKey(key));
  }

  setItem<T>(key: string, item: T) {
    localStorage.setItem(this.buildKey(key), JSON.stringify(item));
  }

  private buildKey(key: string) {
    return `${this.KEY_PREFIX}${key}`;
  }
}
