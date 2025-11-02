import { NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { cacheHeaders } from '../../../../lib/utils/cache-headers';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

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

    // Buscar organización del usuario (prioridad: organization_users más reciente, luego users.organization_id)
    let organization = null;
    try {
      const supabase = await createClient();
      
      // Prioridad 1: Buscar en organization_users (más reciente por joined_at)
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('organization_users')
        .select('organization_id, joined_at, organizations!inner(id, name, logo_url, slug)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1);

      if (!userOrgsError && userOrgs && userOrgs.length > 0) {
        // Usuario tiene organización vía organization_users (más reciente)
        const org = userOrgs[0].organizations;
        organization = {
          id: org.id,
          name: org.name,
          logo_url: org.logo_url,
          slug: org.slug
        };
      } else if (user.organization_id) {
        // Prioridad 2: Si no hay en organization_users, usar users.organization_id
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, logo_url, slug')
          .eq('id', user.organization_id)
          .single();

        if (!orgError && orgData) {
          organization = {
            id: orgData.id,
            name: orgData.name,
            logo_url: orgData.logo_url,
            slug: orgData.slug
          };
        }
      }
    } catch (orgError) {
      logger.warn('Error fetching organization info:', orgError);
      // No fallamos si no podemos obtener la organización
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        ...user,
        organization: organization
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
