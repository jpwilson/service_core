/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f89020',
          600: '#ea7c0c',
          700: '#c2660a',
          800: '#9a4f10',
          900: '#7c4010',
        },
        secondary: {
          50: '#eef2f7',
          100: '#d4dce8',
          200: '#a9b9d1',
          300: '#7e96ba',
          400: '#5373a3',
          500: '#0a1f44',
          600: '#091b3b',
          700: '#071632',
          800: '#051229',
          900: '#030d1f',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
