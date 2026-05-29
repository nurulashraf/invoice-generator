# SmartInvoice — Remediation Plan

A phased plan to close every remaining issue from `UX_AUDIT.md`. The five quick wins (footer logic, tax label, due-date color, empty-state copy, logo copy) are already shipped and are excluded here.

Phases are ordered by a mix of risk, user value, and dependency. Phases 1–2 are low-risk, presentation-only changes. Phase 3 introduces data-model changes and should land together. Phases 4–5 are larger and can be scheduled independently.

Effort key: **S** ≤ half day · **M** ~1–2 days · **L** ~3+ days. Severity carries over from the audit.

---

## Phase 1 — Finish WCAG 2.1 AA compliance

**Goal:** bring the app to clean AA. Mostly markup/CSS plus one shared component. No data-model impact.

| # | Issue | Sev | Files | Approach | Acceptance criteria |
|---|---|---|---|---|---|
| 1.1 | Overdue is signaled by color alone | 🟡 | `InvoiceEditor.tsx` (due-date row), `i18n.tsx` | Pair the existing `isOverdue` red with a non-color cue: a small warning icon and a visually-hidden "(overdue)" string, plus `aria-describedby` on the input. | Overdue state is perceivable without color; SR announces "overdue"; passes 1.4.1. |
| 1.2 | Interactive icons at `text-gray-300` (~1.5:1) | 🟡 | `InvoiceEditor.tsx` (grip, remove, currency chevron), `App.tsx` (history delete) | Raise resting state to `gray-400`/`gray-500`; keep hover/focus states. Audit every actionable icon, not just these. | All actionable icons ≥ 3:1 against their background (1.4.11). |
| 1.3 | Fields rely on placeholder-as-label (label vanishes on input) | 🟡 | `InvoiceEditor.tsx` (From/To block, line items), `index.css` | Introduce a floating-label pattern or small persistent labels above inputs. Keep existing `aria-label`s. Prefer a reusable `<Field label …>` wrapper to avoid repetition. | Every input has a persistent visible label; passes 3.3.2; no regression in the iOS-grouped look. |
| 1.4 | History delete button is `opacity-0` until hover (no keyboard/touch reveal) | 🟡 | `App.tsx` (history item) | Reveal on `group-focus-within` in addition to `group-hover`; on touch/coarse pointers keep it always visible (`@media (pointer: coarse)`). | Delete reachable and visible via keyboard Tab and on touch devices. |
| 1.5 | Icon hit targets ~28–32px | 🟢 | `InvoiceEditor.tsx`, `App.tsx` | Increase padding so the interactive box is ≥ 44×44 where layout allows; minimum 24px (2.5.8). | Primary icon actions ≥ 44px target; none below 24px. |

**Verification (Phase 1):** manual keyboard pass (Tab through editor, modals, history); contrast spot-checks with a contrast tool on the changed colors in both light and dark themes; `npx tsc --noEmit`.

**Effort:** M. **Risk:** low — `1.3` is the only one that touches layout meaningfully; build the `<Field>` wrapper first and migrate inputs incrementally.

---

## Phase 2 — Trust & micro-UX polish

**Goal:** close the small friction items that erode confidence. All low-risk.

| # | Issue | Sev | Files | Approach | Acceptance criteria |
|---|---|---|---|---|---|
| 2.1 | Silent autosave — no save signal | 🟡 | `App.tsx`, `i18n.tsx` | Add a lightweight "Saving… / Saved HH:MM" indicator near the title or Export button, driven off the existing debounced save effect. | User sees state change on every edit; "Saved" within ~1s of stopping. |
| 2.2 | Currency `›` chevron implies navigation, not a dropdown | 🟢 | `InvoiceEditor.tsx` | Swap `ChevronRight` for a down chevron to match the native `<select>`. | Affordance reads as a dropdown. |
| 2.3 | Header icon buttons lack tooltips | 🟢 | `App.tsx` | Add `title` to each nav button (aria-labels already present). | Hover reveals a label on all header actions. |
| 2.4 | Native `window.confirm` for New/Delete is unbranded/abrupt | 🟢 | `App.tsx`, new `components/ConfirmDialog.tsx` | Replace with an in-app confirm dialog reusing the existing `useFocusTrap` + glass styling. | New/Delete use the in-app dialog; focus-trapped; Escape cancels. |
| 2.5 | "SST number switches title to TAX INVOICE" is hidden behavior | 🟢 | `InvoiceEditor.tsx`, `i18n.tsx` | Add one line of helper text under the SST field. | Behavior discoverable without trial-and-error. |
| 2.6 | Clearing a number field snaps to `0` (`parseFloat \|\| 0`) | 🟢 | `InvoiceEditor.tsx` | Allow a transient empty string in state; coerce to number on blur. | User can clear and retype qty/rate/tax without fighting a `0`. |

**Verification (Phase 2):** manual run of New/Delete/confirm flows; edit-and-watch the save indicator; `tsc`.

**Effort:** S–M. **Risk:** low. `2.4` (ConfirmDialog) is reusable later for other confirmations.

---

## Phase 3 — Data model & repeat-use convenience

**Goal:** the highest-ROI features for someone billing regularly. These share the data layer (`types.ts`, `storageService.ts`, `invoiceCalculations.ts`), so land them as one coordinated phase to avoid repeated migrations.

### 3.1 Saved clients + autofill 🟡 (M)
- `types.ts`: add a `Client` type (name, email, address) and persisted collection.
- `services/storageService.ts`: CRUD for saved clients in localStorage, mirroring the invoice-history pattern; guard quota like `saveInvoiceToHistory`.
- `InvoiceEditor.tsx`: turn the client-name field into a combobox that suggests saved clients and fills email/address on select; add a "Save client" affordance.
- **Acceptance:** selecting a saved client populates all client fields; new clients can be saved; list survives reload.

### 3.2 Duplicate invoice 🟡 (S)
- `App.tsx`: add a `duplicateInvoice(inv)` handler — clones line items + client, assigns a new id + next number + today's date, then loads it.
- History sidebar: add a "Duplicate" action beside Delete.
- **Acceptance:** duplicating preserves client and items but gets a fresh number/date; original untouched.

### 3.3 Discount line 🟢 (M)
- `types.ts`: add `discount` (value + a `type: 'percent' | 'fixed'`).
- `services/invoiceCalculations.ts`: apply discount to subtotal **before** tax; add unit-level coverage (see Phase 6 note on tests).
- `InvoiceEditor.tsx`: discount input in Settings; `InvoicePreview.tsx`: render a discount row between subtotal and tax.
- **Acceptance:** totals correct for both discount types; discount row only shows when non-zero; PDF reflects it.

### 3.4 Sensible due-date default 🟢 (S)
- `App.tsx` `handleNewInvoice` already sets +7 days; extend `createDefaultInvoice()` in `types.ts` so first-load drafts also default due date to issue + N days (configurable constant).
- **Acceptance:** a fresh invoice never shows due date equal to issue date by default.

**Verification (Phase 3):** calculation checks for 3.1/3.3 (see Phase 6); manual flows for duplicate and client autofill; confirm `hydrateDraft`/history migration tolerates invoices saved before the new fields exist (back-compat defaults). `tsc`.

**Risk:** medium — the data-model additions must be backward-compatible with invoices already in localStorage. Add defaulting in `hydrateDraft` and history load so older records don't break.

---

## Phase 4 — Output & delivery

**Goal:** make the exported artifact accessible and let users actually deliver it.

### 4.1 Accessible, selectable PDF 🟡 (L)
- Today `html2pdf.js` rasterizes via html2canvas → text isn't selectable/searchable and the PDF is untagged (`App.tsx` `handleExportPDF`).
- Approach: evaluate a text-based path — either render the invoice through jsPDF text APIs, or use the Electron main process `webContents.printToPDF` (the app is Electron, per `electron/main.ts`), which preserves real text.
- Keep the current rasterized path as a fallback.
- **Acceptance:** exported PDF has selectable text; ideally tagged for SR; visual fidelity preserved.

### 4.2 Send / share invoice 🟡 (M)
- Client email is captured but unused.
- Approach: an "Email invoice" action that opens a prefilled `mailto:` with the client email, or — if a mail connector is later connected — attaches the PDF. Start with the local-only `mailto:` to avoid a connector dependency.
- **Acceptance:** one click drafts an email to the client; degrades gracefully when no email is set.

**Verification (Phase 4):** open exported PDF and confirm text selection/search; test export fallback when the primary path fails; manual share flow.

**Risk:** medium–high for 4.1 (rendering parity is fiddly). Time-box a spike before committing to a path.

---

## Phase 5 — Design-system & tech-debt hardening

**Goal:** reduce maintenance cost; no user-facing behavior change. Can run in parallel with any phase. Scope grew during the PDF/pagination work (items 5.4–5.6 are new debt introduced then).

| # | Issue | Files | Approach |
|---|---|---|---|
| 5.1 | ~~Hardcoded surface hex~~ — **DONE**: added `surface`/`ink`/`canvas` tokens (mapped to the same hex, zero visual change) in `tailwind.config.ts`; replaced all `[#1C1C1E]`/`[#1D1D1F]`/`[#F5F5F7]`/`[#000000]` arbitrary classes across `App`, `InvoiceEditor`, `InvoicePreview`, `Toast`, `ConfirmDialog`. (SignaturePad's canvas `'#1D1D1F'` left as-is — JS, not a class.) | `tailwind.config.ts` + components | Done. |
| 5.2 | Duplicated local class constants (`inputClass`, `navBtnClass`, `groupClass`, `fieldRowClass`/`fieldLabelClass`/`fieldInputClass`) | `InvoiceEditor.tsx`, `App.tsx` | **Deferred (judgment call):** each constant already lives in and is reused within a single component, and 5.1 removed the real cross-file duplication (the colors). The remaining "small primitives" version (`IconButton`/`Field` components) is a larger refactor with real regression risk for marginal gain — not worth doing blind. Revisit only if these components grow. |
| 5.3 | ~~Preview scale recompute~~ — **DONE**: added a `ResizeObserver` on the preview container so scale recomputes on any container size change (sidebar/history toggles), in addition to `window.resize`. | `App.tsx` | Done. |
| 5.4 | ~~Two invoice renderers~~ — **RESOLVED**: chose desktop-only, deleted the jsPDF path (`services/pdfExport.ts`) and the unused `html2pdf.js` dependency + `html2pdf.d.ts`. `InvoicePreview` (→ printToPDF) is now the single renderer; the web/dev fallback is `window.print()`. | — | Done. Run `npm install` once to prune `html2pdf.js`/`jspdf` from the lockfile + `node_modules`. |
| 5.5 | ~~Hardcoded RGB constants in the jsPDF generator~~ — **REMOVED with 5.4** (file deleted). | — | Done. |
| 5.6 | ~~Layout magic numbers~~ — **DONE**: page geometry (`PAGE_H_PX`/`PAGE_PADDING`/`USABLE_H`/`TAIL_SAFETY`) centralized in `services/paginate.ts` (6.1); per-field `maxLength` values centralized in `services/fieldLimits.ts`. The per-field line allowances remain as static `line-clamp-N` classes (left inline so Tailwind's JIT detects them). | `services/paginate.ts`, `services/fieldLimits.ts` | Done. |

**Verification (Phase 5):** `npm run typecheck`; `npm run build` (validates the new token classes); visual diff in both themes (tokens map to identical hex, so should be pixel-identical).

**Status:** Phase 5 complete except 5.2, which was deliberately deferred (see above).

---

## Phase 6 — Testing foundation (cross-cutting)

**Status update:** Vitest is now set up and wired (`npm test` = watch, `npm run test:run` = one-shot). Current suite is green — **48 tests** across `invoiceCalculations` (incl. discount-before-tax + grand total), `invoiceDraft` (hydrate/back-compat), `storageService` (incl. corrupt-JSON recovery), and `types`. `npm run typecheck` is also clean across all of Phases 1–5's changes. So the original "stand up a runner + cover calc/draft" goal is **done**; what remains is covering the newer, riskier code.

| # | Item | Why | Approach |
|---|---|---|---|
| 6.1 | ~~Extract + test the pagination packing logic~~ — **DONE**: pulled into pure `services/paginate.ts` (`computePages`) and covered by `services/paginate.test.ts` (8 tests: breaks, tail placement, full item coverage, empty/oversized-row/Bill-To/large-tail edge cases). Logic verified in Node against expected page plans. | `services/paginate.ts`, `services/paginate.test.ts` | Done. |
| 6.2 | ~~`hydrateDraft` back-compat for `discount` fields~~ — **DONE**: added two `invoiceDraft` tests — a pre-discount draft defaults to `percent`/`0`, and an explicit discount is preserved. | `services/invoiceDraft.test.ts` | Done. |
| 6.3 | ~~`services/pdfExport.ts` tests~~ — **DROPPED**: the jsPDF path was removed (5.4), so there's nothing to test here. | — | N/A. |
| 6.4 | ~~Wire CI~~ — **DONE**: `release.yml` already gated the `.exe` build on `typecheck` + `test:run`; added `.github/workflows/ci.yml` to also run `typecheck` + lint + `test:run` on **every push and PR** (Ubuntu) so regressions are caught continuously, not just at release. | `.github/workflows/release.yml`, `.github/workflows/ci.yml` | Done. |

**Note:** the measured pagination's DOM-measurement step itself isn't unit-testable without a browser; 6.1 covers the *decision* logic (given heights, produce the right page plan), which is where bugs live. Visual correctness still relies on manual/preview checks.

**Status:** Phase 6 complete (6.1, 6.2 done; 6.3 dropped; 6.4 done — continuous CI + release gating).

---

## Suggested sequencing

**Done:** Phases 1–4 are implemented (a11y, trust/polish, data-model + discount/clients/duplicate, output/delivery), plus the PDF export reworked to a real-render printToPDF path with height-based A4 pagination and bounded (line-clamped) sections. `npm run typecheck` and the Vitest suite (48 tests) are green.

**Also done:**
- **Phase 5 complete** except 5.2 (deliberately deferred): 5.1 color tokens, 5.3 ResizeObserver scale, 5.4/5.5 jsPDF removed, 5.6 geometry + field-limit constants centralized.
- **Phase 6 complete**: 6.1 pagination extracted + tested, 6.2 discount back-compat tests, 6.4 CI (release gating + new continuous `ci.yml`). 6.3 dropped with the jsPDF path.

**Remaining (all optional):**
1. **Phase 5 · 5.2** — extract shared primitives (`IconButton`/`Field`) only if those components grow enough to justify it.
2. **One-time:** `npm install` to prune `html2pdf.js`/`jspdf` from the lockfile and `node_modules`.

## Cross-cutting guardrails

- **localStorage back-compat:** any new field in `types.ts` must default safely in `hydrateDraft` and history load, since users have existing saved invoices.
- **i18n parity:** every new user-facing string goes in both `en` and `ms` in `i18n.tsx`.
- **Dark mode:** verify each change in both themes (the contrast and token work especially).
- **Single render path:** `InvoicePreview.tsx` is now the only invoice renderer (export = printToPDF capture of it), so there's no second path to keep in sync.
- **Per-phase gate:** `npm run typecheck && npm run test:run` clean + manual keyboard/visual pass before merging.
