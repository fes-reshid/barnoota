/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1faf4',
          100: '#dcf2e3',
          200: '#bbe4ca',
          300: '#8ccfa8',
          400: '#57b280',
          500: '#349563',
          600: '#24774f',
          700: '#1c5f41',
          800: '#194c36',
          900: '#153f2e',
          950: '#0a2419',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
