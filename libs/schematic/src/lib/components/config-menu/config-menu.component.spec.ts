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

import {ComponentRef} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {By} from '@angular/platform-browser';
import {EsmfLocalStorageService} from '../../services/local-storage.service';
import {getTranslocoTestingModule} from '../../test-utils';
import {Config, EsmfConfigMenuComponent} from './config-menu.component';

describe('EsmfConfigMenuComponent', () => {
  let component: EsmfConfigMenuComponent;
  let fixture: ComponentFixture<EsmfConfigMenuComponent>;
  let componentRef: ComponentRef<EsmfConfigMenuComponent>;
  let storageService: jest.Mocked<EsmfLocalStorageService>;

  const createMockConfigs = (): Config[] => [
    {name: 'config.name1', desc: 'config.desc1', selected: true, color: '#ff0000'},
    {name: 'config.name2', desc: 'config.desc2', selected: false, color: '#00ff00'},
    {name: 'config.name3', desc: 'config.desc3', selected: true, color: '#0000ff'},
  ];

  const createMockEvent = () =>
    ({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    }) as unknown as MouseEvent;

  const setupComponent = async (configs?: Config[], keyLocalStorage = 'test-key') => {
    await TestBed.configureTestingModule({
      imports: [EsmfConfigMenuComponent, getTranslocoTestingModule({langs: {en: {}, de: {}}})],
      providers: [{provide: EsmfLocalStorageService, useValue: {setItem: jest.fn()}}],
    }).compileComponents();

    storageService = TestBed.inject(EsmfLocalStorageService) as jest.Mocked<EsmfLocalStorageService>;
    fixture = TestBed.createComponent(EsmfConfigMenuComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    if (configs) {
      componentRef.setInput('configs', configs);
      componentRef.setInput('keyLocalStorage', keyLocalStorage);
    }
  };

  describe('Component Initialization', () => {
    describe('with configs input', () => {
      const mockConfigs = createMockConfigs();

      beforeEach(async () => {
        await setupComponent(mockConfigs);
        fixture.detectChanges();
      });

      it('should initialize with provided configs', () => {
        expect(component.configs()).toEqual(mockConfigs);
        expect(component.keyLocalStorage()).toBe('test-key');
      });

      it('should initialize form with correct number of controls', () => {
        expect(component.configsForm().length).toBe(3);
      });

      it('should initialize form controls with config values', () => {
        expect(component.configsForm().at(0).value).toEqual({
          name: 'config.name1',
          desc: 'config.desc1',
          selected: true,
          color: '#ff0000',
        });
        expect(component.configsForm().at(1).value.selected).toBe(false);
        expect(component.configsForm().at(2).value.selected).toBe(true);
      });

      it('should reinitialize form when configs input changes', () => {
        // Initial state
        expect(component.configsForm().at(0).value.selected).toBe(true);
        expect(component.configsForm().at(1).value.selected).toBe(false);

        // Simulate config change from parent
        const updatedConfigs: Config[] = [
          {name: 'config.name1', desc: 'config.desc1', selected: false, color: '#ff0000'},
          {name: 'config.name2', desc: 'config.desc2', selected: true, color: '#00ff00'},
          {name: 'config.name3', desc: 'config.desc3', selected: true, color: '#0000ff'},
        ];

        componentRef.setInput('configs', updatedConfigs);
        fixture.detectChanges();

        // Form should reflect new config values
        expect(component.configsForm().at(0).value.selected).toBe(false);
        expect(component.configsForm().at(1).value.selected).toBe(true);
        expect(component.configsForm().at(0).value.color).toBe('#ff0000');
      });
    });

    describe('without configs input', () => {
      beforeEach(async () => {
        await setupComponent([]);
        fixture.detectChanges();
      });

      it('should handle empty configs array', () => {
        expect(component.configsForm().length).toBe(0);
      });
    });
  });

  describe('Template Rendering', () => {
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs);
      fixture.detectChanges();
    });

    it('should render the settings title', () => {
      const titleElement = fixture.debugElement.query(By.css('.selection-title'));
      expect(titleElement).toBeTruthy();
      expect(titleElement.nativeElement.textContent.trim()).toBe('esmf.schematic.configMenu.title');
    });

    it('should render all config items in the list', () => {
      const listOptions = fixture.debugElement.queryAll(By.css('[data-test="configuration-list-option"]'));
      expect(listOptions.length).toBe(3);
    });

    it('should display config name and description for each item', () => {
      const firstOption = fixture.debugElement.query(By.css('[data-test="configuration-list-option"]'));
      const name = firstOption.query(By.css('[data-test="config-option-name"]'));
      const desc = firstOption.query(By.css('[data-test="config-option-desc"]'));

      expect(name.nativeElement.textContent.trim()).toBe('esmf.schematic.configMenu.config.name1');
      expect(desc.nativeElement.textContent.trim()).toBe('esmf.schematic.configMenu.config.desc1');
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

  describe('onSelectionChange', () => {
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs);
      fixture.detectChanges();
    });

    it('should update form control when selection changes', () => {
      const mockEvent = {
        options: [{value: 0, selected: false}],
      } as any;

      component.onSelectionChange(mockEvent);

      expect(component.configsForm().at(0).value.selected).toBe(false);
    });

    it('should toggle form control from false to true', () => {
      const mockEvent = {
        options: [{value: 1, selected: true}],
      } as any;

      expect(component.configsForm().at(1).value.selected).toBe(false);
      component.onSelectionChange(mockEvent);
      expect(component.configsForm().at(1).value.selected).toBe(true);
    });
  });

  describe('color input formControl binding', () => {
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs);
      fixture.detectChanges();
    });

    it('should update form control when color picker value changes', () => {
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      const newColor = '#123456';

      colorPicker.nativeElement.value = newColor;
      colorPicker.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.configsForm().at(0).value.color).toBe(newColor);
    });

    it('should render color picker with correct initial value', () => {
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      expect(colorPicker.nativeElement.value).toBe('#ff0000');
    });
  });

  describe('cancel', () => {
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs);
      fixture.detectChanges();
    });

    it('should reset form to default values', () => {
      // Change some values
      component.configsForm().at(0).controls.selected.setValue(false);
      component.configsForm().at(0).controls.color.setValue('#999999');

      component.cancel();

      // Form should be reset to original values
      expect(component.configsForm().at(0).value.selected).toBe(true);
      expect(component.configsForm().at(0).value.color).toBe('#ff0000');
    });

    it('should emit closeMenu output when not in dialog context', () => {
      const spy = jest.fn();
      component.closeMenu.subscribe(spy);
      component.cancel();

      expect(spy).toHaveBeenCalled();
    });

    it('should be triggered when cancel button is clicked', () => {
      const spy = jest.spyOn(component, 'cancel');
      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      cancelButton.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs);
      fixture.detectChanges();
    });

    it('should call storageService.setItem with form values', () => {
      component.save();
      const expectedConfigs = component.configsForm().controls.map(group => group.getRawValue());
      expect(storageService.setItem).toHaveBeenCalledWith('test-key', expectedConfigs);
    });

    it('should emit saveData output with form values', () => {
      const spy = jest.fn();
      component.saveData.subscribe(spy);
      component.save();

      const expectedConfigs = component.configsForm().controls.map(group => group.getRawValue());
      expect(spy).toHaveBeenCalledWith(expectedConfigs);
    });

    it('should emit closeMenu output when not in dialog context', () => {
      const spy = jest.fn();
      component.closeMenu.subscribe(spy);
      component.save();

      expect(spy).toHaveBeenCalled();
    });

    it('should be triggered when apply button is clicked', () => {
      const spy = jest.spyOn(component, 'save');
      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      applyButton.nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Template UI Elements', () => {
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs);
      fixture.detectChanges();
    });

    it('should render cancel button', () => {
      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      expect(cancelButton).toBeTruthy();
    });

    it('should render apply button', () => {
      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      expect(applyButton).toBeTruthy();
    });

    it('should render cancel button with icon and text', () => {
      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      const icon = cancelButton.query(By.css('[data-test="config-menu-cancel-icon"]'));
      const text = cancelButton.query(By.css('[data-test="config-menu-cancel-text"]'));

      expect(icon.nativeElement.textContent.trim()).toBe('close');
      expect(text.nativeElement.textContent.trim()).toBe('esmf.schematic.configMenu.cancel');
    });

    it('should render apply button with icon and text', () => {
      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      const icon = applyButton.query(By.css('[data-test="config-menu-apply-icon"]'));
      const text = applyButton.query(By.css('[data-test="config-menu-apply-text"]'));

      expect(icon.nativeElement.textContent.trim()).toBe('check');
      expect(text.nativeElement.textContent.trim()).toBe('esmf.schematic.configMenu.apply');
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
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      await setupComponent(mockConfigs, 'test-storage-key');
      fixture.detectChanges();
    });

    it('should handle complete user flow: change selection, color, and save', () => {
      const emitSpy = jest.fn();
      component.saveData.subscribe(emitSpy);

      // Change selection via form control
      component.configsForm().at(0).controls.selected.setValue(false);
      fixture.detectChanges();

      expect(component.configsForm().at(0).value.selected).toBe(false);

      // Change color
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      colorPicker.nativeElement.value = '#abcdef';
      colorPicker.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.configsForm().at(0).value.color).toBe('#abcdef');

      // Save configuration
      const applyButton = fixture.debugElement.query(By.css('[data-test="config-menu-apply-button"]'));
      applyButton.nativeElement.click();

      const expectedConfigs = component.configsForm().controls.map(g => g.getRawValue());
      expect(storageService.setItem).toHaveBeenCalledWith('test-storage-key', expectedConfigs);
      expect(emitSpy).toHaveBeenCalledWith(expectedConfigs);
    });

    it('should handle complete user flow: make changes and cancel', () => {
      const originalValues = component.configsForm().controls.map(g => ({...g.getRawValue()}));

      // Change values
      component.configsForm().at(0).controls.selected.setValue(false);
      component.configsForm().at(0).controls.color.setValue('#999999');
      fixture.detectChanges();

      expect(component.configsForm().at(0).value.selected).toBe(false);
      expect(component.configsForm().at(0).value.color).toBe('#999999');

      // Cancel changes
      const cancelButton = fixture.debugElement.query(By.css('[data-test="config-menu-cancel-button"]'));
      cancelButton.nativeElement.click();

      // Form should be reset
      expect(component.configsForm().at(0).value.selected).toBe(originalValues[0].selected);
      expect(component.configsForm().at(0).value.color).toBe(originalValues[0].color);
    });

    it('should prevent color picker clicks from propagating to list option', () => {
      const colorPicker = fixture.debugElement.query(By.css('input[type="color"]'));
      const listOption = fixture.debugElement.query(By.css('[data-test="configuration-list-option"]'));

      // Click color picker
      const clickEvent = new MouseEvent('click', {bubbles: true, cancelable: true});
      Object.defineProperty(clickEvent, 'target', {value: colorPicker.nativeElement, enumerable: true});
      colorPicker.nativeElement.dispatchEvent(clickEvent);

      // Selection should not change
      expect(component.configsForm().at(0).value.selected).toBe(true);
    });

    it('should synchronize multiple component instances when config changes', () => {
      // Simulate a second instance that shares the same config
      const instance2Fixture = TestBed.createComponent(EsmfConfigMenuComponent);
      const instance2 = instance2Fixture.componentInstance;
      const instance2Ref = instance2Fixture.componentRef;

      // Initialize both instances with same config
      const sharedConfig = createMockConfigs();
      instance2Ref.setInput('configs', sharedConfig);
      instance2Ref.setInput('keyLocalStorage', 'test-storage-key');
      instance2Fixture.detectChanges();

      // Verify initial state is same
      expect(component.configsForm().at(0).value.selected).toBe(true);
      expect(instance2.configsForm().at(0).value.selected).toBe(true);

      // Modify config in first instance
      component.configsForm().at(0).controls.selected.setValue(false);
      component.configsForm().at(0).controls.color.setValue('#abcdef');

      // Save configuration - this would emit to parent
      const savedConfigs = component.configsForm().controls.map(g => g.getRawValue());

      // Simulate parent updating the config input for the second instance
      instance2Ref.setInput('configs', savedConfigs);
      instance2Fixture.detectChanges();

      // Second instance should now reflect the changes
      expect(instance2.configsForm().at(0).value.selected).toBe(false);
      expect(instance2.configsForm().at(0).value.color).toBe('#abcdef');
    });
  });

  describe('Dialog Context', () => {
    let mockDialogRef: jest.Mocked<MatDialogRef<EsmfConfigMenuComponent, Config[]>>;
    const mockConfigs = createMockConfigs();

    beforeEach(async () => {
      mockDialogRef = {close: jest.fn()} as any;

      await TestBed.configureTestingModule({
        imports: [EsmfConfigMenuComponent, getTranslocoTestingModule({langs: {en: {}, de: {}}})],
        providers: [
          {provide: MatDialogRef, useValue: mockDialogRef},
          {provide: MAT_DIALOG_DATA, useValue: {keyLocalStorage: 'dialog-storage-key', configs: mockConfigs}},
          {provide: EsmfLocalStorageService, useValue: {setItem: jest.fn()}},
        ],
      }).compileComponents();

      storageService = TestBed.inject(EsmfLocalStorageService) as jest.Mocked<EsmfLocalStorageService>;
      fixture = TestBed.createComponent(EsmfConfigMenuComponent);
      component = fixture.componentInstance;
      componentRef = fixture.componentRef;
      fixture.detectChanges();
    });

    it('should initialize with data from MAT_DIALOG_DATA', () => {
      expect(component.keyLocalStorage()).toBe('dialog-storage-key');
      expect(component.configs()).toEqual(mockConfigs);
    });

    it('should initialize form from dialog data', () => {
      expect(component.configsForm().length).toBe(3);
      expect(component.configsForm().at(0).value.name).toBe('config.name1');
    });

    it('should close dialog when cancel() is called', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should not emit closeMenu output when in dialog context', () => {
      const closeMenuSpy = jest.fn();
      component.closeMenu.subscribe(closeMenuSpy);
      component.cancel();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(closeMenuSpy).not.toHaveBeenCalled();
    });

    it('should close dialog with configs when save() is called', () => {
      component.save();
      const expectedConfigs = component.configsForm().controls.map(g => g.getRawValue());
      expect(mockDialogRef.close).toHaveBeenCalledWith(expectedConfigs);
    });

    it('should not emit closeMenu output when save() is called in dialog context', () => {
      const closeMenuSpy = jest.fn();
      component.closeMenu.subscribe(closeMenuSpy);
      component.save();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(closeMenuSpy).not.toHaveBeenCalled();
    });

    it('should still emit saveData output when save() is called in dialog context', () => {
      const saveSpy = jest.fn();
      component.saveData.subscribe(saveSpy);
      component.save();

      const expectedConfigs = component.configsForm().controls.map(g => g.getRawValue());
      expect(saveSpy).toHaveBeenCalledWith(expectedConfigs);
    });

    it('should store configs to localStorage in dialog context', () => {
      component.configsForm().at(0).controls.selected.setValue(false);
      component.save();

      const expectedConfigs = component.configsForm().controls.map(g => g.getRawValue());
      expect(storageService.setItem).toHaveBeenCalledWith('dialog-storage-key', expectedConfigs);
    });
  });
});
