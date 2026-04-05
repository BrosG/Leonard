/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy aliases (keep for compatibility)
        'primary': '#dbeafe',
        'primary-dark': '#bfdbfe',
        'secondary': '#e0e7ff',
        'accent': '#fef3c7',
        'text-dark': '#1e293b',
        'text-light': '#475569',
        'background': '#faf8f3',
        'surface': '#ffffff',
        'ocean-blue': '#0d3b66',
        'ocean-light': '#1a5276',
        'marine': '#075985',

        // Luxury yacht palette
        'navy': { dark: '#0a1628', DEFAULT: '#0d3b66', light: '#1a5276' },
        'gold': { bright: '#d4af37', DEFAULT: '#b8960f', light: '#f4e4c1', muted: '#8b7d3c' },
        'aqua': { DEFAULT: '#0f8395', light: '#06d6a0' },
        'cream': '#faf8f3',
        'charcoal': '#2c3e50',
        'taupe': '#8b8680',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Lato"', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        '7xl': ['5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 8px 30px rgba(0, 0, 0, 0.1)',
        'gold': '0 0 30px rgba(212, 175, 55, 0.2)',
        'luxury': '0 20px 60px rgba(13, 59, 102, 0.15)',
      },
      animation: {
        'subtle-beat': 'subtle-beat 2s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'gold-pulse': 'gold-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'subtle-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'wave': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.5)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ocean-gradient': 'linear-gradient(135deg, #0d3b66 0%, #1a5276 100%)',
        'luxury-gradient': 'linear-gradient(135deg, #0a1628 0%, #0d3b66 50%, #0f8395 100%)',
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #b8960f 100%)',
      },
    },
  },
  plugins: [],
};
