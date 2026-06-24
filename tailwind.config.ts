import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#FAFAF8",
        card: "#FFFFFF",
        ink: "#1A1A1A",
        muted: "#8A8A8A",
        border: "#E8E8E6",
        accent: "#D4582A",
        "accent-hover": "#BF4D23",
        tag: "#F0EFED",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'DM Sans'", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
