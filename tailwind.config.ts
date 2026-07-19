/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        panel: "#141b2e",
        border: "#26304a",
        ink: "#e8edf7",
        muted: "#9aa6c0",
        accent: "#5b8cff",
        ok: "#3fb950",
        warn: "#d29922",
        bad: "#f85149",
      },
    },
  },
  plugins: [],
};

export default config;
