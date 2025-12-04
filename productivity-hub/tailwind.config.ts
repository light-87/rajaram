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
        background: {
          DEFAULT: "#0A0E27",
          card: "#151821",
        },
        accent: {
          primary: "#F59E0B",
          secondary: "#3B82F6",
          success: "#10B981",
        },
        text: {
          primary: "#E8E8E8",
          secondary: "#9CA3AF",
        },
        border: "#2D3748",
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
