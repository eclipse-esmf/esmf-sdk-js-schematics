import {ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import {EsmfLocalStorageService} from '../../services/storage.service';
import {MAT_DIALOG_DATA, MatDialogClose} from '@angular/material/dialog';
import {MatDivider} from '@angular/material/divider';
import {MatListOption, MatSelectionList} from '@angular/material/list';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import {TranslocoDirective} from '@jsverse/transloco';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

/**
 * A base config for ConfigMenuComponent
 */
export interface ConfigMenuBase {
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
  selector: 'esmf-config-menu',
  templateUrl: './config-menu.component.html',
  styleUrls: ['./config-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDivider,
    MatSelectionList,
    CdkDropList,
    MatListOption,
    CdkDrag,
    MatDialogClose,
    MatIcon,
    MatButton,
    MatIcon,
    TranslocoDirective,
  ],
})
export class EsmfConfigMenuComponent<Config extends ConfigMenuBase> {
  isOpenedFromMatMenu = input(false);
  configChangedEvent = output<Config[]>();

  private readonly storageService: EsmfLocalStorageService = inject(EsmfLocalStorageService);
  private readonly data = inject<{configs: Config[]; keyLocalStorage: string} | null>(MAT_DIALOG_DATA, {optional: true});

  keyLocalStorage = signal(this.data?.keyLocalStorage ?? '');
  closeConfigMenu = signal(false);
  configs = signal<Config[]>(this.data?.configs ?? []);
  configsDefault = signal<Config[]>(JSON.parse(JSON.stringify(this.data?.configs ?? [])));

  closeMenu() {
    this.configs.set(JSON.parse(JSON.stringify(this.configsDefault())));
    this.closeConfigMenu.set(true);
  }

  stopMenuClosing(event: MouseEvent) {
    if (this.isOpenedFromMatMenu()) {
      if (this.closeConfigMenu()) {
        return;
      }
      event.stopPropagation();
    }
  }

  configClick(event: MouseEvent, config: Config) {
    config.selected = !config.selected;
    event.preventDefault();
    event.stopPropagation();
  }

  colorChange(event: Event, config: Config) {
    config.color = (event.target as HTMLInputElement).value;
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Store columns locally and update displayed columns afterward
   */
  storeConfig() {
    this.closeConfigMenu.set(true);
    this.storageService.setItem(this.keyLocalStorage(), this.configs());
    this.configChangedEvent.emit(this.configs());
  }
}
