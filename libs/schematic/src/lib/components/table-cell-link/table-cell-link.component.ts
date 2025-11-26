/** <%= options.generationDisclaimerText %> **/

import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'esmf-table-cell-link',
  templateUrl: './table-cell-link.component.html',
  styleUrls: ['./table-cell-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule, MatIconModule, MatIconButton],
})
export class TableCellLinkComponent {
  value = input.required<string>();
  tooltipMessage = input.required<string>();

  isDisabled = computed(() => this.value() === '-');

  openExternalLink() {
    if (this.isDisabled()) return;
    window.open(this.value(), '_blank');
  }
}
