import { InvoiceData, SavedClient } from '../types';

// This module is the single owner of all localStorage access in the app.
// Components and other services should go through these functions rather than
// touching localStorage directly.
const HISTORY_KEY = 'invoiceHistory';
const DRAFT_KEY = 'invoiceDraft';
const COUNTER_KEY = 'invoiceCounter';
const THEME_KEY = 'theme';
const LOCALE_KEY = 'locale';
const CLIENTS_KEY = 'savedClients';

export type Theme = 'light' | 'dark';

const hasStorage = (): boolean =>
  typeof window !== 'undefined' && !!window.localStorage;

// ---------------------------------------------------------------------------
// Invoice history
// ---------------------------------------------------------------------------

export const getStoredInvoices = (): InvoiceData[] => {
  if (!hasStorage()) return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load invoice history', e);
    return [];
  }
};

export interface SaveResult {
  invoices: InvoiceData[];
  quotaExceeded: boolean;
}

export const saveInvoiceToHistory = (invoice: InvoiceData): SaveResult => {
  const invoices = getStoredInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);

  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.unshift(invoice);
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(invoices));
    return { invoices, quotaExceeded: false };
  } catch (e) {
    console.error('Failed to save invoice history: storage quota exceeded', e);
    return { invoices, quotaExceeded: true };
  }
};

export const deleteInvoiceFromHistory = (id: string): InvoiceData[] => {
  const invoices = getStoredInvoices().filter(i => i.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoice history after delete', e);
  }
  return invoices;
};

// ---------------------------------------------------------------------------
// Working draft
// ---------------------------------------------------------------------------

/** Raw persisted draft string (validation happens in invoiceDraft.hydrateDraft). */
export const loadDraftRaw = (): string | null =>
  hasStorage() ? localStorage.getItem(DRAFT_KEY) : null;

/** Persist the working draft. Returns false if the write failed (quota). */
export const saveDraft = (invoice: InvoiceData): boolean => {
  if (!hasStorage()) return true;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(invoice));
    return true;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Invoice number counter
// ---------------------------------------------------------------------------

export const getCounterRaw = (): string | null =>
  hasStorage() ? localStorage.getItem(COUNTER_KEY) : null;

export const setCounter = (n: number): void => {
  if (hasStorage()) localStorage.setItem(COUNTER_KEY, String(n));
};

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/** Resolve the persisted theme, falling back to the OS preference, then light. */
export const loadTheme = (): Theme => {
  if (!hasStorage()) return 'light';
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const saveTheme = (theme: Theme): void => {
  if (hasStorage()) localStorage.setItem(THEME_KEY, theme);
};

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------

export const loadLocale = (): string | null =>
  hasStorage() ? localStorage.getItem(LOCALE_KEY) : null;

export const saveLocale = (locale: string): void => {
  if (hasStorage()) localStorage.setItem(LOCALE_KEY, locale);
};

// ---------------------------------------------------------------------------
// Saved clients (for autofill)
// ---------------------------------------------------------------------------

export const getStoredClients = (): SavedClient[] => {
  if (!hasStorage()) return [];
  try {
    const stored = localStorage.getItem(CLIENTS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load saved clients', e);
    return [];
  }
};

/** Upsert a client by id (matched case-insensitively by name elsewhere). */
export const saveClient = (client: SavedClient): SavedClient[] => {
  const clients = getStoredClients();
  const index = clients.findIndex((c) => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.unshift(client);
  }
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Failed to save client', e);
  }
  return clients;
};

export const deleteSavedClient = (id: string): SavedClient[] => {
  const clients = getStoredClients().filter((c) => c.id !== id);
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Failed to delete saved client', e);
  }
  return clients;
};
