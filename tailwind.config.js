/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/client/index.html",
    "./src/client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#F5F7FF',
          100: '#EBF0FE',
          200: '#D6E0FD',
          300: '#ADC4FB',
          400: '#7FA1F8',
          500: '#537CF3',
          600: '#3B60E6',
          700: '#2A46C4',
          800: '#22389E',
          900: '#1F317E',
        },
        lavender: {
          50: '#FBFBFF',
          100: '#F4F4FE',
          200: '#E9EAFA',
          300: '#D5D7F4',
          400: '#B6B9EB',
          500: '#9B9EE0',
        },
        mint: {
          50: '#F0FDF8',
          100: '#DBFBEC',
          200: '#B7F5D7',
          300: '#7FEABC',
          400: '#42D499',
          500: '#1CB77B',
        },
        peach: {
          50: '#FFF9F5',
          100: '#FFF0E6',
          200: '#FFE0CC',
          300: '#FFC7A3',
          400: '#FFA470',
          500: '#FA8243',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
        },
        blush: {
          50: '#FDF4F8',
          100: '#FCE7F2',
          200: '#F9D1E6',
          300: '#F4ACD1',
          400: '#EB7CB4',
          500: '#DC5495',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'soft-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow-brand': '0 0 25px -5px rgba(83, 124, 243, 0.25)',
        'glow-mint': '0 0 25px -5px rgba(28, 183, 123, 0.25)',
        'glow-blush': '0 0 25px -5px rgba(220, 84, 149, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
