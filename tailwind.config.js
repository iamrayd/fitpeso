/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0A0B0E',
        card: '#14161B',
        raised: '#1C1F26',
        line: '#262A33',
        ink: '#F4F5F7',
        sub: '#9BA1AD',
        dim: '#5F6673',
        lime: '#C6F432',
        mint: '#3DDC97',
        sky: '#5AB4FF',
        amber: '#FFB547',
        rose: '#FF6B7A',
        violet: '#A78BFA',
      },
    },
  },
  plugins: [],
};
