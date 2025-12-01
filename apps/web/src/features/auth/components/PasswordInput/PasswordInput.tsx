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
        className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${
          isFocused
            ? 'dark:bg-slate-800/70 bg-gray-50 dark:border-primary border-primary'
            : error
              ? 'dark:bg-slate-800/50 bg-gray-50 dark:border-red-500 border-red-500'
              : 'dark:bg-slate-800/50 bg-gray-50 dark:border-slate-600/50 border-gray-300/50'
        } ${isFocused ? 'border-2' : 'border'} ${
          isFocused
            ? 'dark:shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_4px_12px_-2px_rgba(0,0,0,0.2)] shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_4px_12px_-2px_rgba(0,0,0,0.1)]'
            : ''
        }`}
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
            className={`w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200 ${
              isFocused 
                ? 'text-primary' 
                : 'text-gray-400 dark:text-slate-500'
            }`}
          />
          <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal tracking-widest text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 ${className}`}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`ml-2 transition-colors p-1 ${
              isFocused 
                ? 'text-primary' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
