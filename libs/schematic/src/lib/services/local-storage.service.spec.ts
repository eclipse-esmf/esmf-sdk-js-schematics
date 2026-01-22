import {TestBed} from '@angular/core/testing';
import {EsmfLocalStorageService} from './local-storage.service';

describe('EsmfLocalStorageService', () => {
  let service: EsmfLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsmfLocalStorageService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should have KEY_PREFIX set to "JSSDK_"', () => {
    expect(service.KEY_PREFIX).toBe('JSSDK_');
  });

  describe('setItem', () => {
    it('should store a string value', () => {
      service.setItem('testKey', 'testValue');
      expect(localStorage.getItem('JSSDK_testKey')).toBe('"testValue"');
    });

    it('should store a number value', () => {
      service.setItem('numberKey', 42);
      expect(localStorage.getItem('JSSDK_numberKey')).toBe('42');
    });

    it('should store an object value', () => {
      const testObject = {name: 'test', value: 123};
      service.setItem('objectKey', testObject);
      expect(localStorage.getItem('JSSDK_objectKey')).toBe('{"name":"test","value":123}');
    });

    it('should store an array value', () => {
      const testArray = [1, 2, 3];
      service.setItem('arrayKey', testArray);
      expect(localStorage.getItem('JSSDK_arrayKey')).toBe('[1,2,3]');
    });

    it('should store a boolean value', () => {
      service.setItem('boolKey', true);
      expect(localStorage.getItem('JSSDK_boolKey')).toBe('true');
    });

    it('should store null value', () => {
      service.setItem('nullKey', null);
      expect(localStorage.getItem('JSSDK_nullKey')).toBe('null');
    });
  });

  describe('getItem', () => {
    it('should retrieve a string value', () => {
      localStorage.setItem('JSSDK_testKey', '"testValue"');
      const result = service.getItem<string>('testKey');
      expect(result).toBe('testValue');
    });

    it('should retrieve a number value', () => {
      localStorage.setItem('JSSDK_numberKey', '42');
      const result = service.getItem<number>('numberKey');
      expect(result).toBe(42);
    });

    it('should retrieve an object value', () => {
      localStorage.setItem('JSSDK_objectKey', '{"name":"test","value":123}');
      const result = service.getItem<{name: string; value: number}>('objectKey');
      expect(result).toEqual({name: 'test', value: 123});
    });

    it('should retrieve an array value', () => {
      localStorage.setItem('JSSDK_arrayKey', '[1,2,3]');
      const result = service.getItem<number[]>('arrayKey');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should retrieve a boolean value', () => {
      localStorage.setItem('JSSDK_boolKey', 'true');
      const result = service.getItem<boolean>('boolKey');
      expect(result).toBe(true);
    });

    it('should retrieve null value', () => {
      localStorage.setItem('JSSDK_nullKey', 'null');
      const result = service.getItem<null>('nullKey');
      expect(result).toBeNull();
    });

    it('should return undefined when key does not exist', () => {
      const result = service.getItem('nonExistentKey');
      expect(result).toBeUndefined();
    });
  });

  describe('removeItem', () => {
    it('should remove an existing item', () => {
      localStorage.setItem('JSSDK_testKey', '"testValue"');
      service.removeItem('testKey');
      expect(localStorage.getItem('JSSDK_testKey')).toBeNull();
    });

    it('should not throw when removing non-existent item', () => {
      expect(() => service.removeItem('nonExistent')).not.toThrow();
    });
  });

  describe('integration tests', () => {
    it('should set and get the same value', () => {
      const testData = {id: 1, name: 'Test'};
      service.setItem('testData', testData);
      const result = service.getItem<{id: number; name: string}>('testData');
      expect(result).toEqual(testData);
    });

    it('should handle overwriting existing values', () => {
      service.setItem('key', 'firstValue');
      service.setItem('key', 'secondValue');
      const result = service.getItem<string>('key');
      expect(result).toBe('secondValue');
    });

    it('should return undefined after removing an item', () => {
      service.setItem('key', 'value');
      service.removeItem('key');
      const result = service.getItem('key');
      expect(result).toBeUndefined();
    });

    it('should prefix all keys with KEY_PREFIX', () => {
      service.setItem('myKey', 'myValue');
      expect(localStorage.getItem('JSSDK_myKey')).toBeTruthy();
      expect(localStorage.getItem('myKey')).toBeNull();
    });
  });
});
