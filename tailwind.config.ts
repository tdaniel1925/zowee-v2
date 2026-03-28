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
        bg: {
          primary: '#0A0A0B',
          secondary: '#111113',
          tertiary: '#1A1A1D',
        },
        accent: {
          DEFAULT: '#00E5B4',
          dim: '#00B890',
          glow: 'rgba(0, 229, 180, 0.15)',
        },
        text: {
          primary: '#F2F2F3',
          secondary: '#8A8A9A',
          tertiary: '#4A4A5A',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          accent: 'rgba(0, 229, 180, 0.3)',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease-out',
        blink: 'blink 1s ease-in-out infinite',
        slideIn: 'slideIn 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
