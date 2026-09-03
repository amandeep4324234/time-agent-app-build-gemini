import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          supporting: "var(--text-supporting)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
          "on-accent": "var(--text-on-accent)",
        },
        border: {
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
          focus: "var(--border-focus)",
        },
        cat: {
          focus: "var(--cat-focus)",
          sink: "var(--cat-sink)",
          games: "var(--cat-games)",
          other: "var(--cat-other)",
          unclassified: "var(--cat-unclassified)",
          private: "var(--cat-private)",
        },
        accent: {
          creature: "var(--accent-creature)",
        },
        state: {
          warn: "var(--state-warn)",
          error: "var(--state-error)",
          positive: "var(--cat-focus)",
          death: "var(--cat-sink)",
        },
      },
      fontFamily: {
        ui: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        display: ["'Instrument Serif'", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
