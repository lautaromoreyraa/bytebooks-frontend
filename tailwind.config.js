/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#27272a",
        border: "#3f3f46",
        muted: "#a1a1aa",
      },
    },
  },
  plugins: [],
}

