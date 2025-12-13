'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Mail, Phone } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { RegisterFormData } from '../../types/auth.types';
import { registerSchema } from '../RegisterForm/RegisterForm.schema';
import { PasswordInput } from '../PasswordInput';
import { CountrySelector } from '../CountrySelector';
import { registerAction } from '../../actions/register';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';
import Link from 'next/link';
import { ToastNotification } from '../../../../core/components/ToastNotification';

const LegalDocumentsModal = dynamic(() => import('../LegalDocumentsModal').then(mod => ({ default: mod.LegalDocumentsModal })), {
  ssr: false
});

interface OrganizationRegisterFormProps {
  organizationId: string;
  organizationSlug: string;
}

export function OrganizationRegisterForm({
  organizationId,
  organizationSlug,
}: OrganizationRegisterFormProps) {
  const router = useRouter();
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

      // Agregar contexto de organización
      formData.append('organizationId', organizationId);
      formData.append('organizationSlug', organizationSlug);

      try {
        const result = await registerAction(formData);
        
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.message || 'Cuenta creada exitosamente');
        }
      } catch (error) {
        // console.error('Register error:', error);
        setError('Error inesperado al crear la cuenta');
      }
    });
  };

  // Redirigir al login cuando se cree exitosamente la cuenta
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/auth?tab=login');
      }, 2000); // Esperar 2 segundos para que el usuario vea el mensaje de éxito

      return () => clearTimeout(timer);
    }
  }, [success, router]);

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
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Únete a la organización
          </motion.p>
        </motion.div>

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

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
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
                className={`auth-input pl-12 ${errors.firstName ? 'border-error' : ''}`}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            </div>
            {errors.firstName && (
              <p className="auth-error">{errors.firstName.message}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <label htmlFor="lastName" className="auth-label">
              Apellido
            </label>
            <div className="relative">
              <input
                id="lastName"
                type="text"
                placeholder="Pérez"
                {...register('lastName')}
                className={`auth-input pl-12 ${errors.lastName ? 'border-error' : ''}`}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            </div>
            {errors.lastName && (
              <p className="auth-error">{errors.lastName.message}</p>
            )}
          </motion.div>
        </div>

        {/* Username */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <label htmlFor="username" className="auth-label">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            placeholder="juanperez"
            {...register('username')}
            className={`auth-input ${errors.username ? 'border-error' : ''}`}
          />
          {errors.username && (
            <p className="auth-error">{errors.username.message}</p>
          )}
        </motion.div>

        {/* Email Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <label htmlFor="email" className="auth-label">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register('email')}
                onPaste={(e) => e.preventDefault()}
                className={`auth-input pl-12 ${errors.email ? 'border-error' : ''}`}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            </div>
            {errors.email && (
              <p className="auth-error">{errors.email.message}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label htmlFor="confirmEmail" className="auth-label">
              Confirmar Correo
            </label>
            <div className="relative">
              <input
                id="confirmEmail"
                type="email"
                placeholder="tu@email.com"
                {...register('confirmEmail')}
                onPaste={(e) => e.preventDefault()}
                className={`auth-input pl-12 ${errors.confirmEmail ? 'border-error' : ''}`}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            </div>
            {errors.confirmEmail && (
              <p className="auth-error">{errors.confirmEmail.message}</p>
            )}
          </motion.div>
        </div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <label htmlFor="phoneNumber" className="auth-label">
            Teléfono
          </label>
          <div className="flex gap-2">
            <CountrySelector
              selectedCountryCode={selectedCountryCode}
              dialCode={dialCode}
              onCountryChange={(code, dial) => {
                setSelectedCountryCode(code);
                setDialCode(dial);
                setValue('countryCode', code);
              }}
            />
            <div className="relative flex-1">
              <input
                id="phoneNumber"
                type="tel"
                placeholder="1234567890"
                {...register('phoneNumber')}
                className={`auth-input pl-12 ${errors.phoneNumber ? 'border-error' : ''}`}
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            </div>
          </div>
          {errors.phoneNumber && (
            <p className="auth-error">{errors.phoneNumber.message}</p>
          )}
        </motion.div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
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
              <p className="auth-error">{errors.password.message}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <label htmlFor="confirmPassword" className="auth-label">
              Confirmar Contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="auth-error">{errors.confirmPassword.message}</p>
            )}
          </motion.div>
        </div>

        {/* Terms and Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex items-start gap-3"
        >
          <input
            id="acceptTerms"
            type="checkbox"
            {...register('acceptTerms')}
            className="auth-checkbox mt-1"
          />
          <label htmlFor="acceptTerms" className="text-sm text-text-secondary cursor-pointer">
            Acepto los{' '}
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              términos y condiciones
            </button>
            {' '}y la{' '}
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              política de privacidad
            </button>
          </label>
        </motion.div>
        {errors.acceptTerms && (
          <p className="auth-error">{errors.acceptTerms.message}</p>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full relative overflow-hidden group"
            disabled={isPending}
          >
            <span className="relative z-10">
              {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Button>
        </motion.div>

        {/* Social Login Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <SocialLoginButtons />
        </motion.div>

        {/* Login Link */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <p className="text-sm text-text-secondary">
            ¿Ya tienes cuenta?{' '}
            <Link
              href={`/auth/${organizationSlug}`}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
        </motion.div>
      </form>

      {/* Legal Documents Modal */}
      {showLegalModal && (
        <LegalDocumentsModal onClose={() => setShowLegalModal(false)} />
      )}

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

