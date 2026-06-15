/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Cinzel', 'serif'],
        texas: ['Rye', 'serif'],
        modern: ['Montserrat', 'sans-serif'],
        happy: ['Titan One', 'cursive'],
        friendly: ['Fredoka', 'sans-serif'],
        festive: ['Yellowtail', 'cursive'],
        'mexican-main': ['Sancreek', 'cursive'],
        'mexican-elegant': ['Cinzel Decorative', 'cursive'],
        'mexican-script': ['Pinyon Script', 'cursive'],
      },
      colors: {
        // PALETA MEXICANA VIBRANTE
        mexican: {
          green: '#009c3b', // Verde Bandera
          red: '#ce1126',   // Rojo Bandera
          white: '#ffffff',
          gold: '#f1bf00',  // Amarillo Oro
          pink: '#e4007c',  // Rosa Mexicano
          dark: '#0a0a0a',  // Negro Profundo
        },
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        dark: {
          900: '#050505',
          800: '#121212',
          700: '#1a1a1a',
          600: '#262626'
        }
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        gridMove: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(60px)' },
        },
        borderFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'scroll': 'scroll 40s linear infinite',
        'grid-move': 'gridMove 3s linear infinite',
        'border-flow': 'borderFlow 3s ease infinite',
      }
    }
  },
  plugins: [],
}
