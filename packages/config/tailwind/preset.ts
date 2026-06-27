import type { Config } from "tailwindcss";

/**
 * DeLaw design system — Tailwind preset.
 *
 * Values are taken verbatim from the Claude Design HTML exports
 * (main.html, dashboard.dc.html, notification.html, profile.html) and the
 * "Design System" screen documented in dashboard.dc.html. Do not invent new
 * colours — extend this preset if the design introduces a new token.
 *
 * Two layers are encoded:
 *  - Canonical named tokens (from the Design System swatch panel / spec §14.3)
 *  - The full "as-built" palette actually used across the UI markup
 */
const preset = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Canonical tokens (Design System screen / spec §14.3) ---
        navy: "#0A0F1E", // --bg-base
        charcoal: "#111827", // --bg-charcoal
        surface: {
          DEFAULT: "#1C2333", // --surface
          raised: "#232B3E", // --surface-2
        },
        gold: {
          DEFAULT: "#C9A84C", // --accent-gold
          hover: "#D4B25E",
          deep: "#9C7F33",
          muted: "#7D6A3C",
          ink: "#1A1404", // text colour on gold surfaces
        },
        border: {
          DEFAULT: "#2D3748",
          hover: "#3D4A5C",
        },
        text: {
          primary: "#F0F4FF", // --text-primary
          cream: "#F4F1E6", // serif headings / brand
          body: "#EDF1FB",
          secondary: "#C7D0E0",
          tertiary: "#B7C0D2",
          muted: "#8B95A8",
          faint: "#5C6678",
          ghost: "#4F596E",
        },
        // --- Semantic ---
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        // --- As-built surface/border ramp used throughout the UI ---
        bg: {
          base: "#0A0F1E",
          900: "#0B1020",
          850: "#0C1120",
          800: "#0E1424",
          750: "#101728",
          700: "#121A2B",
          600: "#141B2E",
          500: "#1A2236",
          hover: "#161D30", // sidebar / header control hover
        },
        line: {
          subtle: "#1A2336",
          DEFAULT: "#232E44",
          strong: "#243049",
          accent: "#33415C",
          raised: "#2B3650",
          faint: "#1F2840", // command palette dividers
          hover: "#4A5772",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "'Source Serif 4'", "Georgia", "serif"],
        mono: ["var(--font-mono)", "'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Design System screen documents a 4 / 8 / 12 / 16 radius scale
        sm: "4px",
        DEFAULT: "8px",
        md: "9px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
        "3xl": "18px",
      },
      boxShadow: {
        gold: "0 2px 12px rgba(201,168,76,.25)",
        "gold-lg": "0 4px 20px rgba(201,168,76,.3)",
        card: "0 20px 60px rgba(0,0,0,.4)",
        "card-lg": "0 24px 70px rgba(0,0,0,.45)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        rise: "rise .2s ease",
        fade: "fade .2s ease",
        spin: "spin .7s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>;

export default preset;
