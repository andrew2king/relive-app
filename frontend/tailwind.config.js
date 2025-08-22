/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        'touch': {'raw': '(hover: none) and (pointer: coarse)'},
        'mouse': {'raw': '(hover: hover) and (pointer: fine)'},
      },
      colors: {
        // RELIVE品牌色彩
        brand: {
          primary: '#D4A574', // 怀旧金
          secondary: '#E8A87C', // 温暖橙色
          dark: '#8B4513', // 深棕色
          light: '#FAF6F0', // 米白色
          gray: '#F5F5F5', // 浅灰色
        },
        // 功能色彩
        success: '#52C41A',
        error: '#FF4D4F',
        warning: '#FAAD14',
        info: '#1890FF',
        text: {
          primary: '#262626',
          secondary: '#8C8C8C',
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['SFMono-Regular', 'Consolas', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.1)',
        'brand': '0 2px 8px rgba(212, 165, 116, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0,-8px,0)' },
          '70%': { transform: 'translate3d(0,-4px,0)' },
          '90%': { transform: 'translate3d(0,-2px,0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};