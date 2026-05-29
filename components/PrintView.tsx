import React from 'react';
import { InvoicePreview } from './InvoicePreview';
import { hydrateDraft } from '../services/invoiceDraft';
import { loadDraftRaw } from '../services/storageService';

// Standalone, dashboard-free view rendered in a hidden window purely for PDF
// export. It shows only the invoice in normal document flow — no sticky column,
// scroll container, scale transform or responsive grid — so Electron's
// printToPDF captures the full invoice cleanly across A4 pages. The invoice
// data is read from the persisted draft (the main window auto-saves it), which
// the hidden window shares via same-origin localStorage.
export const PrintView: React.FC = () => {
  const data = hydrateDraft(loadDraftRaw());
  return (
    <div className="bg-white">
      <InvoicePreview data={data} exporting />
    </div>
  );
};
