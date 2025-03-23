/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DFCF99',
          light: '#DFCF9933', // Version plus claire avec 20% d'opacité
          dark: '#B9AD7D', // Version plus foncée
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-blue-400',
    'bg-blue-600',
    'bg-pink-400',
    'bg-pink-600',
    'bg-gray-600',
    'bg-gray-800',
  ],
}
