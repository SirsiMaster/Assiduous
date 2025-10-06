# Sirsi UI (prototype)

Shared, framework-agnostic UI resources for Assiduous and related projects.

Contents (prototype snapshot)
- css/tokens.css: CSS variables for colors, spacing, radius, shadows
- tailwind-preset.js: Tailwind preset extending brand colors and fonts
- motion/presets.js: Small Motion One helpers (to be expanded)

Usage (local test)
- Link CSS via CDN later (to be published as @sirsimaster/sirsi-ui)
- Or import Tailwind preset in tailwind.config.js
  module.exports = { presets: [require("./sirsi-ui/tailwind-preset")] }

