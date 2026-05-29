import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#d9e1e8",
        muted: "#64748b",
        surface: "#f8fafc",
        ink: "#0f172a",
        info: "#2563eb",
        success: "#15803d",
        warning: "#b45309",
        danger: "#b91c1c"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
