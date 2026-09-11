/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Verde campo: acción principal
        brand: {
          50: "#F0F8F2",
          100: "#DCEFE1",
          200: "#BBDFC5",
          300: "#8CC79E",
          400: "#57A872",
          500: "#2E7D4F",
          600: "#256A42",
          700: "#1B5E3A",
          800: "#154A2E",
          900: "#0F3A24",
        },
        // Tierra/arena: fondos y superficies cálidas
        sand: {
          50: "#FDFBF7",
          100: "#FAF7F2",
          200: "#F3EDE3",
          300: "#E8DFD0",
          400: "#D6C9B3",
          500: "#B9A68A",
        },
        earth: {
          600: "#8A5A3C",
          700: "#6E4730",
          800: "#4F3223",
        },
        // Ámbar: pendientes y avisos
        harvest: {
          100: "#FDF1DC",
          300: "#F6CE8A",
          500: "#E9A23B",
          700: "#B9771A",
        },
      },
      fontFamily: {
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 41, 26, 0.04), 0 8px 24px -12px rgba(31, 41, 26, 0.18)",
        "card-hover": "0 2px 4px rgba(31, 41, 26, 0.06), 0 16px 40px -16px rgba(31, 41, 26, 0.28)",
        glow: "0 0 0 4px rgba(46, 125, 79, 0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(1200px 600px at 10% -10%, rgba(46,125,79,0.18), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(233,162,59,0.16), transparent 55%)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
