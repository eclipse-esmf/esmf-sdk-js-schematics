import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatIcon} from '@angular/material/icon';
import {EsmfTableCellTooltipDirective} from '../../directives/table-cell-tooltip.directive';
import {EsmfHighlightDirective} from '../../directives/highlight.directive';

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

function convertToSafeString(val: unknown) {
  if (val === null || val === undefined || val.toString().trim() === '') {
    return '-';
  }

  return val.toString();
}

@Component({
  selector: 'esmf-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, EsmfTableCellTooltipDirective, EsmfHighlightDirective],
})
export class EsmfTableCellComponent {
  value = input.required<string, unknown>({transform: convertToSafeString});
  description = input<string>();
  highlightString = input<string[]>([]);
  // TODO: Investigate whether it's possible to replace the array of configs with a single config for "highlight" only.
  //   Should be easily achievable after migrating "Extended Table" to "General" components
  configs = input<Config[]>();

  copyToClipboardEvent = output<string>();

  private readonly clipboard = inject(Clipboard);

  highlightConfig = computed(() => {
    return this.configs()?.find((config: Config) => config.name.includes('highlight'));
  });
  color = computed(() => this.highlightConfig()?.color);
  selected = computed(() => this.highlightConfig()?.selected);
  hasValue = computed(() => this.value() !== '-');

  copyToClipboard(value: string, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.clipboard.copy(value);
    this.copyToClipboardEvent.emit(value);
  }
}
