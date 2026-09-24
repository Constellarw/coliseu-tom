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
          red: '#DC2626',
          'red-light': '#EF4444',
          'red-dark': '#991B1B',
          'red-crimson': '#B91C1C',
          dark: '#0A0A0C',
          surface: '#121216',
          card: '#18181D',
          border: '#27272A',
          muted: '#71717A'
        }
      }
    },
  },
  plugins: [],
}
