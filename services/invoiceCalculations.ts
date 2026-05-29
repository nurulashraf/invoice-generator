import { LineItem, DiscountType } from '../types';

/** Amount for a single line item. Guards against NaN / undefined inputs. */
export const lineItemTotal = (item: Pick<LineItem, 'quantity' | 'rate'>): number =>
  (Number(item.quantity) || 0) * (Number(item.rate) || 0);

/** Sum of all line item amounts (pre-tax, pre-discount). */
export const subtotal = (items: LineItem[]): number =>
  items.reduce((acc, item) => acc + lineItemTotal(item), 0);

/**
 * Discount amount applied to the subtotal. A percent discount scales the
 * subtotal; a fixed discount is capped at the subtotal so the base never goes
 * negative. Defaults to no discount, so existing 2-arg callers are unaffected.
 */
export const discountAmount = (
  items: LineItem[],
  discountType: DiscountType = 'percent',
  discountValue: number = 0,
): number => {
  const sub = subtotal(items);
  const v = Number(discountValue) || 0;
  if (v <= 0) return 0;
  if (discountType === 'fixed') return Math.min(v, sub);
  return sub * (v / 100);
};

/** Subtotal after discount — the base that tax is applied to. */
export const taxableBase = (
  items: LineItem[],
  discountType: DiscountType = 'percent',
  discountValue: number = 0,
): number => Math.max(0, subtotal(items) - discountAmount(items, discountType, discountValue));

/** Tax amount for the given percentage rate, applied after discount. */
export const taxAmount = (
  items: LineItem[],
  taxRate: number,
  discountType: DiscountType = 'percent',
  discountValue: number = 0,
): number => taxableBase(items, discountType, discountValue) * ((Number(taxRate) || 0) / 100);

/** Grand total: (subtotal − discount) + tax. */
export const grandTotal = (
  items: LineItem[],
  taxRate: number,
  discountType: DiscountType = 'percent',
  discountValue: number = 0,
): number =>
  taxableBase(items, discountType, discountValue) +
  taxAmount(items, taxRate, discountType, discountValue);

export const MAX_ITEMS_FIRST_PAGE = 8;
export const MAX_ITEMS_OTHER_PAGE = 15;

/**
 * Split line items across pages for the printed invoice: up to 8 on the first
 * page, then up to 15 on each subsequent page. Always returns at least one
 * (possibly empty) page so the preview renders a blank invoice.
 */
export const paginateItems = (
  items: LineItem[],
  firstPageMax: number = MAX_ITEMS_FIRST_PAGE,
  otherPageMax: number = MAX_ITEMS_OTHER_PAGE,
): LineItem[][] => {
  if (items.length === 0) return [[]];

  const pages: LineItem[][] = [];
  let remaining = [...items];

  pages.push(remaining.slice(0, firstPageMax));
  remaining = remaining.slice(firstPageMax);

  while (remaining.length > 0) {
    pages.push(remaining.slice(0, otherPageMax));
    remaining = remaining.slice(otherPageMax);
  }

  return pages;
};
