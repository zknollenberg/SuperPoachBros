import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        court: '#0f172a',
        accent: '#f59e0b'
      }
    }
  },
  plugins: []
};

export default config;
