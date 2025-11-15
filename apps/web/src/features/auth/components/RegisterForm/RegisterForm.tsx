'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Briefcase } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@aprende-y-aplica/ui';
import { RegisterFormData } from '../../types/auth.types';
import { registerSchema } from './RegisterForm.schema';
import { PasswordInput } from '../PasswordInput';
import { CountrySelector } from '../CountrySelector';
import { registerAction } from '../../actions/register';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';

const LegalDocumentsModal = dynamic(() => import('../LegalDocumentsModal').then(mod => ({ default: mod.LegalDocumentsModal })), {
  ssr: false
});

export function RegisterForm() {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('MX');
  const [dialCode, setDialCode] = useState('+52');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      countryCode: 'MX',
      phoneNumber: '',
      email: '',
      confirmEmail: '',
      password: '',
      confirmPassword: '',
      cargo_titulo: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      const formData = new FormData();
      
      // Añadir todos los campos del formulario
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      });

      try {
        const result = await registerAction(formData);
        
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.message);
        }
      } catch (error) {
        // console.error('Register error:', error);
        setError('Error inesperado al crear la cuenta');
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Header */}
        <motion.div 
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.h2 
            className="text-2xl font-bold text-color-contrast"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
          >
            Crear cuenta
          </motion.h2>
          <motion.p 
            className="text-text-secondary text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Únete a la comunidad de aprendizaje IA
          </motion.p>
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

        {/* Success Message */}
        {success && (
          <motion.div
            className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.div>
        )}

        {/* Social Login Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <SocialLoginButtons />
        </motion.div>

        {/* Divisor */}
        <motion.div
          className="relative my-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              O regístrate con email
            </span>
          </div>
        </motion.div>

        {/* Form Content - Single Column */}
        <div className="space-y-4">
          {/* Información Personal */}
          <div className="space-y-4">
            {/* Name Fields */}
            <motion.div 
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="space-y-2">
                <label htmlFor="firstName" className="auth-label">
                  Nombre
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    {...register('firstName')}
                    className={`auth-input pr-12 ${errors.firstName ? 'border-error' : ''}`}
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                </div>
                {errors.firstName && (
                  <motion.p 
                    className="auth-error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.firstName.message}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="auth-label">
                  Apellido
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    {...register('lastName')}
                    className={`auth-input pr-12 ${errors.lastName ? 'border-error' : ''}`}
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                </div>
                {errors.lastName && (
                  <motion.p 
                    className="auth-error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.lastName.message}
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Username */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <label htmlFor="username" className="auth-label">
                Usuario
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder="juanperez"
                  {...register('username')}
                  className={`auth-input pr-12 ${errors.username ? 'border-error' : ''}`}
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              </div>
              {errors.username && (
                <motion.p 
                  className="auth-error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.username.message}
                </motion.p>
              )}
            </motion.div>

            {/* Cargo / Título */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17, duration: 0.4 }}
            >
              <label htmlFor="cargo_titulo" className="auth-label">
                Cargo / Título <span className="text-text-tertiary text-xs">(Opcional)</span>
              </label>
              <div className="relative">
                <input
                  id="cargo_titulo"
                  type="text"
                  placeholder="Ej: Desarrollador, Gerente, CEO, etc."
                  {...register('cargo_titulo')}
                  className={`auth-input pr-12 ${errors.cargo_titulo ? 'border-error' : ''}`}
                />
                <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              </div>
              {errors.cargo_titulo && (
                <motion.p 
                  className="auth-error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.cargo_titulo.message}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            {/* Email Fields */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <label htmlFor="email" className="auth-label">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                  className={`auth-input pr-12 ${errors.email ? 'border-error' : ''}`}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              </div>
              {errors.email && (
                <motion.p 
                  className="auth-error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.email.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <label htmlFor="confirmEmail" className="auth-label">
                Confirmar correo
              </label>
              <div className="relative">
                <input
                  id="confirmEmail"
                  type="email"
                  placeholder="tu@email.com"
                  {...register('confirmEmail')}
                  className={`auth-input pr-12 ${errors.confirmEmail ? 'border-error' : ''}`}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              </div>
              {errors.confirmEmail && (
                <motion.p 
                  className="auth-error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.confirmEmail.message}
                </motion.p>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label htmlFor="phoneNumber" className="auth-label">
                Teléfono
              </label>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-auto min-w-[120px]">
                  <CountrySelector
                    value={selectedCountryCode}
                    onChange={(code, dial) => {
                      setSelectedCountryCode(code);
                      setDialCode(dial);
                      setValue('countryCode', code);
                    }}
                    error={errors.countryCode?.message}
                  />
                </div>
                <div className="flex-1 relative">
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Número de teléfono"
                    {...register('phoneNumber')}
                    className={`auth-input pr-12 ${errors.phoneNumber ? 'border-error' : ''}`}
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                </div>
              </div>
              {errors.phoneNumber && (
                <motion.p 
                  className="auth-error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.phoneNumber.message}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Contraseñas */}
          <div className="space-y-4">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
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

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label htmlFor="confirmPassword" className="auth-label">
                Verificar contraseña
              </label>
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <motion.p 
                  className="auth-error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div 
          className="flex flex-col items-center space-y-4 pt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          {/* Terms Checkbox */}
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('acceptTerms')}
                className="auth-checkbox mt-0.5 flex-shrink-0"
              />
              <span className="text-xs text-text-secondary leading-relaxed">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Términos y Condiciones
                </button>
                , las{' '}
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Políticas de Privacidad
                </button>{' '}
                y el{' '}
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Código de Conducta
                </button>
              </span>
            </label>
            {errors.acceptTerms && (
              <motion.p 
                className="auth-error text-center mt-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {errors.acceptTerms.message}
              </motion.p>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full max-w-full sm:max-w-md relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isPending}
            >
              <span className="relative z-10 font-semibold">
                {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
              </span>
              {/* Efecto de brillo mejorado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
              {/* Efecto de glow */}
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </motion.div>
        </motion.div>
      </form>

      {/* Legal Modal */}
      <LegalDocumentsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        onAccept={() => setValue('acceptTerms', true)}
      />
    </>
  );
}
