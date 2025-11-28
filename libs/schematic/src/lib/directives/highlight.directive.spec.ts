import {Component, DebugElement} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {EsmfHighlightDirective} from './highlight.directive';

@Component({
  template: `
    <div
      id="testEl"
      esmfHighlight
      [highlight]="highlight"
      [highlightSource]="highlightSource"
      [highlightColor]="highlightColor"
      [selected]="selected"
    >
      {{ highlightSource }}
    </div>
  `,
  imports: [EsmfHighlightDirective],
})
class TestHostComponent {
  highlight: string | string[] = '';
  highlightSource = 'ESMF Highlight Test';
  highlightColor = '#ff0';
  selected = false;
}

describe('EsmfHighlightDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let debugEl: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    debugEl = fixture.debugElement.query(By.directive(EsmfHighlightDirective));
    el = debugEl.nativeElement;
  });

  it('should not highlight if selected is false', () => {
    host.highlight = 'ESMF';
    host.selected = false;
    fixture.detectChanges();
    expect(el.innerHTML.includes('<mark')).toBe(false);
    expect(el.innerHTML).toContain(host.highlightSource);
  });

  it('should highlight text when selected is true', () => {
    host.highlight = 'ESMF';
    host.selected = true;
    fixture.detectChanges();
    expect(el.innerHTML).toContain('<mark');
    expect(el.innerHTML).toContain('ESMF');
  });

  it('should highlight multiple words', () => {
    host.highlight = ['ESMF', 'Test'];
    host.selected = true;
    fixture.detectChanges();
    expect(el.innerHTML.match(/<mark/g)?.length).toBe(2);
  });

  it('should use the provided highlight color', () => {
    host.highlight = 'ESMF';
    host.highlightColor = '#00ff00';
    host.selected = true;
    fixture.detectChanges();
    expect(el.innerHTML).toContain('background-color: #00ff00;');
  });

  it('should clear highlights when selected is set to false after being true', () => {
    host.highlight = 'ESMF';
    host.selected = true;
    fixture.detectChanges();
    expect(el.innerHTML).toContain('<mark');
    host.selected = false;
    fixture.detectChanges();
    expect(el.innerHTML).not.toContain('<mark');
  });

  it('should not highlight if highlightSource is empty', () => {
    host.highlightSource = '';
    host.highlight = 'ESMF';
    host.selected = true;
    fixture.detectChanges();
    expect(el.innerHTML).not.toContain('<mark');
  });

  it('should not highlight if highlightColor is not set', () => {
    host.highlightColor = '';
    host.highlight = 'ESMF';
    host.selected = true;
    fixture.detectChanges();
    expect(el.innerHTML.includes('<mark')).toBe(false);
    expect(el.innerHTML).toContain(host.highlightSource);
  });
});
