import { Variants } from 'framer-motion';

// Variantes de animación básicas
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  }
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  }
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  }
};

export const scaleOnHover: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05, 
    transition: { 
      duration: 0.2, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  }
};

// Animaciones escalonadas
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Animación de shimmer
export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-100% 0'
  },
  animate: {
    backgroundPosition: '100% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop'
    }
  }
};

// Configuraciones de transición
export const transitionConfig = {
  smooth: {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94] as const
  },
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20
  }
};

