/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // @watchknight Neuroaesthetic Design System Tokens
        wk: {
          'obsidian-void': 'var(--wk-obsidian-void, #090A0D)',
          'slate-surface': 'var(--wk-slate-surface, #12151C)',
          'alabaster-ink': 'var(--wk-alabaster-ink, #F2EFE9)',
          'ash-muted': 'var(--wk-ash-muted, #7A808C)',
          'terracotta-pulse': 'var(--wk-terracotta-pulse, #B84A27)',
          'verdigris-signal': 'var(--wk-verdigris-signal, #4E9A7F)',
          obsidian: 'var(--wk-obsidian-void, #090A0D)',
          slate: 'var(--wk-slate-surface, #12151C)',
          alabaster: 'var(--wk-alabaster-ink, #F2EFE9)',
          ash: 'var(--wk-ash-muted, #7A808C)',
          terracotta: 'var(--wk-terracotta-pulse, #B84A27)',
          verdigris: 'var(--wk-verdigris-signal, #4E9A7F)',
        },
        // High-contrast Editorial Design Tokens (Colombel / Spatzek 2026 system)
        obsidian: {
          DEFAULT: 'rgb(var(--bg-obsidian-rgb, 9 10 13) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface-rgb, 18 21 28) / <alpha-value>)',
          card: 'rgb(var(--bg-card-rgb, 22 25 34) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated-rgb, 30 35 46) / <alpha-value>)',
          border: 'rgb(var(--border-editorial-rgb, 242 239 233) / <alpha-value>)',
          darker: 'rgb(var(--bg-obsidian-rgb, 9 10 13) / <alpha-value>)',
        },
        alabaster: {
          DEFAULT: 'rgb(var(--text-primary-rgb, 242 239 233) / <alpha-value>)',
          dim: 'rgb(var(--text-dim-rgb, 220 218 210) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb, 122 128 140) / <alpha-value>)',
          pure: 'rgb(var(--text-primary-rgb, 255 255 255) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--text-muted-rgb, 122 128 140) / <alpha-value>)',
          light: '#7A808C',
          dark: '#1E232E',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rust-rgb, 184 74 39) / <alpha-value>)', // terracotta pulse primary focal accent
          rust: 'rgb(var(--accent-rust-rgb, 184 74 39) / <alpha-value>)',
          coral: 'rgb(var(--accent-coral-rgb, 184 74 39) / <alpha-value>)', // terracotta pulse
          hover: 'rgb(var(--accent-rust-rgb, 202 84 45) / <alpha-value>)',
          glow: 'rgba(var(--accent-rust-rgb, 184 74 39), 0.2)',
        },
        // Editorial compatibility mappings for existing components
        carbon: {
          DEFAULT: 'var(--wk-slate-surface, #12151C)',
          surface: '#161922',
          elevated: '#1E232E',
          highlight: '#262B38',
        },
        cyan: {
          mint: 'var(--wk-verdigris-signal, #4E9A7F)', // Remapped to verdigris signal
          dim: '#38735E',
          glow: 'rgba(78, 154, 127, 0.2)',
        },
        amber: {
          warm: 'var(--wk-terracotta-pulse, #B84A27)', // Remapped to terracotta pulse
          dim: '#8E391E',
          glow: 'rgba(184, 74, 39, 0.2)',
        },
        glass: {
          border: 'rgba(242, 239, 233, 0.08)',
          'border-hover': 'rgba(242, 239, 233, 0.18)',
          'border-accent': 'rgba(184, 74, 39, 0.35)',
          surface: 'rgba(18, 21, 28, 0.75)',
          panel: 'rgba(9, 10, 13, 0.85)',
        },
      },
      fontFamily: {
        display: ['Syne', 'Space Grotesk', 'sans-serif'],
        subheading: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'fluid-marquee': ['clamp(3.5rem, 9.5vw, 9.5rem)', { lineHeight: '0.9', letterSpacing: '-0.035em' }],
        'fluid-hero': ['clamp(3rem, 7.5vw + 1rem, 7.5rem)', { lineHeight: '0.94', letterSpacing: '-0.04em' }],
        'fluid-h1': ['clamp(2.25rem, 4.5vw + 0.5rem, 4.25rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'fluid-h2': ['clamp(1.75rem, 3vw + 0.5rem, 2.85rem)', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        'fluid-h3': ['clamp(1.25rem, 1.8vw + 0.5rem, 1.85rem)', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'fluid-lead': ['clamp(1.05rem, 0.6vw + 0.95rem, 1.35rem)', { lineHeight: '1.6' }],
        'fluid-body': ['clamp(0.925rem, 0.4vw + 0.85rem, 1.1rem)', { lineHeight: '1.65' }],
        'fluid-sm': ['clamp(0.8rem, 0.3vw + 0.75rem, 0.95rem)', { lineHeight: '1.5' }],
        'fluid-xs': ['clamp(0.72rem, 0.2vw + 0.68rem, 0.82rem)', { lineHeight: '1.4' }],
        'fluid-mono': ['clamp(0.75rem, 0.25vw + 0.7rem, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-micro': ['clamp(0.68rem, 0.2vw + 0.62rem, 0.78rem)', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'editorial-card': '0 1px 2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(242, 239, 233, 0.08)',
        'editorial-elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(242, 239, 233, 0.1)',
        'nav-pill': '0 12px 32px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(242, 239, 233, 0.08)',
        'glow-accent': '0 0 24px -6px rgba(184, 74, 39, 0.25)',
        'liquid-card': '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(242, 239, 233, 0.06)',
      },
      backgroundImage: {
        'radial-spotlight': 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(184, 74, 39, 0.06), transparent 40%)',
        'radial-spotlight-amber': 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(184, 74, 39, 0.06), transparent 40%)',
        'noise-pattern': "radial-gradient(rgba(242, 239, 233, 0.03) 1px, transparent 1px)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        radarPing: {
          '75%, 100%': {
            transform: 'scale(2.2)',
            opacity: '0',
          },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
