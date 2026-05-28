import { describe, it, expect } from 'vitest';
import {
  lineItemTotal,
  subtotal,
  taxAmount,
  grandTotal,
  paginateItems,
} from './invoiceCalculations';
import { LineItem } from '../types';

const item = (quantity: number, rate: number): LineItem => ({
  id: Math.random().toString(36).slice(2),
  description: '',
  quantity,
  rate,
});

describe('invoice calculations', () => {
  it('computes a single line item total', () => {
    expect(lineItemTotal(item(3, 100))).toBe(300);
  });

  it('treats missing / NaN quantity or rate as zero', () => {
    expect(lineItemTotal({ quantity: NaN, rate: 100 } as unknown as LineItem)).toBe(0);
    expect(lineItemTotal({ quantity: 2 } as unknown as LineItem)).toBe(0);
  });

  it('sums the subtotal across items', () => {
    expect(subtotal([item(1, 5500), item(1, 2400)])).toBe(7900);
  });

  it('returns zero subtotal for an empty list', () => {
    expect(subtotal([])).toBe(0);
  });

  it('computes tax from a percentage rate', () => {
    expect(taxAmount([item(1, 100)], 6)).toBeCloseTo(6);
  });

  it('includes tax in the grand total', () => {
    expect(grandTotal([item(1, 100)], 6)).toBeCloseTo(106);
  });

  it('treats a zero tax rate as subtotal-only', () => {
    expect(grandTotal([item(2, 50)], 0)).toBe(100);
  });
});

describe('pagination', () => {
  const makeItems = (n: number) =>
    Array.from({ length: n }, (_, i) => item(1, i));

  it('always returns at least one page when empty', () => {
    expect(paginateItems([])).toEqual([[]]);
  });

  it('keeps up to 8 items on the first page', () => {
    const pages = paginateItems(makeItems(8));
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(8);
  });

  it('overflows to a second page after 8', () => {
    const pages = paginateItems(makeItems(9));
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(8);
    expect(pages[1]).toHaveLength(1);
  });

  it('puts up to 15 items on subsequent pages', () => {
    const pages = paginateItems(makeItems(8 + 15 + 1));
    expect(pages.map((p) => p.length)).toEqual([8, 15, 1]);
  });

  it('preserves item order and total count', () => {
    const items = makeItems(30);
    const flat = paginateItems(items).flat();
    expect(flat).toHaveLength(30);
    expect(flat.map((i) => i.rate)).toEqual(items.map((i) => i.rate));
  });
});
