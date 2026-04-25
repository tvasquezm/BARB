/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F172A",
        secondary: "#64748B",
        tertiary: "#3B82F6",
        accent: "#10B981",
        warning: "#F59E0B",
        neutral: "#F8FAFC",
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        h1: ['2.25rem', { fontWeight: '700' }],
        body: ['1rem', { fontWeight: '400' }],
      },
      borderRadius: {
        md: '12px',
      },
      spacing: {
        md: '16px',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
