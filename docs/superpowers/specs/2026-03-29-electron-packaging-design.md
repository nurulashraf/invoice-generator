# Electron Desktop Packaging — Design Spec

## Context

SmartInvoice is currently a client-side React 19 app hosted on GitHub Pages. The goal is to package it as a portable Windows `.exe` using Electron so it can be installed and run locally on any machine, with auto-updates via GitHub Releases.

## Decisions

- **Approach:** Vite + Electron with electron-builder (most mature, best portable .exe support)
- **Distribution:** Portable single `.exe` (no installer)
- **Auto-updates:** electron-updater pulling from GitHub Releases
- **Web deployment:** Removed (desktop-only going forward)

## Architecture

Two-process Electron app:

- **Main process** (`electron/main.ts`) — Creates BrowserWindow, loads built `dist/index.html`, manages auto-update lifecycle via electron-updater
- **Preload script** (`electron/preload.ts`) — Security bridge between main and renderer (contextIsolation enabled)
- **Renderer process** — Existing React app, unchanged except CDN internalization

### Dev vs Production

| Mode | Renderer loads | How to run |
|------|---------------|------------|
| Dev | `http://localhost:3000` (Vite dev server) | `npm run electron:dev` |
| Prod | `file://dist/index.html` | Built `.exe` |

## CDN Internalization

Three CDN dependencies become local npm packages:

### 1. Tailwind CSS → Build-time PostCSS plugin

- Install `tailwindcss`, `postcss`, `autoprefixer`
- Create `tailwind.config.ts` with the existing inline theme config (ios/brand colors, apple shadows, letter-spacing)
- Create `index.css` (at project root, alongside `index.tsx`) with `@tailwind base/components/utilities` directives plus the custom utility classes currently in `index.html` (`<style>` block: `.glass-panel`, `.no-scrollbar`, `.transition-all-smooth`, print styles, `.break-inside-avoid`)
- Remove CDN `<script src="https://cdn.tailwindcss.com">` and inline `tailwind.config` from `index.html`

### 2. html2pdf.js → npm package

- `npm install html2pdf.js`
- In `App.tsx`: `import html2pdf from 'html2pdf.js'` instead of `window.html2pdf()`
- Add TypeScript declaration if needed (`declare module 'html2pdf.js'`)

### 3. Google Fonts (Inter) → Local font files

- Download Inter wght 400, 500, 600 to `assets/fonts/`
- Add `@font-face` declarations in `src/index.css`
- Remove `<link>` tags from `index.html`

### 4. Import map removal

- Remove the `<script type="importmap">` block from `index.html` (Vite handles all module resolution)

## New Files

```
electron/
  main.ts              — Electron main process (BrowserWindow, auto-update)
  preload.ts           — Preload script (contextIsolation bridge)
assets/
  fonts/
    Inter-Regular.woff2
    Inter-Medium.woff2
    Inter-SemiBold.woff2
index.css                — Tailwind directives + custom utilities + font-face
tailwind.config.ts     — Theme config moved from index.html
postcss.config.js      — PostCSS with tailwindcss + autoprefixer
electron-builder.yml   — Build config: portable target, GitHub publish
```

## Modified Files

| File | Changes |
|------|---------|
| `package.json` | Add electron, electron-builder, electron-updater, tailwindcss, postcss, autoprefixer, html2pdf.js. Add scripts: `electron:dev`, `electron:build`. Remove `zod` (unused). |
| `vite.config.ts` | Remove `/invoice-generator/` base path (set to `./`). |
| `index.html` | Remove CDN scripts, import map, inline tailwind config, Google Fonts links, inline `<style>` block (moved to `src/index.css`). Add `<link>` to `src/index.css`. |
| `App.tsx` | Import `html2pdf` from npm instead of `window.html2pdf()`. |
| `index.tsx` | Import `./index.css`. |

## Removed Files

| File | Reason |
|------|--------|
| `.github/workflows/deploy.yml` | No longer deploying to GitHub Pages |

## Auto-Update Flow

1. GitHub Actions workflow builds portable `.exe` on git tag push (e.g., `v1.0.0`)
2. Workflow creates a GitHub Release with the `.exe` artifact
3. On app launch, `electron-updater` checks GitHub Releases for newer version
4. If found, downloads and prompts user to restart

## Electron Main Process (`electron/main.ts`)

Key behaviors:
- Create single BrowserWindow (1200x800 default)
- In dev: load `http://localhost:3000`; in prod: load `file://dist/index.html`
- Enable `contextIsolation: true`, `nodeIntegration: false` (security)
- Check for updates on `app.whenReady()` via `autoUpdater.checkForUpdatesAndNotify()`
- Handle `window-all-closed` to quit on Windows

## electron-builder.yml

```yaml
appId: com.smartinvoice.app
productName: SmartInvoice
directories:
  output: release
files:
  - dist/**/*
  - electron/**/*
win:
  target: portable
publish:
  provider: github
```

## What Stays the Same

- All React components (InvoiceEditor, InvoicePreview, SignaturePad, Toast)
- localStorage persistence (works identically in Electron)
- i18n system, types.ts, storageService.ts
- Dark mode mechanism (classList toggle)
- All business logic

## Verification

1. `npm run electron:dev` — App launches in Electron window, HMR works
2. `npm run electron:build` — Produces portable `.exe` in `release/`
3. Run the `.exe` on a clean machine — app opens, localStorage works
4. Create and export a PDF — html2pdf works correctly in Electron
5. Tailwind styles render correctly (dark mode, glassmorphism, custom colors)
6. Tag a release, push — GitHub Actions builds and publishes to Releases
7. Relaunch app — auto-updater detects new version
