/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Inter', 'sans-serif'],
        mono: ['Cairo', 'Inter', 'sans-serif'],
        cairo: ['Cairo', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
