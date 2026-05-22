import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kg: {
          primary: "#0E6E6E",
          "primary-dark": "#0a5555",
          accent: "#EBA33D",
          "accent-dark": "#d4922f",
          tertiary: "#3D7AE8",
          neutral: "#1F2421",
          muted: "#5c6560",
          surface: "#F4F6F5",
          border: "#E2E8E6",
          "teal-soft": "#E6F3F3",
          "gold-soft": "#FDF4E6",
          "cream": "#FBF7F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        kg: "16px",
      },
      boxShadow: {
        kg: "0 4px 20px rgba(14, 110, 110, 0.08)",
        "kg-sm": "0 2px 8px rgba(31, 36, 33, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
