'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(true); // Por ahora solo dark mode

  const toggleTheme = () => {
    // Por ahora solo mantenemos dark mode
    // En el futuro aquí se implementará el toggle real
    console.log('Theme toggle - por ahora solo dark mode');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center text-white transition-all duration-300 group"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.5)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(10, 10, 10, 0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(10, 10, 10, 0.5)';
      }}
    >
      <motion.div
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        ) : (
          <Sun className="w-5 h-5 group-hover:scale-110 transition-transform" />
        )}
      </motion.div>
    </button>
  );
}
