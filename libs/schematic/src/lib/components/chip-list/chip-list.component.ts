import {Component, input, output, ViewEncapsulation} from '@angular/core';
import {MatMiniFabButton} from '@angular/material/button';
import {MatChipListbox, MatChipOption, MatChipRemove} from '@angular/material/chips';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoDirective} from '@jsverse/transloco';
import {EsmfHorizontalOverflowDirective} from '../../directives/horizontal-overflow.directive';
import {FilterEnums, FilterType} from '../../models/filter.definition';

@Component({
  selector: 'esmf-chip-list',
  templateUrl: './chip-list.component.html',
  imports: [
    MatIcon,
    MatTooltip,
    MatMiniFabButton,
    MatChipListbox,
    MatChipOption,
    EsmfHorizontalOverflowDirective,
    TranslocoDirective,
    MatChipRemove,
  ],
  styleUrls: ['./chip-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {class: 'esmf-chip-list'},
})
// TODO: add unit tests to the component
export class EsmfChipListComponent {
  activeFilters = input.required<FilterType[]>();
  removeFilter = output<FilterType>();

  triggerRemoveFilter(filter: FilterType): void {
    this.removeFilter.emit(filter);
  }

  chipListValue(filter: FilterType): string {
    if (filter.type === FilterEnums.Search) {
      return `${filter.filterValue}: ${filter.label}`;
    }

    if (filter.type === FilterEnums.Date) {
      return filter.label;
    }

    return `${filter.prop}: ${filter.label}`;
  }
}
