/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'binance-bg': '#12161C', // Very dark background for the page
        'binance-card': '#1E2329', // Background for cards, modals, etc.
        'binance-header': '#181A20', // Background for header/footer, slightly different from cards
        'binance-yellow': '#FCD535', // Primary yellow (e.g., buttons, highlights)
        'binance-yellow-darker': '#F0B90B', // Darker yellow for hovers
        'binance-text-primary': '#EAECEF', // Main text (light gray/off-white)
        'binance-text-secondary': '#848E9C', // Secondary text (medium gray, for labels, less important info)
        'binance-text-tertiary': '#474D57', // Tertiary text (darker gray)
        'binance-border': '#2B3139', // Subtle borders for cards, dividers (was #373B40, making it a bit lighter to match Binance inputs)
        'binance-border-strong': '#55595F', // Stronger border for inputs etc.
        'binance-green': '#0ECB81', // Success/positive
        'binance-red': '#F6465D',   // Error/negative
        'binance-input-bg': '#2B3139', // Input field background
        'binance-hover-bg': 'rgba(255, 255, 255, 0.04)', // Subtle hover for list items/table rows
        'binance-tab-active-bg': 'rgba(252, 213, 53, 0.1)', // Subtle bg for active tab if not just border
      },
      keyframes: {
        'price-flash-green': {
          '0%': { backgroundColor: 'rgba(14, 203, 129, 0.2)' }, // binance-green with alpha
          '100%': { backgroundColor: 'transparent' },
        },
        'price-flash-red': {
          '0%': { backgroundColor: 'rgba(246, 70, 93, 0.2)' }, // binance-red with alpha
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'price-flash-green': 'price-flash-green 0.7s ease-out',
        'price-flash-red': 'price-flash-red 0.7s ease-out',
      },
    },
  },
  plugins: [],
}