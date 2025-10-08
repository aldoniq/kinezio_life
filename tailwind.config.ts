import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основная палитра
        'ultramarine': '#2D59F0',
        'picton': '#50C4FF', 
        'rich-black': '#070B14',
        // Градиенты и дополнительные цвета
        primary: {
          DEFAULT: '#2D59F0',
          light: '#50C4FF',
          dark: '#070B14'
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontSize: {
        // Кастомная типографика
        'heading-1': ['48px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-2': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['18px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semi-bold': '600',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config; 