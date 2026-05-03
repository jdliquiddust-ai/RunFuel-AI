/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF4F00',
          'orange-dark': '#E64500',
          'orange-light': '#FF7433',
          'orange-faint': '#FFF3ED',
          asphalt: '#2D2D2D',
          'asphalt-dark': '#1A1A1A',
          'asphalt-mid': '#3D3D3D',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.08)',
        'orange-glow': '0 0 30px rgba(255,79,0,0.35)',
      },
      keyframes: {
        'flash-bg': {
          '0%,100%': { backgroundColor: '#1A1A1A' },
          '30%,70%': { backgroundColor: '#FF4F00' },
        },
        'slide-down': {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(255,79,0,0.5)' },
          '70%':  { boxShadow: '0 0 0 18px rgba(255,79,0,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,79,0,0)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'flash-bg':    'flash-bg 3s ease-in-out',
        'slide-down':  'slide-down 0.35s ease-out',
        'pulse-ring':  'pulse-ring 2s infinite',
        'count-up':    'count-up 0.3s ease-out',
        'fade-in':     'fade-in 0.4s ease',
      },
    },
  },
  plugins: [],
};
