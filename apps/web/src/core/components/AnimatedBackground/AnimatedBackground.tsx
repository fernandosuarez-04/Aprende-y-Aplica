'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface AnimatedBackgroundProps {
  className?: string;
}

export function AnimatedBackground({ className = '' }: AnimatedBackgroundProps) {
  // Generar elementos flotantes de forma dinámica
  const generateFloatingElements = (): FloatingElement[] => {
    const elements: FloatingElement[] = [];
    
    // Círculos decorativos
    for (let i = 0; i < 6; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 60, // Entre 20px y 80px
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 12, // Entre 8s y 20s
      });
    }
    
    return elements;
  };

  const floatingElements = generateFloatingElements();

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Gradiente de fondo animado */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(10, 37, 64, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(0, 212, 179, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 80%, rgba(10, 37, 64, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(10, 37, 64, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Elementos flotantes */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.size}px`,
            height: `${element.size}px`,
            background: 'linear-gradient(135deg, rgba(10, 37, 64, 0.1), rgba(0, 212, 179, 0.1))',
          }}
          animate={{
            y: [0, -20, 10, -15, 0],
            x: [0, 15, -10, 5, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 0.9, 1.05, 1],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Líneas de acento decorativas */}
      <motion.div
        className="absolute top-1/4 left-0 w-32 h-0.5 bg-gradient-to-r from-transparent via-[#0A2540]/30 to-transparent"
        animate={{
          x: ['-100px', '100vw'],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatDelay: 5,
          ease: 'linear',
        }}
      />
      
      <motion.div
        className="absolute bottom-1/3 left-0 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#00D4B3]/30 to-transparent"
        animate={{
          x: ['-100px', '100vw'],
          opacity: [0, 0.4, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatDelay: 8,
          ease: 'linear',
        }}
      />

      {/* Efectos de partículas sutiles */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-1 h-1 rounded-full"
        style={{ backgroundColor: 'rgba(10, 37, 64, 0.4)' }}
        animate={{
          y: [-10, -50, -30, -40, -10],
          opacity: [0, 0.6, 0.3, 0.7, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full"
        style={{ backgroundColor: 'rgba(0, 212, 179, 0.4)' }}
        animate={{
          y: [-15, -60, -20, -35, -15],
          opacity: [0, 0.5, 0.2, 0.6, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />

      {/* Gradiente radial móvil */}
      <motion.div
        className="absolute inset-0 opacity-3"
        animate={{
          background: [
            'radial-gradient(circle at 30% 40%, rgba(10, 37, 64, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 70% 60%, rgba(0, 212, 179, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 50% 80%, rgba(10, 37, 64, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 30% 40%, rgba(10, 37, 64, 0.08) 0%, transparent 60%)',
          ],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
