import {EsmfShowDescriptionPipe} from './show-description.pipe';

describe('EsmfShowDescriptionPipe', () => {
  let pipe: EsmfShowDescriptionPipe;

  beforeEach(() => {
    pipe = new EsmfShowDescriptionPipe();
  });

  it('should return value and description when both are present', () => {
    const mockFn = jest.fn((value: string | undefined) => ({description: 'Test Description'}));
    const result = pipe.transform('testValue', mockFn);

    expect(result).toBe('testValue - Test Description');
    expect(mockFn).toHaveBeenCalledWith('testValue');
  });

  it('should return only description when onlyDesc is true', () => {
    const mockFn = jest.fn((value: string | undefined) => ({description: 'Test Description'}));
    const result = pipe.transform('testValue', mockFn, true);

    expect(result).toBe('Test Description');
    expect(mockFn).toHaveBeenCalledWith('testValue');
  });

  it('should handle undefined value', () => {
    const mockFn = jest.fn((value: string | undefined) => ({description: 'Default Description'}));
    const result = pipe.transform(undefined, mockFn);

    expect(result).toBe('Default Description');
    expect(mockFn).toHaveBeenCalledWith(undefined);
  });

  it('should handle null value', () => {
    const mockFn = jest.fn((value: string | undefined) => ({description: 'Default Description'}));
    const result = pipe.transform(null, mockFn);

    expect(result).toBe('Default Description');
    expect(mockFn).toHaveBeenCalledWith(undefined);
  });

  it('should handle missing description', () => {
    const mockFn = jest.fn((value: string | undefined) => ({}));
    const result = pipe.transform('testValue', mockFn);

    expect(result).toBe('testValue');
  });

  it('should handle numeric values', () => {
    const mockFn = jest.fn((value: string | undefined) => ({description: 'Number Description'}));
    const result = pipe.transform(123, mockFn);

    expect(result).toBe('123 - Number Description');
    expect(mockFn).toHaveBeenCalledWith('123');
  });

  it('should return empty string when value is undefined and description is missing', () => {
    const mockFn = jest.fn((value: string | undefined) => ({}));
    const result = pipe.transform(undefined, mockFn, true);

    expect(result).toBe('');
  });
});
