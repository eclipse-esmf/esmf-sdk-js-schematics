/*
 * Copyright (c) 2025 Robert Bosch Manufacturing Solutions GmbH
 *
 * See the AUTHORS file(s) distributed with this work for
 * additional information regarding authorship.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ComponentRef} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {By} from '@angular/platform-browser';
import {EsmfConfigMenuComponent, ConfigMenuBase} from './config-menu.component';
import {EsmfLocalStorageService} from '../../services/storage.service';
import {getTranslocoTestingModule} from '../../test-utils';

describe('EsmfConfigMenuComponent', () => {
  let component: EsmfConfigMenuComponent<ConfigMenuBase>;
  let fixture: ComponentFixture<EsmfConfigMenuComponent<ConfigMenuBase>>;
  let componentRef: ComponentRef<EsmfConfigMenuComponent<ConfigMenuBase>>;
  let storageService: jest.Mocked<EsmfLocalStorageService>;

  const createMockConfigs = (): ConfigMenuBase[] => [
    {name: 'config.name1', desc: 'config.desc1', selected: true, color: '#ff0000'},
    {name: 'config.name2', desc: 'config.desc2', selected: false, color: '#00ff00'},
    {name: 'config.name3', desc: 'config.desc3', selected: true, color: '#0000ff'},
  ];

  const createMockEvent = () =>
    ({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as MouseEvent);

  const setupComponent = async (dialogData?: {configs: ConfigMenuBase[]; keyLocalStorage: string} | null) => {
    await TestBed.configureTestingModule({
      imports: [EsmfConfigMenuComponent, getTranslocoTestingModule({langs: {en: {}, de: {}}})],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: dialogData},
        {provide: MatDialogRef, useValue: {close: jest.fn()}},
        {provide: EsmfLocalStorageService, useValue: {setItem: jest.fn()}},
      ],
    }).compileComponents();

    storageService = TestBed.inject(EsmfLocalStorageService) as jest.Mocked<EsmfLocalStorageService>;
    fixture = TestBed.createComponent(EsmfConfigMenuComponent<ConfigMenuBase>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  };

  describe('Component Initialization', () => {
    describe('with MAT_DIALOG_DATA', () => {
      const mockConfigs = createMockConfigs();
      const mockData = {configs: mockConfigs, keyLocalStorage: 'test-key'};

      beforeEach(async () => await setupComponent(mockData));

      it('should initialize with provided configs from dialog data', () => {
        expect(component.configs()).toEqual(mockConfigs);
        expect(component.configsDefault()).toEqual(mockConfigs);
        expect(component.keyLocalStorage()).toBe('test-key');
      });

      it('should create deep copy of configs for configsDefault', () => {
        expect(component.configsDefault()).not.toBe(component.configs());
        expect(component.configsDefault()).toEqual(component.configs());
      });
    });

    describe('without MAT_DIALOG_DATA', () => {
      beforeEach(async () => {
        await setupComponent(null);
      });

      it('should initialize with empty configs when no dialog data provided', () => {
        expect(component.configs()).toEqual([]);
        expect(component.configsDefault()).toEqual([]);
        expect(component.keyLocalStorage()).toBe('');
      });
    });
  });

  describe('Template Rendering', () => {
    const mockConfigs = createMockConfigs();
    const mockData = {configs: mockConfigs, keyLocalStorage: 'test-key'};

    beforeEach(async () => {
      await setupComponent(mockData);
      fixture.detectChanges();
    });

    it('should render the settings title', () => {
      const titleElement = fixture.debugElement.query(By.css('.selection-title'));
      expect(titleElement).toBeTruthy();
      expect(titleElement.nativeElement.textContent.trim()).toBe('settings.title');
    });

    it('should render all config items in the list', () => {
      const listOptions = fixture.debugElement.queryAll(By.css('[data-test="configuration-list-option"]'));
      expect(listOptions.length).toBe(3);
    });

    it('should display config name and description for each item', () => {
      const firstOption = fixture.debugElement.query(By.css('[data-test="configuration-list-option"]'));
      const name = firstOption.query(By.css('[data-test="config-option-name"]'));
      const desc = firstOption.query(By.css('[data-test="config-option-desc"]'));

      expect(name.nativeElement.textContent.trim()).toBe('config.name1');
      expect(desc.nativeElement.textContent.trim()).toBe('config.desc1');
    });

    it('should render color picker with correct value for each config', () => {
      const listOptions = fixture.debugElement.queryAll(By.css('[data-test="configuration-list-option"]'));
      const colorPicker = listOptions[0].query(By.css('input[type="color"]'));

      expect(colorPicker).toBeTruthy();
      expect(colorPicker.nativeElement.value).toBe('#ff0000');
    });

    it('should render selected state correctly', () => {
      const listOptions = fixture.debugElement.queryAll(By.css('mat-list-option'));
      expect(listOptions[0].componentInstance.selected).toBe(true);
      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(true);
    });
  });

  describe('configClick', () => {
    const mockConfigs = createMockConfigs();
    const mockData = {configs: mockConfigs, keyLocalStorage: 'test-key'};

    beforeEach(async () => {
      await setupComponent(mockData);
      fixture.detectChanges();
    });

    it('should toggle config selection when clicked', () => {
      const config = component.configs()[0];
      const initialSelected = config.selected;
      const mockEvent = createMockEvent();
      component.configClick(mockEvent, config);

      expect(config.selected).toBe(!initialSelected);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should toggle config from false to true', () => {
      const config = component.configs()[1];
      const mockEvent = createMockEvent();
      expect(config.selected).toBe(false);
      component.configClick(mockEvent, config);
      expect(config.selected).toBe(true);
    });

    it('should be triggered when clicking list option', () => {
      const spy = jest.spyOn(component, 'configClick');
      const listOption = fixture.debugElement.query(By.css('[data-test="configuration-list-option"]'));
      listOption.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('colorChange', () => {
    const mockConfigs = createMockConfigs();
    const mockData = {configs: mockConfigs, keyLocalStorage: 'test-key'};

    beforeEach(async () => {
      await setupComponent(mockData);
      fixture.detectChanges();
    });

    it('should update config color when color picker value changes', () => {
      const config = component.configs()[0];
      const newColor = '#123456';

      const event = {
        ...createMockEvent(),
        target: {value: newColor},
      } as unknown as MouseEvent;

      component.colorChange(event, config);

      expect(config.color).toBe(newColor);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should be triggered when color picker changes', () => {
      const spy = jest.spyOn(component, 'colorChange');
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));

      colorPicker.nativeElement.value = '#abcdef';
      colorPicker.nativeElement.dispatchEvent(new Event('change'));

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('closeMenu', () => {
    const mockData = {configs: createMockConfigs(), keyLocalStorage: 'test-key'};

    beforeEach(async () => {
      await setupComponent(mockData);
      fixture.detectChanges();
    });

    it('should reset configs to default values', () => {
      component.configs()[0].selected = false;
      component.configs()[0].color = '#999999';
      const originalDefaults = component.configsDefault();

      component.closeMenu();

      expect(component.configs()).toEqual(originalDefaults);
      expect(component.configs()[0].selected).toBe(true);
      expect(component.configs()[0].color).toBe('#ff0000');
    });

    it('should set closeConfigMenu flag to true', () => {
      expect(component.closeConfigMenu()).toBe(false);
      component.closeMenu();
      expect(component.closeConfigMenu()).toBe(true);
    });

    it('should be triggered when cancel button is clicked (non-mat-menu)', () => {
      const spy = jest.spyOn(component, 'closeMenu');
      componentRef.setInput('isOpenedFromMatMenu', false);
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      cancelButton.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should be triggered when cancel button is clicked (from mat-menu)', () => {
      const spy = jest.spyOn(component, 'closeMenu');
      componentRef.setInput('isOpenedFromMatMenu', true);
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      cancelButton.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('stopMenuClosing', () => {
    const mockConfigs = createMockConfigs();
    const mockData = {configs: mockConfigs, keyLocalStorage: 'test-key'};

    beforeEach(async () => await setupComponent(mockData));

    it('should stop propagation when isOpenedFromMatMenu is true and closeConfigMenu is false', () => {
      const mockEvent = createMockEvent();
      componentRef.setInput('isOpenedFromMatMenu', true);
      component.closeConfigMenu.set(false);
      fixture.detectChanges();
      component.stopMenuClosing(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when isOpenedFromMatMenu is false', () => {
      const mockEvent = createMockEvent();
      componentRef.setInput('isOpenedFromMatMenu', false);
      component.closeConfigMenu.set(false);
      fixture.detectChanges();
      component.stopMenuClosing(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not stop propagation when closeConfigMenu is true', () => {
      const mockEvent = createMockEvent();
      componentRef.setInput('isOpenedFromMatMenu', true);
      component.closeConfigMenu.set(true);
      fixture.detectChanges();
      component.stopMenuClosing(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should be triggered when clicking actions container', () => {
      const spy = jest.spyOn(component, 'stopMenuClosing');
      componentRef.setInput('isOpenedFromMatMenu', true);
      fixture.detectChanges();

      const actionsContainer = fixture.debugElement.query(By.css('[data-test="config-menu-actions-container"]'));
      actionsContainer.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('storeConfig', () => {
    const mockData = {configs: createMockConfigs(), keyLocalStorage: 'test-key'};

    beforeEach(async () => {
      await setupComponent(mockData);
      fixture.detectChanges();
    });

    it('should set closeConfigMenu to true', () => {
      component.closeConfigMenu.set(false);
      component.storeConfig();
      expect(component.closeConfigMenu()).toBe(true);
    });

    it('should call storageService.setItem with correct parameters', () => {
      component.storeConfig();
      expect(storageService.setItem).toHaveBeenCalledWith('test-key', component.configs());
    });

    it('should emit configChangedEvent with current configs', () => {
      const spy = jest.fn();
      component.configChangedEvent.subscribe(spy);
      component.storeConfig();

      expect(spy).toHaveBeenCalledWith(component.configs());
    });

    it('should be triggered when apply button is clicked (non-mat-menu)', () => {
      const spy = jest.spyOn(component, 'storeConfig');
      componentRef.setInput('isOpenedFromMatMenu', false);
      fixture.detectChanges();

      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      applyButton.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should be triggered when apply button is clicked (from mat-menu)', () => {
      const spy = jest.spyOn(component, 'storeConfig');
      componentRef.setInput('isOpenedFromMatMenu', true);
      fixture.detectChanges();

      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      applyButton.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Template UI Elements', () => {
    const mockConfigs = createMockConfigs();
    const mockData = {configs: mockConfigs, keyLocalStorage: 'test-key'};

    describe('when not opened from mat-menu', () => {
      beforeEach(async () => {
        await setupComponent(mockData);
        componentRef.setInput('isOpenedFromMatMenu', false);
        fixture.detectChanges();
      });

      it('should render cancel button with mat-dialog-close directive', () => {
        const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
        expect(cancelButton).toBeTruthy();
        expect(cancelButton.nativeElement.getAttribute('data-test')).toBe('config-menu-cancel-button');
      });

      it('should render apply button with mat-dialog-close directive', () => {
        const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
        expect(applyButton).toBeTruthy();
      });

      it('should render cancel button with icon and text', () => {
        const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
        const icon = cancelButton.query(By.css('[data-test="config-menu-cancel-icon"]'));
        const text = cancelButton.query(By.css('[data-test="config-menu-cancel-text"]'));

        expect(icon.nativeElement.textContent.trim()).toBe('close');
        expect(text.nativeElement.textContent.trim()).toBe('cancel');
      });

      it('should render apply button with icon and text', () => {
        const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
        const icon = applyButton.query(By.css('[data-test="config-menu-apply-icon"]'));
        const text = applyButton.query(By.css('[data-test="config-menu-apply-text"]'));

        expect(icon.nativeElement.textContent.trim()).toBe('check');
        expect(text.nativeElement.textContent.trim()).toBe('apply');
      });
    });

    describe('when opened from mat-menu', () => {
      beforeEach(async () => {
        await setupComponent(mockData);
        componentRef.setInput('isOpenedFromMatMenu', true);
        fixture.detectChanges();
      });

      it('should render cancel button without mat-dialog-close directive', () => {
        const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
        expect(cancelButton).toBeTruthy();
        expect(cancelButton.nativeElement.getAttribute('ng-reflect-dialog-result')).toBeNull();
      });

      it('should render apply button without mat-dialog-close directive', () => {
        const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
        expect(applyButton).toBeTruthy();
        expect(applyButton.nativeElement.getAttribute('ng-reflect-dialog-result')).toBeNull();
      });
    });

    it('should render mat-dividers', () => {
      fixture.detectChanges();
      const dividers = fixture.debugElement.queryAll(By.css('mat-divider'));
      expect(dividers.length).toBe(2);
    });

    it('should render selection list with proper attributes', () => {
      fixture.detectChanges();
      const selectionList = fixture.debugElement.query(By.css('[data-test="config-selection-list"]'));
      expect(selectionList).toBeTruthy();
      expect(selectionList.nativeElement.classList.contains('selection-list')).toBe(true);
    });

    it('should have stopPropagation handler on title element', () => {
      fixture.detectChanges();
      const titleElement = fixture.debugElement.query(By.css('.selection-title'));

      expect(titleElement).toBeTruthy();
      expect(titleElement.nativeElement.getAttribute('role')).toBe('button');
      expect(titleElement.nativeElement.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Integration Tests', () => {
    const mockData = {configs: createMockConfigs(), keyLocalStorage: 'test-storage-key'};

    beforeEach(async () => {
      await setupComponent(mockData);
      fixture.detectChanges();
    });

    it('should handle complete user flow: change selection, color, and save', () => {
      const emitSpy = jest.fn();
      component.configChangedEvent.subscribe(emitSpy);

      // Toggle selection
      const listOption = fixture.debugElement.query(By.css('[data-test="configuration-list-option"]'));
      listOption.nativeElement.click();
      fixture.detectChanges();

      expect(component.configs()[0].selected).toBe(false);

      // Change color
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      colorPicker.nativeElement.value = '#abcdef';
      colorPicker.nativeElement.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.configs()[0].color).toBe('#abcdef');

      // Save configuration
      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      applyButton.nativeElement.click();

      expect(storageService.setItem).toHaveBeenCalledWith('test-storage-key', component.configs());
      expect(emitSpy).toHaveBeenCalledWith(component.configs());
      expect(component.closeConfigMenu()).toBe(true);
    });

    it('should handle complete user flow: make changes and cancel', () => {
      const originalConfigs = JSON.parse(JSON.stringify(component.configs()));

      // Toggle selection
      const listOption = fixture.debugElement.query(By.css('[data-test="configuration-list-option"]'));
      listOption.nativeElement.click();
      fixture.detectChanges();

      // Change color
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      colorPicker.nativeElement.value = '#123456';
      colorPicker.nativeElement.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      // Cancel changes
      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      cancelButton.nativeElement.click();

      expect(component.configs()).toEqual(originalConfigs);
      expect(storageService.setItem).not.toHaveBeenCalled();
    });

    it('should prevent color picker clicks from propagating to list option', () => {
      const configClickSpy = jest.spyOn(component, 'configClick');
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      colorPicker.nativeElement.click();

      expect(configClickSpy).not.toHaveBeenCalled();
    });
  });
});
