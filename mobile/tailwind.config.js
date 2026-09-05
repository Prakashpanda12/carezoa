/** Mirror of src/theme/tokens.ts — keep in sync. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0E7C7B", dark: "#0A5C5B", soft: "#E0F0EF" },
        accent: { DEFAULT: "#E8654A", soft: "#FBEBE7" },
        ink: "#1B1F1E",
        soft: "#5F6B68",
        faint: "#9AA5A2",
        paper: "#F6F4EE",
        card: "#FDFDFB",
        line: "#E5E2D8",
        success: "#1F9D6C",
        warn: "#C98A1B",
        danger: "#D3402E",
      },
      borderRadius: { xl2: "22px", xl3: "28px" },
    },
  },
  plugins: [],
};
