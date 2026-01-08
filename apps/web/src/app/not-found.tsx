import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import Link from 'next/link';

export default async function NotFound() {
  let dashboardUrl = '/dashboard';

  try {
    // Get current user
    const currentUser = await SessionService.getCurrentUser();

    if (currentUser) {
      const supabase = await createClient();

      // Get user's active organization
      const { data: userOrg, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id, role, status, organizations!inner(slug)')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .single();

      if (!orgError && userOrg) {
        const orgSlug = (userOrg.organizations as any)?.slug;
        const orgRole = userOrg.role;

        if (orgSlug) {
          // Determine dashboard URL based on role
          if (orgRole === 'owner' || orgRole === 'admin') {
            dashboardUrl = `/${orgSlug}/business-panel/dashboard`;
          } else {
            dashboardUrl = `/${orgSlug}/business-user/dashboard`;
          }
        }
      }
    }
  } catch (error) {
    // If there's an error, just use default dashboard
    console.error('Error getting dashboard URL for 404:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-blue-600/20">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900">
            Página no encontrada
          </h2>
          <p className="text-gray-600">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={dashboardUrl}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Ir al inicio
          </Link>
          <Link
            href={dashboardUrl}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 bg-transparent rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all"
          >
            Explorar
          </Link>
        </div>
      </div>
    </div>
  );
}
