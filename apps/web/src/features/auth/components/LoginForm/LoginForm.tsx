'use client';

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { LoginFormData } from '../../types/auth.types';
import { loginSchema } from './LoginForm.schema';
import { PasswordInput } from '../PasswordInput';
import { loginAction } from '../../actions/login';

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('emailOrUsername', data.emailOrUsername);
      formData.append('password', data.password);
      formData.append('rememberMe', data.rememberMe.toString());

      try {
        const result = await loginAction(formData);
        
        if (result?.error) {
          setError(result.error);
        }
        // Si no hay error, la acción redirect ya maneja la navegación
      } catch (error) {
        // Verificar si es una redirección de Next.js (no es un error real)
        if (error && typeof error === 'object' && 'digest' in error) {
          const digest = (error as any).digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            // Es una redirección exitosa, no mostrar error
            return;
          }
        }
        
        console.error('Login error:', error);
        setError('Error inesperado al iniciar sesión');
      }
    });
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

      {/* Error Message */}
      {error && (
        <motion.div 
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

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
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </motion.div>
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
            disabled={isPending}
          >
            <span className="relative z-10">
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </span>
            {/* Efecto de brillo al hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
}
