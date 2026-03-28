import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zowee: {
          green: '#00E87A',
          'green-dark': '#00C066',
          'green-glow': 'rgba(0,232,122,0.15)',
          dark: '#0A0A0F',
          'dark-2': '#111118',
          'dark-3': '#1A1A24',
          'dark-4': '#22222E',
          'dark-5': '#2C2C3A',
          muted: '#6B6B80',
          'muted-2': '#9090A8',
          light: '#E8E8F0',
        },
        // Keep old names for backwards compatibility
        bg: {
          primary: '#0A0A0F',
          secondary: '#111118',
          tertiary: '#1A1A24',
        },
        accent: {
          DEFAULT: '#00E87A',
          dim: '#00C066',
          glow: 'rgba(0,232,122,0.15)',
        },
        text: {
          primary: '#E8E8F0',
          secondary: '#9090A8',
          tertiary: '#6B6B80',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          accent: 'rgba(0,232,122,0.3)',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        small: '8px',
        large: '24px',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        cycleOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-20px)' },
        },
        cycleIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        smsSlide: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '15%': { opacity: '1', transform: 'translateY(0)' },
          '85%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-12px)' },
        },
        greenPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,232,122,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0,232,122,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.7s ease forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-in-right': 'slideInRight 0.7s ease forwards',
        slideIn: 'slideIn 0.4s ease-out',
        blink: 'blink 1s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'green-pulse': 'greenPulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
