import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'white',
  				foreground: 'hsl(var(--old-tool-primary))',
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--old-tool-primary))',
  				foreground: 'black'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--old-tool-secondary))',
  				foreground: 'black'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--old-tool-secondary))',
  				foreground: 'hsl(var(--old-tool-primary))',
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--old-tool-primary))',
  				foreground: 'white'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--old-tool-primary))',
  				foreground: 'hsl(var(--old-tool-secondary))',
  			},
  			border: 'hsl(var(--old-tool-primary))',
  			input: 'hsl(var(--old-tool-primary))',
  			ring: 'hsl(var(--old-tool-primary))',
  			chart: {
  				'1': 'hsl(var(--old-tool-primary))',
  				'2': 'hsl(var(--old-tool-primary))',
  				'3': 'hsl(var(--old-tool-primary))',
  				'4': 'hsl(var(--old-tool-primary))',
  				'5': 'hsl(var(--old-tool-primary))',
  			},
			// oldtoolprimary: 'hsl(var(--old-tool-primary))',
			// oldtoolsecondary: 'hsl(var(--old-tool-secondary))',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
