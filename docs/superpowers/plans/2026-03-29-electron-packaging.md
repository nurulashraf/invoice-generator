# Electron Desktop Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package SmartInvoice as a portable Windows `.exe` with auto-updates via GitHub Releases.

**Architecture:** Vite builds the React app to `dist/`. Electron main process loads `dist/index.html` in production or the Vite dev server in development. electron-builder produces a portable `.exe`. electron-updater checks GitHub Releases on launch.

**Tech Stack:** Electron, electron-builder, electron-updater, Tailwind CSS (PostCSS), html2pdf.js (npm), Inter font (local)

---

## File Structure

```text
electron/
  main.ts          — Electron main process: BrowserWindow, auto-update
  preload.ts       — Preload script (empty, but required for contextIsolation)
assets/
  fonts/
    inter.css      — @font-face declarations for Inter variable font
    Inter.woff2     — Inter variable font file (all weights)
index.css          — Tailwind directives + custom utilities (moved from index.html <style>)
tailwind.config.ts — Theme config (moved from inline in index.html)
postcss.config.js  — PostCSS with tailwindcss + autoprefixer
electron-builder.yml   — Portable exe config + GitHub publish
tsconfig.electron.json — TypeScript config for Electron main process (commonjs)
html2pdf.d.ts          — TypeScript declaration for html2pdf.js
```

---

### Task 1: Install Tailwind CSS as a build-time PostCSS plugin

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `index.css`
- Modify: `index.html`
- Modify: `index.tsx`

- [ ] **Step 1: Install Tailwind, PostCSS, and Autoprefixer**

```bash
npm install -D tailwindcss postcss autoprefixer
```

- [ ] **Step 2: Create `tailwind.config.ts`**

Move the inline theme config from `index.html` into a proper config file.

```ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './**/*.{ts,tsx}',
    '!./node_modules/**',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        ios: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          blue: '#007AFF',
          gray: '#8E8E93',
          separator: '#C6C6C8',
          destruct: '#FF3B30',
        },
        brand: {
          50: '#F5F7FA',
          100: '#E4E7EB',
          500: '#0071E3',
          600: '#0077ED',
          900: '#1D1D1F',
        },
      },
      boxShadow: {
        apple: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)',
        'apple-hover': '0 4px 6px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.04)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        float: '0 20px 40px -10px rgba(0,0,0,0.15)',
      },
      letterSpacing: {
        tightest: '-0.02em',
        tighter: '-0.01em',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Create `index.css`**

This file combines Tailwind directives with all the custom styles currently in `index.html`'s `<style>` block.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  height: 100%;
  overflow-x: hidden;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.dark .glass-panel {
  background: rgba(28, 28, 30, 0.75);
}

.transition-all-smooth {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@media print {
  @page { margin: 0; }
  body { margin: 0; background: white !important; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .print-container {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

.break-inside-avoid {
  page-break-inside: avoid;
  break-inside: avoid;
}

thead {
  display: table-header-group;
}

tr {
  page-break-inside: avoid;
  break-inside: avoid;
}
```

- [ ] **Step 5: Import `index.css` in `index.tsx`**

Add this line at the top of `index.tsx` (before other imports):

```ts
import './index.css';
```

Full file becomes:

```ts
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
```

- [ ] **Step 6: Strip CDN Tailwind and inline styles from `index.html`**

Remove these from `index.html`:
1. `<script src="https://cdn.tailwindcss.com"></script>`
2. The entire `<script>tailwind.config = { ... }</script>` block (lines 13–50)
3. The entire `<style>...</style>` block (lines 51–118)
4. The `<script type="importmap">...</script>` block (lines 119–130)

The `<head>` should now only contain:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SmartInvoice</title>
</head>
```

(Google Fonts links will be replaced by local font in Task 2, so remove those too.)

- [ ] **Step 7: Verify Tailwind builds correctly**

```bash
npm run build
```

Expected: Build succeeds, `dist/` contains CSS with Tailwind utility classes.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.ts postcss.config.js index.css index.tsx index.html package.json package-lock.json
git commit -m "feat: replace Tailwind CDN with build-time PostCSS plugin"
```

---

### Task 2: Internalize Google Fonts (Inter) as local font

**Files:**
- Create: `assets/fonts/Inter.woff2`
- Create: `assets/fonts/inter.css`
- Modify: `index.css`

- [ ] **Step 1: Download Inter variable font**

```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/Inter.woff2 "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2"
```

This is the variable font file that covers weights 100–900.

- [ ] **Step 2: Create `assets/fonts/inter.css`**

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('./Inter.woff2') format('woff2');
}
```

- [ ] **Step 3: Import the font CSS in `index.css`**

Add this at the very top of `index.css`, before the Tailwind directives:

```css
@import './assets/fonts/inter.css';

@tailwind base;
```

- [ ] **Step 4: Verify font loads**

```bash
npm run build
```

Expected: Build succeeds. The font file is copied to `dist/assets/`.

- [ ] **Step 5: Commit**

```bash
git add assets/fonts/ index.css
git commit -m "feat: internalize Inter font as local woff2"
```

---

### Task 3: Replace html2pdf.js CDN with npm package

**Files:**
- Modify: `App.tsx`
- Modify: `index.html` (if not already cleaned in Task 1)

- [ ] **Step 1: Install html2pdf.js**

```bash
npm install html2pdf.js
```

- [ ] **Step 2: Add TypeScript declaration for html2pdf.js**

Create `html2pdf.d.ts` at project root:

```ts
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: Record<string, unknown>;
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    save(): Promise<void>;
  }

  export default function html2pdf(): Html2PdfInstance;
}
```

- [ ] **Step 3: Update `App.tsx` to import html2pdf from npm**

Replace the `handleExportPDF` function. Change the html2pdf usage from `window.html2pdf()` to the imported module.

Replace lines 126–169 in `App.tsx`:

```ts
import html2pdf from 'html2pdf.js';
```

Add this import at the top of `App.tsx` (after the existing imports, around line 8).

Then replace the `handleExportPDF` function body:

Old:
```ts
      // @ts-ignore - html2pdf is loaded via CDN in index.html
      if (typeof window.html2pdf === 'undefined') {
        window.print();
        return;
      }
```

New:
```ts
      if (!html2pdf) {
        window.print();
        return;
      }
```

Old:
```ts
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
```

New:
```ts
      await html2pdf().set(opt).from(element).save();
```

- [ ] **Step 4: Remove html2pdf CDN script from `index.html`**

Remove this line if not already removed in Task 1:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

- [ ] **Step 5: Verify PDF export still works**

```bash
npm run dev
```

Open browser, create an invoice, click "Export PDF". Verify PDF downloads correctly.

- [ ] **Step 6: Commit**

```bash
git add App.tsx html2pdf.d.ts index.html package.json package-lock.json
git commit -m "feat: replace html2pdf.js CDN with npm package"
```

---

### Task 4: Update Vite config for Electron compatibility

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Update `vite.config.ts`**

Change base path from `/invoice-generator/` to `./` (relative, needed for Electron's `file://` protocol). Update the entry point to resolve correctly.

```ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
```

- [ ] **Step 2: Verify build works with new base path**

```bash
npm run build
```

Expected: Build succeeds. Check that `dist/index.html` has relative asset paths (e.g., `./assets/...` not `/invoice-generator/assets/...`).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: change Vite base path to ./ for Electron file:// protocol"
```

---

### Task 5: Add Electron main process and preload script

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

- [ ] **Step 1: Install Electron and electron-builder**

```bash
npm install -D electron electron-builder
npm install electron-updater
```

- [ ] **Step 2: Create `electron/main.ts`**

```ts
import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
```

- [ ] **Step 3: Create `electron/preload.ts`**

```ts
// Preload script — contextIsolation bridge
// Currently empty. Add contextBridge.exposeInMainWorld() here if
// the renderer ever needs to call Node/Electron APIs.
```

- [ ] **Step 4: Commit**

```bash
git add electron/
git commit -m "feat: add Electron main process and preload script"
```

---

### Task 6: Configure package.json scripts and electron-builder

**Files:**
- Modify: `package.json`
- Create: `electron-builder.yml`

- [ ] **Step 1: Update `package.json`**

Add `main` field and new scripts. Remove unused `zod` dependency.

Add/modify these fields in `package.json`:

```json
{
  "name": "smartinvoice",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "electron:dev": "npm run build && electron .",
    "electron:build": "npm run build && electron-builder --win portable"
  }
}
```

Also remove `zod` from `dependencies`:

```bash
npm uninstall zod
```

- [ ] **Step 2: Add TypeScript build for Electron files**

The Electron main process files are TypeScript but need to be compiled separately from Vite. Add a `tsconfig.electron.json`:

Create `tsconfig.electron.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "electron",
    "rootDir": "electron",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["electron/*.ts"]
}
```

Update the scripts in `package.json` to compile Electron files first:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:electron": "tsc -p tsconfig.electron.json",
    "preview": "vite preview",
    "electron:dev": "npm run build:electron && concurrently \"vite\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && npm run build:electron && electron-builder --win portable"
  }
}
```

Install dev utilities:

```bash
npm install -D concurrently wait-on
```

- [ ] **Step 3: Create `electron-builder.yml`**

```yaml
appId: com.smartinvoice.app
productName: SmartInvoice
directories:
  output: release
files:
  - dist/**/*
  - electron/**/*.js
  - "!electron/**/*.ts"
win:
  target: portable
  icon: assets/icon.ico
portable:
  artifactName: SmartInvoice-${version}-portable.exe
publish:
  provider: github
```

- [ ] **Step 4: Add Electron output to `.gitignore`**

Append to `.gitignore`:

```text
# Electron
release/
electron/*.js
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json electron-builder.yml tsconfig.electron.json .gitignore
git commit -m "feat: configure electron-builder for portable exe with auto-updates"
```

---

### Task 7: Remove GitHub Pages deployment

**Files:**
- Delete: `.github/workflows/deploy.yml`

- [ ] **Step 1: Delete the deploy workflow**

```bash
rm .github/workflows/deploy.yml
rmdir .github/workflows 2>/dev/null
rmdir .github 2>/dev/null
```

(The `rmdir` commands clean up empty parent dirs if no other workflows exist.)

- [ ] **Step 2: Commit**

```bash
git add -A .github/
git commit -m "chore: remove GitHub Pages deployment (desktop-only now)"
```

---

### Task 8: Add GitHub Actions workflow for building releases

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create release workflow**

This triggers on version tags and builds the portable `.exe`, publishing it as a GitHub Release.

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build
      - run: npm run build:electron

      - name: Build Electron portable
        run: npx electron-builder --win portable --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions workflow for Electron release builds"
```

---

### Task 9: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md to reflect the Electron setup**

Replace the Build & Development Commands and Deployment sections:

Replace:
```markdown
## Build & Development Commands

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Production build via Vite
- `npm run preview` — Preview production build locally

No test runner or linter is configured.

## Deployment

GitHub Pages auto-deploys on push to `main` (via `.github/workflows/deploy.yml`). Base path is `/invoice-generator/` (set in `vite.config.ts`).
```

With:
```markdown
## Build & Development Commands

- `npm run dev` — Start Vite dev server on port 3000 (web only)
- `npm run build` — Production build via Vite (outputs to `dist/`)
- `npm run build:electron` — Compile Electron main process TypeScript
- `npm run electron:dev` — Build Electron TS, then launch Vite + Electron concurrently
- `npm run electron:build` — Build portable Windows `.exe` (outputs to `release/`)

No test runner or linter is configured.

## Deployment

Desktop-only distribution. Push a version tag (e.g., `git tag v1.0.0 && git push --tags`) to trigger GitHub Actions which builds the portable `.exe` and publishes it as a GitHub Release. The app auto-updates via electron-updater on launch.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Electron desktop setup"
```

---

### Task 10: End-to-end verification

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf node_modules dist release
npm install
npm run build
npm run build:electron
```

Expected: All commands succeed without errors.

- [ ] **Step 2: Launch in dev mode**

```bash
npm run electron:dev
```

Expected: Electron window opens, loads the app. Verify:
- Tailwind styles render (dark mode toggle, glassmorphism navbar, brand colors)
- Invoice editor works (add items, change fields)
- PDF export works (click Export PDF, file downloads)
- localStorage persistence works (refresh preserves data)
- Inter font is loaded (check in DevTools → Elements → Computed styles)

- [ ] **Step 3: Build portable exe**

```bash
npm run electron:build
```

Expected: `release/` directory contains `SmartInvoice-1.0.0-portable.exe`.

- [ ] **Step 4: Test the portable exe**

Run the portable `.exe` from `release/`. Verify same functionality as Step 2.

- [ ] **Step 5: Commit any final fixes**

If any issues were found and fixed during verification:

```bash
git add -A
git commit -m "fix: address issues found during end-to-end verification"
```
