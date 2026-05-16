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
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(0 0% 4%)",
        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(0 0% 4%)",
        primary: "hsl(0 0% 9%)",
        "primary-foreground": "hsl(0 0% 98%)",
        secondary: "hsl(0 0% 96%)",
        "secondary-foreground": "hsl(0 0% 9%)",
        muted: "hsl(0 0% 96%)",
        "muted-foreground": "hsl(0 0% 45%)",
        accent: "hsl(0 0% 96%)",
        "accent-foreground": "hsl(0 0% 9%)",
        destructive: "hsl(0 70% 45%)",
        "destructive-foreground": "hsl(0 0% 98%)",
        border: "hsl(0 0% 90%)",
        input: "hsl(0 0% 90%)",
        ring: "hsl(0 0% 70%)",
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [],
};
