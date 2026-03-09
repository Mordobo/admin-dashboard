/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "Segoe UI", "sans-serif"],
      },
      colors: {
        mordobo: {
          bg: "#0F1117",
          surface: "#161821",
          surfaceHover: "#1C1E2A",
          card: "#1A1C28",
          border: "#2A2D3A",
          borderLight: "#353849",
          accent: "#6C5CE7",
          accentLight: "#8B7CF7",
          accentDim: "rgba(108, 92, 231, 0.15)",
          success: "#00D68F",
          successDim: "rgba(0, 214, 143, 0.12)",
          warning: "#FFAA00",
          warningDim: "rgba(255, 170, 0, 0.12)",
          danger: "#FF4757",
          dangerDim: "rgba(255, 71, 87, 0.12)",
          info: "#00B4D8",
          infoDim: "rgba(0, 180, 216, 0.12)",
          text: "#E8E9ED",
          textSecondary: "#8B8FA3",
          textMuted: "#5D6178",
        },
      },
    },
  },
  plugins: [],
};
