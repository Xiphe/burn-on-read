/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.ts', './public/**/*.js'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
