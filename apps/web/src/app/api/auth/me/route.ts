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

    // Si el usuario tiene organization_id, obtener información de la organización
    let organization = null;
    if (user.organization_id) {
      try {
        const supabase = await createClient();
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
      } catch (orgError) {
        logger.warn('Error fetching organization info:', orgError);
        // No fallamos si no podemos obtener la organización
      }
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
