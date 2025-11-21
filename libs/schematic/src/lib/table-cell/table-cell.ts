import {Component, computed, inject, input, output} from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatIcon} from '@angular/material/icon';
import {TableCellTooltipDirective} from '../directives/table-cell-tooltip.directive';
import {HighlightDirective} from '../directives/highlight.directive';

interface Config {
  /** Column name **/
  name: string;
  /** Desc of the config **/
  desc: string;
  /** State if the column is selected **/
  selected: boolean;
  /** Color for the highlighted configuration **/
  color?: string;
}

@Component({
  selector: 'esmf-table-cell',
  templateUrl: './table-cell.html',
  styleUrl: './table-cell.scss',
  imports: [MatIcon, TableCellTooltipDirective, HighlightDirective],
})
export class TableCell {
  value = input.required<string, unknown>({transform: convertToSafeString});
  description = input<string>();
  highlightString = input<string[]>([]);
  configs = input<Config[]>(); //TODO is it possible to replace array of configs with a single config for highlight only?

  copyToClipboardEvent = output<string>();

  highlightConfig = computed(() => {
    return this.configs()?.find((config: Config) => config.name.includes('highlight'));
  });

  color = computed(() => {
    return this.highlightConfig()?.color;
  });

  selected = computed(() => {
    return this.highlightConfig()?.selected;
  });

  hasValue = computed(() => this.value() !== '-');

  private readonly clipboard = inject(Clipboard);

  copyToClipboard(value: any, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.clipboard.copy(value);
    this.copyToClipboardEvent.emit(value);
  }
}

function convertToSafeString(val: unknown) {
  if (val === null || val === undefined || val.toString().trim() === '') {
    return '-';
  }

  return val.toString();
}
