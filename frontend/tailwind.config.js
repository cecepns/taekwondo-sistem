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
          DEFAULT: '#3b82f6', // Will be dynamic, but default is blue-500
          hover: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
