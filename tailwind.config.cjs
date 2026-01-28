/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./**/*.tsx", "./**/*.res.mjs"],
  theme: {
    extend: {
      colors: {
        cinema: {
          amber: "#f59e0b",
          orange: "#f97316",
          gold: "#fbbf24",
          black: "#09090b",
        },
      },
      animation: {
        "light-swing": "swing 5s infinite",
      },
      keyframes: {
        swing: {
          "0%, 100%": { transform: "rotate(9deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        "cinema-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "cinema-slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      fontFamily: {
        virgin: ["Virgil", "Comic Sans MS", "Bradley Hand", "cursive"],
        display: ["Bebas Neue", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        body: ["Outfit", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
