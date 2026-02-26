# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Production build via Vite
- `npm run preview` — Preview production build locally

No test runner or linter is configured.

## Architecture

Single-page client-side React 19 app with no backend and no routing. All state lives in React `useState` hooks in `App.tsx`.

### Key directories and files

- `components/` — React components (InvoiceEditor, InvoicePreview, SignaturePad, Toast)
- `services/storageService.ts` — localStorage persistence (draft, history, invoice counter)
- `types.ts` — Core data types (`InvoiceData`, `LineItem`)
- `i18n.tsx` — React context-based i18n with English and Malay translations
- `App.tsx` — Root component; owns all top-level state, auto-saves draft to localStorage

### Data flow

1. User edits fields in `InvoiceEditor` → `setInvoice` updates state in `App.tsx`
2. `InvoicePreview` renders the live invoice (also used as the PDF source element)
3. `storageService` handles localStorage read/write for drafts and history

### Styling

Tailwind CSS loaded via CDN in `index.html` with a custom theme config (Apple-inspired design tokens, glassmorphism effects). Dark mode is toggled in state and persisted to localStorage.

### PDF generation

Uses `html2pdf.js` loaded from CDN. Renders the `InvoicePreview` DOM element to A4 PDF with `break-inside-avoid` rules for pagination.

### External libraries loaded from CDN (not in package.json)

- Tailwind CSS (with custom theme config in `index.html`)
- html2pdf.js v0.10.1

## Conventions

- Functional components with TypeScript interfaces for props
- Path alias `@` maps to project root (configured in `vite.config.ts` and `tsconfig.json`)
- Logo and signature images stored as Base64 data URLs in invoice state
- Default invoice data is Malaysia-focused (MYR currency, 6% SST tax rate)
