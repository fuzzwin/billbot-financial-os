/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'industrial-base': 'rgb(var(--industrial-base-rgb) / <alpha-value>)',
        'industrial-text': 'rgb(var(--industrial-text-rgb) / <alpha-value>)',
        'industrial-subtext': 'rgb(var(--industrial-subtext-rgb) / <alpha-value>)',
        'industrial-highlight': 'rgb(var(--industrial-highlight-rgb) / <alpha-value>)',
        'industrial-shadow': 'rgb(var(--industrial-shadow-rgb) / <alpha-value>)',
        'industrial-well-bg': 'rgb(var(--industrial-well-bg-rgb) / <alpha-value>)',
        // Keep Tailwind colors in sync with theme variables
        'industrial-orange': 'rgb(var(--industrial-orange-rgb) / <alpha-value>)',
        'industrial-blue': 'rgb(var(--industrial-blue-rgb) / <alpha-value>)',
        'industrial-yellow': 'rgb(var(--industrial-yellow-rgb) / <alpha-value>)',
        'industrial-green': 'rgb(var(--industrial-green-rgb) / <alpha-value>)',
      },
      boxShadow: {
        'tactile-raised': 'var(--shadow-raised)',
        'tactile-pressed': 'var(--shadow-pressed)',
        'tactile-sm': 'var(--shadow-sm)',
        well: 'var(--shadow-well)',
      },
    },
  },
  plugins: [],
};


