import {ChangeDetectionStrategy, Component, inject, input, linkedSignal, Optional, output} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {EsmfLocalStorageService} from '../../services/local-storage.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatDivider} from '@angular/material/divider';
import {MatListOption, MatSelectionList, MatSelectionListChange} from '@angular/material/list';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import {TranslocoDirective} from '@jsverse/transloco';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

/**
 * A base config for ConfigMenuComponent
 */
export interface Config {
  /** Column name **/
  name: string;
  /** Desc of the config **/
  desc: string;
  /** State if the column is selected **/
  selected: boolean;
  /** Color for the highlighted configuration **/
  color: string;
}

type ConfigFormGroup = {
  [K in keyof Config]: FormControl<NonNullable<Config[K]>>;
};

export interface ConfigMenuData {
  keyLocalStorage: string;
  configs: Config[];
}

@Component({
  selector: 'esmf-config-menu',
  templateUrl: './config-menu.component.html',
  styleUrls: ['./config-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDivider, MatSelectionList, CdkDropList, MatListOption, CdkDrag, MatIcon, MatButton, TranslocoDirective, ReactiveFormsModule],
})
export class EsmfConfigMenuComponent {
  private readonly dialogData = inject<ConfigMenuData | null>(MAT_DIALOG_DATA, {optional: true});
  private readonly dialogRef = inject(MatDialogRef<EsmfConfigMenuComponent, Config[]>, {optional: true});
  private readonly storageService = inject(EsmfLocalStorageService);

  keyLocalStorage = input<string>(this.dialogData?.keyLocalStorage ?? '');
  configs = input<Config[]>(this.dialogData?.configs ?? []);
  saveData = output<Config[]>();
  closeMenu = output<void>();

  configsForm = linkedSignal<Config[], FormArray<FormGroup<ConfigFormGroup>>>({
    source: this.configs,
    computation: (newOptions, previous) => {
      previous?.value?.clear();
      const controls = newOptions.map(config => this.createConfigFormGroup(config));
      return new FormArray(controls);
    },
  });

  cancel() {
    this.configsForm().reset();
    return this.dialogRef ? this.dialogRef.close() : this.closeMenu.emit();
  }

  save() {
    const configs: Config[] = this.configsForm().controls.map(group => group.getRawValue());
    this.storageService.setItem(this.keyLocalStorage(), configs);
    this.saveData.emit(configs);
    return this.dialogRef ? this.dialogRef.close(configs) : this.closeMenu.emit();
  }

  onSelectionChange(event: MatSelectionListChange) {
    const index = event.options[0].value as number;
    const isSelected = event.options[0].selected;
    this.configsForm().at(index).controls.selected.setValue(isSelected);
  }

  private createConfigFormGroup(config: Config) {
    return new FormGroup<ConfigFormGroup>({
      name: new FormControl(config.name, {nonNullable: true}),
      desc: new FormControl(config.desc, {nonNullable: true}),
      selected: new FormControl(config.selected, {nonNullable: true}),
      color: new FormControl(config.color, {nonNullable: true}),
    });
  }
}
