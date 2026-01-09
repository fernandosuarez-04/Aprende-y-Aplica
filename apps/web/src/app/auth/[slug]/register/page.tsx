'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { OrganizationAuthLayout } from '@/features/auth/components/OrganizationAuth/OrganizationAuthLayout';
import { OrganizationRegisterForm } from '@/features/auth/components/OrganizationAuth/OrganizationRegisterForm';
import { validateInvitationAction } from '@/features/auth/actions/invitation';
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

interface InvitationData {
  email: string;
  role: string;
}

interface BulkInviteData {
  token: string;
  role: string;
}

export default function OrganizationRegisterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const token = searchParams?.get('token'); // Individual invitation token
  const bulkToken = searchParams?.get('bulk_token'); // Bulk invite link token

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [bulkInvite, setBulkInvite] = useState<BulkInviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null); // Error de organización (crítico)
  const [invitationError, setInvitationError] = useState<string | null>(null); // Error de invitación (no crítico)

  useEffect(() => {
    if (!slug) {
      setOrgError('Slug de organización no proporcionado');
      setIsLoading(false);
      return;
    }

    const fetchOrganizationAndValidateToken = async () => {
      try {
        setIsLoading(true);
        setOrgError(null);
        setInvitationError(null);

        // 1. Cargar información de la organización
        const response = await fetch(`/api/organizations/${slug}`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setOrgError(data.error || 'Organización no encontrada');
          setIsLoading(false);
          return;
        }

        setOrganization(data.organization);

        // 2. Si hay bulk_token (enlace de invitación masiva), validarlo
        if (bulkToken) {
          const bulkResponse = await fetch(`/api/invite/${bulkToken}`);
          const bulkData = await bulkResponse.json();

          if (!bulkData.success || !bulkData.valid) {
            setInvitationError(bulkData.error || 'Enlace de invitación inválido');
          } else if (bulkData.organization?.slug?.toLowerCase() !== slug.toLowerCase()) {
            setInvitationError('Este enlace de invitación no es para esta organización');
          } else {
            // Bulk invite válida
            setBulkInvite({
              token: bulkToken,
              role: bulkData.invite?.role || 'member',
            });
          }
        }
        // 3. Si hay token de invitación individual, validarlo
        else if (token) {
          const validation = await validateInvitationAction(token);

          if (!validation.valid) {
            // Error de invitación - mostrar error pero continuar mostrando el formulario
            setInvitationError(validation.error || 'Invitación inválida o expirada');
          } else if (validation.organizationSlug?.toLowerCase() !== slug.toLowerCase()) {
            // La invitación es para otra organización
            setInvitationError('Esta invitación no es para esta organización');
          } else {
            // Invitación válida - guardar datos
            setInvitation({
              email: validation.email!,
              role: validation.role!,
            });
          }
        }
      } catch (err) {
        setOrgError('Error al cargar información de la organización');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationAndValidateToken();
  }, [slug, token, bulkToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"
            />
          </div>
          <p className="text-white/60 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error crítico de organización - no se puede continuar
  if (orgError || !organization) {
    return (
      <OrganizationAuthLayout
        organization={{
          id: '',
          name: 'Error',
          logo_url: '/icono.png',
        }}
        error={orgError || 'Organización no encontrada'}
      >
        <div className="text-center space-y-4">
          <p className="text-text-secondary">
            {orgError || 'No se pudo cargar la información de la organización'}
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
    <OrganizationAuthLayout organization={organization} error={invitationError}>
      <div className="space-y-6">
        {/* Si hay error de invitación pero la organización existe, mostrar mensaje */}
        {invitationError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              {invitationError}. Puedes registrarte manualmente si tienes una invitación pendiente.
            </p>
          </div>
        )}

        <OrganizationRegisterForm
          organizationId={organization.id}
          organizationSlug={organization.slug || slug}
          invitationToken={invitationError ? undefined : token}
          invitedEmail={invitation?.email}
          invitedRole={invitation?.role || bulkInvite?.role}
          bulkInviteToken={invitationError ? undefined : bulkInvite?.token}
          googleLoginEnabled={organization.google_login_enabled}
          microsoftLoginEnabled={organization.microsoft_login_enabled}
        />
      </div>
    </OrganizationAuthLayout>
  );
}

