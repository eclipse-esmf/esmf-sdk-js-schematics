import {Directive, effect, ElementRef, inject, input, output, Renderer2, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';

@Directive({
  selector: '[esmfResizeColumn]',
})
export class ResizeColumnDirective {
  resizable = input(false, {alias: 'esmfResizeColumn'});
  minWidth = input(50);
  initialWidth = input(200);

  dragging = output<boolean>();

  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);
  private readonly document = inject(DOCUMENT);

  private readonly startX = signal(0);
  private readonly startWidth = signal(0);
  private readonly pressed = signal(false);
  private readonly column: HTMLElement;
  private table!: HTMLElement;
  private handle!: HTMLElement;

  private mouseMoveListener!: () => void;
  private mouseUpListener!: () => void;
  private mouseEnterListener!: () => void;
  private mouseLeaveListener!: () => void;

  constructor() {
    this.column = this.el.nativeElement;

    effect(() => {
      if (this.resizable()) {
        this.setTable();
        this.setListeners();
        this.createHandle();
      }
    });
  }

  createHandle(): void {
    this.handle = this.renderer.createElement('div');
    this.renderer.appendChild(this.column, this.handle);
    this.renderer.addClass(this.handle, 'handle');
  }

  setTable(): void {
    const row = this.renderer.parentNode(this.column);
    const thead = this.renderer.parentNode(row);
    this.table = this.renderer.parentNode(thead);
    this.renderer.setStyle(this.column, 'min-width', `${this.initialWidth()}px`);
  }

  setListeners(): void {
    this.mouseEnterListener = this.renderer.listen(this.column, 'mouseenter', this.onMouseEnter);
    this.mouseLeaveListener = this.renderer.listen(this.column, 'mouseleave', this.onMouseLeave);
  }

  onMouseEnter = (): void => {
    this.renderer.setStyle(this.handle, 'opacity', '1');
    this.renderer.listen(this.handle, 'mousedown', this.onMouseDown);
  };

  onMouseLeave = (): void => {
    this.renderer.setStyle(this.handle, 'opacity', '0');
  };

  onMouseDown = (event: MouseEvent) => {
    this.pressed.set(true);
    this.mouseEnterListener();
    this.mouseLeaveListener();
    this.dragging.emit(true);
    this.startX.set(event.pageX);
    this.startWidth.set(this.column.offsetWidth);
    this.renderer.addClass(this.document.body, 'resizing');
    this.mouseMoveListener = this.renderer.listen(this.table, 'mousemove', this.onMouseMove);
    this.mouseUpListener = this.renderer.listen('document', 'mouseup', this.onMouseUp);
  };

  onMouseMove = (event: MouseEvent): void => {
    if (this.pressed() && event.buttons) {
      // Calculate width of column
      const distance = event.pageX - this.startX();
      const targetWidth = this.startWidth() + distance;
      const width = targetWidth >= this.minWidth() ? targetWidth : this.minWidth();

      // Set column width explicitly (cells are getting resized automatically)
      this.renderer.setStyle(this.column, 'min-width', `${width}px`);
      this.renderer.setStyle(this.column, 'width', `${width}px`);
    }
  };

  onMouseUp = (): void => {
    if (this.pressed()) {
      this.mouseMoveListener();
      this.mouseUpListener();
      this.setListeners();
      this.pressed.set(false);

      // setTimeout is used in order to ensure that the click will only trigger the resize event and not the
      // sorting one as well, since both of the events are triggered on the same cell. This is the only way it
      // worked. If you have another idea, please feel free to change it.
      setTimeout((): void => {
        this.dragging.emit(false);
        this.renderer.removeClass(this.document.body, 'resizing');
        this.renderer.setStyle(this.handle, 'opacity', '0');
      }, 0);
    }
  };
}
