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
          DEFAULT: '#1a2b4a',
          50: '#f0f3f8',
          600: '#243756',
          700: '#1a2b4a',
          800: '#111d33',
          900: '#0b1322',
        },
      },
    },
  },
  plugins: [],
}
