import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TableCellComponent} from './table-cell.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {By} from '@angular/platform-browser';

describe('TableCellComponent', () => {
  let component: TableCellComponent;
  let fixture: ComponentFixture<TableCellComponent>;
  let clipboardSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCellComponent);
    component = fixture.componentInstance;
    clipboardSpy = jest.spyOn(TestBed.inject(Clipboard), 'copy');
  });

  describe('value input transformation', () => {
    it('should convert null to "-"', () => {
      fixture.componentRef.setInput('value', null);
      fixture.detectChanges();

      expect(component.value()).toBe('-');
    });

    it('should convert undefined to "-"', () => {
      fixture.componentRef.setInput('value', undefined);
      fixture.detectChanges();

      expect(component.value()).toBe('-');
    });

    it('should convert empty string to "-"', () => {
      fixture.componentRef.setInput('value', '');
      fixture.detectChanges();

      expect(component.value()).toBe('-');
    });

    it('should convert whitespace-only string to "-"', () => {
      fixture.componentRef.setInput('value', '   ');
      fixture.detectChanges();

      expect(component.value()).toBe('-');
    });

    it('should convert number to string', () => {
      fixture.componentRef.setInput('value', 123);
      fixture.detectChanges();

      expect(component.value()).toBe('123');
    });

    it('should convert boolean to string', () => {
      fixture.componentRef.setInput('value', true);
      fixture.detectChanges();

      expect(component.value()).toBe('true');
    });

    it('should keep valid string as is', () => {
      fixture.componentRef.setInput('value', 'test value');
      fixture.detectChanges();

      expect(component.value()).toBe('test value');
    });
  });

  describe('computed properties', () => {
    it('should compute hasValue correctly', () => {
      fixture.componentRef.setInput('value', null);
      expect(component.hasValue()).toBe(false);

      fixture.componentRef.setInput('value', 'test');
      expect(component.hasValue()).toBe(true);
    });

    it('should compute highlight config properties', () => {
      const configs = [
        {name: 'highlight-test', desc: 'Test', selected: true, color: 'red'},
        {name: 'other', desc: 'Other', selected: false},
      ];
      fixture.componentRef.setInput('value', 'test');
      fixture.componentRef.setInput('configs', configs);

      expect(component.highlightConfig()).toEqual(configs[0]);
      expect(component.color()).toBe('red');
      expect(component.selected()).toBe(true);
    });

    it('should return undefined when no highlight config exists', () => {
      fixture.componentRef.setInput('value', 'test');
      fixture.componentRef.setInput('configs', [{name: 'other', desc: 'Test', selected: false}]);

      expect(component.highlightConfig()).toBeUndefined();
      expect(component.color()).toBeUndefined();
      expect(component.selected()).toBeUndefined();
    });
  });

  describe('copyToClipboard', () => {
    it('should copy value, prevent event bubbling, and emit event', () => {
      const event = new MouseEvent('click');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const emitSpy = jest.spyOn(component.copyToClipboardEvent, 'emit');

      component.copyToClipboard('test', event);

      expect(clipboardSpy).toHaveBeenCalledWith('test');
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('test');
    });
  });

  describe('template', () => {
    it('should render value and show copy icon when value exists', () => {
      fixture.componentRef.setInput('value', 'test value');
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.cell-content')).nativeElement.textContent).toContain('test value');
      expect(fixture.debugElement.query(By.css('[data-test="copy-to-clipboard-icon"]'))).toBeTruthy();
    });

    it('should render "-" and hide copy icon when value is empty', () => {
      fixture.componentRef.setInput('value', null);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.cell-content')).nativeElement.textContent).toContain('-');
      expect(fixture.debugElement.query(By.css('[data-test="copy-to-clipboard-icon"]'))).toBeNull();
    });

    it('should trigger copy on icon click', () => {
      fixture.componentRef.setInput('value', 'test');
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.copyToClipboardEvent, 'emit');
      fixture.debugElement.query(By.css('[data-test="copy-to-clipboard-icon"]')).nativeElement.click();

      expect(clipboardSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should apply directives with correct bindings', () => {
      fixture.componentRef.setInput('value', 'test');
      fixture.componentRef.setInput('description', 'desc');
      fixture.componentRef.setInput('highlightString', ['test']);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[esmfHighlight]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[esmfTableCellTooltip]'))).toBeTruthy();
      expect(component.description()).toBe('desc');
      expect(component.highlightString()).toEqual(['test']);
    });
  });
});
