/**
 * Componente de Loading para páginas de administración
 * Usado durante lazy loading de componentes pesados
 */
export function AdminLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#00D4B3]/20 border-t-[#00D4B3] align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Cargando...
          </span>
        </div>
        <p 
          className="mt-4 text-sm text-[#0A2540] dark:text-white"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          Cargando panel de administración...
        </p>
      </div>
    </div>
  );
}
