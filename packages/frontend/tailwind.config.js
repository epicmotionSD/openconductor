/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          surface: "hsl(var(--background-surface))",
          elevated: "hsl(var(--background-elevated))",
          hover: "hsl(var(--background-hover))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          secondary: "hsl(var(--foreground-secondary))",
          muted: "hsl(var(--foreground-muted))",
          disabled: "hsl(var(--foreground-disabled))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          light: "hsl(var(--secondary-light))",
          dark: "hsl(var(--secondary-dark))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          light: "hsl(var(--destructive-light))",
          dark: "hsl(var(--destructive-dark))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
          dark: "hsl(var(--success-dark))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
          dark: "hsl(var(--warning-dark))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        cta: "hsl(var(--cta))",
        badge: "hsl(var(--badge))",
        category: {
          memory: "hsl(var(--category-memory))",
          filesystem: "hsl(var(--category-filesystem))",
          database: "hsl(var(--category-database))",
          api: "hsl(var(--category-api))",
          search: "hsl(var(--category-search))",
          communication: "hsl(var(--category-communication))",
          monitoring: "hsl(var(--category-monitoring))",
          development: "hsl(var(--category-development))",
          custom: "hsl(var(--category-custom))",
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00FFB2 0%, #00C2FF 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-error': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'gradient-warning': 'linear-gradient(135deg, #FF9500 0%, #F59E0B 100%)',
        'gradient-dark': 'linear-gradient(180deg, #080B12 0%, #0F131D 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(0, 255, 178, 0.5), 0 0 40px rgba(0, 255, 178, 0.3)',
        'glow-blue': '0 0 20px rgba(0, 194, 255, 0.5), 0 0 40px rgba(0, 194, 255, 0.3)',
        'glow-success': '0 0 20px rgba(0, 255, 178, 0.5)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.5)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "grid-scroll": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(60px)" },
        },
        "rim-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "grid-scroll": "grid-scroll 8s linear infinite",
        "rim-pulse": "rim-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}