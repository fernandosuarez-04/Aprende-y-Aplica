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

export default function ScormUploadPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirigir si no está autenticado
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
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

        // Obtener organizaciones del usuario
        const { data: orgUsersData, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id, organizations!inner(id, name)')
          .eq('user_id', user.id)
          .eq('status', 'active');

        let orgs: Organization[] = [];

        if (!orgError && orgUsersData) {
          orgs = orgUsersData.map((item: any) => item.organizations).filter(Boolean);
        }

        // Si no hay organizaciones en organization_users, intentar obtener la organización directa del usuario
        if (orgs.length === 0) {
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single();

          if (userData?.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', userData.organization_id)
              .single();

            if (orgData) {
              orgs = [orgData];
            }
          }
        }

        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedOrgId(orgs[0].id);
        } else {
          setError('No tienes una organización asociada. Contacta al administrador para asignarte una organización.');
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

  // Solo ejecutar el hook cuando hay curso y organización seleccionados
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Link 
            href="/dashboard" 
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 underline"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Subir Paquete SCORM</h1>
        <p className="text-neutral-600">
          Sube y gestiona paquetes SCORM 1.2 o SCORM 2004 para tus cursos
        </p>
      </div>

      {/* Selectores */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Organización {organizations.length === 0 && <span className="text-red-500">*</span>}
            </label>
            {organizations.length === 0 ? (
              <div className="px-3 py-2 border border-red-300 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">
                  No tienes organizaciones disponibles. Contacta al administrador.
                </p>
              </div>
            ) : (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Curso
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!selectedOrgId}
            >
              <option value="">Selecciona un curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Uploader */}
      {selectedCourseId && selectedOrgId ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Subir Nuevo Paquete</h2>
          <SCORMUploader
            courseId={selectedCourseId}
            organizationId={selectedOrgId}
            onSuccess={handleUploadSuccess}
            onError={(err) => setError(err)}
          />
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            Por favor, selecciona una organización y un curso para comenzar a subir paquetes SCORM.
          </p>
        </div>
      )}

      {/* Lista de paquetes */}
      {selectedCourseId && selectedOrgId && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Paquetes SCORM del Curso</h2>
          
          {packagesLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
              <svg className="w-12 h-12 mx-auto text-neutral-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-neutral-600 font-medium">No hay paquetes SCORM</p>
              <p className="text-neutral-500 text-sm mt-1">Sube tu primer paquete para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => {
                const course = courses.find(c => c.id === selectedCourseId);
                const formatFileSize = (bytes: number) => {
                  const mb = bytes / 1024 / 1024;
                  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
                };

                return (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="font-medium text-neutral-900 truncate">{pkg.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                          {pkg.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatFileSize(pkg.file_size)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          pkg.status === 'active' 
                            ? 'bg-green-50 text-green-700' 
                            : pkg.status === 'processing'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {pkg.status === 'active' ? 'Activo' : pkg.status === 'processing' ? 'Procesando' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {course && (
                        <Link
                          href={`/courses/${course.slug}/scorm/${pkg.id}`}
                          className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
                        >
                          Ver
                        </Link>
                      )}
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

