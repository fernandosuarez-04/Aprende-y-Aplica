'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { LoginFormData } from '../../types/auth.types';
import { loginSchema } from '../LoginForm/LoginForm.schema';
import { PasswordInput } from '../PasswordInput';
import { loginAction } from '../../actions/login';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';

interface OrganizationLoginFormProps {
  organizationId: string;
  organizationSlug: string;
}

export function OrganizationLoginForm({
  organizationId,
  organizationSlug,
}: OrganizationLoginFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectInfo, setRedirectInfo] = useState<{ to: string; message: string; countdown: number } | null>(null);
  const router = useRouter();
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  // Limpiar intervalo al desmontar componente
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsPending(true);
    
    try {
      console.log('🔄 Iniciando proceso de login (organización)...');
      
      const formData = new FormData();
      formData.append('emailOrUsername', data.emailOrUsername);
      formData.append('password', data.password);
      formData.append('rememberMe', data.rememberMe.toString());
      formData.append('organizationId', organizationId);
      formData.append('organizationSlug', organizationSlug);

      console.log('📤 Enviando datos al servidor...');
      const result = await loginAction(formData);
      
      console.log('📥 Respuesta recibida:', result);
      
      if (result?.error) {
        console.error('❌ Error en login:', result.error);
        
        // Si hay información de redirección, mostrar mensaje con countdown
        if (result.redirectTo && result.redirectMessage) {
          setError(result.error);
          setRedirectInfo({
            to: result.redirectTo,
            message: result.redirectMessage,
            countdown: 5
          });
          
          // Limpiar intervalo anterior si existe
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          
          // Iniciar countdown y redirección
          let countdown = 5;
          countdownIntervalRef.current = setInterval(() => {
            countdown -= 1;
            setRedirectInfo(prev => prev ? { ...prev, countdown } : null);
            
            if (countdown <= 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              router.push(result.redirectTo);
            }
          }, 1000);
          
          setIsPending(false);
        } else {
          setError(result.error);
          setIsPending(false);
        }
      }
    } catch (error: any) {
      console.error('💥 Error capturado en onSubmit:', error);
      
      if (error && typeof error === 'object') {
        if ('digest' in error) {
          const digest = error.digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            console.log('✅ Redirección detectada, login exitoso');
            throw error;
          }
        }
        
        if (error.message && error.message.includes('NEXT_REDIRECT')) {
          console.log('✅ Redirección detectada (alternativa), login exitoso');
          throw error;
        }
      }
      
      console.error('❌ Error inesperado:', error);
      setError('Error inesperado al iniciar sesión');
      setIsPending(false);
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

      {/* Error Message */}
      {error && (
        <motion.div 
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p>{error}</p>
          {redirectInfo && (
            <div className="mt-2 pt-2 border-t border-red-300">
              <p className="text-xs text-red-600 font-medium">
                {redirectInfo.message.replace('5 segundos', `${redirectInfo.countdown} segundo${redirectInfo.countdown !== 1 ? 's' : ''}`)}
              </p>
            </div>
          )}
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
            href={`/auth/${organizationSlug}/forgot-password`}
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
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Social Login Buttons - Oculto en login personalizado de organización */}
    </form>
  );
}

