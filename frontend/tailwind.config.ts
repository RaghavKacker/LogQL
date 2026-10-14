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
          bg: "#10141d",
          sidebar: "#141a26",
          panel: "#18202e",
          surface: "#1f283a",
          border: "#28344b",
          borderLight: "#354461",
          hover: "#222c3e",
          active: "#4b678c",
          text: "#dde4ee",
          muted: "#8e9eb3",
          subtle: "#5f6f85"
        },
        token: {
          keyword: "#7ea3cc",
          ident: "#dde4ee",
          string: "#73b098",
          number: "#cca268",
          func: "#a392bf",
          op: "#84a98c",
          comment: "#6b7c93"
        },
        status: {
          success: "#6ea88f",
          warning: "#cca268",
          error: "#c97373",
          info: "#759bc2"
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
