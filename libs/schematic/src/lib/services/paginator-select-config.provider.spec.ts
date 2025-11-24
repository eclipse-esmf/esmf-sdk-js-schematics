import {TestBed} from '@angular/core/testing';
import {FactoryProvider} from '@angular/core';
import {MatPaginatorSelectConfig} from '@angular/material/paginator';
import {PaginatorSelectConfigInjector, PaginatorSelectConfigProvider} from './paginator-select-config.provider';

describe('PaginatorSelectConfigProvider', () => {
  describe('PaginatorSelectConfigInjector', () => {
    it('should be defined', () => {
      expect(PaginatorSelectConfigInjector).toBeDefined();
    });

    it('should have correct token description', () => {
      expect(PaginatorSelectConfigInjector.toString()).toContain('PaginatorSelectConfig');
    });
  });

  describe('PaginatorSelectConfigProvider', () => {
    const typedProvider = PaginatorSelectConfigProvider as FactoryProvider;

    it('should be defined', () => {
      expect(PaginatorSelectConfigProvider).toBeDefined();
    });

    it('should provide PaginatorSelectConfigInjector token', () => {
      expect(typedProvider.provide).toBe(PaginatorSelectConfigInjector);
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
        providers: [PaginatorSelectConfigProvider],
      });
    });

    it('should return default config when no custom config is provided', () => {
      const config = TestBed.inject(PaginatorSelectConfigInjector);

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
            provide: PaginatorSelectConfigInjector,
            useValue: customConfig,
          },
        ],
      });

      const childInjector = TestBed.inject(PaginatorSelectConfigInjector);

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
            provide: PaginatorSelectConfigInjector,
            useValue: customConfig,
          },
        ],
      });

      const childInjector = TestBed.inject(PaginatorSelectConfigInjector);

      expect(childInjector).toEqual(customConfig);
      expect(childInjector.panelClass).toBe('custom-panel');
    });
  });

  describe('factory function directly', () => {
    const typedProvider = PaginatorSelectConfigProvider as FactoryProvider;

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
