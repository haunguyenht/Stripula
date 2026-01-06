import tailwindcssAnimate from 'tailwindcss-animate';

// Import shadow tokens from centralized token system
import { tailwindShadows } from './src/lib/tokens/shadows.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // OPUX Colors
        opux: {
          'bg-primary': 'var(--opux-bg-primary)',
          'bg-secondary': 'var(--opux-bg-secondary)',
          'text-primary': 'var(--opux-text-primary)',
          'text-secondary': 'var(--opux-text-secondary)',
          'border': 'var(--opux-border)',
          'accent': 'var(--opux-accent)',
        },
        terracotta: {
          DEFAULT: '#AB726F',
          light: '#b4817e',
          dark: '#9d5e5b',
          50: '#fdf5f4',
          100: '#fbeae9',
          200: '#f7d5d4',
          300: '#f0b5b2',
          400: '#e58d89',
          500: '#AB726F',
          600: '#9d5e5b',
          700: '#7a4946',
          800: '#653f3d',
          900: '#563938',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        // OPUX Design System - Inter as primary UI font
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        // Display font
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Shadow tokens imported from lib/tokens/shadows.js
      boxShadow: {
        ...tailwindShadows,
        // OPUX Glass shadows
        'opux-glass': '0 8px 32px #0000005e, inset 0 1px 0 #ffffff0d',
        'opux-glass-hover': '0 8px 32px #00000070, inset 0 1px 0 #ffffff14',
        'opux-button-black': '#3d3d3db8 0 0.602187px 1.08394px -1.25px, #3d3d3da3 0 2.28853px 4.11936px -2.5px, #3d3d3d40 0 10px 18px -3.75px',
        'opux-button-terracotta': '#9d5e5bb8 0 0.602187px 1.08394px -1.25px, #9d5e5ba3 0 2.28853px 4.11936px -2.5px, #9d5e5b40 0 10px 18px -3.75px',
      },
      backgroundImage: {
        // OPUX Gradients
        'gradient-aurora': 'linear-gradient(135deg, hsl(3 26% 55%), hsl(295 100% 60%))',
        'gradient-glass': 'linear-gradient(135deg, #33333359, #2e2e2e52)',
        'gradient-glass-elevated': 'linear-gradient(135deg, #4747476e, #40404066)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'chat-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Badge status animations
        'badge-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'badge-pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(245, 158, 11, 0.2)' },
          '50%': { boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)' },
        },
        'badge-glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)' },
        },
        // Tier card shimmer animation
        'shimmer-slow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'chat-fade-in': 'chat-fade-in 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease',
        // Badge status animations
        'badge-shimmer': 'badge-shimmer 2.5s ease-in-out infinite',
        'badge-pulse-soft': 'badge-pulse-soft 2s ease-in-out infinite',
        'badge-glow-pulse': 'badge-glow-pulse 2s ease-in-out infinite',
        // Tier card animations
        'shimmer-slow': 'shimmer-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
