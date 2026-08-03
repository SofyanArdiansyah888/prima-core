/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7dafe',
          300: '#94b5fd',
          400: '#608afa',
          500: '#1d4ed8',
          600: '#0f2c59', // Primary Deep Navy PKM
          700: '#0b1e3f',
          800: '#071328',
          900: '#040b17',
        },
        tonasa: {
          red: '#dc2626',
          blue: '#0284c7',
          gray: '#334155'
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b', // Industrial Amber Gold
          600: '#d97706',
          700: '#b45309',
        },
        slate: {
          850: '#121e31',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px rgba(245, 158, 11, 0.3)',
        'glow-blue': '0 0 25px rgba(29, 78, 216, 0.3)',
        'card': '0 4px 20px -2px rgba(15, 44, 89, 0.08)',
        'premium': '0 10px 30px -5px rgba(15, 44, 89, 0.15)',
      }
    },
  },
  plugins: [],
}
