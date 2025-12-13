import Link from 'next/link';

export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Cuenta Suspendida
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido suspendida debido a múltiples violaciones de las reglas 
          de la comunidad. Esta suspensión es permanente.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            <strong>Motivo:</strong> Contenido inapropiado reiterado después de 3 advertencias.
          </p>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.
        </p>
        
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
