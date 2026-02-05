    -- Create skills table
    CREATE TABLE IF NOT EXISTS public.skills (
        skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT NOT NULL,
        icon_url TEXT,
        icon_type TEXT,
        icon_name TEXT,
        color TEXT,
        level TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Create course_skills table
    CREATE TABLE IF NOT EXISTS public.course_skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
        skill_id UUID NOT NULL REFERENCES public.skills(skill_id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        is_required BOOLEAN DEFAULT true,
        proficiency_level TEXT DEFAULT 'beginner',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(course_id, skill_id)
    );

    -- Create skill_badges table
    CREATE TABLE IF NOT EXISTS public.skill_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_id UUID NOT NULL REFERENCES public.skills(skill_id) ON DELETE CASCADE,
        level TEXT NOT NULL,
        badge_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(skill_id, level)
    );

    -- Function to get user skill level (placeholder)
    DROP FUNCTION IF EXISTS public.get_user_skill_level(uuid, uuid);

    CREATE OR REPLACE FUNCTION public.get_user_skill_level(p_user_id UUID, p_skill_id UUID)
    RETURNS TABLE (level TEXT, course_count BIGINT) AS $$
    BEGIN
        RETURN QUERY SELECT 'beginner'::TEXT, 0::BIGINT;
    END;
    $$ LANGUAGE plpgsql;

    -- Enable RLS
    ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;

    -- Policies for skills (Public read, Admin write)
    DO $$ BEGIN
        CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Skills are insertable by admins" ON public.skills FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.cargo_rol = 'Administrador')
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Skills are updateable by admins" ON public.skills FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.cargo_rol = 'Administrador')
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Skills are deletable by admins" ON public.skills FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.cargo_rol = 'Administrador')
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- Policies for course_skills
    DO $$ BEGIN
        CREATE POLICY "Course skills are viewable by everyone" ON public.course_skills FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Course skills are insertable by instructors and admins" ON public.course_skills FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.cargo_rol = 'Administrador')))
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Course skills are updateable by instructors and admins" ON public.course_skills FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.cargo_rol = 'Administrador')))
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Course skills are deletable by instructors and admins" ON public.course_skills FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.cargo_rol = 'Administrador')))
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- Policies for skill_badges
    DO $$ BEGIN
        CREATE POLICY "Skill badges are viewable by everyone" ON public.skill_badges FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE POLICY "Skill badges are manageable by admins" ON public.skill_badges FOR ALL USING (
            EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.cargo_rol = 'Administrador')
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

