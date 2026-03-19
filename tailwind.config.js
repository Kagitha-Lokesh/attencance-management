/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0f9f9',
          100: '#d9f2f2',
          200: '#b8e5e5',
          300: '#8bd1d1',
          400: '#5ab3b3',
          500: '#3d9a9a',
          600: '#2e7d7d',
          700: '#286565',
          800: '#245151',
          900: '#214444',
          950: '#0e2828',
        },
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
