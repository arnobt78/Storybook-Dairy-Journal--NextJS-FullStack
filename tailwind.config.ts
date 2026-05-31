import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        lora: ["Lora", "serif"],
        fell: ["IM Fell English", "serif"],
      },
      colors: {
        paper: {
          light: "#f4ecda",
          DEFAULT: "#ede1cc",
          dark: "#e0d0b4",
        },
        leather: {
          light: "#d2691e",
          DEFAULT: "#8b4513",
          dark: "#5d2e0c",
          darkest: "#2e1005",
        },
        ink: {
          primary: "rgba(35,14,3,0.82)",
          secondary: "rgba(55,28,8,0.6)",
          faint: "rgba(100,55,20,0.35)",
        },
      },
      animation: {
        "page-flip-fwd": "pageFwd 0.65s cubic-bezier(0.4,0,0.2,1) forwards",
        "page-flip-bwd": "pageBwd 0.65s cubic-bezier(0.4,0,0.2,1) forwards",
        float: "float 4s ease-in-out infinite",
        breathe: "breathe 2.5s ease-in-out infinite",
      },
      keyframes: {
        pageFwd: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(-180deg)" },
        },
        pageBwd: {
          "0%": { transform: "rotateY(-180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        breathe: {
          "0%,100%": { opacity: "0.3" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
