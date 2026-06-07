import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vinyl: {
          bg: "#0a0a0a",
          surface: "#121212",
          card: "#1a1a1a",
          border: "#2a2a2a",
          accent: "#1db954",
          accentDim: "#169c46",
          gold: "#ffd700",
          silver: "#c0c0c0",
          bronze: "#cd7f32",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "eq-1": "eq 0.9s ease-in-out infinite",
        "eq-2": "eq 1.2s ease-in-out infinite 0.1s",
        "eq-3": "eq 0.7s ease-in-out infinite 0.2s",
        "eq-4": "eq 1.3s ease-in-out infinite 0.15s",
        "eq-5": "eq 0.8s ease-in-out infinite 0.05s",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(29, 185, 84, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(29, 185, 84, 0.6)" },
        },
        eq: {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
