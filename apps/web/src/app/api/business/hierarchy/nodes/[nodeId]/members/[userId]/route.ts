import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

/**
 * DELETE /api/business/hierarchy/nodes/[nodeId]/members/[userId]
 * Removes a user from a node.
 */
export async function DELETE(
    request: Request,
    { params }: { params: { nodeId: string; userId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        // Permissions: Only Owner/Admin can remove members for now
        if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const { nodeId, userId } = params;
        const supabase = await createClient();

        // Verify Node belongs to Org
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

        // Attempt to delete
        const { error: deleteError } = await supabase
            .from('organization_node_users')
            .delete()
            .eq('node_id', nodeId)
            .eq('user_id', userId);

        if (deleteError) {
            logger.error('Error removing user from node:', deleteError);
            return NextResponse.json(
                { success: false, error: 'Failed to remove user' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User removed successfully'
        });

    } catch (error) {
        logger.error('Error in DELETE /api/business/hierarchy/nodes/[nodeId]/members/[userId]:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
