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

export const saveInvoiceToHistory = (invoice: InvoiceData) => {
  const invoices = getStoredInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);
  
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.unshift(invoice); // Add to top
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoice history: storage quota exceeded', e);
  }
  return invoices;
};

export const deleteInvoiceFromHistory = (id: string) => {
  const invoices = getStoredInvoices().filter(i => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoice history after delete', e);
  }
  return invoices;
};