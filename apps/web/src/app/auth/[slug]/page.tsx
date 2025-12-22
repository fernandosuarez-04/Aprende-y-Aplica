'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrganizationAuthLayout } from '@/features/auth/components/OrganizationAuth/OrganizationAuthLayout';
import { OrganizationLoginForm } from '@/features/auth/components/OrganizationAuth/OrganizationLoginForm';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_font_family?: string | null;
  brand_favicon_url?: string | null;
  google_login_enabled?: boolean;
  microsoft_login_enabled?: boolean;
}

export default function OrganizationLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Slug de organización no proporcionado');
      setIsLoading(false);
      return;
    }

    const fetchOrganization = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/organizations/${slug}`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'Organización no encontrada');
          setIsLoading(false);
          return;
        }

        setOrganization(data.organization);
      } catch (err) {
        // console.error('Error fetching organization:', err);
        setError('Error al cargar información de la organización');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [slug]);

  if (isLoading) {
    return (
      <OrganizationAuthLayout
        organization={{
          id: '',
          name: 'Cargando...',
          logo_url: '/icono.png',
        }}
        isLoading={true}
      >
        <div></div>
      </OrganizationAuthLayout>
    );
  }

  if (error || !organization) {
    return (
      <OrganizationAuthLayout
        organization={{
          id: '',
          name: 'Error',
          logo_url: '/icono.png',
        }}
        error={error || 'Organización no encontrada'}
      >
        <div className="text-center space-y-4">
          <p className="text-text-secondary">
            {error || 'No se pudo cargar la información de la organización'}
          </p>
          <Link
            href="/auth"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Volver al login principal
          </Link>
        </div>
      </OrganizationAuthLayout>
    );
  }

  return (
    <OrganizationAuthLayout organization={organization} error={error}>
      <div className="space-y-6">
        <OrganizationLoginForm
          organizationId={organization.id}
          organizationSlug={organization.slug || slug}
          googleLoginEnabled={organization.google_login_enabled}
          microsoftLoginEnabled={organization.microsoft_login_enabled}
        />
      </div>
    </OrganizationAuthLayout>
  );
}

