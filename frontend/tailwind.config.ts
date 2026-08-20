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
        background: '#0B0F14',
        surface: '#111821',
        blue: '#4F7CFF',
        cyan: '#5CC8D7',
        teal: '#4FAF9D',
        amber: '#D6A756',
        coral: '#D96868',
        primary: '#E8EDF2',
        muted: '#8D98A5',
        'scenario-amber': '#17150F',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite'
      }
    },
  },
  plugins: [],
}
export default config
