/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Every colour resolves through a CSS variable so the palette can be
      // swapped at runtime: `ThemeProvider` feeds one of the twelve sets in
      // `lib/themes.ts` to NativeWind's `vars()`. The fallbacks are Salbei, the
      // default, so a colour still renders if a variable is ever missing.
      colors: {
        background: "var(--background, #f7f5f0)",
        foreground: "var(--foreground, #26251f)",
        card: "var(--card, #ffffff)",
        "card-foreground": "var(--foreground, #26251f)",
        primary: "var(--primary, #3a7d44)",
        "primary-foreground": "var(--primary-foreground, #ffffff)",
        secondary: "var(--field, #f4f1e9)",
        "secondary-foreground": "var(--foreground, #26251f)",
        muted: "var(--field, #f4f1e9)",
        "muted-foreground": "var(--muted-foreground, #837d70)",
        accent: "var(--accent, #e4efe2)",
        "accent-foreground": "var(--accent-foreground, #316b3a)",
        destructive: "var(--status-rose-fg, #a3452e)",
        "destructive-foreground": "var(--primary-foreground, #ffffff)",
        border: "var(--border, #e7e2d7)",
        input: "var(--border, #e7e2d7)",
        ring: "var(--primary, #3a7d44)",
        gold: "var(--gold, #e9c46a)",
        "gold-foreground": "var(--gold-foreground, #43350e)",
        // Dark band behind a running clock, mirroring --timer-bg/--timer-fg.
        timer: "var(--timer, #24422a)",
        "timer-foreground": "var(--timer-foreground, #eef3e8)",
        // --row-h / --field: the two surfaces between background and card.
        "row-hover": "var(--row-hover, #faf8f2)",
        field: "var(--field, #f4f1e9)",
        "status-slate-bg": "var(--status-slate-bg, #efece1)",
        "status-slate-fg": "var(--status-slate-fg, #77705d)",
        "status-sky-bg": "var(--status-sky-bg, #e0ebe8)",
        "status-sky-fg": "var(--status-sky-fg, #2f6459)",
        "status-amber-bg": "var(--status-amber-bg, #f6ecd4)",
        "status-amber-fg": "var(--status-amber-fg, #8a6414)",
        "status-green-bg": "var(--status-green-bg, #e4efe2)",
        "status-green-fg": "var(--status-green-fg, #316b3a)",
        "status-rose-bg": "var(--status-rose-bg, #f7e3dd)",
        "status-rose-fg": "var(--status-rose-fg, #a3452e)",
      },
      borderRadius: {
        lg: "16px",
        md: "11px",
        sm: "8px",
        // The mobile time-tracking screens use softer corners than the
        // --r-card token: cards 22, rows/summary 20, timer band and calendar 24.
        row: "20px",
        card: "22px",
        band: "24px",
        tile: "15px",
      },
      fontFamily: {
        sans: ["Geist_400Regular"],
        medium: ["Geist_500Medium"],
        semibold: ["Geist_600SemiBold"],
        bold: ["Geist_700Bold"],
        mono: ["GeistMono_400Regular"],
        // React Native picks a font file by family name, not by weight, so a
        // bold mono figure needs its own family rather than `font-bold`.
        "mono-bold": ["GeistMono_700Bold"],
      },
    },
  },
  plugins: [],
};
