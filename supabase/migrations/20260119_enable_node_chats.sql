-- Migration: Enable Hierarchy Chats for Organization Nodes
-- 1. Update constraint on hierarchy_chats table to allow 'node' entity type
-- 2. Create RPC function to get participants for a node chat (Manager + Users)

-- 1. Update Constraint
DO $$ 
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hierarchy_chats_entity_type_check') THEN
        ALTER TABLE public.hierarchy_chats DROP CONSTRAINT hierarchy_chats_entity_type_check;
    END IF;

    -- Add new constraint including 'node'
    ALTER TABLE public.hierarchy_chats 
    ADD CONSTRAINT hierarchy_chats_entity_type_check 
    CHECK (entity_type IN ('region', 'zone', 'team', 'node'));
END $$;

-- 2. Create RPC Function to get Node Participants
-- This function returns the list of users who should be in the chat for a specific node:
-- - The Node Manager (Leader)
-- - All users assigned directly to the node (organization_node_users)
CREATE OR REPLACE FUNCTION public.get_node_chat_participants(
    p_node_id uuid,
    p_organization_id uuid
)
RETURNS TABLE (
    user_id uuid,
    role text, -- 'manager' or 'member'
    full_name text,
    avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_manager_id uuid;
BEGIN
    -- Get Node Manager ID
    SELECT manager_id INTO v_manager_id
    FROM public.organization_nodes
    WHERE id = p_node_id AND organization_id = p_organization_id;

    RETURN QUERY
    -- Select Manager (if exists)
    SELECT 
        u.id as user_id,
        'manager'::text as role,
        (u.first_name || ' ' || u.last_name)::text as full_name,
        u.profile_picture_url as avatar_url
    FROM public.users u
    WHERE u.id = v_manager_id
    
    UNION
    
    -- Select Node Members
    SELECT 
        u.id as user_id,
        'member'::text as role,
        (u.first_name || ' ' || u.last_name)::text as full_name,
        u.profile_picture_url as avatar_url
    FROM public.organization_node_users onu
    JOIN public.users u ON u.id = onu.user_id
    WHERE onu.node_id = p_node_id 
    -- Exclude manager if they are also in the users list (to avoid duplicates, though UNION handles it)
    AND u.id IS DISTINCT FROM v_manager_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_node_chat_participants(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_node_chat_participants(uuid, uuid) TO service_role;
