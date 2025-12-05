/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#020617',
          800: '#02081f',
          700: '#0b1120',
        },
        brand: {
          primary: '#0f172a',
          accent: '#38bdf8',
        },
      },
    },
  },
  plugins: [],
};
