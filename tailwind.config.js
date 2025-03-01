/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'slide-right-to-left': 'slideRightToLeft 0.5s ease-in-out',
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      keyframes: {
        slideRightToLeft: {
          '0%': { 
            transform: 'translateX(100%)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          },
        }
      }
    },
  },
  plugins: [],
}
