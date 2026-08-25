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
          50:  '#fff5f6',
          100: '#ffe4e6',
          200: '#fecdd2',
          300: '#fda4af',
          400: '#fb6c7a',
          500: '#f43f52',
          600: '#B91C2E', // Merah Indonesia — balanced, tidak terlalu terang
          700: '#8F1422',
          800: '#6B0F1A',
          900: '#420910',
          950: '#200408',
        },
        nusantara: {
          gold:   '#B8860B', // Batik gold — muted, klasik
          cream:  '#F9F4EE', // Kertas batik
          sand:   '#E2D0B8', // Pasir hangat
          earth:  '#5C3D2E', // Tanah cokelat
          teak:   '#8B6914', // Kayu jati
          sage:   '#4A6741', // Hijau sage
        },
        accent: {
          300: '#E8C97A',
          400: '#D4A843',
          500: '#B8860B', // Batik gold utama
          600: '#96700A',
          700: '#735508',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow':       '0 0 20px rgba(185, 28, 46, 0.25)',
        'glow-brand': '0 0 20px rgba(185, 28, 46, 0.2)',
        'card':       '0 4px 20px -2px rgba(80, 10, 20, 0.07)',
        'premium':    '0 10px 30px -5px rgba(80, 10, 20, 0.12)',
        'nusa':       '0 6px 24px -4px rgba(185, 28, 46, 0.15)',
      }
    },
  },
  plugins: [],
}
