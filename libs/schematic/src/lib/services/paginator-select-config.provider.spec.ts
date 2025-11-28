import {TestBed} from '@angular/core/testing';
import {FactoryProvider} from '@angular/core';
import {MatPaginatorSelectConfig} from '@angular/material/paginator';
import {EsmfPaginatorSelectConfigInjector, EsmfPaginatorSelectConfigProvider} from './paginator-select-config.provider';

describe('EsmfPaginatorSelectConfigProvider', () => {
  describe('EsmfPaginatorSelectConfigInjector', () => {
    it('should be defined', () => {
      expect(EsmfPaginatorSelectConfigInjector).toBeDefined();
    });

    it('should have correct token description', () => {
      expect(EsmfPaginatorSelectConfigInjector.toString()).toContain('PaginatorSelectConfig');
    });
  });

  describe('EsmfPaginatorSelectConfigProvider', () => {
    const typedProvider = EsmfPaginatorSelectConfigProvider as FactoryProvider;

    it('should be defined', () => {
      expect(EsmfPaginatorSelectConfigProvider).toBeDefined();
    });

    it('should provide EsmfPaginatorSelectConfigInjector token', () => {
      expect(typedProvider.provide).toBe(EsmfPaginatorSelectConfigInjector);
    });

    it('should have useFactory defined', () => {
      expect(typedProvider.useFactory).toBeDefined();
      expect(typeof typedProvider.useFactory).toBe('function');
    });

    it('should have deps defined', () => {
      expect(typedProvider.deps).toBeDefined();
      expect(Array.isArray(typedProvider.deps)).toBe(true);
    });
  });

  describe('useFactory behavior', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [EsmfPaginatorSelectConfigProvider],
      });
    });

    it('should return default config when no custom config is provided', () => {
      const config = TestBed.inject(EsmfPaginatorSelectConfigInjector);

      expect(config).toEqual({disableOptionCentering: true});
    });

    it('should return custom config when provided in parent injector', () => {
      const customConfig: MatPaginatorSelectConfig = {
        disableOptionCentering: false,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EsmfPaginatorSelectConfigInjector,
            useValue: customConfig,
          },
        ],
      });

      const childInjector = TestBed.inject(EsmfPaginatorSelectConfigInjector);

      expect(childInjector).toEqual(customConfig);
    });

    it('should handle custom config with additional properties in parent injector', () => {
      const customConfig: MatPaginatorSelectConfig = {
        disableOptionCentering: false,
        panelClass: 'custom-panel',
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EsmfPaginatorSelectConfigInjector,
            useValue: customConfig,
          },
        ],
      });

      const childInjector = TestBed.inject(EsmfPaginatorSelectConfigInjector);

      expect(childInjector).toEqual(customConfig);
      expect(childInjector.panelClass).toBe('custom-panel');
    });
  });

  describe('factory function directly', () => {
    const typedProvider = EsmfPaginatorSelectConfigProvider as FactoryProvider;

    it('should return default config when called with undefined', () => {
      const factory = typedProvider.useFactory as (config?: MatPaginatorSelectConfig) => MatPaginatorSelectConfig;
      const result = factory(undefined);

      expect(result).toEqual({disableOptionCentering: true});
    });

    it('should return default config when called with no arguments', () => {
      const factory = typedProvider.useFactory as (config?: MatPaginatorSelectConfig) => MatPaginatorSelectConfig;
      const result = factory();

      expect(result).toEqual({disableOptionCentering: true});
    });

    it('should return custom config when provided', () => {
      const customConfig: MatPaginatorSelectConfig = {
        disableOptionCentering: false,
      };
      const factory = typedProvider.useFactory as (config?: MatPaginatorSelectConfig) => MatPaginatorSelectConfig;
      const result = factory(customConfig);

      expect(result).toEqual(customConfig);
    });

    it('should return the exact custom config object', () => {
      const customConfig: MatPaginatorSelectConfig = {
        disableOptionCentering: false,
        panelClass: 'test-class',
      };
      const factory = typedProvider.useFactory as (config?: MatPaginatorSelectConfig) => MatPaginatorSelectConfig;
      const result = factory(customConfig);

      expect(result).toBe(customConfig);
    });
  });
});
