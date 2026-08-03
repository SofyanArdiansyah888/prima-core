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
          50: '#fff0f1',
          100: '#ffe0e3',
          200: '#ffc5cb',
          300: '#fe969f',
          400: '#fb5a68',
          500: '#f42638',
          600: '#ce1126', // Merah Indonesia
          700: '#a30a1c',
          800: '#870b1b',
          900: '#74101d',
          950: '#410208',
        },
        nusantara: {
          gold:    '#F4A900', // Emas Nusantara
          cream:   '#FFF8F0', // Krem hangat
          earth:   '#6B3A2A', // Tanah Mahoni
          sand:    '#E8D5B7', // Pasir Pantai
          forest:  '#1A5C38', // Hijau Rimba
          batik:   '#8B1A1A', // Merah Batik gelap
        },
        accent: {
          400: '#f8c830',
          500: '#F4A900', // Emas Nusantara
          600: '#d4900a',
          700: '#a86e05',
        },
        slate: {
          850: '#1a1520',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow':        '0 0 25px rgba(244, 169, 0, 0.35)',
        'glow-red':    '0 0 25px rgba(206, 17, 38, 0.3)',
        'card':        '0 4px 20px -2px rgba(100, 10, 20, 0.08)',
        'premium':     '0 10px 30px -5px rgba(100, 10, 20, 0.15)',
        'nusa':        '0 8px 32px -4px rgba(206, 17, 38, 0.18)',
      }
    },
  },
  plugins: [],
}
