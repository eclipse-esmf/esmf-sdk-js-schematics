import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, input, linkedSignal, output, ViewEncapsulation} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatDivider, MatListOption, MatSelectionList} from '@angular/material/list';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoDirective, TranslocoPipe} from '@jsverse/transloco';

export interface Column {
  name: string;
  selected: boolean;
}

function makeAllColumnsSelected(columns: string[]): Column[] {
  const columnsSource: string[] = [...columns];

  return columnsSource.map(column => ({name: column, selected: true}));
}

function addDotToTheEnd(prefix: string): string {
  if (prefix === '' || prefix.endsWith('.')) {
    return prefix;
  }

  return `${prefix}.`;
}

@Component({
  selector: 'esmf-column-menu',
  templateUrl: './column-menu.component.html',
  styleUrls: ['./column-menu.component.scss'],
  imports: [MatSelectionList, MatDivider, MatListOption, MatButton, MatIcon, MatTooltip, DragDropModule, TranslocoDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {class: 'esmf-column-menu'}
})
export class EsmfColumnMenuComponent {
  i18nPrefix = input.required<string, string>({transform: addDotToTheEnd});
  defaultColumns = input.required<Column[], string[]>({transform: makeAllColumnsSelected});
  columns = input.required<Column[]>();

  columnsToDisplay = linkedSignal(() => this.columns());

  columnsChangedEvent = output<Column[]>();

  closeColumnMenu = false;

  close(): void {
    this.resetToDefault();
    this.closeColumnMenu = true;
  }

  stopMenuClosing(event: MouseEvent): void {
    if (this.closeColumnMenu) {
      return;
    }
    event.stopPropagation();
  }

  columnClick(event: MouseEvent, column: Column): void {
    this.closeColumnMenu = false;
    column.selected = !column.selected;
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Reset columns to defaults which are all available columns
   */
  resetToDefault(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.columnsToDisplay.set(JSON.parse(JSON.stringify(this.defaultColumns())));
  }

  /**
   * Store columns locally and update displayed columns afterwards
   */
  emitChanges(): void {
    this.closeColumnMenu = true;
    this.columnsChangedEvent.emit(this.columnsToDisplay());
  }

  /**
   * Order of a column is changed
   */
  columnDrop(event: CdkDragDrop<string[]>) {
    const columns = this.columnsToDisplay();
    moveItemInArray(columns, event.previousIndex, event.currentIndex);
    this.columnsToDisplay.set(columns);
  }
}
