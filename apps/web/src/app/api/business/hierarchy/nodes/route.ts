import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextResponse } from 'next/server';

// helper to build tree
function buildTree(nodes: any[]) {
    const map = new Map();
    const roots: any[] = [];

    nodes.forEach(node => {
        map.set(node.id, { ...node, children: [] });
    });

    nodes.forEach(node => {
        if (node.parent_id && map.has(node.parent_id)) {
            map.get(node.parent_id).children.push(map.get(node.id));
        } else {
            roots.push(map.get(node.id));
        }
    });

    return roots;
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const structureId = searchParams.get('structureId');

    if (!structureId) {
        return NextResponse.json({ error: 'Structure ID required' }, { status: 400 });
    }

    const { data: nodes, error } = await supabase
        .from('organization_nodes')
        .select(`
        *,
        manager:manager_id (
            id, first_name, last_name, email, profile_picture_url
        )
    `)
        .eq('structure_id', structureId)
        .order('depth')
        .order('position');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if we assume the client wants flat list or tree. 
    // Let's return flat list to let client build tree or build it here?
    // Let's return flat nodes, easier for client storage/manipulation sometimes, 
    // but if we want simple, let's return flat. The frontend service seemed to expect "nodes" array.

    return NextResponse.json({ nodes });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    // Auth Check
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth as any;

    const body = await request.json(); // { structure_id, parent_id, name, type, ... }

    // Logic to calculate path and depth
    let path = '';
    let depth = 0;

    // 1. Get Organization ID from structure and VERIFY it matches auth context
    const { data: structure } = await supabase
        .from('organization_structures')
        .select('organization_id')
        .eq('id', body.structure_id)
        .single();

    if (!structure) return NextResponse.json({ error: 'Structure not found' }, { status: 404 });

    // Security check: Ensure structure belongs to the user's organization
    if (structure.organization_id !== organizationId) {
        return NextResponse.json({ error: 'Unauthorized access to this structure' }, { status: 403 });
    }

    // 2. Calculate Path
    if (body.parent_id) {
        const { data: parent } = await supabase.from('organization_nodes').select('path, depth').eq('id', body.parent_id).single();
        if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

        // Sanitize slug
        const slug = body.name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');

        path = `${parent.path}.${slug}`;
        depth = parent.depth + 1;
    } else {
        path = 'root';
        depth = 0;
    }

    const { data, error } = await supabase
        .from('organization_nodes')
        .insert({
            ...body,
            organization_id: organizationId, // Enforce from auth context
            path,
            depth
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
