'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordResetAction } from '../../actions/reset-password';
import { forgotPasswordSchema, type ForgotPasswordFormData } from './ForgotPasswordForm.schema';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('email', data.email);

      const response = await requestPasswordResetAction(formData);

      if (response.error) {
        setResult({ type: 'error', message: response.error });
      } else {
        setResult({
          type: 'success',
          message: response.message || 'Revisa tu correo para las instrucciones.',
        });
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

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campo Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register('email')}
            disabled={isLoading}
            className={`
              w-full px-4 py-2 rounded-lg border
              ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            `}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
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
              <span>Enviando...</span>
            </>
          ) : (
            <span>Enviar enlace de recuperación</span>
          )}
        </button>

        {/* Link volver */}
        <div className="text-center">
          <a
            href="/auth"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </form>
    </div>
  );
}
