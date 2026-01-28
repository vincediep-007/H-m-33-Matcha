import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        matcha: {
          50: '#f4f9f4',
          100: '#e6f2e6',
          200: '#cecfc9', // Sage/Greyish
          300: '#a3bfa3',
          400: '#7da67d',
          500: '#2d5a27', // Primary Deep Green
          600: '#23471f',
          700: '#1a3517',
          800: '#122410',
          900: '#0a1409',
        },
        cream: {
          50: '#fdfbf7', // Main BG
          100: '#f7f3ea',
          200: '#efe6d5',
        },
        earth: {
          500: '#8c705f',
          800: '#5c4033', // Primary Text
        }
      },
      fontFamily: {
        serif: ['var(--font-merriweather)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config