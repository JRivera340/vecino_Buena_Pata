import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      lg: '992px',
      xl: '1280px',
    },
    extend: {
      colors: {
        verde: {
          DEFAULT: '#719d15',
          medio: '#5f8910',
          profundo: '#55711f',
          oscuro: '#45591a',
          suave: '#e7f5d1',
          tenue: '#eef9d8',
          tinta: '#2d5f07',
        },
        azul: {
          DEFAULT: '#0345bf',
          oscuro: '#002d7a',
          suave: '#e7f5ff',
          tinta: '#003366',
        },
        tinta: {
          DEFAULT: '#252525',
          suave: '#6c757d',
        },
        lienzo: {
          DEFAULT: '#ffffff',
          gris: '#fafafa',
          borde: '#d0d0d0',
        },
        alerta: {
          DEFAULT: '#ff9800',
          suave: '#fff3cd',
          tinta: '#856404',
        },
        peligro: {
          DEFAULT: '#dc3545',
          oscuro: '#c82333',
          suave: '#f8d7da',
          tinta: '#721c24',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          '"Noto Sans"',
          '"Liberation Sans"',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        hero: ['3rem', { lineHeight: '1.1', fontWeight: '600' }],
        h1: ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        h2: ['1.75rem', { lineHeight: '1.3', fontWeight: '500' }],
        h3: ['1.5rem', { lineHeight: '1.3', fontWeight: '500' }],
        h4: ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        h5: ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        h6: ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        cuerpo: ['1rem', { lineHeight: '1.6' }],
        pequeno: ['0.875rem', { lineHeight: '1.5' }],
        minimo: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        pequeno: '4px',
        DEFAULT: '6px',
        tarjeta: '8px',
        seccion: '12px',
      },
      boxShadow: {
        sutil: '0 1px 3px rgba(0, 0, 0, 0.1)',
        medio: '0 4px 12px rgba(113, 157, 21, 0.15)',
        fuerte: '0 12px 24px rgba(0, 0, 0, 0.15)',
      },
      keyframes: {
        brillo: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        aparecer: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        deslizar: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        brillo: 'brillo 1.5s linear infinite',
        aparecer: 'aparecer 200ms ease-out',
        deslizar: 'deslizar 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
