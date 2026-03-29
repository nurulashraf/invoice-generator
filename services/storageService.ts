import { InvoiceData } from '../types';

const STORAGE_KEY = 'invoiceHistory';

export const getStoredInvoices = (): InvoiceData[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    return { invoices, quotaExceeded: false };
  } catch (e) {
    console.error('Failed to save invoice history: storage quota exceeded', e);
    return { invoices, quotaExceeded: true };
  }
};

export const deleteInvoiceFromHistory = (id: string): InvoiceData[] => {
  const invoices = getStoredInvoices().filter(i => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoice history after delete', e);
  }
  return invoices;
};
