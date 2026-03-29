# SmartInvoice

![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwindcss)

A beautifully crafted desktop invoice generator with an Apple-inspired interface, pixel-perfect PDF export, and zero cloud dependencies. Your data never leaves your machine.

> **[Download the latest release](../../releases/latest)** — grab the portable `.exe` and start invoicing in seconds. No installation required.

---

## Features

### Desktop App
- **Portable:** Single `.exe` file — no installer, no setup. Just download and run.
- **Offline:** Works entirely offline. No internet connection needed after download.
- **Update Notifications:** Checks for new versions on launch and prompts you to download from GitHub Releases.
- **Private:** All data stays on your machine in local storage. Nothing is sent anywhere.

### Professional PDF Engine
- **High-Fidelity Export:** Generates crisp, print-ready A4 PDFs directly on your desktop.
- **Smart Pagination:** Intelligent layout rules prevent rows from splitting across pages.
- **One-Click Download:** Export your invoice as a PDF with a single click.

### Premium Interface
- **Glassmorphism Design:** Modern, translucent UI elements with background blur effects.
- **Dark Mode:** System-aware dark mode with smooth transitions.
- **Responsive Preview:** Live invoice preview with accurate A4 scaling.
- **Smooth Animations:** Polished transitions powered by Framer Motion.

### Productivity
- **Invoice History:** Saves and manages all your invoices locally with auto-save.
- **Digital Signature:** Draw signatures directly on screen with the built-in signature pad.
- **Multi-Language:** Supports English and Malay (Bahasa Melayu).
- **Smart Defaults:** Pre-configured for Malaysian businesses (MYR, 6% SST), easily customizable.

---

## Getting Started

### Download

1. Go to the **[Releases page](../../releases/latest)**
2. Download `SmartInvoice-x.x.x-portable.exe`
3. Run it — no installation needed

The app notifies you when a new version is available.

### For Developers

```bash
# Clone and install
git clone https://github.com/nurulashraf/invoice-generator.git
cd invoice-generator
npm install

# Run in Electron (dev mode)
npm run electron:dev

# Build portable .exe
npm run electron:build
```

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server (web only, port 3000) |
| `npm run build` | Production build via Vite |
| `npm run build:electron` | Compile Electron main process TypeScript |
| `npm run electron:dev` | Launch Vite + Electron concurrently for development |
| `npm run electron:build` | Build portable Windows `.exe` (outputs to `release/`) |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Desktop Shell** | Electron 33 |
| **Framework** | React 19 |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS 3 (PostCSS) |
| **PDF Engine** | html2pdf.js |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Build** | Vite 6 + electron-builder |
| **Update Check** | electron-updater via GitHub Releases |

---

## Privacy

SmartInvoice is designed with privacy at its core:

- **No cloud, no accounts, no tracking.** The app runs entirely on your machine.
- **Local storage only.** All invoices and preferences are saved in Electron's local storage.
- **No network requests** except for checking for app updates from GitHub Releases.

---

## Releasing

To publish a new version:

```bash
# Bump version in package.json, then:
git tag v1.0.0
git push --tags
```

GitHub Actions will automatically build the portable `.exe` and publish it as a GitHub Release.

---

## License

MIT License. Free to use for personal and commercial projects.
