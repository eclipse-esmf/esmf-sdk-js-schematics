import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { EsmfColumnMenuComponent, Column } from './column-menu.component';
import {getTranslocoTestingModule} from '../../test-utils';

describe('EsmfColumnMenuComponent', () => {
  let component: EsmfColumnMenuComponent;
  let fixture: ComponentFixture<EsmfColumnMenuComponent>;

  const mockColumns: Column[] = [
    { name: 'column1', selected: true },
    { name: 'column2', selected: false },
    { name: 'column3', selected: true }
  ];

  const translocoLangs = {
    en: {
      esmf: {
        schematic: {
          columnMenu: {
            columns: 'Columns',
            restoreDefaults: 'Restore defaults',
            cancel: 'Cancel',
            apply: 'Apply',
          },
        },
      },
      test: {
        prefix: {
          column1: {
            preferredName: 'Column 1 Preferred',
            description: 'Column 1 Description',
          },
          column2: {
            preferredName: 'Column 2 Preferred',
            description: 'Column 2 Description',
          },
          column3: {
            preferredName: 'Column 3 Preferred',
            description: 'Column 3 Description',
          },
        },
      },
    },
    de: {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule({langs: translocoLangs}), EsmfColumnMenuComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EsmfColumnMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('defaultColumns', ['column1', 'column2', 'column3']);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('i18nPrefix', 'test.prefix');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize columnsToDisplay with columns input', () => {
    expect(component.columnsToDisplay()).toEqual(mockColumns);
  });

  it('should transform defaultColumns input to Column array', () => {
    const defaultColumns = component.defaultColumns();
    expect(defaultColumns).toEqual([
      { name: 'column1', selected: true },
      { name: 'column2', selected: true },
      { name: 'column3', selected: true }
    ]);
  });

  describe('close', () => {
    it('should set closeColumnMenu to true', () => {
      component.close();
      expect(component.closeColumnMenu).toBe(true);
    });

    it('should reset to default columns', () => {
      const defaultColumns = component.defaultColumns();
      component.close();
      expect(component.columnsToDisplay()).toEqual(defaultColumns);
    });
  });

  describe('stopMenuClosing', () => {
    it('should stop event propagation when closeColumnMenu is false', () => {
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');
      component.closeColumnMenu = false;

      component.stopMenuClosing(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop event propagation when closeColumnMenu is true', () => {
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');
      component.closeColumnMenu = true;

      component.stopMenuClosing(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('columnClick', () => {
    it('should toggle column selected state', () => {
      const event = new MouseEvent('click');
      const column = { name: 'test', selected: true };
      jest.spyOn(event, 'preventDefault');
      jest.spyOn(event, 'stopPropagation');

      component.columnClick(event, column);

      expect(column.selected).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set closeColumnMenu to false', () => {
      const event = new MouseEvent('click');
      const column = { name: 'test', selected: true };
      component.closeColumnMenu = true;

      component.columnClick(event, column);

      expect(component.closeColumnMenu).toBe(false);
    });
  });

  describe('resetToDefault', () => {
    it('should reset columns to default', () => {
      const defaultColumns = component.defaultColumns();
      component.columnsToDisplay.set([{ name: 'modified', selected: false }]);

      component.resetToDefault();

      expect(component.columnsToDisplay()).toEqual(defaultColumns);
    });

    it('should prevent default and stop propagation when event is provided', () => {
      const event = new MouseEvent('click');
      jest.spyOn(event, 'preventDefault');
      jest.spyOn(event, 'stopPropagation');

      component.resetToDefault(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('emitChanges', () => {
    it('should emit columnsChangedEvent', () => {
      jest.spyOn(component.columnsChangedEvent, 'emit');

      component.emitChanges();

      expect(component.columnsChangedEvent.emit).toHaveBeenCalledWith(mockColumns);
    });

    it('should set closeColumnMenu to true', () => {
      component.closeColumnMenu = false;

      component.emitChanges();

      expect(component.closeColumnMenu).toBe(true);
    });
  });

  describe('columnDrop', () => {
    it('should reorder columns', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2
      } as CdkDragDrop<string[]>;

      component.columnDrop(event);

      const columns = component.columnsToDisplay();
      expect(columns[0]).toEqual({ name: 'column2', selected: false });
      expect(columns[2]).toEqual({ name: 'column1', selected: true });
    });
  });

  describe('translations', () => {
    it('should render preferred name translations using the provided prefix', () => {
      fixture.detectChanges();
      const preferredNameElements = Array.from<Element>(
        fixture.nativeElement.querySelectorAll('[data-test="column-option-preferred-name"]')
      );
      const preferredNames = preferredNameElements.map((element: Element) => (element.textContent ?? '').trim());

      expect(preferredNames).toEqual([
        'Column 2 Preferred',
        'Column 3 Preferred',
        'Column 1 Preferred'
      ]);
    });

    it('should render description translations using the provided prefix', () => {
      fixture.detectChanges();
      const descriptionElements = Array.from<Element>(fixture.nativeElement.querySelectorAll('[data-test="column-option-description"]'));
      const descriptions = descriptionElements.map((element: Element) => (element.textContent ?? '').trim());

      expect(descriptions).toEqual([
        'Column 2 Description',
        'Column 3 Description',
        'Column 1 Description'
      ]);
    });

    it('should render the section title translation using the default prefix', () => {
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('.selection-title');

      expect(titleElement?.textContent?.trim()).toBe('Columns');
    });

    it('should render the action button translations using the default prefix', () => {
      fixture.detectChanges();
      const restoreText = fixture.nativeElement.querySelector('[data-test="restore-to-defaults-text"]');
      const cancelText = fixture.nativeElement.querySelector('[data-test="column-menu-cancel-text"]');
      const applyText = fixture.nativeElement.querySelector('[data-test="column-menu-apply-text"]');

      expect(restoreText?.textContent?.trim()).toBe('Restore defaults');
      expect(cancelText?.textContent?.trim()).toBe('Cancel');
      expect(applyText?.textContent?.trim()).toBe('Apply');
    });
  });
});
