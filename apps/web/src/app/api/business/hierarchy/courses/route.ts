import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const type = requestUrl.searchParams.get('type');
  const id = requestUrl.searchParams.get('id');

  if (!type || !id || !['region', 'zone', 'team'].includes(type)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Llamada a la RPC
    const { data, error } = await supabase.rpc('get_hierarchy_courses', {
      p_entity_type: type,
      p_entity_id: id
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      data: { courses: data || [] } 
    });

  } catch (error: any) {
    console.error('Error fetching hierarchy courses:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
