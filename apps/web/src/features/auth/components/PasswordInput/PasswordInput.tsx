'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function PasswordInput({
  id,
  placeholder = '••••••••',
  error,
  className = '',
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        className={`auth-input pr-12 ${error ? 'border-error' : ''} ${className}`}
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.8)',
          color: 'var(--org-text-color, #ffffff)',
          borderRadius: '12px'
        } as React.CSSProperties}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
