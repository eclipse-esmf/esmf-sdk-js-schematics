import {Component, DebugElement} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ResizeColumnDirective} from './resize-column.directive';

@Component({
  template: `
    <table>
      <thead>
        <tr>
          <th [esmfResizeColumn]="resizable" [minWidth]="minWidth" [initialWidth]="initialWidth" (dragging)="onDragging($event)">
            Column 1
          </th>
          <th>Column 2</th>
        </tr>
      </thead>
    </table>
  `,
  imports: [ResizeColumnDirective],
})
class TestComponent {
  resizable = true;
  minWidth = 50;
  initialWidth = 200;
  isDragging = false;

  onDragging(dragging: boolean): void {
    this.isDragging = dragging;
  }
}

describe('ResizeColumnDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directiveElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    directiveElement = fixture.debugElement.query(By.directive(ResizeColumnDirective));
  });

  afterEach(fakeAsync(() => {
    // Clean up any pending drag operations to prevent warnings
    document.dispatchEvent(new MouseEvent('mouseup'));
    fixture.detectChanges();
    tick();
    fixture.destroy();
  }));

  describe('when resizable is true', () => {
    beforeEach(() => {
      component.resizable = true;
      fixture.detectChanges();
    });

    it('should create handle element', () => {
      const handle = directiveElement.nativeElement.querySelector('.handle');
      expect(handle).toBeTruthy();
    });

    it('should set initial width on column', () => {
      const column = directiveElement.nativeElement;
      expect(column.style.minWidth).toBe('200px');
    });

    it('should show handle on mouse enter', () => {
      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      expect(handle.style.opacity).toBe('1');
    });

    it('should hide handle on mouse leave', () => {
      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(handle.style.opacity).toBe('1');

      column.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();

      expect(handle.style.opacity).toBe('0');
    });

    it('should start resize on handle mousedown', () => {
      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
      });

      handle.dispatchEvent(mouseDownEvent);
      fixture.detectChanges();

      expect(component.isDragging).toBe(true);
      expect(document.body.classList.contains('resizing')).toBe(true);
    });

    it('should resize column on mousemove', fakeAsync(() => {
      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;
      const table = column.closest('table') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      const initialWidth = column.offsetWidth;

      // Start resize
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      Object.defineProperty(mouseDownEvent, 'pageX', {value: 100});
      handle.dispatchEvent(mouseDownEvent);
      fixture.detectChanges();

      // Move mouse
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        buttons: 1,
        view: window,
      });
      Object.defineProperty(mouseMoveEvent, 'pageX', {value: 150});
      table.dispatchEvent(mouseMoveEvent);
      fixture.detectChanges();

      // Column width should change
      const newWidth = parseInt(column.style.width, 10);
      expect(newWidth).toBeGreaterThan(initialWidth);
    }));

    it('should not resize below minimum width', fakeAsync(() => {
      component.minWidth = 100;
      fixture.detectChanges();

      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;
      const table = column.closest('table') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Start resize
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      Object.defineProperty(mouseDownEvent, 'pageX', {value: 200});
      handle.dispatchEvent(mouseDownEvent);
      fixture.detectChanges();

      // Try to resize to less than minimum
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        buttons: 1,
        view: window,
      });
      Object.defineProperty(mouseMoveEvent, 'pageX', {value: 50});
      table.dispatchEvent(mouseMoveEvent);
      fixture.detectChanges();

      // Width should be at minimum
      const width = parseInt(column.style.width, 10);
      expect(width).toBe(100);
    }));

    it('should end resize on mouseup', fakeAsync(() => {
      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Start resize
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      Object.defineProperty(mouseDownEvent, 'pageX', {value: 100});
      handle.dispatchEvent(mouseDownEvent);
      fixture.detectChanges();

      expect(component.isDragging).toBe(true);

      // End resize
      document.dispatchEvent(new MouseEvent('mouseup'));
      fixture.detectChanges();
      tick();

      expect(component.isDragging).toBe(false);
      expect(document.body.classList.contains('resizing')).toBe(false);
      expect(handle.style.opacity).toBe('0');
    }));

    it('should not resize if mousemove without buttons pressed', fakeAsync(() => {
      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;
      const table = column.closest('table') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      const initialWidth = column.offsetWidth;

      // Start resize
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      Object.defineProperty(mouseDownEvent, 'pageX', {value: 100});
      handle.dispatchEvent(mouseDownEvent);
      fixture.detectChanges();

      // Move mouse without buttons pressed
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        buttons: 0,
        view: window,
      });
      Object.defineProperty(mouseMoveEvent, 'pageX', {value: 150});
      table.dispatchEvent(mouseMoveEvent);
      fixture.detectChanges();

      // Width should not change significantly (might have some browser default)
      const currentStyleWidth = column.style.width;
      expect(currentStyleWidth === '' || parseInt(currentStyleWidth, 10) <= initialWidth + 1).toBe(true);
    }));

    it('should not do anything on mouseup if not pressed', () => {
      const handle = directiveElement.nativeElement.querySelector('.handle') as HTMLElement;

      // Call mouseup without starting resize
      document.dispatchEvent(new MouseEvent('mouseup'));
      fixture.detectChanges();

      // Should not affect dragging state
      expect(component.isDragging).toBe(false);
      // Handle opacity might be empty string or '0' if not set
      expect(handle.style.opacity === '' || handle.style.opacity === '0').toBe(true);
    });
  });

  describe('when resizable is false', () => {
    it('should not create handle element', fakeAsync(() => {
      // Create a new fixture with resizable set to false from the start
      const testFixture = TestBed.createComponent(TestComponent);
      const testComponent = testFixture.componentInstance;
      testComponent.resizable = false;
      testFixture.detectChanges();

      const testDirectiveElement = testFixture.debugElement.query(By.directive(ResizeColumnDirective));
      const handle = testDirectiveElement.nativeElement.querySelector('.handle');
      expect(handle).toBeFalsy();

      tick();
      testFixture.destroy();
    }));

    it('should not set up event listeners', fakeAsync(() => {
      // Create a new fixture with resizable set to false from the start
      const testFixture = TestBed.createComponent(TestComponent);
      const testComponent = testFixture.componentInstance;
      testComponent.resizable = false;
      testFixture.detectChanges();

      const testDirectiveElement = testFixture.debugElement.query(By.directive(ResizeColumnDirective));
      const column = testDirectiveElement.nativeElement;

      // Mouse enter should not create handle
      column.dispatchEvent(new MouseEvent('mouseenter'));
      testFixture.detectChanges();

      const handle = column.querySelector('.handle');
      expect(handle).toBeFalsy();

      tick();
      testFixture.destroy();
    }));
  });

  describe('custom configuration', () => {
    it('should use custom minWidth', fakeAsync(() => {
      component.minWidth = 150;
      component.resizable = true;
      fixture.detectChanges();

      const column = directiveElement.nativeElement;
      const handle = column.querySelector('.handle') as HTMLElement;
      const table = column.closest('table') as HTMLElement;

      column.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Start resize
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      Object.defineProperty(mouseDownEvent, 'pageX', {value: 200});
      handle.dispatchEvent(mouseDownEvent);
      fixture.detectChanges();

      // Try to resize below custom minimum
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        buttons: 1,
        view: window,
      });
      Object.defineProperty(mouseMoveEvent, 'pageX', {value: 50});
      table.dispatchEvent(mouseMoveEvent);
      fixture.detectChanges();

      const width = parseInt(column.style.width, 10);
      expect(width).toBe(150);
    }));

    it('should use custom initialWidth', fakeAsync(() => {
      // Create a new fixture with custom initialWidth from the start
      const testFixture = TestBed.createComponent(TestComponent);
      const testComponent = testFixture.componentInstance;
      testComponent.initialWidth = 300;
      testComponent.resizable = true;
      testFixture.detectChanges();

      const testDirectiveElement = testFixture.debugElement.query(By.directive(ResizeColumnDirective));
      const column = testDirectiveElement.nativeElement;
      expect(column.style.minWidth).toBe('300px');

      tick();
      testFixture.destroy();
    }));
  });
});
