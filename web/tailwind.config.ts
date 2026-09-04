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
        tf: {
          bg: "#0D1117",
          "surface-1": "#161B22",
          "surface-2": "#1C2128",
          hairline: "#21262D",
          "fg-primary": "#E6EDF3",
          "fg-secondary": "#8B949E",
          "fg-muted": "#6E7681",
          "fg-faint": "#484F58",
          amber: "#D29922",
          red: "#F85149",
          "heat-0": "#161B22",
          "heat-1": "#3E331A",
          "heat-2": "#6F551D",
          "heat-3": "#A1771F",
          "heat-4": "#D29922",
        },
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
        sans: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
        ui: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
        display: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
