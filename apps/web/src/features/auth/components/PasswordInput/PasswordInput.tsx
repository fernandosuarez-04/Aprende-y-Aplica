'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  placeholder?: string;
  error?: string;
  className?: string;
  focusedField?: string | null;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function PasswordInput({
  id,
  placeholder = '••••••••',
  error,
  className = '',
  focusedField,
  onFocus,
  onBlur,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isFocused = focusedField === 'password';

  return (
    <div className="relative group">
      <motion.div
        className="relative rounded-xl border transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: isFocused 
            ? 'rgba(30, 41, 59, 0.7)' 
            : 'rgba(30, 41, 59, 0.5)',
          borderColor: isFocused 
            ? 'var(--color-primary, #3b82f6)' 
            : error 
              ? '#ef4444' 
              : 'rgba(71, 85, 105, 0.5)',
          borderWidth: isFocused ? '2px' : '1px',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.2)'
            : 'none',
        }}
        animate={{
          scale: isFocused ? 1.005 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {isFocused && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(90deg, var(--color-primary, #3b82f6), var(--color-success, #10b981))',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3">
          <Lock 
            className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" 
            style={{ 
              color: isFocused ? 'var(--color-primary, #3b82f6)' : 'rgba(203, 213, 225, 0.5)'
            }}
          />
          <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal tracking-widest ${className}`}
            style={{
              color: 'var(--text-color, rgba(203, 213, 225, 0.9))',
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 text-text-tertiary hover:text-text-secondary transition-colors p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ 
              color: isFocused ? 'var(--color-primary, #3b82f6)' : 'rgba(203, 213, 225, 0.5)'
            }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
