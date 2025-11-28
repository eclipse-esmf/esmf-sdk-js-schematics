import {EsmfStaticTableService} from './static-table.service';

class MockEnum {
  static isEnumeration() {
    return true;
  }
  static values() {
    return [
      {a: 1, b: 2},
      {a: 3, b: 4},
    ];
  }
  a: number;
  b: number;
  constructor(a: number, b: number) {
    this.a = a;
    this.b = b;
  }
}

describe('EsmfStaticTableService', () => {
  let service: EsmfStaticTableService<any>;

  beforeEach(() => {
    service = new EsmfStaticTableService();
  });

  it('should flatten a simple object', () => {
    const input = [{foo: 'bar', num: 42}];
    const output = service.flatten(input);
    expect(output).toEqual([{foo: 'bar', num: 42}]);
  });

  it('should flatten a nested object', () => {
    const input = [{foo: {bar: 'baz', qux: 1}, num: 42}];
    const output = service.flatten(input);
    expect(output).toEqual([{'foo.bar': 'baz', 'foo.qux': 1, num: 42}]);
  });

  it('should flatten an object with enumeration', () => {
    const input = [{enumProp: new MockEnum(1, 2), other: 'test'}];
    const output = service.flatten(input);
    expect(output).toEqual([{enumProp: '1-2', other: 'test'}]);
  });

  it('should flatten deeply nested objects', () => {
    const input = [
      {
        a: {
          b: {
            c: 'd',
          },
        },
        e: 5,
      },
    ];
    const output = service.flatten(input);
    expect(output).toEqual([{'a.b.c': 'd', e: 5}]);
  });

  it('should handle Date objects without flattening', () => {
    const date = new Date();
    const input = [{created: date, value: 10}];
    const output = service.flatten(input);
    expect(output).toEqual([{created: date, value: 10}]);
  });
});
