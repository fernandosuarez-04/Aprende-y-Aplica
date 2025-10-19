'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { LoginFormData } from '../../types/auth.types';
import { loginSchema } from './LoginForm.schema';
import { PasswordInput } from '../PasswordInput';
import { useAuthStore } from '../../../../core/stores/authStore';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.emailOrUsername, data.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Welcome Message */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-color-contrast">Bienvenido de vuelta</h2>
        <p className="text-text-secondary">Ingresa a tu cuenta para continuar</p>
      </motion.div>

      {/* Email or Username */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <label htmlFor="emailOrUsername" className="auth-label">
          Correo o Usuario
        </label>
        <div className="relative">
          <input
            id="emailOrUsername"
            type="text"
            placeholder="tu@email.com o usuario"
            {...register('emailOrUsername')}
            className={`auth-input pr-12 ${errors.emailOrUsername ? 'border-error' : ''}`}
          />
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        </div>
        {errors.emailOrUsername && (
          <motion.p 
            className="auth-error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {errors.emailOrUsername.message}
          </motion.p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <label htmlFor="password" className="auth-label">
          Contraseña
        </label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        {errors.password && (
          <motion.p 
            className="auth-error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      {/* Remember Me & Forgot Password */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="auth-checkbox"
          />
          <span className="text-sm text-text-secondary">Recordarme</span>
        </label>
        <motion.button
          type="button"
          className="text-sm text-primary hover:text-primary/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ¿Olvidaste tu contraseña?
        </motion.button>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full relative overflow-hidden group"
            disabled={isLoading}
          >
            <span className="relative z-10">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </span>
            {/* Efecto de brillo al hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
}
