import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Light-only: no dark mode variants
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
