/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coliseu: {
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
          'gold-dark': '#B45309',
          crimson: '#DC2626',
          'crimson-dark': '#7F1D1D',
          arena: '#090D16',
          stone: '#131B2E',
          card: '#101726',
          border: '#1E293B'
        }
      }
    },
  },
  plugins: [],
}
