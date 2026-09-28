/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emerald Gateway semantic tokens from stitch_minimalist_responsive_redesign
        surface: '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#3c4a42',
        'outline-stitch': '#6c7a71',
        'outline-variant': '#bbcabf',
        'primary-stitch': '#006c49',
        'primary-container': '#10b981',
        'on-primary-container': '#00422b',
        'secondary-stitch': '#006c4a',
        'secondary-container': '#82f5c1',
        'on-secondary-fixed-variant': '#005137',
        'tertiary-stitch': '#006398',
        'tertiary-container': '#4aaaef',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        // Existing brand & remapped utilities
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981', // primary-container
          600: '#006c49', // primary
          700: '#005236',
          800: '#00422b'
        },
        // Remap common hardcoded slate/emerald classes used across panels
        slate: {
          50: '#f8f9ff',
          100: '#eff4ff',
          200: '#dce9ff',
          300: '#d3e4fe',
          400: '#6c7a71',
          500: '#6c7a71',
          600: '#3c4a42',
          700: '#213145',
          800: '#14273c',
          900: '#0b1c30',
          950: '#081426'
        },
        emerald: {
          50: '#f0fdf4',
          100: '#d1fae5',
          300: '#6ee7b7',
          500: '#10b981',
          600: '#006c49',
          700: '#005236',
          800: '#00422b',
          900: '#00422b',
          950: '#002113'
        }
      }
    },
  },
  plugins: [],
}
