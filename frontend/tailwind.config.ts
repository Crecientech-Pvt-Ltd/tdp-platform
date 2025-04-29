import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'white',
        foreground: '#273386',
        card: {
          DEFAULT: 'white',
          foreground: '#273386',
        },
        popover: {
          DEFAULT: 'white',
          foreground: '#273386',
        },
        primary: {
          DEFAULT: '#273386',
          foreground: 'white',
        },
        secondary: {
          DEFAULT: 'white',
          foreground: '#273386',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#273386',
        },
        accent: {
          DEFAULT: '#EFAB00',
          foreground: '#273386',
        },
        destructive: {
          DEFAULT: '#273386',
          foreground: 'white',
        },
        border: '#273386',
        input: '#273386',
        ring: '#273386',
        chart: {
          '1': '#273386',
          '2': '#C50F23',
          '3': '#8A0051',
          '4': '#EFAB00',
          '5': '#273386',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
