/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Menú lateral (azul oscuro, fijo)
        sidebar:      '#0f1349',
        'sidebar-2':  '#1a2060',
        'sidebar-3':  '#242b7a',
        // Zona de contenido (variables CSS, cambian en modo oscuro)
        bg:           'var(--c-bg)',
        surface:      'var(--c-surface)',
        surface2:     'var(--c-surface2)',
        surface3:     'var(--c-surface3)',
        // Bordes
        rim:          'var(--c-rim)',
        'rim-2':      'var(--c-rim2)',
        // Acento (índigo, fijo)
        accent:       '#6366f1',
        'accent-dim': '#4f52d8',
        'accent-xs':  '#eef2ff',
        // Texto
        ink:          'var(--c-ink)',
        muted:        'var(--c-muted)',
        faint:        'var(--c-faint)',
        // Colores de estado (fijos)
        success:      '#10b981',
        danger:       '#ef4444',
        warning:      '#f59e0b',
        info:         '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 3px rgba(15,19,73,.06), 0 1px 2px rgba(15,19,73,.04)',
        'card-md': '0 4px 12px rgba(15,19,73,.08), 0 2px 4px rgba(15,19,73,.04)',
        'sidebar': '4px 0 24px rgba(15,19,73,.15)',
      },
      animation: {
        'fade-in':  'fadeIn .3s ease both',
        'slide-up': 'slideUp .35s cubic-bezier(.22,1,.36,1) both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
