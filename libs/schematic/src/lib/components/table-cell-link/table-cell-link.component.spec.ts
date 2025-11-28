import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EsmfTableCellLinkComponent} from './table-cell-link.component';
import {By} from '@angular/platform-browser';
import {ComponentRef} from '@angular/core';

describe('EsmfTableCellLinkComponent', () => {
  let component: EsmfTableCellLinkComponent;
  let fixture: ComponentFixture<EsmfTableCellLinkComponent>;
  let componentRef: ComponentRef<EsmfTableCellLinkComponent>;
  let windowOpenSpy: jest.SpyInstance;

  const DISABLED_VALUE = '-';
  const VALID_URL = 'https://example.com';
  const ALTERNATIVE_URL = 'https://newsite.com';
  const TOOLTIP_MESSAGE = 'Open link';
  const NO_LINK_MESSAGE = 'No link';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EsmfTableCellLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EsmfTableCellLinkComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  describe('isDisabled computed signal', () => {
    it('should return true only when value is "-"', () => {
      componentRef.setInput('value', DISABLED_VALUE);
      componentRef.setInput('tooltipMessage', NO_LINK_MESSAGE);
      fixture.detectChanges();

      expect(component.isDisabled()).toBe(true);
    });

    it('should return false for any other value', () => {
      const testValues = [VALID_URL, '', 'some-text'];

      testValues.forEach(value => {
        componentRef.setInput('value', value);
        componentRef.setInput('tooltipMessage', TOOLTIP_MESSAGE);
        fixture.detectChanges();

        expect(component.isDisabled()).toBe(false);
      });
    });
  });

  describe('openExternalLink', () => {
    it('should open link in new tab when enabled', () => {
      componentRef.setInput('value', VALID_URL);
      componentRef.setInput('tooltipMessage', TOOLTIP_MESSAGE);
      fixture.detectChanges();

      component.openExternalLink();

      expect(windowOpenSpy).toHaveBeenCalledWith(VALID_URL, '_blank');
    });

    it('should not open link when disabled', () => {
      componentRef.setInput('value', DISABLED_VALUE);
      componentRef.setInput('tooltipMessage', NO_LINK_MESSAGE);
      fixture.detectChanges();

      component.openExternalLink();

      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('UI rendering', () => {
    beforeEach(() => {
      componentRef.setInput('value', VALID_URL);
      componentRef.setInput('tooltipMessage', TOOLTIP_MESSAGE);
      fixture.detectChanges();
    });

    it('should render button with icon', () => {
      const button = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      const icon = fixture.debugElement.query(By.css('mat-icon'));

      expect(button).toBeTruthy();
      expect(button.nativeElement.getAttribute('aria-label')).toBe('link row');
      expect(icon.nativeElement.textContent.trim()).toBe('open_in_new');
    });

    it('should apply disabled class based on isDisabled state', () => {
      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.classList.contains('button-disabled')).toBe(false);

      componentRef.setInput('value', DISABLED_VALUE);
      fixture.detectChanges();

      expect(button.nativeElement.classList.contains('button-disabled')).toBe(true);
    });
  });

  describe('UI interactions', () => {
    it('should open window when button is clicked and enabled', () => {
      componentRef.setInput('value', VALID_URL);
      componentRef.setInput('tooltipMessage', TOOLTIP_MESSAGE);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(windowOpenSpy).toHaveBeenCalledWith(VALID_URL, '_blank');
    });

    it('should not open window when button is clicked and disabled', () => {
      componentRef.setInput('value', DISABLED_VALUE);
      componentRef.setInput('tooltipMessage', NO_LINK_MESSAGE);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('Dynamic input changes', () => {
    it('should update disabled state when value changes', () => {
      componentRef.setInput('value', VALID_URL);
      componentRef.setInput('tooltipMessage', TOOLTIP_MESSAGE);
      fixture.detectChanges();

      expect(component.isDisabled()).toBe(false);

      componentRef.setInput('value', DISABLED_VALUE);
      fixture.detectChanges();

      expect(component.isDisabled()).toBe(true);
    });

    it('should open new URL when value changes', () => {
      componentRef.setInput('value', VALID_URL);
      componentRef.setInput('tooltipMessage', TOOLTIP_MESSAGE);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(windowOpenSpy).toHaveBeenCalledWith(VALID_URL, '_blank');

      componentRef.setInput('value', ALTERNATIVE_URL);
      fixture.detectChanges();

      button.nativeElement.click();

      expect(windowOpenSpy).toHaveBeenCalledWith(ALTERNATIVE_URL, '_blank');
    });
  });
});
