/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Trinity AI Color System
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
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
        // Trinity AI Agent Colors
        'trinity-oracle': 'hsl(var(--trinity-oracle))',
        'trinity-sentinel': 'hsl(var(--trinity-sentinel))',
        'trinity-sage': 'hsl(var(--trinity-sage))',
        'trinity-neutral': 'hsl(var(--trinity-neutral))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Bloomberg Terminal-style shadows
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'premium': '0 10px 40px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-oracle': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-sentinel': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-sage': '0 0 20px rgba(147, 51, 234, 0.3)',
      },
      // Enhanced backdrop blur
      backdropBlur: {
        'trinity': '20px',
        'trinity-enhanced': '40px',
      },
      // Professional animations
      animation: {
        'trinity-fade-in': 'trinity-fade-in 0.5s ease-out',
        'trinity-slide-in': 'trinity-slide-in 0.3s ease-out',
        'trinity-shimmer': 'trinity-shimmer 2s ease-in-out infinite',
        'trinity-glow': 'trinity-glow 3s ease-in-out infinite',
        'trinity-pulse-oracle': 'trinity-pulse-oracle 2s ease-in-out infinite',
        'trinity-pulse-sentinel': 'trinity-pulse-sentinel 2s ease-in-out infinite',
        'trinity-pulse-sage': 'trinity-pulse-sage 2s ease-in-out infinite',
      },
      // Bloomberg Terminal typography
      fontFamily: {
        'display': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      // Professional spacing system
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Enhanced transitions
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      transitionTimingFunction: {
        'professional': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}