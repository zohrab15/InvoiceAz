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
          blue: "#1e40af",
          green: "#059669",
          yellow: "#f59e0b",
          red: "#dc2626",
          gray: "#64748b",
        }
      }
    },
  },
  plugins: [],
}
