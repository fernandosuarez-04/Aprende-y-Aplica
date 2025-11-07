/**
 * Componente de Loading para páginas de administración
 * Usado durante lazy loading de componentes pesados
 */
export function AdminLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary dark:border-primary/50 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Cargando...
          </span>
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Cargando panel de administración...
        </p>
      </div>
    </div>
  );
}
