'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { LoginFormData } from '../../types/auth.types';
import { loginSchema } from '../LoginForm/LoginForm.schema';
import { PasswordInput } from '../PasswordInput';
import { loginAction } from '../../actions/login';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';
import { getSavedCredentials, saveCredentials, clearSavedCredentials } from '../../../../lib/auth/remember-me';

interface OrganizationLoginFormProps {
  organizationId: string;
  organizationSlug: string;
}

interface LoginStyles {
  primary_button_color?: string;
  secondary_button_color?: string;
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
  const redirectUrlRef = useRef<string | null>(null);
  const [loginStyles, setLoginStyles] = useState<LoginStyles | null>(null);

  // Obtener estilos de login desde la API
  useEffect(() => {
    const fetchLoginStyles = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationSlug}/styles`, {
          credentials: 'include',
        });

        const data = await response.json();
        if (data.success && data.styles?.login) {
          setLoginStyles(data.styles.login);
        }
      } catch (error) {
        // console.error('Error fetching login styles:', error);
      }
    };

    if (organizationSlug) {
      fetchLoginStyles();
    }
  }, [organizationSlug]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  // Limpiar intervalo al desmontar componente
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      redirectUrlRef.current = null;
    };
  }, []);
  
  // Efecto para redirigir cuando countdown llegue a 0
  useEffect(() => {
    if (redirectInfo && redirectInfo.countdown === 0) {
      const urlToRedirect = redirectUrlRef.current || redirectInfo.to;
      // console.log('🔄 Redirigiendo (useEffect) a:', urlToRedirect);
      
      // Limpiar intervalo si aún existe
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      let timeoutId: NodeJS.Timeout | null = null;
      let isCleanedUp = false;
      
      let finalUrl = urlToRedirect;
      
      const performRedirect = () => {
        if (!isCleanedUp) {
          timeoutId = setTimeout(() => {
            window.location.href = finalUrl;
          }, 300);
        }
      };
      
      // Si redirigimos a /auth, primero cerrar sesión para evitar que el middleware nos redirija de vuelta
      if (urlToRedirect === '/auth' || urlToRedirect.startsWith('/auth')) {
        // Agregar parámetro para evitar redirección automática del middleware
        if (urlToRedirect === '/auth' || urlToRedirect === '/auth/') {
          finalUrl = '/auth?redirect=force';
        } else if (urlToRedirect.includes('?')) {
          finalUrl = urlToRedirect + '&redirect=force';
        } else {
          finalUrl = urlToRedirect + '?redirect=force';
        }
        
        // Llamar a logout API para limpiar la sesión
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(() => {
          // console.log('✅ Sesión cerrada antes de redirigir (useEffect)');
          performRedirect();
        }).catch((logoutError) => {
          // console.error('⚠️ Error al cerrar sesión:', logoutError);
          // Continuar con la redirección aunque haya error
          performRedirect();
        });
      } else {
        // Para otras URLs, redirigir directamente
        performRedirect();
      }
      
      return () => {
        isCleanedUp = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [redirectInfo]);

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
      
      // console.log('🔄 Iniciando proceso de login (organización)...');
      
      const formData = new FormData();
      formData.append('emailOrUsername', data.emailOrUsername);
      formData.append('password', data.password);
      formData.append('rememberMe', data.rememberMe.toString());
      formData.append('organizationId', organizationId);
      formData.append('organizationSlug', organizationSlug);

      // console.log('📤 Enviando datos al servidor...');
      const result = await loginAction(formData);
      
      // console.log('📥 Respuesta recibida:', result);
      
      if (result?.error) {
        // console.error('❌ Error en login:', result.error);
        
        // Si hay información de redirección, mostrar mensaje con countdown
        if (result.redirectTo && result.redirectMessage) {
          setError(result.error);
          
          // Guardar URL de redirección en ref para usar en el intervalo
          redirectUrlRef.current = result.redirectTo;
          
          // Limpiar intervalo anterior si existe
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          // Iniciar countdown y redirección
          let countdown = 5;
          setRedirectInfo({
            to: result.redirectTo,
            message: result.redirectMessage,
            countdown: countdown
          });
          
          countdownIntervalRef.current = setInterval(async () => {
            countdown -= 1;
            
            if (countdown > 0) {
              setRedirectInfo(prev => {
                if (!prev) return null;
                return { ...prev, countdown };
              });
            } else {
              // Limpiar intervalo antes de redirigir
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              
              // Actualizar estado a 0
              setRedirectInfo(prev => prev ? { ...prev, countdown: 0 } : null);
              
              // Usar la URL del ref para asegurar que tenemos la URL correcta
              let urlToRedirect = redirectUrlRef.current || result.redirectTo;
              // console.log('🔄 Redirigiendo a:', urlToRedirect);
              
              // Si redirigimos a /auth, primero cerrar sesión para evitar que el middleware nos redirija de vuelta
              if (urlToRedirect === '/auth' || urlToRedirect.startsWith('/auth')) {
                try {
                  // Llamar a logout API para limpiar la sesión
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  // console.log('✅ Sesión cerrada antes de redirigir');
                  
                  // Agregar parámetro para evitar redirección automática del middleware
                  if (urlToRedirect === '/auth' || urlToRedirect === '/auth/') {
                    urlToRedirect = '/auth?redirect=force';
                  } else if (urlToRedirect.includes('?')) {
                    urlToRedirect += '&redirect=force';
                  } else {
                    urlToRedirect += '?redirect=force';
                  }
                } catch (logoutError) {
                  // console.error('⚠️ Error al cerrar sesión:', logoutError);
                  // Agregar parámetro como respaldo
                  if (urlToRedirect === '/auth' || urlToRedirect === '/auth/') {
                    urlToRedirect = '/auth?redirect=force';
                  } else if (urlToRedirect.includes('?')) {
                    urlToRedirect += '&redirect=force';
                  } else {
                    urlToRedirect += '?redirect=force';
                  }
                }
              }
              
              // Pequeño delay para asegurar que el estado se actualice y la cookie se elimine
              setTimeout(() => {
                window.location.href = urlToRedirect;
              }, 300);
            }
          }, 1000);
          
          setIsPending(false);
        } else {
          setError(result.error);
          setIsPending(false);
        }
      }
    } catch (error: any) {
      // console.error('💥 Error capturado en onSubmit:', error);
      
      if (error && typeof error === 'object') {
        if ('digest' in error) {
          const digest = error.digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            // console.log('✅ Redirección detectada, login exitoso');
            throw error;
          }
        }
        
        if (error.message && error.message.includes('NEXT_REDIRECT')) {
          // console.log('✅ Redirección detectada (alternativa), login exitoso');
          throw error;
        }
      }
      
      // console.error('❌ Error inesperado:', error);
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
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-950/80 via-red-900/60 to-orange-950/60 border border-red-500/30 shadow-2xl shadow-red-500/20"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Efecto de brillo animado en el borde */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-red-400/20 to-red-500/0 opacity-50 animate-pulse" />
          
          {/* Contenido */}
          <div className="relative p-6 space-y-4">
            <div className="flex items-start gap-4">
              <motion.div
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center border border-red-500/40 shadow-lg shadow-red-500/20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <AlertCircle className="w-6 h-6 text-red-300" />
              </motion.div>
              <div className="flex-1 min-w-0 space-y-3">
                <p className="text-red-100 font-bold text-lg leading-tight">{error}</p>
                {redirectInfo && (
                  <div className="pt-3 border-t border-red-500/30">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-red-400/60 border-t-red-400"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      <p className="text-sm text-red-200/90 font-medium flex-1">
                        {redirectInfo.message.replace('5 segundos', `${redirectInfo.countdown} segundo${redirectInfo.countdown !== 1 ? 's' : ''}`)}
                      </p>
                      {redirectInfo.countdown > 0 && (
                        <motion.span
                          key={redirectInfo.countdown}
                          className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg bg-gradient-to-br from-red-500/30 to-orange-500/30 border border-red-400/40 text-red-100 font-bold text-base shadow-lg shadow-red-500/20"
                          initial={{ scale: 1.4 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {redirectInfo.countdown}
                        </motion.span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
            style={{
              backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.8)',
              color: 'var(--org-text-color, #ffffff)',
              borderRadius: '12px'
            } as React.CSSProperties}
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
          <span className="text-sm" style={{ color: 'var(--org-text-color, #94a3b8)' }}>Recordarme</span>
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
            style={{
              backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
            } as React.CSSProperties}
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

