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
        // Redesign tokens (§4.1)
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          overlay: "var(--surface-overlay)",
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
          focus: "var(--border-focus)",
        },
        text: {
          DEFAULT: "var(--text)",
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          tertiary: "var(--text-tertiary)",
          supporting: "var(--text-supporting)",
          faint: "var(--text-faint)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },
        focus: {
          DEFAULT: "var(--focus)",
          tint: "var(--focus-tint)",
        },
        sink: {
          DEFAULT: "var(--sink)",
          tint: "var(--sink-tint)",
        },
        games: "var(--games)",
        other: "var(--other)",
        unclassified: "var(--unclassified)",
        selection: "var(--selection)",

        // Legacy compatibility
        tf: {
          bg: "var(--bg)",
          "surface-1": "var(--surface)",
          "surface-2": "var(--surface-hover)",
          hairline: "var(--border)",
          "fg-primary": "var(--text)",
          "fg-secondary": "var(--text-secondary)",
          "fg-muted": "var(--text-muted)",
          "fg-faint": "var(--unclassified)",
          amber: "var(--focus)",
          red: "var(--sink)",
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
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        ui: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        panel: "10px",
        control: "6px",
        chart: "3px",
        DEFAULT: "6px",
        sm: "3px",
        md: "6px",
        lg: "10px",
      },
      spacing: {
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-5": "24px",
        "space-6": "32px",
        "space-7": "48px",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "160ms",
        layout: "200ms",
      },
      transitionTimingFunction: {
        instrument: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
