'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ChevronRight, Loader2, Users, Shield } from 'lucide-react';
import { useOrganization } from '@/core/hooks/useOrganization';
import type { Organization } from '@/core/stores/organizationStore';

/**
 * Organization Selection Page
 *
 * Shown after login when a user belongs to multiple organizations.
 * Allows them to choose which organization context to enter.
 */
export default function SelectOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizations: userOrganizations = [], isLoading, setCurrentOrganization } = useOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get redirect URL from query params (where to go after selection)
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // If user has only one org, auto-select and redirect
  useEffect(() => {
    if (!isLoading && userOrganizations.length === 1) {
      handleSelectOrganization(userOrganizations[0]);
    }
  }, [isLoading, userOrganizations]);

  // If user has no orgs, redirect to regular dashboard (B2C user)
  useEffect(() => {
    if (!isLoading && userOrganizations.length === 0) {
      router.replace(redirectTo);
    }
  }, [isLoading, userOrganizations, redirectTo, router]);

  const handleSelectOrganization = async (org: Organization) => {
    setSelectedOrg(org.id);
    setIsNavigating(true);

    // Set the organization in the store
    setCurrentOrganization(org);

    // Navigate to the org-specific dashboard or redirect URL
    const targetUrl = redirectTo.startsWith('/')
      ? `/${org.slug}${redirectTo}`
      : redirectTo;

    router.push(targetUrl);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Administrador';
      case 'member':
        return 'Miembro';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-gray-400">Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while auto-redirecting for single org or no orgs
  if (userOrganizations.length <= 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/20 flex items-center justify-center"
          >
            <Building2 className="w-8 h-8 text-primary-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Selecciona una Organizacion
          </h1>
          <p className="text-gray-400">
            Perteneces a {userOrganizations.length} organizaciones. Elige con cual deseas continuar.
          </p>
        </div>

        {/* Organization List */}
        <div className="space-y-3">
          {userOrganizations.map((org, index) => (
            <motion.button
              key={org.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              onClick={() => handleSelectOrganization(org)}
              disabled={isNavigating}
              className={`
                w-full p-4 rounded-xl border transition-all duration-200
                flex items-center gap-4 text-left
                ${
                  selectedOrg === org.id
                    ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/20'
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                }
                ${isNavigating && selectedOrg !== org.id ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Logo */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  backgroundColor: org.brandColorPrimary || '#3b82f6',
                }}
              >
                {org.brandLogoUrl || org.logoUrl ? (
                  <img
                    src={org.brandLogoUrl || org.logoUrl || ''}
                    alt={org.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{org.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
                      ${getRoleColor(org.role)}
                    `}
                  >
                    {getRoleIcon(org.role)}
                    {getRoleLabel(org.role)}
                  </span>
                </div>
              </div>

              {/* Arrow / Loading */}
              <div className="flex-shrink-0">
                {selectedOrg === org.id && isNavigating ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Puedes cambiar de organizacion en cualquier momento desde el menu de tu perfil.
        </p>
      </motion.div>
    </div>
  );
}
