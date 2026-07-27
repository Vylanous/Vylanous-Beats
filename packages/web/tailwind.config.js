/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "vb-black": "#0a0a0c",
        "vb-black-light": "#121217",
        "vb-surface": "#1a1a20",
        "vb-surface-hover": "#242429",
        "vb-purple": "#7c2fcb",
        "vb-purple-bright": "#a24df5",
        "vb-purple-deep": "#5c1fa5",
        "vb-chrome": "#e0e0e0",
        "vb-text": "#edeef2",
        "vb-muted": "#7a7c88",
      },
      fontFamily: {
        display: "ui-monospace, SFMono-Regular, Menlo, monospace",
        sub: "system-ui, sans-serif",
      },
    },
  },
  plugins: [],
};
