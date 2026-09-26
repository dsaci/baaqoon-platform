/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        baaqoon: {
          // Base — off-white & warm grays (inspired by keffiyeh white)
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b', // Near black (Palestinian flag black)

          // Palestinian Green — the core accent color
          accent:     '#007A3D',  // Palestine green
          accentDark: '#005C2E',  // Darker green for hover

          // Palestinian Red — for alerts, CTAs, live indicators
          red:        '#CE1126',  // Palestine red
          redDark:    '#A50E1F',

          // Palestinian Black — for headings, borders
          black:      '#000000',
        }
      },
      fontFamily: {
        sans: ['"Cairo"', '"Tajawal"', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
