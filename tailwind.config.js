/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF7",
        ink: "#111111",
        line: {
          red: "#D42E12",
          green: "#009645",
          purple: "#9900AA",
          orange: "#FA9E0D",
          blue: "#005EC4",
          brown: "#9D5B25",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Bricolage Grotesque'", "Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        dash: {
          to: { strokeDashoffset: "-24" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "train-in": {
          from: { transform: "translateX(-10px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        dash: "dash 1.2s linear infinite",
        ticker: "ticker 30s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        "train-in": "train-in 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2) both",
      },
    },
  },
  plugins: [],
};
