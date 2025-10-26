'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordAction, validateResetTokenAction } from '../../actions/reset-password';
import { resetPasswordSchema, type ResetPasswordFormData } from './ResetPasswordForm.schema';
import { Loader2, Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch('newPassword', '');

  // Validar token al cargar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token no proporcionado');
        setIsValidatingToken(false);
        return;
      }

      const result = await validateResetTokenAction(token);

      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenError(result.error || 'Token inválido');
      }

      setIsValidatingToken(false);
    };

    validateToken();
  }, [token]);

  // Calcular fortaleza de contraseña
  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;

    const labels = ['', 'Débil', 'Media', 'Buena', 'Fuerte'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('newPassword', data.newPassword);

      const response = await resetPasswordAction(formData);

      if (response.error) {
        setResult({ type: 'error', message: response.error });
      } else {
        setResult({
          type: 'success',
          message: response.message || 'Contraseña actualizada correctamente',
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/auth?message=password-reset-success');
        }, 2000);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Error de conexión. Inténtalo más tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  // ESTADO: Validando token
  if (isValidatingToken) {
    return (
      <div className="w-full max-w-md mx-auto p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600 dark:text-gray-400">Verificando enlace...</p>
      </div>
    );
  }

  // ESTADO: Token inválido
  if (!tokenValid) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Enlace Inválido</h1>
          <p className="text-gray-600 dark:text-gray-400">{tokenError}</p>
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="
              px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-800
              transition-colors
            "
          >
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  // ESTADO: Formulario principal
  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Contraseña</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crea una contraseña segura para tu cuenta.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nueva Contraseña */}
        <div className="space-y-2">
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              {...register('newPassword')}
              disabled={isLoading}
              className={`
                w-full px-4 py-2 pr-10 rounded-lg border
                ${errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}

          {/* Indicador de fortaleza */}
          {newPassword && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded transition-all ${
                      level <= passwordStrength.strength
                        ? passwordStrength.color
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fortaleza: <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}

          {/* Requisitos */}
          <div className="space-y-1 text-sm">
            <div className={`flex items-center space-x-2 ${newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <span>{newPassword.length >= 8 ? '✓' : '○'}</span>
              <span>Al menos 8 caracteres</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
              <span>Una letra mayúscula</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[a-z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
              <span>Una letra minúscula</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[0-9]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
              <span>Un número</span>
            </div>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite la contraseña"
              {...register('confirmPassword')}
              disabled={isLoading}
              className={`
                w-full px-4 py-2 pr-10 rounded-lg border
                ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Mensaje de resultado */}
        {result && (
          <div
            className={`
              p-4 rounded-lg border flex items-start space-x-3
              ${
                result.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }
            `}
          >
            {result.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                result.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isLoading || result?.type === 'success'}
          className="
            w-full px-4 py-2 rounded-lg
            bg-gradient-to-r from-blue-500 to-cyan-500
            text-white font-medium
            hover:from-blue-600 hover:to-cyan-600
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center justify-center space-x-2
          "
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Actualizando...</span>
            </>
          ) : (
            <span>Actualizar Contraseña</span>
          )}
        </button>
      </form>
    </div>
  );
}
