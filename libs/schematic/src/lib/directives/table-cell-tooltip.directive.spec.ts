import {ElementRef} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatTooltip} from '@angular/material/tooltip';
import {EsmfTableCellTooltipDirective} from './table-cell-tooltip.directive';

describe('EsmfTableCellTooltipDirective', () => {
  let directive: EsmfTableCellTooltipDirective;
  let elementRefMock: ElementRef<{offsetParent: {offsetWidth: number}; offsetWidth: number}>;
  let tooltipMock: MatTooltip;

  beforeEach(() => {
    elementRefMock = {
      nativeElement: {
        offsetParent: {offsetWidth: 0},
        offsetWidth: 0,
      },
    } as ElementRef;

    tooltipMock = {
      message: '',
      tooltipClass: '',
    } as MatTooltip;

    TestBed.configureTestingModule({
      providers: [
        EsmfTableCellTooltipDirective,
        {provide: ElementRef, useValue: elementRefMock},
        {provide: MatTooltip, useValue: tooltipMock},
      ],
    });

    directive = TestBed.inject(EsmfTableCellTooltipDirective);
  });

  const setNativeElementDimensions = (cellWidth: number, contentWidth: number) => {
    elementRefMock.nativeElement = {
      offsetParent: {offsetWidth: cellWidth},
      offsetWidth: contentWidth,
    };
  };

  const setDirectiveInputs = (value: string, description?: string) => {
    (directive as any).value = jest.fn(() => value);
    (directive as any).description = jest.fn(() => description);
  };

  it('applies the tooltip class on creation', () => {
    expect(tooltipMock.tooltipClass).toBe('table-cell-tooltip');
  });

  it('uses only the description when the full content fits inside the cell', () => {
    setNativeElementDimensions(200, 100);
    setDirectiveInputs('Row value', 'Full description');

    directive.check();

    expect(tooltipMock.message).toBe('Full description');
  });

  it('shows the value plus description when content is truncated', () => {
    setNativeElementDimensions(100, 80);
    setDirectiveInputs('Row value', 'Full description');

    directive.check();

    expect(tooltipMock.message).toBe('Row value - Full description');
  });

  it('falls back to the value when truncated with no description', () => {
    setNativeElementDimensions(100, 80);
    setDirectiveInputs('Row value');

    directive.check();

    expect(tooltipMock.message).toBe('Row value');
  });
});
