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
