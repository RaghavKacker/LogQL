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
          bg: "#0d1117",
          sidebar: "#13161c",
          panel: "#161920",
          surface: "#1e222b",
          border: "#282c37",
          borderLight: "#353a48",
          hover: "#252934",
          active: "#2e3442",
          text: "#f1f5f9",
          muted: "#94a3b8",
          subtle: "#64748b"
        },
        token: {
          keyword: "#93c5fd",
          ident: "#f1f5f9",
          string: "#86efac",
          number: "#fcd34d",
          func: "#c084fc",
          op: "#94a3b8",
          comment: "#64748b"
        },
        status: {
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#38bdf8"
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
          "Inter",
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
