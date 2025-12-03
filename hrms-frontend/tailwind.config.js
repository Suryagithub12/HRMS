// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
      keyframes: {
        scrollRightToLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        // ✨ Added for "Coming Soon"
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scrollRightToLeft: "scrollRightToLeft 20s linear infinite",
        scrollLoop: "scrollRightToLeft 40s linear infinite",
        // ✨ Added new fade-in animation
        fadeIn: "fadeIn 1.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
