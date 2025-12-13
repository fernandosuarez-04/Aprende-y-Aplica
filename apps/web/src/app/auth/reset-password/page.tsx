import { Suspense } from 'react';
import { ResetPasswordForm } from '../../../features/auth/components/ResetPasswordForm';

export const metadata = {
  title: 'Restablecer Contraseña | Aprende y Aplica',
  description: 'Crea una nueva contraseña segura para tu cuenta',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <Suspense
            fallback={
              <div className="w-full max-w-md mx-auto p-6 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
