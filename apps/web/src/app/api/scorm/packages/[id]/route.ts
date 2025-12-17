import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('scorm_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json({ package: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el paquete existe y obtener storage_path
    const { data: package_ } = await supabase
      .from('scorm_packages')
      .select('storage_path, created_by')
      .eq('id', id)
      .single();

    if (!package_) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Verificar permisos (solo el creador o admin puede eliminar)
    // Por ahora solo verificamos que el usuario esté autenticado
    // En producción agregar verificación de roles

    // Soft delete - marcar como inactivo
    const { error } = await supabase
      .from('scorm_packages')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete package' },
        { status: 500 }
      );
    }

    // Opcionalmente eliminar archivos del storage
    // await supabase.storage.from('scorm-packages').remove([package_.storage_path]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, status } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from('scorm_packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, package: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}
