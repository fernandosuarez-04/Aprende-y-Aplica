import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener datos de referencia de todas las tablas
    const [
      nivelesResult,
      rolesResult,
      areasResult,
      relacionesResult,
      tamanosResult,
      sectoresResult
    ] = await Promise.allSettled([
      supabase.from('niveles').select('id, nombre, slug').order('id'),
      supabase.from('roles').select('id, nombre, slug, area_id').order('id'),
      supabase.from('areas').select('id, nombre, slug').order('id'),
      supabase.from('relaciones').select('id, nombre, slug').order('id'),
      supabase.from('tamanos_empresa').select('id, nombre, min_empleados, max_empleados').order('id'),
      supabase.from('sectores').select('id, nombre, slug').order('id')
    ]);

    // Procesar resultados
    const niveles = nivelesResult.status === 'fulfilled' ? nivelesResult.value.data || [] : [];
    const roles = rolesResult.status === 'fulfilled' ? rolesResult.value.data || [] : [];
    const areas = areasResult.status === 'fulfilled' ? areasResult.value.data || [] : [];
    const relaciones = relacionesResult.status === 'fulfilled' ? relacionesResult.value.data || [] : [];
    const tamanos_empresa = tamanosResult.status === 'fulfilled' ? tamanosResult.value.data || [] : [];
    const sectores = sectoresResult.status === 'fulfilled' ? sectoresResult.value.data || [] : [];

    // Si no hay datos reales, retornar datos de ejemplo
    if (niveles.length === 0) {
      return NextResponse.json({
        niveles: [
          { id: 1, nombre: 'Principiante', slug: 'principiante' },
          { id: 2, nombre: 'Intermedio', slug: 'intermedio' },
          { id: 3, nombre: 'Avanzado', slug: 'avanzado' },
          { id: 4, nombre: 'Experto', slug: 'experto' }
        ],
        roles: [
          { id: 1, nombre: 'CEO/Dirección', slug: 'ceo-direccion', area_id: 1 },
          { id: 2, nombre: 'CTO/CIO', slug: 'cto-cio', area_id: 2 },
          { id: 3, nombre: 'Desarrollador UX/UI', slug: 'desarrollador-ux-ui', area_id: 2 },
          { id: 4, nombre: 'Gerencia Media', slug: 'gerencia-media', area_id: 1 },
          { id: 5, nombre: 'Miembros de Marketing', slug: 'miembros-marketing', area_id: 3 },
          { id: 6, nombre: 'Dirección de Finanzas (CFO)', slug: 'direccion-finanzas', area_id: 4 }
        ],
        areas: [
          { id: 1, nombre: 'Dirección y Liderazgo', slug: 'direccion-liderazgo' },
          { id: 2, nombre: 'Tecnología', slug: 'tecnologia' },
          { id: 3, nombre: 'Marketing', slug: 'marketing' },
          { id: 4, nombre: 'Finanzas', slug: 'finanzas' },
          { id: 5, nombre: 'Recursos Humanos', slug: 'recursos-humanos' },
          { id: 6, nombre: 'Operaciones', slug: 'operaciones' }
        ],
        relaciones: [
          { id: 1, nombre: 'Empleado a Tiempo Completo', slug: 'empleado-tiempo-completo' },
          { id: 2, nombre: 'Empleado a Tiempo Parcial', slug: 'empleado-tiempo-parcial' },
          { id: 3, nombre: 'Freelancer', slug: 'freelancer' },
          { id: 4, nombre: 'Consultor', slug: 'consultor' },
          { id: 5, nombre: 'Emprendedor', slug: 'emprendedor' },
          { id: 6, nombre: 'Estudiante', slug: 'estudiante' }
        ],
        tamanos_empresa: [
          { id: 1, nombre: 'Startup (1-10 empleados)', min_empleados: 1, max_empleados: 10 },
          { id: 2, nombre: 'Pequeña Empresa (11-50 empleados)', min_empleados: 11, max_empleados: 50 },
          { id: 3, nombre: 'Mediana Empresa (51-200 empleados)', min_empleados: 51, max_empleados: 200 },
          { id: 4, nombre: 'Gran Empresa (201-1000 empleados)', min_empleados: 201, max_empleados: 1000 },
          { id: 5, nombre: 'Corporación (1000+ empleados)', min_empleados: 1001, max_empleados: 999999 }
        ],
        sectores: [
          { id: 1, nombre: 'Tecnología', slug: 'tecnologia' },
          { id: 2, nombre: 'Salud', slug: 'salud' },
          { id: 3, nombre: 'Educación', slug: 'educacion' },
          { id: 4, nombre: 'Finanzas', slug: 'finanzas' },
          { id: 5, nombre: 'Manufactura', slug: 'manufactura' },
          { id: 6, nombre: 'Retail', slug: 'retail' },
          { id: 7, nombre: 'Consultoría', slug: 'consultoria' },
          { id: 8, nombre: 'Gobierno', slug: 'gobierno' }
        ]
      });
    }

    return NextResponse.json({
      niveles,
      roles,
      areas,
      relaciones,
      tamanos_empresa,
      sectores
    });

  } catch (error) {
    logger.error('Error fetching reference data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
