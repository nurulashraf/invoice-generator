import { describe, it, expect } from 'vitest';
import {
  formatInvoiceNumber,
  computeNextInvoiceNumber,
  hydrateDraft,
  hasMeaningfulContent,
} from './invoiceDraft';
import { createDefaultInvoice, InvoiceData } from '../types';

describe('invoice numbering', () => {
  it('zero-pads the formatted number', () => {
    expect(formatInvoiceNumber(7)).toBe('INV-007');
    expect(formatInvoiceNumber(123)).toBe('INV-123');
  });

  it('starts at 1 when no counter is stored', () => {
    expect(computeNextInvoiceNumber(null)).toEqual({ counter: 1, invoiceNumber: 'INV-001' });
  });

  it('increments the stored counter', () => {
    expect(computeNextInvoiceNumber('5')).toEqual({ counter: 6, invoiceNumber: 'INV-006' });
  });

  it('falls back to 1 on a non-numeric counter', () => {
    expect(computeNextInvoiceNumber('abc')).toEqual({ counter: 1, invoiceNumber: 'INV-001' });
  });
});

describe('hydrateDraft', () => {
  it('returns defaults when there is no draft', () => {
    const result = hydrateDraft(null);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('returns defaults on invalid JSON', () => {
    const defaults = createDefaultInvoice();
    expect(hydrateDraft('{not json', defaults)).toBe(defaults);
  });

  it('returns defaults on a non-object payload', () => {
    const defaults = createDefaultInvoice();
    expect(hydrateDraft('[1,2,3]', defaults)).toBe(defaults);
    expect(hydrateDraft('"a string"', defaults)).toBe(defaults);
  });

  it('merges valid fields over defaults', () => {
    const draft = JSON.stringify({ clientName: 'Acme Corp', currency: 'USD' });
    const result = hydrateDraft(draft);
    expect(result.clientName).toBe('Acme Corp');
    expect(result.currency).toBe('USD');
    expect(result.items.length).toBeGreaterThan(0); // defaults preserved
  });

  it('rejects malformed items and falls back to default items', () => {
    const defaults = createDefaultInvoice();
    const draft = JSON.stringify({ items: [{ id: 'x', description: 'bad' /* missing qty/rate */ }] });
    const result = hydrateDraft(draft, defaults);
    expect(result.items).toEqual(defaults.items);
  });

  it('keeps well-formed items', () => {
    const items = [{ id: 'a', description: 'Work', quantity: 2, rate: 50 }];
    const result = hydrateDraft(JSON.stringify({ items }));
    expect(result.items).toEqual(items);
  });

  it('preserves a valid id', () => {
    const result = hydrateDraft(JSON.stringify({ id: 'fixed-id' }));
    expect(result.id).toBe('fixed-id');
  });

  it('defaults discount fields for a pre-discount draft (back-compat)', () => {
    // A draft saved before the discount feature existed has no discount keys.
    const legacy = JSON.stringify({ clientName: 'Old Co', currency: 'MYR', taxRate: 6 });
    const result = hydrateDraft(legacy);
    expect(result.discountType).toBe('percent');
    expect(result.discountValue).toBe(0);
  });

  it('preserves discount fields when present', () => {
    const draft = JSON.stringify({ discountType: 'fixed', discountValue: 50 });
    const result = hydrateDraft(draft);
    expect(result.discountType).toBe('fixed');
    expect(result.discountValue).toBe(50);
  });
});

describe('hasMeaningfulContent', () => {
  const blank = (): InvoiceData => ({
    ...createDefaultInvoice(),
    clientName: '',
    items: [{ id: '1', description: '', quantity: 1, rate: 0 }],
  });

  it('is false for a blank invoice', () => {
    expect(hasMeaningfulContent(blank())).toBe(false);
  });

  it('is true once a client name is entered', () => {
    expect(hasMeaningfulContent({ ...blank(), clientName: 'Someone' })).toBe(true);
  });

  it('is true once an item has a description or rate', () => {
    expect(hasMeaningfulContent({ ...blank(), items: [{ id: '1', description: 'X', quantity: 1, rate: 0 }] })).toBe(true);
    expect(hasMeaningfulContent({ ...blank(), items: [{ id: '1', description: '', quantity: 1, rate: 100 }] })).toBe(true);
  });
});
