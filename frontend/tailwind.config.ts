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
        foreground: 'black',
        card: {
          DEFAULT: 'white',
          foreground: 'black',
        },
        popover: {
          DEFAULT: 'white',
          foreground: 'black',
        },
        primary: {
          DEFAULT: '#5EA7CC',
          foreground: 'white',
        },
        nav: {
          DEFAULT: '#2B5876',
          foreground: 'white',
        },
        secondary: {
          DEFAULT: 'white',
          foreground: 'black',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: 'black',
        },
        accent: {
          DEFAULT: '#EFAB00',
          foreground: 'black',
        },
        destructive: {
          DEFAULT: '#1A365D',
          foreground: 'white',
        },
        border: '#2B5876',
        input: '#2B5876',
        ring: '#2B5876',
        chart: {
          '1': '#2B5876',
          '2': '#C50F23',
          '3': '#8A0051',
          '4': '#EFAB00',
          '5': '#2B5876',
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
