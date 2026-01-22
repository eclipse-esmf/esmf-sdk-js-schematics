import {Directive, ElementRef, HostListener, inject, input} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';

@Directive({
  selector: '[esmfTableCellTooltip]',
  hostDirectives: [MatTooltip],
})
export class EsmfTableCellTooltipDirective {
  value = input.required<string>();
  description = input<string>();

  private readonly el = inject(ElementRef);
  private readonly matTooltip = inject(MatTooltip);
  // average space taken by the 3 dots that trim the text
  private readonly ellipsisSpace = 56;

  constructor() {
    this.matTooltip.tooltipClass = 'table-cell-tooltip';
  }

  @HostListener('mouseenter')
  check(): void {
    const nativeEl = this.el.nativeElement;
    // offsetParent.offsetWidth is the width of the table cell (td element)
    // offsetWidth width of the span that contains the text inside the table cell
    const isCellContentVisible = nativeEl.offsetParent.offsetWidth - this.ellipsisSpace >= nativeEl.offsetWidth;

    if (isCellContentVisible) {
      this.matTooltip.message = this.description();
    } else {
      this.matTooltip.message = this.description() ? `${this.value()} - ${this.description()}` : this.value();
    }
  }
}
