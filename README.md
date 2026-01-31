# SmartInvoice AI ⚡️

![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.0-8E75B2?style=flat-square&logo=googlebard)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwindcss)

**SmartInvoice AI** is a next-generation, client-side invoice generator that uses **Google Gemini AI** to transform rough notes, emails, or conversational text into structured, professional tax invoices.

It features a premium "Apple-style" interface, real-time AI streaming effects, and pixel-perfect client-side PDF generation without requiring a backend server.

---

## ✨ Key Features

### 🧠 AI Copilot
- **Natural Language Processing:** Type "Bill Apple for 50 hours of react work at $100" and watch the invoice update instantly.
- **Context Aware:** It understands tax rates, currency conversions, and professional formatting.
- **Streaming UI:** Features a typewriter effect that mimics real-time thought processing.

### 📄 Professional PDF Engine
- **Client-Side Generation:** Uses `html2pdf.js` to render high-fidelity PDFs directly in the browser.
- **Smart Pagination:** Intelligent CSS rules (`break-inside-avoid`) prevent rows from being cut in half across pages.
- **High Resolution:** Exports crisp, vector-quality text and images.

### 🎨 Premium UX/UI
- **Glassmorphism:** Modern, translucent UI elements with background blurs.
- **Responsive:** Fully functional on Mobile, Tablet, and Desktop with adaptive layouts.
- **Dark Mode:** System-aware dark mode support.
- **Animation:** Smooth transitions powered by `framer-motion`.

### 🛠 Utility
- **Local History:** Saves invoices to `localStorage` for privacy and persistence.
- **Signature Pad:** Draw digital signatures directly on the screen.
- **i18n Ready:** Native support for English (`en`) and Malay (`ms`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google Cloud Project with the **Gemini API** enabled.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartinvoice-ai.git
   cd smartinvoice-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file (or configure your build tool) with your API key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

## 🤖 How to use the AI

1. Open the **AI Copilot** by clicking the Sparkles ✨ icon in the navbar.
2. Type a command. Examples:
   - *"Add a line item for Server Maintenance, Qty 1, Price 500."*
   - *"Change the tax rate to 8% and update the currency to USD."*
   - *"Make the payment terms more polite and add a thank you note."*
   - *"Remove the last item."*
3. The AI will interpret your intent, generate the necessary JSON changes, and update the React state instantly.

---

## 🏗 Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** Google Gemini (`gemini-3-flash-preview` / `gemini-2.0`) via `@google/genai` SDK.
- **PDF Engine:** `html2pdf.js`
- **Icons:** Lucide React
- **Validation:** Zod

---

## 🔒 Privacy & Data

- **Client-Side Storage:** All invoice history is stored in your browser's `localStorage`.
- **AI Processing:** Invoice data is sent to Google Gemini only when explicitly using the AI features. No data is stored on our own servers because **there is no backend server**.

---

## 📄 License

MIT License. Free to use for personal and commercial projects.
