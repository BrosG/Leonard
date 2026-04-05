/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#dbeafe',
        'primary-dark': '#bfdbfe',
        'secondary': '#e0e7ff',
        'accent': '#fef3c7',
        'text-dark': '#1e293b',
        'text-light': '#475569',
        'background': '#f8fafc',
        'surface': '#ffffff',
        'ocean-blue': '#0c4a6e',
        'ocean-light': '#0369a1',
        'marine': '#075985',
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
      },
      animation: {
        'subtle-beat': 'subtle-beat 2s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
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
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ocean-gradient': 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
      },
    },
  },
  plugins: [],
};