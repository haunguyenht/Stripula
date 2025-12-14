/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['SF Pro Display', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                // Liquid Glass 2026 Color System
                background: {
                    DEFAULT: "hsl(var(--background) / <alpha-value>)",
                    secondary: "hsl(var(--background-secondary) / <alpha-value>)",
                },
                foreground: {
                    DEFAULT: "hsl(var(--foreground) / <alpha-value>)",
                    muted: "hsl(var(--foreground-muted) / <alpha-value>)",
                    dim: "hsl(var(--foreground-dim) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
                // Primary - Liquid Blue (#007AFF)
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                },
                // Secondary - Liquid Purple (#AF52DE)
                secondary: {
                    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
                    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                // Accent - Liquid Indigo (#5856D6)
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                },
                // Info - Liquid Teal (#5AC8FA)
                info: {
                    DEFAULT: "hsl(var(--info) / <alpha-value>)",
                    foreground: "hsl(var(--info-foreground) / <alpha-value>)",
                },
                // Destructive - Apple System Red (#FF3B30)
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
                },
                // Success - Apple System Green (#34C759)
                success: {
                    DEFAULT: "hsl(var(--success) / <alpha-value>)",
                    foreground: "hsl(var(--success-foreground) / <alpha-value>)",
                },
                // Declined/Die - Apple System Red (#FF3B30)
                declined: {
                    DEFAULT: "hsl(var(--declined) / <alpha-value>)",
                    foreground: "hsl(var(--declined-foreground) / <alpha-value>)",
                },
                // Warning - Apple System Orange (#FF9500)
                warning: {
                    DEFAULT: "hsl(var(--warning) / <alpha-value>)",
                    foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
                },
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",
            },
            boxShadow: {
                // Liquid Glass shadows - updated with blue primary glow
                'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 80px rgba(0, 122, 255, 0.08)',
                'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
                'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 100px rgba(0, 122, 255, 0.1)',
                'glass-primary': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 30px rgba(0, 122, 255, 0.25)',
                'glass-success': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 30px rgba(52, 199, 89, 0.25)',
                'glass-error': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 30px rgba(255, 59, 48, 0.25)',
                // Glow effects - updated with Liquid Glass colors
                'glow-primary': '0 0 24px rgba(0, 122, 255, 0.4)',
                'glow-success': '0 0 24px rgba(52, 199, 89, 0.4)',
                'glow-error': '0 0 24px rgba(255, 59, 48, 0.4)',
                'glow-warning': '0 0 24px rgba(255, 149, 0, 0.4)',
                'glow-info': '0 0 24px rgba(90, 200, 250, 0.4)',
            },
            backdropBlur: {
                'glass': '24px',
                'glass-sm': '16px',
                'glass-lg': '32px',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 4px)",
                sm: "calc(var(--radius) - 8px)",
                'xl': '1.25rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
        },
    },
    plugins: [],
}
