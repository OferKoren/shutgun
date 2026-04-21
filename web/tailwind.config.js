/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9A3412',
          600: '#9A3412',
          500: '#C2410C',
          400: '#EA580C',
          50: '#FFF7ED',
        },
        accent: { DEFAULT: '#059669', 600: '#059669' },
        cream: { DEFAULT: '#FFFBEB', 100: '#FFF8E1' },
        surface: '#FFFFFF',
        ink: '#0F172A',
        muted: '#F8F2F0',
        hairline: '#F2E6E2',
      },
      fontFamily: {
        display: ['Rubik', 'system-ui', 'sans-serif'],
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(154,52,18,0.04), 0 4px 16px rgba(154,52,18,0.06)',
      },
    },
  },
  plugins: [],
};
