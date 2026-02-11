/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060E1A',
          900: '#0A1628',
          800: '#0F2035',
          700: '#162D4A',
          600: '#1E3A5F',
          500: '#2A4A6B',
        },
        brass: {
          DEFAULT: '#C9A962',
          light: '#DCC07A',
          dark: '#A88B42',
          muted: '#8A7440',
        },
        parchment: {
          DEFAULT: '#F5F0E8',
          muted: '#C4BBA8',
        },
        'sea-slate': '#8B9DB5',
        signal: {
          red: '#C0392B',
          'red-bg': '#1A0F0D',
          amber: '#D4A017',
          'amber-bg': '#1A1608',
          green: '#27AE60',
          'green-bg': '#0D1A12',
          blue: '#2980B9',
          'blue-bg': '#0D1520',
        },
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
