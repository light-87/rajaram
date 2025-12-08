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
          DEFAULT: "#0F0A1A",
          card: "#1A1425",
          elevated: "#241D30",
        },
        // Vibrant color palette
        pink: {
          light: "#F9A8D4",
          DEFAULT: "#EC4899",
          dark: "#DB2777",
          glow: "rgba(236, 72, 153, 0.4)",
        },
        purple: {
          light: "#C4B5FD",
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          glow: "rgba(139, 92, 246, 0.4)",
        },
        sky: {
          light: "#BAE6FD",
          DEFAULT: "#38BDF8",
          dark: "#0EA5E9",
          glow: "rgba(56, 189, 248, 0.4)",
        },
        yellow: {
          light: "#FEF08A",
          DEFAULT: "#FACC15",
          dark: "#EAB308",
          glow: "rgba(250, 204, 21, 0.4)",
        },
        green: {
          light: "#86EFAC",
          DEFAULT: "#22C55E",
          dark: "#16A34A",
          glow: "rgba(34, 197, 94, 0.4)",
        },
        coral: {
          light: "#FED7AA",
          DEFAULT: "#FB923C",
          dark: "#EA580C",
          glow: "rgba(251, 146, 60, 0.4)",
        },
        // Keep accent for backward compatibility
        accent: {
          primary: "#EC4899",
          secondary: "#8B5CF6",
          success: "#22C55E",
        },
        text: {
          primary: "#F5F5F5",
          secondary: "#A1A1AA",
        },
        border: {
          DEFAULT: "#2D2640",
          light: "#3D3555",
        },
      },
      borderRadius: {
        DEFAULT: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      boxShadow: {
        glow: "0 0 20px -5px",
        "glow-lg": "0 0 30px -5px",
        "glow-pink": "0 0 25px -5px rgba(236, 72, 153, 0.5)",
        "glow-purple": "0 0 25px -5px rgba(139, 92, 246, 0.5)",
        "glow-sky": "0 0 25px -5px rgba(56, 189, 248, 0.5)",
        "glow-yellow": "0 0 25px -5px rgba(250, 204, 21, 0.5)",
        "glow-green": "0 0 25px -5px rgba(34, 197, 94, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-pink-purple": "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
        "gradient-purple-sky": "linear-gradient(135deg, #8B5CF6 0%, #38BDF8 100%)",
        "gradient-sky-green": "linear-gradient(135deg, #38BDF8 0%, #22C55E 100%)",
        "gradient-yellow-coral": "linear-gradient(135deg, #FACC15 0%, #FB923C 100%)",
        "gradient-rainbow": "linear-gradient(135deg, #EC4899 0%, #8B5CF6 25%, #38BDF8 50%, #22C55E 75%, #FACC15 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
