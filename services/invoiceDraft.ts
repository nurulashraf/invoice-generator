import { InvoiceData, LineItem, createDefaultInvoice } from '../types';

/** Format a counter as a zero-padded invoice number, e.g. 7 => "INV-007". */
export const formatInvoiceNumber = (n: number): string =>
  `INV-${String(n).padStart(3, '0')}`;

/**
 * Given the stored counter string, compute the next counter value and its
 * formatted invoice number. Pure — does not touch storage, so it is safe to
 * call from a render/initializer without side effects.
 */
export const computeNextInvoiceNumber = (
  rawCounter: string | null,
): { counter: number; invoiceNumber: string } => {
  let next = 1;
  if (rawCounter) {
    const parsed = parseInt(rawCounter, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }
  return { counter: next, invoiceNumber: formatInvoiceNumber(next) };
};

const isValidLineItem = (x: unknown): x is LineItem => {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.id === 'string' &&
    typeof i.description === 'string' &&
    typeof i.quantity === 'number' &&
    typeof i.rate === 'number'
  );
};

/**
 * Parse and validate a persisted draft, merging valid fields over fresh
 * defaults. Any parse error or shape mismatch falls back to defaults rather
 * than propagating corrupt state into the app (which previously could crash
 * the preview on a malformed or outdated draft).
 */
export const hydrateDraft = (
  raw: string | null,
  defaults: InvoiceData = createDefaultInvoice(),
): InvoiceData => {
  if (!raw) return defaults;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaults;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return defaults;
  }

  const p = parsed as Partial<InvoiceData>;
  const items =
    Array.isArray(p.items) && p.items.length > 0 && p.items.every(isValidLineItem)
      ? (p.items as LineItem[])
      : defaults.items;

  return {
    ...defaults,
    ...p,
    items,
    id: typeof p.id === 'string' && p.id ? p.id : defaults.id,
  };
};

/**
 * Whether a draft has enough content to be worth persisting to history.
 * Prevents blank/just-created invoices from flooding the history list.
 */
export const hasMeaningfulContent = (inv: InvoiceData): boolean => {
  if (inv.clientName.trim().length > 0) return true;
  return inv.items.some(
    (i) => i.description.trim().length > 0 || i.rate > 0,
  );
};
