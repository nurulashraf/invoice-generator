import { describe, it, expect } from 'vitest';
import { computePages } from './paginate';
import type { PaginationMetrics, PagePlan } from './paginate';

// Small, deterministic metrics: 500px usable height, no tail safety margin.
const base = (over: Partial<PaginationMetrics> = {}): PaginationMetrics => ({
  itemCount: 0,
  rowHeights: [],
  firstHeaderH: 100,
  contHeaderH: 50,
  billToH: 0,
  tableHeadH: 0,
  totalsH: 80,
  tailExtrasH: 0,
  footerH: 20,
  usableH: 500,
  tailSafety: 0,
  ...over,
});

const rows = (n: number, h: number) => Array.from({ length: n }, () => h);
const flatten = (pages: PagePlan[]) => {
  const idx: number[] = [];
  for (const p of pages) for (let i = p.start; i < p.end; i++) idx.push(i);
  return idx;
};

describe('computePages', () => {
  it('returns a single page with the tail for an empty invoice', () => {
    const pages = computePages(base({ itemCount: 0, rowHeights: [] }));
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ isFirst: true, start: 0, end: 0, hasTail: true });
  });

  it('keeps everything on one page when items + tail fit', () => {
    // used: header 100 + 3*50 = 250; tail 100; 500-250 = 250 >= 100.
    const pages = computePages(base({ itemCount: 3, rowHeights: rows(3, 50) }));
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ isFirst: true, start: 0, end: 3, hasTail: true });
  });

  it('breaks onto a second sheet when rows overflow', () => {
    // header 100, rows of 100 → 4 rows fill page 1 (used 500); the 5th overflows.
    const pages = computePages(base({ itemCount: 5, rowHeights: rows(5, 100) }));
    expect(pages).toHaveLength(2);
    expect(pages[0]).toMatchObject({ isFirst: true, start: 0, end: 4, hasTail: false });
    expect(pages[1]).toMatchObject({ isFirst: false, start: 4, end: 5, hasTail: true });
  });

  it('covers every item exactly once, in order, across pages', () => {
    const pages = computePages(base({ itemCount: 12, rowHeights: rows(12, 90) }));
    expect(flatten(pages)).toEqual(Array.from({ length: 12 }, (_, i) => i));
  });

  it('pushes the tail to a fresh page when it does not fit after the last row', () => {
    // 4 rows of 100 exactly fill the page (used 500); tail can't fit.
    const pages = computePages(base({ itemCount: 4, rowHeights: rows(4, 100) }));
    expect(pages).toHaveLength(2);
    expect(pages[0]).toMatchObject({ start: 0, end: 4, hasTail: false });
    expect(pages[1]).toMatchObject({ isFirst: false, start: 4, end: 4, hasTail: true });
  });

  it('keeps an over-tall single row on its own page instead of looping forever', () => {
    const pages = computePages(base({ itemCount: 1, rowHeights: [2000] }));
    expect(pages[0]).toMatchObject({ isFirst: true, start: 0, end: 1 });
    expect(flatten(pages)).toEqual([0]);
    expect(pages[pages.length - 1].hasTail).toBe(true);
  });

  it('reserves Bill To space on the first page only', () => {
    // Bill To 300 + header 100 = 400 used on page 1, so only one 80px row fits there.
    const pages = computePages(base({ itemCount: 3, rowHeights: rows(3, 80), billToH: 300 }));
    expect(pages[0]).toMatchObject({ isFirst: true, start: 0, end: 1 });
    expect(pages[1].isFirst).toBe(false);
    expect(flatten(pages)).toEqual([0, 1, 2]);
  });

  it('treats a larger tail (notes + signature) as needing more room', () => {
    // header 100 + 3*100 = 400 used; tail = 80 + 300 + 20 = 400; 500-400 = 100 < 400 → new page.
    const pages = computePages(base({ itemCount: 3, rowHeights: rows(3, 100), tailExtrasH: 300 }));
    expect(pages).toHaveLength(2);
    expect(pages[1]).toMatchObject({ start: 3, end: 3, hasTail: true });
  });
});
