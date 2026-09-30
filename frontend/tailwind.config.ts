import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(255 158 44 / <alpha-value>)',
        secondary: 'rgb(255 197 51 / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
