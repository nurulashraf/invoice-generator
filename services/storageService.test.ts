import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredInvoices,
  saveInvoiceToHistory,
  deleteInvoiceFromHistory,
  loadDraftRaw,
  saveDraft,
  getCounterRaw,
  setCounter,
  loadTheme,
  saveTheme,
  loadLocale,
  saveLocale,
} from './storageService';
import { createDefaultInvoice } from '../types';

beforeEach(() => {
  localStorage.clear();
});

describe('storageService', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getStoredInvoices()).toEqual([]);
  });

  it('saves a new invoice to history', () => {
    const inv = createDefaultInvoice();
    const { invoices, quotaExceeded } = saveInvoiceToHistory(inv);
    expect(quotaExceeded).toBe(false);
    expect(invoices).toHaveLength(1);
    expect(getStoredInvoices()[0].id).toBe(inv.id);
  });

  it('updates an existing invoice in place rather than duplicating', () => {
    const inv = createDefaultInvoice();
    saveInvoiceToHistory(inv);
    saveInvoiceToHistory({ ...inv, clientName: 'Updated Client' });
    const stored = getStoredInvoices();
    expect(stored).toHaveLength(1);
    expect(stored[0].clientName).toBe('Updated Client');
  });

  it('prepends newer invoices first', () => {
    const a = createDefaultInvoice();
    const b = createDefaultInvoice();
    saveInvoiceToHistory(a);
    saveInvoiceToHistory(b);
    expect(getStoredInvoices()[0].id).toBe(b.id);
  });

  it('deletes an invoice by id', () => {
    const inv = createDefaultInvoice();
    saveInvoiceToHistory(inv);
    expect(deleteInvoiceFromHistory(inv.id)).toEqual([]);
    expect(getStoredInvoices()).toEqual([]);
  });

  it('recovers gracefully from corrupt JSON in storage', () => {
    localStorage.setItem('invoiceHistory', '{not valid json');
    expect(getStoredInvoices()).toEqual([]);
  });
});

describe('draft persistence', () => {
  it('round-trips a draft', () => {
    const inv = createDefaultInvoice();
    expect(saveDraft(inv)).toBe(true);
    expect(JSON.parse(loadDraftRaw() as string).id).toBe(inv.id);
  });

  it('returns null when no draft is stored', () => {
    expect(loadDraftRaw()).toBeNull();
  });
});

describe('invoice counter', () => {
  it('returns null before any number is allocated', () => {
    expect(getCounterRaw()).toBeNull();
  });

  it('persists the counter as a string', () => {
    setCounter(7);
    expect(getCounterRaw()).toBe('7');
  });
});

describe('theme + locale', () => {
  it('defaults the theme to light when nothing is stored', () => {
    expect(loadTheme()).toBe('light');
  });

  it('round-trips the theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });

  it('round-trips the locale', () => {
    expect(loadLocale()).toBeNull();
    saveLocale('ms');
    expect(loadLocale()).toBe('ms');
  });
});
