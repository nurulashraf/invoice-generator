// Per-field character limits, centralized so they're discoverable and tunable
// in one place (used as `maxLength` on the editor inputs). The matching
// per-field line allowances live as `line-clamp-N` classes in InvoicePreview.
export const FIELD_LIMITS = {
  name: 120,          // supplier / client name
  email: 120,
  address: 300,
  idNo: 60,           // business/IC reg. no. and SST no.
  invoiceNumber: 40,
  description: 200,   // a single line item
  notes: 1500,
} as const;
