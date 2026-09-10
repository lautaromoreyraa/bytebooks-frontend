/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutrales cálidos: una sola familia de grises, tintada hacia el papel.
        ink: {
          50: "#f6f2ea",
          100: "#e7e1d7",
          200: "#cfc7ba",
          300: "#b0a698",
          400: "#8d8478",
          500: "#6b635a",
          600: "#4a443c",
          700: "#332e29",
          800: "#221f1c",
          850: "#1a1816",
          900: "#121110",
          950: "#0c0b09",
        },
        // Acento único: latón. Sobre relleno lleva texto ink-950, nunca blanco.
        brass: {
          300: "#e6c48f",
          400: "#d9ab68",
          500: "#c8924a",
          600: "#a8763a",
          700: "#82592c",
        },
        // Destructivo / error.
        ember: {
          400: "#e08a7e",
          500: "#cf6455",
          600: "#a94b3e",
        },
        // Confirmación.
        sage: {
          400: "#8fbf9a",
          500: "#5f9c6f",
        },
      },
      fontFamily: {
        sans: ["Geist", "Geist Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Iowan Old Style", "Georgia", "serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.035em",
      },
      borderRadius: {
        // Contenedores más blandos que sus elementos internos.
        xs: "0.25rem",
      },
      boxShadow: {
        // Sombras tintadas con el marrón del fondo, no negro puro.
        card: "0 1px 2px rgba(12, 11, 9, 0.6), 0 12px 28px -18px rgba(12, 11, 9, 0.9)",
        lift: "0 2px 4px rgba(12, 11, 9, 0.5), 0 22px 44px -20px rgba(12, 11, 9, 0.95)",
        panel: "0 32px 64px -28px rgba(12, 11, 9, 0.95)",
        spine: "-6px 0 12px -8px rgba(12, 11, 9, 0.9) inset",
      },
      zIndex: {
        base: "0",
        raised: "10",
        sticky: "20",
        dropdown: "30",
        overlay: "40",
        modal: "50",
        toast: "60",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translate3d(0, 10px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "translate3d(0, 8px, 0) scale(0.98)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translate3d(100%, 0, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 200ms ease-out both",
        "scale-in": "scale-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
