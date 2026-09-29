import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ide: {
          bg: "#0c0e14",
          sidebar: "#10131c",
          panel: "#141824",
          surface: "#191f2e",
          border: "#232b3e",
          borderLight: "#323d57",
          hover: "#1f2638",
          active: "#252e42",
          text: "#e6edf3",
          muted: "#8b949e",
          subtle: "#5a6578"
        },
        token: {
          keyword: "#79c0ff",
          ident: "#e6edf3",
          string: "#a5d6ff",
          number: "#ffa657",
          func: "#d2a8ff",
          op: "#ff7b72",
          comment: "#8b949e"
        },
        status: {
          success: "#3fb950",
          warning: "#d29922",
          error: "#f85149",
          info: "#58a6ff"
        }
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif"
        ],
      },
    },
  },
  plugins: [],
};
export default config;
