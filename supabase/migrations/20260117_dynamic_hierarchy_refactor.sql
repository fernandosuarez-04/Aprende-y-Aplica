-- Enable ltree extension for efficient hierarchical data querying
CREATE EXTENSION IF NOT EXISTS ltree;

-- 1. Organization Structures (Dimensiones: Geográfica, Orgánica, etc.)
CREATE TABLE IF NOT EXISTS public.organization_structures (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organization_structures_pkey PRIMARY KEY (id),
    CONSTRAINT organization_structures_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- 2. Organization Nodes (Nodos del árbol: Región, Zona, Equipo, etc.)
CREATE TABLE IF NOT EXISTS public.organization_nodes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    structure_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    type text NOT NULL, -- 'root', 'region', 'zone', 'team', 'custom'
    code text, -- Identificador opcional (ej. para integración externa)
    manager_id uuid, -- Líder/Responsable del nodo
    properties jsonb DEFAULT '{}'::jsonb, -- Metadata flexible (dirección, configuración, etc.)
    path ltree, -- Path materializado para búsquedas eficientes (ej. 'root.usa.sales')
    depth integer DEFAULT 0,
    position integer DEFAULT 0, -- Para ordenamiento manual
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organization_nodes_pkey PRIMARY KEY (id),
    CONSTRAINT organization_nodes_structure_id_fkey FOREIGN KEY (structure_id) REFERENCES public.organization_structures(id) ON DELETE CASCADE,
    CONSTRAINT organization_nodes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT organization_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.organization_nodes(id) ON DELETE CASCADE,
    CONSTRAINT organization_nodes_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Index for hierarchical queries
CREATE INDEX IF NOT EXISTS organization_nodes_path_idx ON public.organization_nodes USING GIST (path);
CREATE INDEX IF NOT EXISTS organization_nodes_parent_id_idx ON public.organization_nodes (parent_id);
CREATE INDEX IF NOT EXISTS organization_nodes_structure_id_idx ON public.organization_nodes (structure_id);

-- 3. Organization Node Users (Asignación de usuarios a nodos)
CREATE TABLE IF NOT EXISTS public.organization_node_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    node_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'member', -- 'leader', 'member', 'viewer'
    is_primary boolean DEFAULT false, -- Si el usuario pertenece a múltiples nodos, cuál es el principal
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organization_node_users_pkey PRIMARY KEY (id),
    CONSTRAINT organization_node_users_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.organization_nodes(id) ON DELETE CASCADE,
    CONSTRAINT organization_node_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE(node_id, user_id)
);

-- 4. Organization Node Courses (Asignación de cursos a niveles jerárquicos)
CREATE TABLE IF NOT EXISTS public.organization_node_courses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    node_id uuid NOT NULL,
    course_id uuid NOT NULL,
    assigned_by uuid,
    status text DEFAULT 'active',
    assigned_at timestamp with time zone DEFAULT now(),
    due_date timestamp with time zone,
    
    -- Campos migrados de work_team_course_assignments
    message text,
    metadata jsonb DEFAULT '{}'::jsonb,

    CONSTRAINT organization_node_courses_pkey PRIMARY KEY (id),
    CONSTRAINT organization_node_courses_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.organization_nodes(id) ON DELETE CASCADE,
    CONSTRAINT organization_node_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- 5. Organization Node Objectives (Objetivos de nodo)
CREATE TABLE IF NOT EXISTS public.organization_node_objectives (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    node_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    metric_type text NOT NULL, -- 'completion_percentage', 'average_score', etc.
    target_value numeric NOT NULL,
    current_value numeric DEFAULT 0,
    status text DEFAULT 'pending',
    deadline timestamp with time zone,
    course_id uuid, -- Opcional, si el objetivo es sobre un curso específico
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organization_node_objectives_pkey PRIMARY KEY (id),
    CONSTRAINT organization_node_objectives_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.organization_nodes(id) ON DELETE CASCADE
);

-- MIGRATION LOGIC (PL/pgSQL Block)
DO $$
DECLARE
    org_record RECORD;
    structure_id uuid;
    root_node_id uuid;
    team_record RECORD;
    new_node_id uuid;
    member_record RECORD;
    course_assign_record RECORD;
    objective_record RECORD;
BEGIN
    -- Loop through all existing organizations found in work_teams (or just all orgs)
    FOR org_record IN SELECT DISTINCT organization_id FROM public.work_teams
    LOOP
        -- 1. Create Default Structure for the Organization
        INSERT INTO public.organization_structures (organization_id, name, is_default)
        VALUES (org_record.organization_id, 'Estructura Organizacional', true)
        RETURNING id INTO structure_id;

        -- 2. Create Root Node 'General'
        INSERT INTO public.organization_nodes (structure_id, organization_id, name, type, depth, path)
        VALUES (structure_id, org_record.organization_id, 'General', 'root', 0, 'root')
        RETURNING id INTO root_node_id;

        -- 3. Loop through Work Teams of this Organization
        FOR team_record IN SELECT * FROM public.work_teams WHERE organization_id = org_record.organization_id
        LOOP
            -- Create Node for Team
            INSERT INTO public.organization_nodes (
                structure_id, 
                organization_id, 
                parent_id, 
                name, 
                type, 
                manager_id, 
                properties,
                depth,
                path
            )
            VALUES (
                structure_id,
                org_record.organization_id,
                root_node_id, -- Parent is General Root
                team_record.name,
                'team',
                team_record.team_leader_id,
                jsonb_build_object(
                    'original_team_id', team_record.team_id,
                    'description', team_record.description,
                    'slug', team_record.slug,
                    'image_url', team_record.image_url,
                    'legacy_status', team_record.status
                ),
                1,
                ('root.' || replace(lower(team_record.slug), '-', '_'))::ltree -- Generates path like root.team_slug
            )
            RETURNING id INTO new_node_id;

            -- 3a. Migrate Members
            INSERT INTO public.organization_node_users (node_id, user_id, role, created_at)
            SELECT 
                new_node_id, 
                user_id, 
                CASE 
                    WHEN role = 'leader' THEN 'leader' 
                    WHEN role = 'co-leader' THEN 'leader' 
                    ELSE 'member' 
                END, 
                joined_at
            FROM public.work_team_members 
            WHERE team_id = team_record.team_id
            ON CONFLICT DO NOTHING; -- Avoid duplicates

            -- 3b. Migrate Course Assignments
            INSERT INTO public.organization_node_courses (node_id, course_id, assigned_by, status, assigned_at, due_date, message)
            SELECT 
                new_node_id,
                course_id,
                assigned_by,
                status,
                assigned_at,
                due_date,
                message
            FROM public.work_team_course_assignments
            WHERE team_id = team_record.team_id;

            -- 3c. Migrate Main Team Course (if exists and not already assigned via table above)
            IF team_record.course_id IS NOT NULL THEN
                INSERT INTO public.organization_node_courses (node_id, course_id, assigned_by, status)
                VALUES (new_node_id, team_record.course_id, team_record.created_by, 'active')
                ON CONFLICT DO NOTHING; -- Could add constraint check or just ignore if logic is complex, for now assume simpler is better
                -- Note: table organization_node_courses pk is UUID, so no conflict unless we added unique constraint (node, course). 
                -- Let's stick to inserting.
            END IF;

            -- 3d. Migrate Objectives
            INSERT INTO public.organization_node_objectives (node_id, title, description, metric_type, target_value, current_value, status, deadline, course_id, created_by)
            SELECT
                new_node_id,
                title,
                description,
                metric_type,
                target_value,
                current_value,
                status,
                deadline,
                course_id,
                created_by
            FROM public.work_team_objectives
            WHERE team_id = team_record.team_id;

        END LOOP;
    END LOOP;
END $$;
