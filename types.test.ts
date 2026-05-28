import { describe, it, expect } from 'vitest';
import { createDefaultInvoice } from './types';

describe('createDefaultInvoice', () => {
  it('produces a complete invoice with sensible defaults', () => {
    const inv = createDefaultInvoice();
    expect(inv.currency).toBe('MYR');
    expect(inv.taxRate).toBe(6);
    expect(inv.items.length).toBeGreaterThan(0);
    expect(inv.id).toBeTruthy();
  });

  it('generates a fresh id on each call', () => {
    expect(createDefaultInvoice().id).not.toBe(createDefaultInvoice().id);
  });
});
