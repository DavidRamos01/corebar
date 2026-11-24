/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:    '#F59E0B',
        'brand-dim': '#D97706',
        night:    '#07080F',
        surface:  '#0F1117',
        surface2: '#161820',
        rim:      '#1E2130',
        ink:      '#F0F2FA',
        muted:    '#7B8AA8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        marquee:      'marquee 28s linear infinite',
        'fade-up':    'fadeUp 0.7s ease forwards',
        float:        'float 5s ease-in-out infinite',
        pulse2:       'pulse2 2s ease-in-out infinite',
        'spin-slow':  'spin 12s linear infinite',
        blink:        'blink 1s step-end infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-16px)' },
        },
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.3' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        pulseSlow: {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
