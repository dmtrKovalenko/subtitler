/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./**/*.tsx", "./**/*.res.mjs"],
  theme: {
    extend: {
      animation: {
        "light-swing": "swing 5s infinite",
      },
      keyframes: {
        swing: {
          "0%, 100%": { transform: "rotate(9deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
      },
      fontFamily: {
        virgin: ["Virgil", "Comic Sans MS", "Bradley Hand", "cursive"],
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
