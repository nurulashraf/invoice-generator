# SmartInvoice

![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwindcss)

**SmartInvoice** is a client-side invoice generator with a premium "Apple-style" interface and pixel-perfect PDF generation, no backend server required.

---

## Key Features

### Professional PDF Engine
- **Client-Side Generation:** Uses `html2pdf.js` to render high-fidelity PDFs directly in the browser.
- **Smart Pagination:** Intelligent CSS rules (`break-inside-avoid`) prevent rows from being cut in half across pages.
- **High Resolution:** Exports crisp, vector-quality text and images.

### Premium UX/UI
- **Glassmorphism:** Modern, translucent UI elements with background blurs.
- **Responsive:** Fully functional on Mobile, Tablet, and Desktop with adaptive layouts.
- **Dark Mode:** System-aware dark mode support.
- **Animation:** Smooth transitions powered by `framer-motion`.

### Utility
- **Local History:** Saves invoices to `localStorage` for privacy and persistence.
- **Signature Pad:** Draw digital signatures directly on the screen.
- **i18n Ready:** Native support for English (`en`) and Malay (`ms`).

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nurulashraf/invoice-generator.git
   cd invoice-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

---

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF Engine:** `html2pdf.js`
- **Icons:** Lucide React
- **Validation:** Zod

---

## Privacy & Data

- **Client-Side Storage:** All invoice history is stored in your browser's `localStorage`.
- **No Server:** There is no backend. All data stays in your browser.

---

## License

MIT License. Free to use for personal and commercial projects.
