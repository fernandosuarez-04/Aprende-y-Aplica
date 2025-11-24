/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Colores principales de Aprende y Aplica
        primary: {
          DEFAULT: '#0066CC', // Azul Principal
          50: '#E6F2FF',
          100: '#CCE5FF',
          500: '#0066CC',
          600: '#0052A3', // Azul más oscuro
          900: '#0A0A0A', // Carbón Digital
        },
        dark: '#0A0A0A', // Carbón Digital
        light: '#F2F2F2', // Gris Neblina
        white: '#FFFFFF', // Blanco Puro
        
        // Colores semánticos
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        heading: ['Montserrat', 'Arial', 'Helvetica', 'sans-serif'],
        body: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
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
      },
      boxShadow: {
        'glass': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'glass-hover': '0 4px 16px rgba(0, 102, 204, 0.2)',
      },
      backdropBlur: {
        'glass': '8px',
      },
    },
  },
  plugins: [],
}

