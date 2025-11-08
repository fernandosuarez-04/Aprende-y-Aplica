'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Mail, Phone } from 'lucide-react';
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header */}
        <motion.div 
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.h2 
            className="text-3xl lg:text-4xl font-bold text-color-contrast"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          >
            Crear cuenta
          </motion.h2>
          <motion.p 
            className="text-text-secondary text-base lg:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
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
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <SocialLoginButtons />
        </motion.div>

        {/* Divisor */}
        <motion.div
          className="relative my-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
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

        {/* Form Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-7">
            {/* Name Fields */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div 
                className="space-y-3"
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
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
              </motion.div>

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
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
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

            {/* Phone */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            >
              <label htmlFor="phoneNumber" className="auth-label">
                Teléfono
              </label>
              <div className="grid grid-cols-3 gap-3">
                <CountrySelector
                  value={selectedCountryCode}
                  onChange={(code, dial) => {
                    setSelectedCountryCode(code);
                    setDialCode(dial);
                    setValue('countryCode', code);
                  }}
                  error={errors.countryCode?.message}
                />
                <div className="col-span-2 relative">
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

          {/* Right Column */}
          <div className="space-y-7">
            {/* Email Fields */}
            <motion.div 
              className="space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            >
              <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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
              </div>
            </motion.div>

            {/* Password Fields */}
            <motion.div 
              className="space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            >
              <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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
              </div>
            </motion.div>
          </div>
        </div>

        {/* Separator */}
        {watch('password') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-xs text-text-tertiary">Ingresa una contraseña</p>
          </motion.div>
        )}

        {/* Bottom Section - Centered */}
        <motion.div 
          className="flex flex-col items-center space-y-8 pt-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: 'easeOut' }}
        >
          {/* Terms Checkbox */}
          <motion.div 
            className="w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
          >
            <label className="flex items-start gap-3 cursor-pointer justify-center lg:justify-start">
              <input
                type="checkbox"
                {...register('acceptTerms')}
                className="auth-checkbox mt-1 flex-shrink-0"
              />
              <span className="text-sm text-text-secondary text-center lg:text-left leading-relaxed">
                Acepto los{' '}
                <motion.button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Términos y Condiciones
                </motion.button>
                , las{' '}
                <motion.button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Políticas de Privacidad
                </motion.button>{' '}
                y el{' '}
                <motion.button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Código de Conducta
                </motion.button>
              </span>
            </label>
            {errors.acceptTerms && (
              <motion.p 
                className="auth-error text-center lg:text-left mt-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {errors.acceptTerms.message}
              </motion.p>
            )}
          </motion.div>

          {/* Submit Button - Perfectly Centered */}
          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
          >
            <motion.div
              className="w-full max-w-sm lg:max-w-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isPending}
              >
                <span className="relative z-10 font-semibold text-lg">
                  {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
                </span>
                {/* Efecto de brillo mejorado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
                {/* Efecto de glow */}
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </motion.div>
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
