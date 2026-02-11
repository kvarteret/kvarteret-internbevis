/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#EFE2CD',
        primaryText: '#000000',
        secondaryText: '#4A4A4A',
        danger: '#AA0000',
      },
    },
  },
  plugins: [],
};
