/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          blue: '#1E40AF',
          yellow: '#FACC15',
          red: '#EF4444',
          dark: '#0F172A'
        }
      }
    },
  },
  plugins: [],
}
