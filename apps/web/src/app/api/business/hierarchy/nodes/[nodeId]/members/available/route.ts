import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/business/hierarchy/nodes/[nodeId]/members/available
 * Returns a list of users in the organization who are NOT members of this node.
 */
export async function GET(
    request: Request,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const nodeId = params.nodeId;
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';

        const supabase = await createClient();

        // 1. Get IDs of current members to exclude
        const { data: currentMembers, error: membersError } = await supabase
            .from('organization_node_users')
            .select('user_id')
            .eq('node_id', nodeId);

        if (membersError) {
            return NextResponse.json({ success: false, error: 'Error fetching current members' }, { status: 500 });
        }

        const excludedUserIds = currentMembers.map(m => m.user_id);

        // 2. Fetch available users from organization_users
        let dbQuery = supabase
            .from('organization_users')
            .select(`
        id,
        user_id,
        role,
        job_title,
        status,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url,
          username
        )
      `)
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active');

        // Filter by query (text search) if provided
        if (query) {
            // We can't easily ILIKE on a joined relation in standard postgrest-js without specialized syntax or RPC.
            // But assuming the 'users!inner' works, we can filter on the columns directly?
            // Supabase/PostgREST syntax for nested filter is `users.first_name.ilike.%query%`
            dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`, { foreignTable: 'users' });
        }

        const { data: users, error: usersError } = await dbQuery;

        if (usersError) {
            logger.error('Error fetching available users:', usersError);
            return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
        }

        // 3. Filter out excluded IDs strictly in JS (simpler than NOT IN with large arrays in API)
        // Or if array is small we could use .not('user_id', 'in', `(${excludedUserIds.join(',')})`)
        // JS filtering is fine for typical team sizes.
        const availableUsers = users.filter(u => !excludedUserIds.includes(u.user_id));

        return NextResponse.json({
            success: true,
            users: availableUsers
        });

    } catch (error) {
        logger.error('Error in GET /api/business/hierarchy/nodes/[nodeId]/members/available:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
