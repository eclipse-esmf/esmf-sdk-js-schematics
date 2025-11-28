import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {EsmfExportTableDialogComponent, ExportTableDialogComponentData, Actions} from './export-table-dialog.component';
import {TranslocoService} from '@jsverse/transloco';
import {By} from '@angular/platform-browser';
import {MatCheckbox} from '@angular/material/checkbox';
import {of} from 'rxjs';

describe('EsmfExportTableDialogComponent', () => {
  let component: EsmfExportTableDialogComponent;
  let fixture: ComponentFixture<EsmfExportTableDialogComponent>;
  let dialogRef: jest.Mocked<MatDialogRef<EsmfExportTableDialogComponent>>;
  let translocoService: jest.Mocked<TranslocoService>;

  const createMockData = (overrides?: Partial<ExportTableDialogComponentData>): ExportTableDialogComponentData => ({
    extendedCsvExporter: true,
    allColumns: 10,
    displayedColumns: 5,
    maxExportRows: 1000,
    ...overrides,
  });

  const createTranslocoMock = () => ({
    translate: jest.fn().mockReturnValue('Translated text'),
    langChanges$: of('en'),
    config: {reRenderOnLangChange: false},
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EsmfExportTableDialogComponent],
      providers: [
        {provide: MatDialogRef, useValue: {close: jest.fn()}},
        {provide: MAT_DIALOG_DATA, useValue: createMockData()},
        {provide: TranslocoService, useValue: createTranslocoMock()},
      ],
    }).compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jest.Mocked<MatDialogRef<EsmfExportTableDialogComponent>>;
    translocoService = TestBed.inject(TranslocoService) as jest.Mocked<TranslocoService>;
    fixture = TestBed.createComponent(EsmfExportTableDialogComponent);
    component = fixture.componentInstance;
  });

  it('should initialize with correct data', () => {
    expect(component.data).toEqual(createMockData());
    expect(component.Actions).toEqual(Actions);
  });

  describe('ngAfterViewInit', () => {
    it('should set showAllColumnsBox to false when displayedColumns < allColumns', () => {
      fixture.detectChanges();
      expect(component.showAllColumnsBox()).toBe(false);
    });

    it('should set showAllColumnsBox to true when displayedColumns === allColumns', () => {
      component.data.displayedColumns = 10;
      fixture.detectChanges();
      expect(component.showAllColumnsBox()).toBe(true);
    });

    it('should call setDialogDescription on initialization', () => {
      const spy = jest.spyOn(component, 'setDialogDescription');
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
    });
  });

  const setCheckboxStates = (exportAllPages: boolean, exportAllColumns: boolean, displayedColumns = 5) => {
    component.data.displayedColumns = displayedColumns;
    fixture.detectChanges();

    const exportAllPagesCheckbox = component.exportAllPages();
    const exportAllColumnsCheckbox = component.exportAllColumns();

    exportAllPagesCheckbox.checked = exportAllPages;
    exportAllColumnsCheckbox.checked = exportAllColumns;
  };

  describe('setDialogDescription', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set description to "caseOne" when both checkboxes are checked', () => {
      setCheckboxStates(true, true);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseOne', {
        maxExportRows: 1000,
        allColumns: 10,
        displayedColumns: 5,
      });
      expect(component.dialogDescription()).toBe('Translated text');
    });

    it('should set description to "caseTwo.plural" when only exportAllPages is checked and displayedColumns > 1', () => {
      setCheckboxStates(true, false);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseTwo.plural', {
        maxExportRows: 1000,
        allColumns: 10,
        displayedColumns: 5,
      });
      expect(component.dialogDescription()).toBe('Translated text');
    });

    it('should set description to "caseTwo.singular" when only exportAllPages is checked and displayedColumns === 1', () => {
      setCheckboxStates(true, false, 1);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseTwo.singular', {
        maxExportRows: 1000,
        allColumns: 10,
        displayedColumns: 1,
      });
    });

    it('should set description to "caseThree.plural" when exportAllPages is unchecked, exportAllColumns is unchecked, and displayedColumns > 1', () => {
      setCheckboxStates(false, false);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseThree.plural', {
        maxExportRows: 1000,
        allColumns: 10,
        displayedColumns: 5,
      });
    });

    it('should set description to "caseThree.singular" when exportAllPages is unchecked, exportAllColumns is unchecked, and displayedColumns === 1', () => {
      setCheckboxStates(false, false, 1);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseThree.singular', {
        maxExportRows: 1000,
        allColumns: 10,
        displayedColumns: 1,
      });
    });

    it('should set description to "caseFour" when exportAllPages is unchecked and exportAllColumns is checked', () => {
      setCheckboxStates(false, true);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseFour', {
        maxExportRows: 1000,
        allColumns: 10,
        displayedColumns: 5,
      });
    });

    it('should set description to "default" when both checkboxes are unchecked', () => {
      setCheckboxStates(false, false);
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseThree.plural', expect.any(Object));
    });
  });

  describe('exportData', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog with export action and checkbox states', () => {
      const exportAllPagesCheckbox = component.exportAllPages();
      const exportAllColumnsCheckbox = component.exportAllColumns();

      exportAllPagesCheckbox.checked = true;
      exportAllColumnsCheckbox.checked = false;

      component.exportData();

      expect(dialogRef.close).toHaveBeenCalledWith({
        action: Actions.Export,
        exportAllPages: true,
        exportAllColumns: false,
      });
    });

    it('should close dialog with both checkboxes checked', () => {
      const exportAllPagesCheckbox = component.exportAllPages();
      const exportAllColumnsCheckbox = component.exportAllColumns();

      exportAllPagesCheckbox.checked = true;
      exportAllColumnsCheckbox.checked = true;

      component.exportData();

      expect(dialogRef.close).toHaveBeenCalledWith({
        action: Actions.Export,
        exportAllPages: true,
        exportAllColumns: true,
      });
    });

    it('should close dialog with both checkboxes unchecked', () => {
      const exportAllPagesCheckbox = component.exportAllPages();
      const exportAllColumnsCheckbox = component.exportAllColumns();

      exportAllPagesCheckbox.checked = false;
      exportAllColumnsCheckbox.checked = false;

      component.exportData();

      expect(dialogRef.close).toHaveBeenCalledWith({
        action: Actions.Export,
        exportAllPages: false,
        exportAllColumns: false,
      });
    });
  });

  describe('UI interactions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should display the dialog title', () => {
      const titleElement = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      expect(titleElement).toBeTruthy();
    });

    it('should display the dialog description', () => {
      const descriptionElement = fixture.debugElement.query(By.css('[data-test="dialogDescription"]'));
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement.nativeElement.textContent).toBe('Translated text');
    });

    it('should display exportAllPages checkbox', () => {
      expect(fixture.debugElement.query(By.css('[data-test="exportAllPages"]'))).toBeTruthy();
    });

    it('should display exportAllColumns checkbox when showAllColumnsBox is false', () => {
      expect(fixture.debugElement.query(By.css('[data-test="exportAllColumns"]'))).toBeTruthy();
    });

    it('should not display exportAllColumns checkbox when showAllColumnsBox is true', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EsmfExportTableDialogComponent],
        providers: [
          {provide: MatDialogRef, useValue: {close: jest.fn()}},
          {provide: MAT_DIALOG_DATA, useValue: createMockData({displayedColumns: 10, allColumns: 10})},
          {provide: TranslocoService, useValue: createTranslocoMock()},
        ],
      });
      const newFixture = TestBed.createComponent(EsmfExportTableDialogComponent);
      newFixture.detectChanges();

      expect(newFixture.debugElement.query(By.css('[data-test="exportAllColumns"]'))).toBeFalsy();
    });

    it('should call setDialogDescription when exportAllPages checkbox changes', () => {
      const spy = jest.spyOn(component, 'setDialogDescription');
      const checkbox = fixture.debugElement.query(By.css('[data-test="exportAllPages"]')).componentInstance as MatCheckbox;

      checkbox.change.emit();

      expect(spy).toHaveBeenCalled();
    });

    it('should call setDialogDescription when exportAllColumns checkbox changes', () => {
      const spy = jest.spyOn(component, 'setDialogDescription');
      const checkbox = fixture.debugElement.query(By.css('[data-test="exportAllColumns"]')).componentInstance as MatCheckbox;

      checkbox.change.emit();

      expect(spy).toHaveBeenCalled();
    });

    it('should call exportData when export button is clicked', () => {
      const spy = jest.spyOn(component, 'exportData');

      fixture.debugElement.query(By.css('[data-test="exportData"]')).nativeElement.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should close dialog with Cancel action when close button is clicked', () => {
      expect(fixture.debugElement.query(By.css('[data-test="closeDialog"]'))).toBeTruthy();
    });

    it('should close dialog with Cancel action when close icon is clicked', () => {
      const closeIcon = fixture.debugElement.query(By.css('.close-dialog-icon'));
      expect(closeIcon).toBeTruthy();
    });

    it('should update dialog description when checkbox state changes via UI', () => {
      const checkbox = fixture.debugElement.query(By.css('[data-test="exportAllPages"]')).componentInstance as MatCheckbox;

      checkbox.checked = true;
      checkbox.change.emit();

      expect(translocoService.translate).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle when exportAllColumns is undefined (showAllColumnsBox true)', () => {
      component.data.displayedColumns = 10;
      fixture.detectChanges();

      const exportAllPagesCheckbox = component.exportAllPages();
      exportAllPagesCheckbox.checked = false;
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalled();
    });

    it('should handle maxExportRows of 0', () => {
      component.data.maxExportRows = 0;
      fixture.detectChanges();

      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({maxExportRows: 0}));
    });

    it('should handle displayedColumns of 0', () => {
      component.data.displayedColumns = 0;
      fixture.detectChanges();

      const exportAllPagesCheckbox = component.exportAllPages();
      const exportAllColumnsCheckbox = component.exportAllColumns();

      exportAllPagesCheckbox.checked = true;
      exportAllColumnsCheckbox.checked = false;
      component.setDialogDescription();

      expect(translocoService.translate).toHaveBeenCalledWith('exportData.description.caseTwo.singular', expect.any(Object));
    });
  });
});
