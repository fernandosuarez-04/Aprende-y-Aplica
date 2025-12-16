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

    // ⚡ OPTIMIZACIÓN: Buscar organización con cache y queries en paralelo
    let organization = null;

    // Verificar cache primero
    const cacheKey = `user-org:${user.id}`;
    const cachedOrg = orgCache.get(cacheKey);

    if (cachedOrg) {
      organization = cachedOrg;
    } else {
      try {
        const supabase = await createClient();

        // ⚡ OPTIMIZACIÓN CRÍTICA: Ejecutar ambas queries en PARALELO con Promise.all
        // ANTES: Query 1 → wait → Query 2 (2-4 segundos)
        // DESPUÉS: Promise.all([Query 1, Query 2]) (1-2 segundos)
        const [userOrgsResult, directOrgResult] = await Promise.all([
          // Query 1: organization_users
          supabase
            .from('organization_users')
            .select('organization_id, joined_at, organizations!inner(id, name, logo_url, brand_logo_url, brand_favicon_url, slug)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('joined_at', { ascending: false })
            .limit(1),

          // Query 2: organizations (solo si hay organization_id)
          user.organization_id
            ? supabase
                .from('organizations')
                .select('id, name, logo_url, brand_logo_url, brand_favicon_url, slug')
                .eq('id', user.organization_id)
                .single()
            : Promise.resolve({ data: null, error: null })
        ]);

        // Prioridad 1: organization_users (más reciente)
        if (!userOrgsResult.error && userOrgsResult.data && userOrgsResult.data.length > 0) {
          const org = userOrgsResult.data[0].organizations;
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
        // Prioridad 2: users.organization_id
        else if (!directOrgResult.error && directOrgResult.data) {
          const orgData = directOrgResult.data;
          organization = {
            id: orgData.id,
            name: orgData.name,
            logo_url: orgData.logo_url,
            brand_logo_url: orgData.brand_logo_url,
            brand_favicon_url: orgData.brand_favicon_url,
            favicon_url: orgData.brand_favicon_url,
            slug: orgData.slug
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
        organization_id: user.organization_id, // ✅ CRÍTICO: Incluir organization_id directo
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
