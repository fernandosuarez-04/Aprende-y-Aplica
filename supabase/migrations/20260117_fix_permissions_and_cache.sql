-- 1. Explicitly GRANT permissions to ensuring visibility
-- Sometimes default permissions might not apply to new tables depending on project config
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.organization_structures TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.organization_nodes TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.organization_node_users TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.organization_node_courses TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.organization_node_objectives TO postgres, anon, authenticated, service_role;

-- 2. Force Schema Cache Reload (Try multiple channels just in case)
NOTIFY pgrst, 'reload config';

-- 3. Verify RLS is enabled (just to be sure)
ALTER TABLE public.organization_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_nodes ENABLE ROW LEVEL SECURITY;
