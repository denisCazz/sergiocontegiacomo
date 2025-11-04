/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2F5AA8",
          light: "#3F7BE0",
          accent: "#C7A452",
          dark: "#1E3D6A",
        },
        neutral: {
          base: "#F8FAFC",
          text: "#1F2933",
          muted: "#52606D",
          border: "#E4E7EB",
        },
      },
      fontFamily: {
        sans: ["'Work Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        serif: ["'Merriweather'", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
