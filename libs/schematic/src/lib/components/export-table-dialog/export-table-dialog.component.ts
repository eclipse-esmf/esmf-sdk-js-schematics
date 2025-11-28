import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {AfterViewInit, ChangeDetectionStrategy, Component, computed, inject, signal, viewChild} from '@angular/core';
import {MatCheckbox} from '@angular/material/checkbox';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

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
  imports: [MatIcon, MatDialogTitle, MatDialogClose, MatDialogContent, MatCheckbox, MatDialogActions, MatButton, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsmfExportTableDialogComponent implements AfterViewInit {
  private readonly translateService = inject(TranslocoService);

  readonly dialogRef = inject<MatDialogRef<EsmfExportTableDialogComponent>>(MatDialogRef);
  readonly data = inject<ExportTableDialogComponentData>(MAT_DIALOG_DATA);

  readonly exportAllPages = viewChild.required<MatCheckbox>('exportAllPages');
  readonly exportAllColumns = viewChild<MatCheckbox>('exportAllColumns');

  readonly Actions = Actions;
  readonly dialogDescription = signal('');
  readonly showAllColumnsBox = computed(() => this.data.displayedColumns === this.data.allColumns);

  ngAfterViewInit() {
    this.setDialogDescription();
  }

  setDialogDescription() {
    const {maxExportRows, allColumns, displayedColumns} = this.data;
    const isExportAllPagesChecked = this.exportAllPages().checked;
    const isExportAllColumnsChecked = this.exportAllColumns()?.checked;

    const translationKey = this.getTranslationKey(isExportAllPagesChecked, isExportAllColumnsChecked, displayedColumns);
    this.dialogDescription.set(this.translateService.translate(translationKey, {maxExportRows, allColumns, displayedColumns}));
  }

  exportData() {
    const exportAllPagesCheckbox = this.exportAllPages();
    const exportAllColumnsCheckbox = this.exportAllColumns();

    this.dialogRef.close({
      action: Actions.Export,
      exportAllPages: exportAllPagesCheckbox.checked,
      exportAllColumns: exportAllColumnsCheckbox?.checked,
    });
  }

  private getTranslationKey(isExportAllPagesChecked: boolean, isExportAllColumnsChecked: boolean, displayedColumns: number): string {
    if (isExportAllPagesChecked && isExportAllColumnsChecked) {
      return 'exportData.description.caseOne';
    }

    if (isExportAllPagesChecked) {
      return displayedColumns > 1 ? 'exportData.description.caseTwo.plural' : 'exportData.description.caseTwo.singular';
    }

    if (!isExportAllColumnsChecked) {
      return displayedColumns > 1 ? 'exportData.description.caseThree.plural' : 'exportData.description.caseThree.singular';
    }

    if (isExportAllColumnsChecked) {
      return 'exportData.description.caseFour';
    }

    return 'exportData.description.default';
  }
}
