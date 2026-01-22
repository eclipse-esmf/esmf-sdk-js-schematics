import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  imports: [RouterModule, TranslocoDirective],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
}
