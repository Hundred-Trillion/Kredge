/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050A14',
          900: '#0A0F1E',
          800: '#0F1629',
          700: '#141D35',
          600: '#1A2540',
          500: '#1F2D4C',
          400: '#2A3A5C',
          300: '#364A70',
          200: '#4A6490',
          100: '#6B89B8',
        },
        electric: {
          DEFAULT: '#2D6FF7',
          50: '#E8F0FF',
          100: '#C5D9FF',
          200: '#8FB4FF',
          300: '#5A8FFF',
          400: '#2D6FF7',
          500: '#1A5CE0',
          600: '#1249C0',
          700: '#0D38A0',
        },
        emerald: {
          DEFAULT: '#00C48C',
          50: '#E6FFF6',
          100: '#B3FFE5',
          200: '#66FFCC',
          300: '#33FFB8',
          400: '#00E6A0',
          500: '#00C48C',
          600: '#009E70',
          700: '#007854',
        },
        danger: {
          DEFAULT: '#FF4444',
          50: '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFADAD',
          300: '#FF8585',
          400: '#FF4444',
          500: '#E03030',
          600: '#C02020',
          700: '#A01010',
        },
        surface: {
          DEFAULT: '#111827',
          light: '#1A2236',
          lighter: '#1F2A40',
          border: '#2A3550',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        'metric': ['3rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'metric-lg': ['4rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
      },
      backgroundImage: {
        'grid-texture': `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40L40 0M-10 10L10-10M30 50L50 30' stroke='%23ffffff' stroke-width='0.3' opacity='0.04'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3C/svg%3E")`,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
