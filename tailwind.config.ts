import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#15181d",
        panel2: "#1c2026",
        border: "#272c33",
        muted: "#8b939e",
        text: "#e6e8eb",
        accent: "#7cc4ff",
        success: "#7ed4a3",
        danger: "#ff7a7a",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
