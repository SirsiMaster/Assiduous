// Tailwind preset for Sirsi UI
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#60A3D9",
          dark: "#0B1F41",
          accent: "#FFD940"
        }
      },
      fontFamily: {
        sans: ["Geist Sans", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "Liberation Sans", "sans-serif"],
        display: ["DM Serif Display", "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"]
      },
      boxShadow: {
        card: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
      }
    }
  }
};

