/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales de Aprende y Aplica usando CSS variables
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        carbon: 'var(--color-bg-dark)', // Carbón Digital
        surface: 'rgba(15, 20, 25, 0.8)', // Superficie con transparencia
        border: 'rgba(255, 255, 255, 0.1)',
        
        // Colores semánticos
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        
        // Estados de módulos
        'status-locked': 'var(--status-locked)',
        'status-not-started': 'var(--status-not-started)',
        'status-in-progress': 'var(--status-in-progress)',
        'status-completed': 'var(--status-completed)',
      },
      fontFamily: {
        heading: ['Montserrat', 'Arial', 'Helvetica', 'sans-serif'],
        body: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
        sans: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
        'h2': ['24px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'body-large': ['18px', { lineHeight: '1.5' }],
        'small': ['14px', { lineHeight: '1.5' }],
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'base': '12px',
      },
      boxShadow: {
        'glass': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'glass-hover': '0 4px 16px rgba(0, 102, 204, 0.2)',
        'glow': '0 0 20px rgba(0, 102, 204, 0.5)',
      },
      backdropBlur: {
        'glass': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease',
        'slide-up': 'slideUp 0.5s ease',
        'slide-in': 'slideIn 0.3s ease',
        'shimmer': 'shimmer 2s infinite',
        'pulse': 'pulse 2s infinite',
        'button-shimmer': 'buttonShimmer 2s infinite',
        'button-bounce': 'buttonBounce 0.6s ease-in-out',
        'button-glow': 'buttonGlow 2s ease-in-out infinite',
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
        slideIn: {
          'from': { transform: 'translateX(400px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        buttonShimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        buttonBounce: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
        buttonGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 102, 204, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 102, 204, 0.8), 0 0 30px rgba(0, 102, 204, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
