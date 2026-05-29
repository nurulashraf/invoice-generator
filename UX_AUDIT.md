# SmartInvoice — UI/UX & Convenience Audit

Audit date: 29 May 2026. Scope: the three screenshots provided (desktop, light theme) cross-referenced against `App.tsx`, `components/InvoiceEditor.tsx`, and `components/InvoicePreview.tsx`. Severity key: 🔴 Critical · 🟡 Moderate · 🟢 Minor.

---

## Overall impression

A polished, Apple/iOS-inspired two-pane tool: a grouped-list editor on the left, a live A4 preview on the right. The structure is intuitive and the live preview is the standout feature. The biggest opportunities are a few correctness/copy bugs that undermine trust, a couple of real accessibility failures (contrast and color-only signals), and some convenience gaps around repeat use (client reuse, duplicating invoices, sharing).

---

## 1. Design critique (heuristics)

### Usability

| Finding | Severity | Recommendation |
|---|---|---|
| Autosave is completely silent (debounced write to history every 1s). The user has no signal their work is safe, and no manual save. | 🟡 | Add a subtle "Saved" / "Saving…" indicator near the title or Export button. Builds trust in a no-backend app. |
| Footer always prints "NO SIGNATURE IS REQUIRED" even when a digital signature has been added and rendered. Directly contradicts the prominent Signature feature. | 🔴 | Make the footer note conditional — hide it (or change wording) when `data.signature` is present. See code review. |
| Due Date is rendered permanently in **red**. Red reads as error/overdue, but here it is just the default style — and in the sample it equals the issue date. | 🟡 | Reserve red for genuinely overdue/invalid dates; use neutral text otherwise. Default due date to issue date + 7/14/30 days. |
| Currency row uses a `›` chevron (ChevronRight), which signals "drill into a new screen," not "open a dropdown." | 🟢 | Use a down-chevron (▼) to match the native `<select>` behavior. |
| Logo control says **"Edit"** even when no logo exists yet. | 🟢 | Show "Add" when empty, "Edit"/"Replace" when set. |
| Empty line-items state reads "No items. **Tap** to add." — "Tap" is mobile language in a desktop window. | 🟢 | "Click to add an item" (or device-neutral "Add an item"). |
| Header icon buttons (history, theme, language, +) are icon-only with no labels; "+" for "new invoice" is ambiguous beside them. | 🟢 | aria-labels exist (good) — add tooltips/`title` on all, or a small text label on the most ambiguous (New). |

### Visual hierarchy

- **First thing the eye hits**: the "INVOICE" wordmark and the dark logo tile, then the bold **Total RM 2,715.00**. That is the correct priority for an invoice.
- **Reading flow** in the preview (header → Bill To → line table → totals → terms) is clean and conventional.
- **Editor** uses low-contrast uppercase gray section headers — appropriately recessive so input values dominate. Good.
- Brand-blue accents ("Edit", "+", client email) correctly mark the interactive/primary elements.

### Consistency

| Element | Issue | Recommendation |
|---|---|---|
| Tax field label | Renders **"Tax / SST (%) (%)"** — the "(%)" is duplicated (the translation string already ends in "(%)" and the JSX appends another). | Remove the appended `(%)` in `InvoiceEditor` or from the i18n string — keep one. |
| Surface colors | Hardcoded hex (`#1C1C1E`, `#1D1D1F`, `#F5F5F7`, `#000000`) repeated across files instead of theme tokens. | Map to semantic Tailwind tokens (`surface`, `surface-elevated`, `text-primary`). |
| Number formatting | Editor shows plain numbers (`1500`), preview shows currency (`RM 1,500.00`). Acceptable, but the editor rate field gives no thousands separators for large values. | Optional: format-on-blur in the editor for readability. |

### What works well

- Live preview beside the editor — immediate feedback, no "generate" round-trip.
- New-invoice flow **carries over sender details, logo, signature, currency, tax** and only clears the client — a real time-saver.
- Sequential invoice numbering, history sidebar, EN/MS i18n, and dark mode are all solid baseline features.
- Keyboard-reorderable line items (Arrow Up/Down on the grip handle) — thoughtful.

---

## 2. Accessibility review (WCAG 2.1 AA)

The code is **well above average** for accessibility: aria-labels on every icon button, visible focus rings (`focus:ring-brand-500`), focus traps on both modals, `role="dialog"`/`aria-modal`, Escape-to-close, and keyboard line-item reordering. Remaining issues:

| Finding | Guideline | Severity | Fix |
|---|---|---|---|
| Due Date in `text-red-500` (#EF4444) on white ≈ **3.9:1** — below the 4.5:1 minimum for normal text. | 1.4.3 Contrast | 🔴 | Darken to ~`red-600`/`red-700` and only apply when actually overdue. |
| "Overdue/due" is signaled **by color alone** (red text). | 1.4.1 Use of Color | 🟡 | Pair with an icon or "(overdue)" text. |
| Interactive icons (grip handle, remove, chevron) use `text-gray-300` (#D1D5DB) ≈ 1.5:1 against white. | 1.4.11 Non-text Contrast (needs 3:1) | 🟡 | Use `gray-400`/`gray-500` at rest for actionable icons. |
| From/To and line-item fields have **no visible label** — they rely on placeholder text, which disappears once the user types (aria-label is present for screen readers, but sighted users lose the label). | 3.3.2 Labels/Instructions | 🟡 | Add small persistent field labels, or a floating-label pattern. |
| History "delete" button is `opacity-0` until row hover; keyboard focus does not reveal it, and touch has no hover. | 2.1.1 Keyboard / 2.5 | 🟡 | Reveal on `focus-within` as well as hover; keep visible on touch. |
| Exported PDF is rasterized via html2canvas — text is not selectable, searchable, or tagged for screen readers. | PDF/UA (document a11y) | 🟡 | Consider a vector/text PDF path (e.g. jsPDF text or print-to-PDF) for accessible, selectable output. |
| Icon-only action buttons (~28–32px) are below the comfortable 44px target, though above the 24px AA minimum. | 2.5.8 Target Size | 🟢 | Increase hit area with padding, especially the remove/grip controls. |

---

## 3. UX copy review

- 🔴 **"THIS IS A COMPUTER-GENERATED DOCUMENT. NO SIGNATURE IS REQUIRED."** — contradicts the signature block. Make conditional.
- 🟡 **"Tax / SST (%) (%)"** — duplicated suffix.
- 🟢 **"No items. Tap to add."** — desktop app; prefer "Click to add an item."
- 🟢 **Logo "Edit"** when empty → "Add logo."
- 🟢 Native `window.confirm` dialogs for New/Delete are unbranded and abrupt; the strings are translated but the dialog chrome is generic. Consider an in-app confirm matching the glass UI.
- 🟢 "SST ID (Optional)" vs "Reg. / IC No." — fine, but consider a one-line helper explaining that adding an SST number switches the document title to "TAX INVOICE" (currently a hidden behavior).

---

## 4. Convenience / repeat-use synthesis

Ranked by impact on day-to-day use:

1. 🟡 **Client reuse / autofill.** Client name, email, and address are retyped for every invoice. A saved-clients list (or autocomplete from history) would be the single biggest convenience win for a freelancer billing repeat clients.
2. 🟡 **"Duplicate invoice"** action. Today only "New" exists, which wipes the client. Duplicating an existing invoice (keeping client + line items, new number/date) matches how invoicing actually works.
3. 🟡 **Sharing/sending.** Client email is captured but unused — the only output is a downloaded PDF. An "email this invoice" or share action would close the loop.
4. 🟡 **Saved status + trust** (see §1). Silent autosave with no confirmation.
5. 🟢 **Discount line.** Common need; currently only a single global tax rate is supported.
6. 🟢 **Due-date defaulting** to a sensible offset rather than equal to the issue date.

**Strengths to preserve:** carry-over of sender/branding on new invoices, live preview, history, i18n, dark mode, keyboard reorder.

---

## 5. Design system + code review (UX-affecting)

- 🔴 **Footer signature logic** (`InvoicePreview.tsx` ~line 221): `computerGenerated` note renders unconditionally. Gate it on `!data.signature`.
- 🟡 **Due-date color** (`InvoiceEditor.tsx` ~line 196): `text-red-500` is hardcoded on the due-date input regardless of state. Drive color from an "is overdue" check.
- 🟡 **Tax label** (`InvoiceEditor.tsx` ~line 366): `{t('taxSst')} (%)` double-appends the percent sign.
- 🟢 **Number inputs**: `parseFloat(e.target.value) || 0` forces an empty field to snap to `0`, so a user can't clear a field to retype. Allow transient empty/string state.
- 🟢 **Token debt**: hardcoded surface hex repeated across `App.tsx` and `InvoiceEditor.tsx`; `inputClass`/`navBtnClass` are duplicated local constants. Centralize as theme tokens / shared class utilities.
- 🟢 **Preview scale** recomputes only on `window.resize`, not when the history sidebar opens/closes — minor layout staleness edge case.

---

## Priority recommendations

1. **Fix the signature/footer contradiction** (🔴 correctness + trust) — conditional footer note.
2. **Fix the two contrast/color issues** (🔴 a11y) — darken the due-date red and only show it when overdue; bump actionable-icon contrast.
3. **Fix the copy bugs** (quick wins) — "Tax / SST (%) (%)", "Tap to add", logo "Edit/Add".
4. **Add client reuse + Duplicate invoice** (🟡 highest convenience ROI for repeat users).
5. **Add a "Saved" indicator** (🟡 trust in the silent autosave).
