/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bfe0ff',
          300: '#8ec7ff',
          400: '#5aaafc',
          500: '#2d8cff',
          600: '#1f6de5',
          700: '#1d57b9',
          800: '#1d4d96',
          900: '#1e427b'
        },
        accent: {
          50: '#f3f6ff',
          100: '#e9edff',
          500: '#5865f2',
          600: '#4757db'
        }
      }
    }
  },
  plugins: []
};
