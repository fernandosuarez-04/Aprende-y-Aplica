'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginFormData } from '../../types/auth.types';
import { loginSchema } from './LoginForm.schema';
import { PasswordInput } from '../PasswordInput';
import { loginAction } from '../../actions/login';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';
import { getSavedCredentials, saveCredentials, clearSavedCredentials } from '../../../../lib/auth/remember-me';
import { ToastNotification } from '../../../../core/components/ToastNotification';

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError: setFormError,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  // Cargar credenciales guardadas al montar el componente
  useEffect(() => {
    const savedCredentials = getSavedCredentials();
    if (savedCredentials) {
      setValue('emailOrUsername', savedCredentials.emailOrUsername);
      setValue('password', savedCredentials.password);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsPending(true);
    
    try {
      // Guardar o eliminar credenciales según el estado de "recuérdame"
      if (data.rememberMe) {
        saveCredentials({
          emailOrUsername: data.emailOrUsername,
          password: data.password,
        });
      } else {
        clearSavedCredentials();
      }
      
      // console.log('🔄 Iniciando proceso de login...');
      
      const formData = new FormData();
      formData.append('emailOrUsername', data.emailOrUsername);
      formData.append('password', data.password);
      formData.append('rememberMe', data.rememberMe.toString());

      // console.log('📤 Enviando datos al servidor...');
      const result = await loginAction(formData);
      
      // console.log('📥 Respuesta recibida:', result);
      
      if (result?.error) {
        // console.error('❌ Error en login:', result.error);
        setError(result.error);
        setIsPending(false);
      }
      // Si no hay error, la acción redirect ya maneja la navegación
      // No necesitamos hacer nada más aquí
    } catch (error: any) {
      // Verificar si es una redirección de Next.js (no es un error real)
      if (error && typeof error === 'object') {
        // Next.js redirect lanza un error especial que debemos re-lanzar
        if ('digest' in error) {
          const digest = error.digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            // Es una redirección exitosa, re-lanzar para que Next.js la maneje
            // console.log('✅ Redirección detectada, login exitoso');
            throw error;
          }
        }
        
        // También puede ser un error de redirección de otra forma
        if (error.message && error.message.includes('NEXT_REDIRECT')) {
          // console.log('✅ Redirección detectada (alternativa), login exitoso');
          throw error;
        }
      }
      
      // Solo mostrar error si NO es una redirección
      console.error('❌ Error inesperado en login:', error);
      
      // Proporcionar mensaje de error más específico
      let errorMessage = 'Error inesperado al iniciar sesión';
      
      if (error instanceof Error) {
        // Errores de red/conexión
        if (error.message.includes('ERR_SSL_PROTOCOL_ERROR') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'La solicitud tardó demasiado. Por favor, intenta nuevamente.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      setIsPending(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-3">
      {/* Welcome Message */}
      <motion.div 
        className="text-center space-y-0.5 mb-2.5 sm:mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">Bienvenido de vuelta</h2>
        <p className="text-xs text-gray-600 dark:text-slate-400 opacity-70 font-normal">Ingresa a tu cuenta para continuar</p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="relative overflow-hidden rounded-xl backdrop-blur-sm border p-3 sm:p-4"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 font-medium leading-snug flex-1">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email or Username */}
      <motion.div 
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
      >
        <label 
          htmlFor="emailOrUsername" 
          className={`block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200 ${
            focusedField === 'emailOrUsername' 
              ? 'text-primary dark:text-primary' 
              : 'text-gray-700 dark:text-slate-300'
          } ${focusedField === 'emailOrUsername' ? 'opacity-100' : 'opacity-70'}`}
        >
          Correo o Usuario
        </label>
        <div className="relative group">
          <motion.div
            className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${
              focusedField === 'emailOrUsername'
                ? 'dark:bg-slate-800/70 bg-gray-50 dark:border-primary border-primary'
                : errors.emailOrUsername
                  ? 'dark:bg-slate-800/50 bg-gray-50 dark:border-red-500 border-red-500'
                  : 'dark:bg-slate-800/50 bg-gray-50 dark:border-slate-600/50 border-gray-300/50'
            } ${focusedField === 'emailOrUsername' ? 'border-2' : 'border'} ${
              focusedField === 'emailOrUsername'
                ? 'dark:shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_4px_12px_-2px_rgba(0,0,0,0.2)] shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_4px_12px_-2px_rgba(0,0,0,0.1)]'
                : ''
            }`}
            animate={{
              scale: focusedField === 'emailOrUsername' ? 1.005 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {focusedField === 'emailOrUsername' && (
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
              <Mail 
                className={`w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200 ${
                  focusedField === 'emailOrUsername' 
                    ? 'text-primary' 
                    : 'text-gray-400 dark:text-slate-500'
                }`}
              />
              <input
                id="emailOrUsername"
                type="text"
                placeholder="tu@email.com o usuario"
                {...register('emailOrUsername')}
                onFocus={() => setFocusedField('emailOrUsername')}
                onBlur={() => setFocusedField(null)}
                className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {errors.emailOrUsername && (
            <motion.p 
              className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 px-1 mt-1"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.emailOrUsername.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Password */}
      <motion.div 
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <label 
          htmlFor="password" 
          className={`block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200 ${
            focusedField === 'password' 
              ? 'text-primary dark:text-primary' 
              : 'text-gray-700 dark:text-slate-300'
          } ${focusedField === 'password' ? 'opacity-100' : 'opacity-70'}`}
        >
          Contraseña
        </label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          error={errors.password?.message}
          focusedField={focusedField}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          {...register('password')}
        />
        <AnimatePresence>
          {errors.password && (
            <motion.p 
              className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 px-1 mt-1"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.password.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Remember Me & Forgot Password */}
      <motion.div 
        className="flex items-center justify-between pt-0.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="sr-only"
            />
            <motion.div
              className="w-4 h-4 rounded-md border-2 transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: watch('rememberMe') 
                  ? 'transparent' 
                  : 'transparent',
                borderColor: watch('rememberMe')
                  ? 'transparent'
                  : 'rgba(156, 163, 175, 0.5)',
                background: watch('rememberMe')
                  ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                  : 'transparent',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: watch('rememberMe') ? 1 : 0,
                  opacity: watch('rememberMe') ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>
          </div>
          <span className="text-xs font-medium transition-colors select-none text-gray-700 dark:text-slate-300">
            Recordarme
          </span>
        </label>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/auth/forgot-password"
            className="text-xs font-medium transition-all duration-200 relative group/link"
            style={{ color: 'var(--color-primary, #3b82f6)' }}
          >
            ¿Olvidaste tu contraseña?
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-200 group-hover/link:w-full" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="pt-1.5"
      >
        <motion.button
          type="submit"
          disabled={isPending}
          className="w-full relative overflow-hidden group rounded-xl py-2.5 sm:py-3 px-4 sm:px-5 font-semibold text-xs sm:text-sm text-white transition-all duration-300 border-2"
          style={{
            backgroundImage: isPending
              ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.6), rgba(6, 182, 212, 0.6))'
              : 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa, #06b6d4)',
            backgroundSize: '200% 200%',
            backgroundPosition: !isPending ? '0% 50%' : 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'transparent',
            borderColor: isPending ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
            boxShadow: isPending 
              ? '0 4px 14px 0 rgba(30, 64, 175, 0.3)' 
              : '0 4px 14px 0 rgba(30, 64, 175, 0.4)',
          }}
          animate={!isPending ? {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          } : {}}
          transition={!isPending ? {
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          } : {}}
          whileHover={!isPending ? { 
            scale: 1.02, 
            boxShadow: '0 8px 24px 0 rgba(30, 64, 175, 0.5)',
          } : {}}
          whileTap={!isPending ? { scale: 0.98 } : {}}
        >
          {/* Líneas animadas alrededor del borde */}
          {!isPending && (
            <>
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent)',
                  maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
                }}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.5), transparent)',
                  maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                }}
                animate={{
                  y: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </>
          )}

          {/* Efecto de glow pulsante en el borde */}
          {!isPending && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                boxShadow: '0 0 20px rgba(96, 165, 250, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.3)',
                pointerEvents: 'none',
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
                boxShadow: [
                  '0 0 20px rgba(96, 165, 250, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.3)',
                  '0 0 30px rgba(96, 165, 250, 0.8), inset 0 0 30px rgba(6, 182, 212, 0.5)',
                  '0 0 20px rgba(96, 165, 250, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.3)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Partículas/ondas que emanan del botón */}
          {!isPending && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `radial-gradient(circle at ${50 + i * 10}% ${50 + i * 10}%, rgba(96, 165, 250, 0.3), transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                />
              ))}
            </>
          )}

          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Ingresando...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </span>

          {/* Efecto de brillo al hover */}
          {!isPending && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
              initial={{ x: '-200%' }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          )}

          {/* Efecto de carga */}
          {isPending && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Social Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="pt-0.5"
      >
        <SocialLoginButtons />
      </motion.div>
    </form>

    {/* Toast Notification para errores */}
    <ToastNotification
      isOpen={!!error}
      onClose={() => setError(null)}
      message={error || ''}
      type="error"
      duration={6000}
    />
    </>
  );
}
