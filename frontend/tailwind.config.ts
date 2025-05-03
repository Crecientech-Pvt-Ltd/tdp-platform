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
          DEFAULT: '#5EA7CC',
          foreground: 'white',
        },
        border: '#5EA7CC',
        input: '#5EA7CC',
        ring: '#5EA7CC',
        chart: {
          '1': '#5EA7CC',
          '2': '#C50F23',
          '3': '#8A0051',
          '4': '#EFAB00',
          '5': '#5EA7CC',
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
