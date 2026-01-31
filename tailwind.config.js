/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        secondary: '#0066FF',
        dark: {
          100: '#1a1a2e',
          200: '#16162a',
          300: '#0f0f1a',
        }
      },
    },
  },
  plugins: [],
};
