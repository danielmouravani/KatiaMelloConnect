/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f9ff',   /* Sky 50 */
          100: '#e0f2fe',  /* Sky 100 */
          200: '#bae6fd',  /* Sky 200 */
          300: '#7dd3fc',  /* Sky 300 */
          400: '#38bdf8',  /* Sky 400 */
          500: '#0ea5e9',  /* Sky 500 */
          600: '#0284c7',  /* Sky 600 - Main Primary */
          700: '#0369a1',  /* Sky 700 */
          800: '#075985',  /* Sky 800 */
          900: '#0c4a6e',  /* Sky 900 */
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}