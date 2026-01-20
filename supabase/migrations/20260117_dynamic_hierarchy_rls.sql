-- Enable RLS on all hierarchy tables
ALTER TABLE public.organization_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_node_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_node_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_node_objectives ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR ORGANIZATION VARIABLILITY
-- We assume users are linked to organizations via organization_users table (based on requireBusiness logic)
-- Or we use the simple check: "auth.uid() is a member of the organization"

-- Helper function to check org membership (if not exists)
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Organization Structures
CREATE POLICY "Users can view structures of their organization"
ON public.organization_structures FOR SELECT
USING (public.is_org_member(organization_id));

CREATE POLICY "Business/Admins can manage structures"
ON public.organization_structures FOR ALL
USING (
  public.is_org_member(organization_id) AND 
  EXISTS (
    SELECT 1 FROM public.organization_users 
    WHERE user_id = auth.uid() AND organization_id = organization_structures.organization_id AND role IN ('owner', 'admin')
  )
);

-- 2. Organization Nodes
CREATE POLICY "Users can view nodes of their organization"
ON public.organization_nodes FOR SELECT
USING (public.is_org_member(organization_id));

CREATE POLICY "Business/Admins can manage nodes"
ON public.organization_nodes FOR ALL
USING (
  public.is_org_member(organization_id) AND 
  EXISTS (
    SELECT 1 FROM public.organization_users 
    WHERE user_id = auth.uid() AND organization_id = organization_nodes.organization_id AND role IN ('owner', 'admin')
  )
);

-- 3. Organization Node Users
CREATE POLICY "Users can view node memberships of their organization"
ON public.organization_node_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_nodes 
    WHERE id = organization_node_users.node_id 
    AND public.is_org_member(organization_nodes.organization_id)
  )
);

CREATE POLICY "Business/Admins can manage node users"
ON public.organization_node_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_nodes 
    WHERE id = organization_node_users.node_id 
    AND public.is_org_member(organization_nodes.organization_id)
    AND EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE user_id = auth.uid() AND organization_id = organization_nodes.organization_id AND role IN ('owner', 'admin')
    )
  )
);

-- 4. Organization Node Courses
CREATE POLICY "Users can view node courses of their organization"
ON public.organization_node_courses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_nodes 
    WHERE id = organization_node_courses.node_id 
    AND public.is_org_member(organization_nodes.organization_id)
  )
);

CREATE POLICY "Business/Admins can manage node courses"
ON public.organization_node_courses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_nodes 
    WHERE id = organization_node_courses.node_id 
    AND public.is_org_member(organization_nodes.organization_id)
    AND EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE user_id = auth.uid() AND organization_id = organization_nodes.organization_id AND role IN ('owner', 'admin')
    )
  )
);

-- 5. Organization Node Objectives
CREATE POLICY "Users can view node objectives"
ON public.organization_node_objectives FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_nodes 
    WHERE id = organization_node_objectives.node_id 
    AND public.is_org_member(organization_nodes.organization_id)
  )
);

CREATE POLICY "Business/Admins can manage node objectives"
ON public.organization_node_objectives FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_nodes 
    WHERE id = organization_node_objectives.node_id 
    AND public.is_org_member(organization_nodes.organization_id)
    AND EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE user_id = auth.uid() AND organization_id = organization_nodes.organization_id AND role IN ('owner', 'admin')
    )
  )
);

-- NOTIFY PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
