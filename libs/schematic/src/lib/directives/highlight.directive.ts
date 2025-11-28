import {Directive, ElementRef, SecurityContext, inject, input, effect, computed} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

interface HighlightRange {
  from: number;
  to: number;
}

@Directive({
  selector: '[esmfHighlight]',
})
export class EsmfHighlightDirective {
  highlightSource = input<string | null>();
  highlightColor = input<string>();
  highlight = input<string | string[]>();
  selected = input<boolean>();

  private readonly el = inject(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly regExpFlags = 'gi';

  private readonly highlightArray = computed(() => {
    const value = this.highlight();
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }
    return typeof value === 'string' ? [value] : [];
  });

  private get isStringHighlighted(): boolean {
    return !!this.el.nativeElement.querySelector('mark');
  }

  constructor() {
    effect(() => {
      this.handleHighlightText();
    });
  }

  private handleHighlightText(): void {
    if (this.selected()) {
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
    const source = this.highlightSource();
    return (
      this.el?.nativeElement &&
      this.highlightArray().length > 0 &&
      typeof source === 'string' &&
      source.length > 0 &&
      !!this.highlightColor()
    );
  }

  private calcRangesToReplace(): HighlightRange[] {
    return this.highlightArray()
      .map(highlightString => {
        const len = highlightString.length;
        const matches = this.highlightSource()?.matchAll(new RegExp(highlightString.toLowerCase(), this.regExpFlags));

        if (!matches) return [];

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
    const highlightSource = this.highlightSource();

    if (!highlightSource) return '';
    if (rangesToHighlight.length === 0) return highlightSource;

    let result = '';
    let lastIndex = 0;

    rangesToHighlight.forEach(({from, to}) => {
      result += highlightSource?.substring(lastIndex, from);
      result += `<mark style="background-color: ${this.highlightColor()};">${highlightSource?.substring(from, to)}</mark>`;
      lastIndex = to;
    });

    result += highlightSource?.substring(lastIndex);
    return result;
  }

  private clearHighlights(): void {
    (this.el.nativeElement as HTMLElement).innerHTML = this.highlightSource() || '';
  }
}
