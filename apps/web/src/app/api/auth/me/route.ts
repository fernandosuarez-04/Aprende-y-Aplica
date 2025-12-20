import { NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { cacheHeaders } from '../../../../lib/utils/cache-headers';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { MemoryCache } from '@/lib/cache/memory-cache';

// ⚡ OPTIMIZACIÓN: Cache de organizaciones (5MB, 5min TTL)
const orgCache = new MemoryCache<any>(5, 5 * 60 * 1000);

export async function GET() {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, {
        status: 401,
        headers: cacheHeaders.private // NO cachear - datos sensibles
      });
    }

    // ⚡ OPTIMIZACIÓN: Buscar organización con cache y query simplificada
    let organization = null;

    // Verificar cache primero
    const cacheKey = `user-org:${user.id}`;
    const cachedOrg = orgCache.get(cacheKey);

    if (cachedOrg) {
      organization = cachedOrg;
    } else {
      try {
        const supabase = await createClient();

        // Buscar en organization_users (única fuente de verdad después de eliminar users.organization_id)
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('organization_users')
          .select('organization_id, joined_at, organizations!inner(id, name, logo_url, brand_logo_url, brand_favicon_url, slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1);

        if (!userOrgsError && userOrgs && userOrgs.length > 0) {
          const org = userOrgs[0].organizations;
          organization = {
            id: org.id,
            name: org.name,
            logo_url: org.logo_url,
            brand_logo_url: org.brand_logo_url,
            brand_favicon_url: org.brand_favicon_url,
            favicon_url: org.brand_favicon_url,
            slug: org.slug
          };
        }

        // Cachear resultado (incluido null para evitar queries repetidas)
        if (organization) {
          orgCache.set(cacheKey, organization);
        }
      } catch (orgError) {
        // Error manejado silenciosamente (ya optimizado en FASE 1)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        organization_id: organization?.id || null, // ID directo para acceso fácil en hooks
        organization: organization // Información completa de la organización (opcional)
      }
    }, {
      headers: cacheHeaders.private // NO cachear - datos de usuario
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    }, { status: 500 });
  }
}
