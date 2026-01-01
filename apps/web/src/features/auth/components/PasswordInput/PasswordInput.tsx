'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'focusedField'> {
  id: string;
  placeholder?: string;
  error?: string;
  className?: string;
  focusedField?: string | null;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({
  id,
  placeholder = '••••••••',
  error,
  className = '',
  focusedField: _focusedField, // Renombrar para evitar que se pase al DOM
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localFocused, setLocalFocused] = useState(false);
  const isFocused = _focusedField === id || localFocused;
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalFocused(false);
    onBlur?.(e);
  };

  // Filtrar explícitamente focusedField de props para evitar que se pase al DOM
  const { focusedField, ...inputProps } = props as any;

  return (
    <div className="w-full">
      <motion.div
        className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${
          isFocused
            ? 'bg-white dark:bg-[#1E2329] border-[#00D4B3] shadow-lg shadow-[#00D4B3]/10'
            : error
              ? 'bg-white dark:bg-[#1E2329] border-red-500 dark:border-red-500'
              : 'bg-white dark:bg-[#1E2329] border-[#E9ECEF] dark:border-[#6C757D]/30'
        } ${isFocused ? 'ring-2 ring-[#00D4B3] ring-opacity-20' : ''}`}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center px-4 py-3.5">
          <Lock 
            className={`w-5 h-5 flex-shrink-0 mr-3 transition-colors duration-200 ${
              isFocused 
                ? 'text-[#00D4B3]' 
                : error
                  ? 'text-red-500'
                : 'text-[#6C757D] dark:text-white/50'
            }`}
          />
          <input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-50 transition-colors text-sm font-normal font-sans text-[#0A2540] dark:text-white placeholder:text-[#6C757D] dark:placeholder:text-white/50 ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...inputProps}
          />
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`ml-2 transition-colors p-1 rounded-lg ${
              isFocused 
                ? 'text-[#00D4B3]' 
                : 'text-[#6C757D] dark:text-white/50 hover:text-[#00D4B3] dark:hover:text-[#00D4B3]'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </motion.button>
        </div>
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput'; // Importante para devtools

