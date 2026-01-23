import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';

export const Actions = {
  Export: 'export',
  Cancel: 'cancel',
};
export type Action = (typeof Actions)[keyof typeof Actions];

export interface ExportTableDialogComponentData {
  extendedCsvExporter: boolean;
  allColumns: number;
  displayedColumns: number;
  maxExportRows: number;
}

@Component({
  selector: 'esmf-export-table-dialog',
  templateUrl: './export-table-dialog.component.html',
  styleUrls: ['./export-table-dialog.component.scss'],
  imports: [MatIcon, MatDialogTitle, MatDialogClose, MatDialogContent, MatCheckbox, MatDialogActions, MatButton, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {class: 'esmf-export-table-dialog'}
})
export class EsmfExportTableDialogComponent implements AfterViewInit {
  readonly dialogRef = inject<MatDialogRef<EsmfExportTableDialogComponent>>(MatDialogRef);
  readonly data = inject<ExportTableDialogComponentData>(MAT_DIALOG_DATA);
  readonly exportAllPages = viewChild.required<MatCheckbox>('exportAllPages');
  readonly exportAllColumns = viewChild<MatCheckbox>('exportAllColumns');
  readonly Actions = Actions;
  readonly dialogDescription = signal('');
  readonly showAllColumnsBox = computed(() => this.data.displayedColumns === this.data.allColumns);
  private readonly translateService = inject(TranslocoService);

  ngAfterViewInit() {
    this.setDialogDescription();
  }

  setDialogDescription() {
    const {maxExportRows, allColumns, displayedColumns} = this.data;
    const isExportAllPagesChecked = this.exportAllPages().checked;
    const isExportAllColumnsChecked = this.exportAllColumns()?.checked || false;

    const translationKey = this.getTranslationKey(isExportAllPagesChecked, isExportAllColumnsChecked, displayedColumns);
    this.dialogDescription.set(this.translateService.translate(translationKey, {maxExportRows, allColumns, displayedColumns}));
  }

  exportData() {
    const exportAllPagesCheckbox = this.exportAllPages();
    const exportAllColumnsCheckbox = this.exportAllColumns();

    this.dialogRef.close({
      action: Actions.Export,
      exportAllPages: exportAllPagesCheckbox.checked,
      exportAllColumns: exportAllColumnsCheckbox?.checked || false,
    });
  }

  private getTranslationKey(isExportAllPagesChecked: boolean, isExportAllColumnsChecked: boolean, displayedColumns: number): string {
    if (isExportAllPagesChecked && isExportAllColumnsChecked) {
      return 'esmf.schematic.exportDialog.description.caseOne';
    }

    if (isExportAllPagesChecked) {
      return displayedColumns > 1
        ? 'esmf.schematic.exportDialog.description.caseTwo.plural'
        : 'esmf.schematic.exportDialog.description.caseTwo.singular';
    }

    if (!isExportAllColumnsChecked) {
      return displayedColumns > 1
        ? 'esmf.schematic.exportDialog.description.caseThree.plural'
        : 'esmf.schematic.exportDialog.description.caseThree.singular';
    }

    if (isExportAllColumnsChecked) {
      return 'esmf.schematic.exportDialog.description.caseFour';
    }

    return 'esmf.schematic.exportDialog.description.default';
  }
}
