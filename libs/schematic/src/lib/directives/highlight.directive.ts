import {Directive, ElementRef, inject, Input, OnChanges, OnInit, SecurityContext, SimpleChange, SimpleChanges} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatTooltip} from '@angular/material/tooltip';

interface HighlightSimpleChanges extends SimpleChanges {
  highlight: SimpleChange;
  caseSensitive: SimpleChange;
  selected: SimpleChange;
}

interface HighlightRange {
  from: number;
  to: number;
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[highlight]',
})
export class HighlightDirective implements OnChanges, OnInit {
  @Input() highlightSource: string | null = null;
  private regExpFlags = 'gi';
  private _color: string | undefined = undefined;

  @Input() set highlightColor(value: string | undefined) {
    if (value) {
      this._color = value;
    }
  }

  private _highlight: string[] = [];

  @Input() set highlight(value: string | string[]) {
    this._highlight = Array.isArray(value) ? value : [value];
  }

  private _selected = false;

  @Input() set selected(value: boolean | undefined) {
    if (value !== undefined) {
      this._selected = value;
    }
  }

  private get isStringHighlighted(): boolean {
    return !!this.el.nativeElement.querySelector('mark');
  }

  private readonly el = inject(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: HighlightSimpleChanges) {
    if (
      (changes.highlight && !changes.highlight.firstChange) ||
      (changes.caseSensitive && !changes.caseSensitive.firstChange) ||
      (changes.selected && !changes.selected.firstChange)
    ) {
      this.handleHighlightText();
    }
  }

  ngOnInit(): void {
    this.handleHighlightText();
  }

  private handleHighlightText(): void {
    if (this._selected) {
      this.transformText();
    } else if (this.isStringHighlighted) {
      this.clearHighlights();
    }
  }

  private transformText(): void {
    if (this.canHighlightText()) {
      const allRanges = this.calcRangesToReplace();
      const rangesToHighlight = this.mergeRangeIntersections(allRanges);
      const content = this.sanitizer.sanitize(SecurityContext.STYLE, this.replaceHighlights(rangesToHighlight));

      if (content?.length) {
        (this.el.nativeElement as HTMLElement).innerHTML = content;
      }
    }
  }

  private canHighlightText(): boolean {
    return (
      this.el?.nativeElement &&
      this._highlight &&
      typeof this.highlightSource === 'string' &&
      this.highlightSource.length > 0 &&
      !!this._color
    );
  }

  private calcRangesToReplace(): HighlightRange[] {
    return this._highlight
      .map(highlightString => {
        const len = highlightString.length;
        const matches = this.highlightSource?.matchAll(new RegExp(highlightString.toLowerCase(), this.regExpFlags));

        if (!matches) {
          return [];
        }

        return [...matches]
          .filter((a: RegExpMatchArray) => a && a.index !== undefined)
          .map<HighlightRange>(a => ({from: a.index!, to: a.index! + len}));
      })
      .filter(match => match.length > 0)
      .flat()
      .sort((a, b) => a.from - b.from);
  }

  private mergeRangeIntersections(allRanges: HighlightRange[]): HighlightRange[] {
    if (allRanges.length === 0) {
      return [];
    }

    const rangesToHighlight = [allRanges[0]];

    allRanges.forEach(range => {
      const currentRange = rangesToHighlight[rangesToHighlight.length - 1];

      if (range.from <= currentRange.from) {
        currentRange.from = range.from;

        if (range.to > currentRange.to) {
          currentRange.to = range.to;
        }
      } else if (range.from <= currentRange.to && range.to >= currentRange.to) {
        currentRange.to = range.to;
      } else {
        rangesToHighlight.push(range);
      }
    });

    return rangesToHighlight;
  }

  private replaceHighlights(rangesToHighlight: HighlightRange[]): string {
    if (!this.highlightSource || this._highlight.length === 0) {
      if (this._highlight.every(h => !this.highlightSource?.includes(h))) {
        return this.highlightSource || '';
      }
    }

    if (!this.highlightSource) {
      return '';
    }

    if (rangesToHighlight.length === 0) {
      return this.highlightSource;
    }

    let result = '';
    let lastIndex = 0;

    rangesToHighlight.forEach(({from, to}) => {
      result += this.highlightSource?.substring(lastIndex, from);
      result += `<mark style="background-color: ${this._color};">${this.highlightSource?.substring(from, to)}</mark>`;
      lastIndex = to;
    });

    result += this.highlightSource?.substring(lastIndex);
    return result;
  }

  private clearHighlights(): void {
    if(this.highlightSource) {
      (this.el.nativeElement as HTMLElement).innerHTML = this.highlightSource;
    }
  }
}
