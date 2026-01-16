import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/business/hierarchy/geocode
 * Convierte una dirección en coordenadas (lat/lon) usando OpenStreetMap Nominatim
 * 
 * Body: {
 *   address?: string
 *   city?: string
 *   state?: string
 *   country?: string
 *   postal_code?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación business
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { address, city, state, country, postal_code } = body;

    // Construir query de búsqueda
    const parts = [address, city, state, postal_code, country]
      .filter(p => p && typeof p === 'string' && p.trim().length > 0);
    
    if (parts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debes proporcionar al menos un campo de ubicación (ciudad, estado, etc.)' },
        { status: 400 }
      );
    }

    const query = parts.join(', ');
    logger.info(`🔍 Geocoding request: ${query}`);

    // Llamar a OpenStreetMap Nominatim API
    // IMPORTANTE: Usar User-Agent según las políticas de Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Aprende-y-Aplica/1.0 (contact@aprendeyapla.com)', // Requerido por Nominatim
        'Accept-Language': 'es,en',
        'Referer': request.headers.get('referer') || 'https://aprendeyapla.com'
      }
    });

    if (!response.ok) {
      logger.error(`❌ Nominatim API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: 'Error al conectar con el servicio de geocodificación' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      logger.warn(`⚠️ No se encontró ubicación para: ${query}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se pudo encontrar la ubicación. Intenta con una dirección más específica.',
          query 
        },
        { status: 404 }
      );
    }

    const result = data[0];
    const coordinates = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address
    };

    logger.info(`✅ Geocoding success: ${coordinates.lat}, ${coordinates.lon} - ${coordinates.display_name}`);

    return NextResponse.json({
      success: true,
      coordinates
    });

  } catch (error) {
    logger.error('❌ Error en geocoding:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al buscar coordenadas' 
      },
      { status: 500 }
    );
  }
}









