import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F2EFE9",
          50: "#FAF9F6",
          100: "#F2EFE9",
          200: "#EAE6DE",
          300: "#E0DBD1",
          400: "#D0C9BC",
          500: "#B8B0A2",
          600: "#9B9489",
          700: "#6B6358",
          800: "#3D3830",
          900: "#1C1810"
        },
        espresso: {
          DEFAULT: "#1C1810",
          light: "#2E2720",
          dark: "#0E0D0A"
        },
        background: "#F2EFE9",
        surface: "#EAE6DE",
        border: "#D0C9BC",
        "border-strong": "#B8B0A2",
        "text-primary": "#1C1810",
        "text-secondary": "#6B6358",
        "text-muted": "#9B9489"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"]
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        lg: "6px",
        xl: "8px"
      },
      boxShadow: {
        sm: "0 1px 3px rgba(28, 24, 16, 0.06)",
        DEFAULT: "0 2px 8px rgba(28, 24, 16, 0.08)",
        lg: "0 4px 16px rgba(28, 24, 16, 0.10)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
