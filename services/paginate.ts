// Pure invoice pagination logic — decides which line items land on which A4
// sheet and where the totals/notes/footer "tail" goes, given the measured
// pixel heights of each block. Kept free of React/DOM so it can be unit-tested.

// A4 page geometry in CSS pixels (1cm = 96/2.54 px).
export const CM = 96 / 2.54;
export const PAGE_H_PX = 29.7 * CM;          // full A4 height (~1122.5)
export const PAGE_PADDING = 48;              // sheet padding (px), fixed for measuring
export const USABLE_H = PAGE_H_PX - PAGE_PADDING * 2 - 2; // content height per sheet (small safety margin)
export const TAIL_SAFETY = 12;               // breathing room reserved above the footer

export interface PagePlan {
  isFirst: boolean; // first page gets the full header + Bill To
  start: number;    // first item index on this page
  end: number;      // one past the last item index on this page
  hasTail: boolean; // totals / notes / signature / footer live on this page
}

export interface PaginationMetrics {
  itemCount: number;
  rowHeights: number[];   // measured height of each item row (length === itemCount)
  firstHeaderH: number;   // full header (page 1)
  contHeaderH: number;    // continuation header (page 2+)
  billToH: number;        // Bill To block (page 1 only)
  tableHeadH: number;     // the items table header row
  totalsH: number;        // totals block
  tailExtrasH: number;    // notes + signature block (0 if none)
  footerH: number;        // footer note (0 when signed / hidden)
  usableH?: number;       // overridable usable content height (defaults to USABLE_H)
  tailSafety?: number;    // overridable tail safety margin (defaults to TAIL_SAFETY)
}

/**
 * Pack line items into fixed-height A4 sheets, then place the tail
 * (totals/notes/signature/footer) on the last sheet if it fits, otherwise on a
 * fresh sheet. Always returns at least one page.
 */
export function computePages(m: PaginationMetrics): PagePlan[] {
  const usableH = m.usableH ?? USABLE_H;
  const tailSafety = m.tailSafety ?? TAIL_SAFETY;

  const pages: PagePlan[] = [{ isFirst: true, start: 0, end: 0, hasTail: false }];
  let cur = 0;
  let used = m.firstHeaderH + m.billToH + m.tableHeadH;

  for (let i = 0; i < m.itemCount; i++) {
    const rh = m.rowHeights[i] || 0;
    // Break to a new sheet when this row won't fit — but never create an empty
    // page (the guard keeps an over-tall single row on its own page).
    if (used + rh > usableH && pages[cur].end > pages[cur].start) {
      pages.push({ isFirst: false, start: i, end: i, hasTail: false });
      cur++;
      used = m.contHeaderH + m.tableHeadH;
    }
    pages[cur].end = i + 1;
    used += rh;
  }

  const tailH = m.totalsH + m.tailExtrasH + m.footerH + tailSafety;
  if (usableH - used >= tailH) {
    pages[cur].hasTail = true;
  } else {
    pages.push({ isFirst: false, start: m.itemCount, end: m.itemCount, hasTail: true });
  }

  return pages;
}
