/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  daisyui:{
    base: false,
    themes:[
      {
        myTheme: {
          'base-100': "#121826",
          "secondary": "#04bf9f",
          "primary": "#0377c9",
        }
      }
    ]
  },
  theme: {
    extend: {
      colors:{
        primary_bg: 'rgb(18,24,38)',
      }
    },
  },
  plugins: [require("daisyui")],
};

module.exports = config;
