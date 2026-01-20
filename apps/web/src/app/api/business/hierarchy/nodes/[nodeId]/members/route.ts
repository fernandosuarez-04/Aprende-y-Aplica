import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/business/hierarchy/nodes/[nodeId]/members
 * Returns a list of members assigned to a specific node.
 */
export async function GET(
    request: Request,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const nodeId = params.nodeId;

        const supabase = await createClient();

        // Verify node belongs to organization
        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select('id')
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            return NextResponse.json(
                { success: false, error: 'Node not found or access denied' },
                { status: 404 }
            );
        }

        const { data: members, error: membersError } = await supabase
            .from('organization_node_users')
            .select(`
        id,
        user_id,
        role,
        is_primary,
        created_at,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url,
          username
        )
      `)
            .eq('node_id', nodeId)
            .order('created_at', { ascending: false });

        if (membersError) {
            logger.error('Error fetching node members:', membersError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch members' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            members
        });
    } catch (error) {
        logger.error('Error in GET /api/business/hierarchy/nodes/[nodeId]/members:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/business/hierarchy/nodes/[nodeId]/members
 * Assigns a user to a node.
 */
export async function POST(
    request: Request,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        // Check permissions (Owner/Admin or Manager of this node/parent?)
        // For now, restrict to Owner/Admin
        if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const nodeId = params.nodeId;
        const body = await request.json();
        const { userId, role = 'member', isPrimary = false } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Verify Node exists in Org
        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select('id')
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            return NextResponse.json(
                { success: false, error: 'Node not found' },
                { status: 404 }
            );
        }

        // 2. Verify User exists in Organization (organization_users table?)
        // Actually, we should check if they are an active member of the org context
        // Ideally we check public.organization_users but schema might vary.
        // Based on `users/assign/route.ts` it checks `organization_users`.
        const { data: orgUser, error: userError } = await supabase
            .from('organization_users')
            .select('id, user_id')
            .eq('user_id', userId)
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active')
            .single();

        if (userError || !orgUser) {
            return NextResponse.json(
                { success: false, error: 'User not found in organization' },
                { status: 404 }
            );
        }

        // 3. Assign User to Node
        // Check if already assigned
        const { data: existingAssignment } = await supabase
            .from('organization_node_users')
            .select('id')
            .eq('node_id', nodeId)
            .eq('user_id', userId)
            .single();

        if (existingAssignment) {
            return NextResponse.json(
                { success: false, error: 'User already assigned to this node' },
                { status: 409 }
            );
        }

        const { data: newAssignment, error: assignError } = await supabase
            .from('organization_node_users')
            .insert({
                node_id: nodeId,
                user_id: userId,
                role,
                is_primary: isPrimary
            })
            .select()
            .single();

        if (assignError) {
            logger.error('Error assigning user to node:', assignError);
            return NextResponse.json(
                { success: false, error: 'Failed to assign user' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            member: newAssignment
        });

    } catch (error) {
        logger.error('Error in POST /api/business/hierarchy/nodes/[nodeId]/members:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
