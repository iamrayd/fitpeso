/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      // Red & black, taken from the R/D logo. Keep in sync with `C` in components/ui.tsx.
      colors: {
        bg: '#0A0A0A',
        card: '#141414',
        raised: '#1F1F1F',
        line: '#2A2A2A',
        ink: '#F5F5F5',
        sub: '#A3A3A3',
        dim: '#8A8A8A', // 5.6:1 on bg (WCAG AA)
        accent: '#E2232D',
        glow: '#FF4D57', // red for small text: 6:1 on bg
        fill: '#D91F28', // red behind white text (4.6:1)
        warn: '#F5A524',
      },
    },
  },
  plugins: [],
};
