'use client';

import { useState, useEffect } from 'react';
import { SCORMUploader, useScormPackage, ScormPackage } from '@/features/scorm';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function AdminScormPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user && user.cargo_rol !== 'Administrador') {
      router.push('/dashboard');
      return;
    }

    if (!user || authLoading) return;

    async function loadData() {
      try {
        const supabase = createClient();

        // Obtener cursos
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, slug')
          .eq('is_active', true)
          .order('title', { ascending: true });

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Admin puede ver TODAS las organizaciones
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name', { ascending: true });

        if (orgsError) throw orgsError;
        setOrganizations(orgsData || []);

        if (orgsData && orgsData.length > 0) {
          setSelectedOrgId(orgsData[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, isAuthenticated, router]);

  const { packages, isLoading: packagesLoading, refetch } = useScormPackage(
    selectedCourseId && selectedOrgId
      ? {
          courseId: selectedCourseId,
          organizationId: selectedOrgId
        }
      : {}
  );

  const handleUploadSuccess = (packageData: ScormPackage) => {
    refetch();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (user && user.cargo_rol !== 'Administrador')) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Acceso no autorizado. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Importar Paquete SCORM</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Sube y gestiona paquetes SCORM 1.2 o SCORM 2004 para las organizaciones
            </p>
          </div>
        </div>
      </div>

      {/* Selectores */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Configuración</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Organización
            </label>
            {organizations.length === 0 ? (
              <div className="px-4 py-3 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No hay organizaciones disponibles. Crea una organización primero.
                </p>
              </div>
            ) : (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-white transition-all"
              >
                <option value="">Selecciona una organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Curso (opcional)
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={!selectedOrgId}
            >
              <option value="">Sin curso asociado</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Puedes subir paquetes SCORM sin asociarlos a un curso específico
            </p>
          </div>
        </div>
      </div>

      {/* Uploader */}
      {selectedOrgId ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Subir Nuevo Paquete</h2>
          <SCORMUploader
            courseId={selectedCourseId || undefined}
            organizationId={selectedOrgId}
            onSuccess={handleUploadSuccess}
            onError={(err) => setError(err)}
          />
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
            Por favor, selecciona una organización para comenzar a subir paquetes SCORM.
          </p>
        </div>
      )}

      {/* Lista de paquetes */}
      {selectedOrgId && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Paquetes SCORM {selectedCourseId ? 'del Curso' : 'de la Organización'}
            </h2>
            {packages.length > 0 && (
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                {packages.length} {packages.length === 1 ? 'paquete' : 'paquetes'}
              </span>
            )}
          </div>

          {packagesLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">Cargando paquetes...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600">
              <div className="w-16 h-16 mx-auto mb-4 p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 font-semibold text-lg mb-1">No hay paquetes SCORM</p>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sube tu primer paquete para comenzar</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {packages.map((pkg) => {
                const course = courses.find(c => c.id === selectedCourseId);
                const formatFileSize = (bytes: number) => {
                  const mb = bytes / 1024 / 1024;
                  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
                };

                return (
                  <div
                    key={pkg.id}
                    className="group relative bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Icono y título */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2.5 bg-primary-100 dark:bg-primary-900/40 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/60 transition-colors">
                        <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-white text-lg mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {pkg.title}
                        </h3>
                      </div>
                    </div>

                    {/* Badges y metadata */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold border border-primary-200 dark:border-primary-800">
                        {pkg.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
                      </span>
                      <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg text-xs font-medium">
                        {formatFileSize(pkg.file_size)}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        pkg.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                          : pkg.status === 'processing'
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-600'
                      }`}>
                        {pkg.status === 'active' ? 'Activo' : pkg.status === 'processing' ? 'Procesando' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Botón Ver */}
                    {course && (
                      <Link
                        href={`/courses/${course.slug}/scorm/${pkg.id}`}
                        className="block w-full text-center px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 dark:from-primary-500 dark:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 border-2 border-primary-800 dark:border-primary-400"
                      >
                        Ver Curso
                      </Link>
                    )}

                    {/* Info adicional */}
                    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Creado: {new Date(pkg.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
