-- ============================================
-- MIGRACIÓN: Sistema de Chats Jerárquicos
-- Fecha: 2026-01-10
-- Descripción: Implementa sistema de chats horizontales (mismo nivel)
--              y verticales (jerárquicos) para la estructura organizacional
-- ============================================

-- ===========================================
-- PARTE 1: CREAR TABLA HIERARCHY_CHATS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.hierarchy_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  
  -- Tipo de chat
  chat_type character varying(20) NOT NULL CHECK (chat_type IN ('horizontal', 'vertical')),
  
  -- Entidad a la que pertenece el chat
  entity_type character varying(20) NOT NULL CHECK (entity_type IN ('region', 'zone', 'team')),
  entity_id uuid NOT NULL,
  
  -- Para chats horizontales: nivel jerárquico
  -- Para chats verticales: líder que gestiona el chat
  level_role character varying(30), -- 'regional_manager', 'zone_manager', 'team_leader'
  
  -- Metadata adicional
  name character varying(200), -- Nombre descriptivo del chat
  description text,
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone,
  
  -- Primary Key
  CONSTRAINT hierarchy_chats_pkey PRIMARY KEY (id),
  
  -- Foreign Keys
  CONSTRAINT hierarchy_chats_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  
  -- Unique constraint: un chat por tipo y entidad
  CONSTRAINT hierarchy_chats_unique_entity
    UNIQUE (organization_id, entity_type, entity_id, chat_type)
);

-- Índices para hierarchy_chats
CREATE INDEX IF NOT EXISTS idx_hierarchy_chats_org_id
ON public.hierarchy_chats(organization_id);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chats_entity
ON public.hierarchy_chats(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chats_type
ON public.hierarchy_chats(chat_type, entity_type);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chats_active
ON public.hierarchy_chats(organization_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_hierarchy_chats_last_message
ON public.hierarchy_chats(last_message_at DESC NULLS LAST);

-- Comentarios
COMMENT ON TABLE public.hierarchy_chats IS
  'Chats jerárquicos: horizontales (mismo nivel) y verticales (líder con subordinados)';
COMMENT ON COLUMN public.hierarchy_chats.chat_type IS
  'Tipo de chat: horizontal (mismo nivel) o vertical (jerárquico)';
COMMENT ON COLUMN public.hierarchy_chats.entity_type IS
  'Tipo de entidad: region, zone, team';
COMMENT ON COLUMN public.hierarchy_chats.entity_id IS
  'ID de la entidad (región, zona o equipo)';
COMMENT ON COLUMN public.hierarchy_chats.level_role IS
  'Rol del nivel jerárquico para identificar participantes';

-- ===========================================
-- PARTE 2: CREAR TABLA HIERARCHY_CHAT_MESSAGES
-- ===========================================

CREATE TABLE IF NOT EXISTS public.hierarchy_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  
  -- Usuario que envía el mensaje
  sender_id uuid NOT NULL,
  
  -- Contenido del mensaje
  content text NOT NULL,
  message_type character varying(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  
  -- Metadata del mensaje
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Estado del mensaje
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Primary Key
  CONSTRAINT hierarchy_chat_messages_pkey PRIMARY KEY (id),
  
  -- Foreign Keys
  CONSTRAINT hierarchy_chat_messages_chat_id_fkey
    FOREIGN KEY (chat_id)
    REFERENCES public.hierarchy_chats(id)
    ON DELETE CASCADE,
  CONSTRAINT hierarchy_chat_messages_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT hierarchy_chat_messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
);

-- Índices para hierarchy_chat_messages
CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_messages_chat_id
ON public.hierarchy_chat_messages(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_messages_sender
ON public.hierarchy_chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_messages_org_id
ON public.hierarchy_chat_messages(organization_id);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_messages_active
ON public.hierarchy_chat_messages(chat_id, created_at DESC)
WHERE is_deleted = false;

-- Comentarios
COMMENT ON TABLE public.hierarchy_chat_messages IS
  'Mensajes dentro de los chats jerárquicos';
COMMENT ON COLUMN public.hierarchy_chat_messages.message_type IS
  'Tipo de mensaje: text (normal), system (mensaje del sistema), file (archivo adjunto)';

-- ===========================================
-- PARTE 3: CREAR TABLA HIERARCHY_CHAT_PARTICIPANTS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.hierarchy_chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  
  -- Estado de participación
  is_active boolean DEFAULT true,
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  
  -- Notificaciones
  last_read_at timestamp with time zone,
  unread_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Primary Key
  CONSTRAINT hierarchy_chat_participants_pkey PRIMARY KEY (id),
  
  -- Foreign Keys
  CONSTRAINT hierarchy_chat_participants_chat_id_fkey
    FOREIGN KEY (chat_id)
    REFERENCES public.hierarchy_chats(id)
    ON DELETE CASCADE,
  CONSTRAINT hierarchy_chat_participants_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE,
  CONSTRAINT hierarchy_chat_participants_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  
  -- Unique constraint: un usuario solo puede estar una vez en un chat
  CONSTRAINT hierarchy_chat_participants_unique
    UNIQUE (chat_id, user_id)
);

-- Índices para hierarchy_chat_participants
CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_participants_chat_id
ON public.hierarchy_chat_participants(chat_id, is_active);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_participants_user_id
ON public.hierarchy_chat_participants(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_hierarchy_chat_participants_org_id
ON public.hierarchy_chat_participants(organization_id);

-- Comentarios
COMMENT ON TABLE public.hierarchy_chat_participants IS
  'Participantes de los chats jerárquicos con estado de lectura';

-- ===========================================
-- PARTE 4: FUNCIONES AUXILIARES
-- ===========================================

-- Función para actualizar last_message_at cuando se crea un mensaje
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.hierarchy_chats
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  -- Incrementar unread_count para todos los participantes excepto el sender
  UPDATE public.hierarchy_chat_participants
  SET unread_count = unread_count + 1,
      updated_at = NOW()
  WHERE chat_id = NEW.chat_id
    AND user_id != NEW.sender_id
    AND is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_message_at
CREATE TRIGGER trigger_update_chat_last_message
AFTER INSERT ON public.hierarchy_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message();

-- Función para obtener participantes de un chat horizontal (mismo nivel)
CREATE OR REPLACE FUNCTION get_horizontal_chat_participants(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR,
  display_name VARCHAR,
  email VARCHAR,
  profile_picture_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ou.user_id,
    ou.role::VARCHAR,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name, u.username)::VARCHAR as display_name,
    u.email::VARCHAR,
    u.profile_picture_url::TEXT
  FROM public.organization_users ou
  INNER JOIN public.users u ON u.id = ou.user_id
  WHERE ou.organization_id = p_organization_id
    AND ou.status = 'active'
    AND (
      -- Para regiones: todos los regional_manager de la misma organización
      (p_entity_type = 'region' AND ou.role = 'regional_manager' AND ou.region_id = p_entity_id)
      OR
      -- Para zonas: todos los zone_manager de la misma región (necesitamos obtener la región de la zona)
      (p_entity_type = 'zone' AND ou.role = 'zone_manager' AND ou.zone_id IN (
        SELECT id FROM public.organization_zones WHERE region_id = (
          SELECT region_id FROM public.organization_zones WHERE id = p_entity_id
        )
      ))
      OR
      -- Para equipos: todos los team_leader de la misma zona (necesitamos obtener la zona del equipo)
      (p_entity_type = 'team' AND ou.role = 'team_leader' AND ou.team_id IN (
        SELECT id FROM public.organization_teams WHERE zone_id = (
          SELECT zone_id FROM public.organization_teams WHERE id = p_entity_id
        )
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener participantes de un chat vertical (líder con subordinados)
CREATE OR REPLACE FUNCTION get_vertical_chat_participants(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR,
  display_name VARCHAR,
  email VARCHAR,
  profile_picture_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ou.user_id,
    ou.role::VARCHAR,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name, u.username)::VARCHAR as display_name,
    u.email::VARCHAR,
    u.profile_picture_url::TEXT
  FROM public.organization_users ou
  INNER JOIN public.users u ON u.id = ou.user_id
  WHERE ou.organization_id = p_organization_id
    AND ou.status = 'active'
    AND (
      -- Para regiones: líder regional + todos los zone_manager de sus zonas
      (p_entity_type = 'region' AND (
        (ou.role = 'regional_manager' AND ou.region_id = p_entity_id)
        OR
        (ou.role = 'zone_manager' AND ou.zone_id IN (
          SELECT id FROM public.organization_zones WHERE region_id = p_entity_id
        ))
      ))
      OR
      -- Para zonas: líder de zona + todos los team_leader de sus equipos
      (p_entity_type = 'zone' AND (
        (ou.role = 'zone_manager' AND ou.zone_id = p_entity_id)
        OR
        (ou.role = 'team_leader' AND ou.team_id IN (
          SELECT id FROM public.organization_teams WHERE zone_id = p_entity_id
        ))
      ))
      OR
      -- Para equipos: líder de equipo + todos los miembros (member) del equipo
      (p_entity_type = 'team' AND (
        (ou.role = 'team_leader' AND ou.team_id = p_entity_id)
        OR
        (ou.role = 'member' AND ou.team_id = p_entity_id)
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- PARTE 5: RLS (Row Level Security)
-- ===========================================

-- Habilitar RLS
ALTER TABLE public.hierarchy_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_chat_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para hierarchy_chats
CREATE POLICY "Users can view chats in their organization"
  ON public.hierarchy_chats
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Políticas para hierarchy_chat_messages
CREATE POLICY "Users can view messages in chats they participate"
  ON public.hierarchy_chat_messages
  FOR SELECT
  USING (
    chat_id IN (
      SELECT chat_id FROM public.hierarchy_chat_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can send messages in chats they participate"
  ON public.hierarchy_chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND chat_id IN (
      SELECT chat_id FROM public.hierarchy_chat_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.hierarchy_chat_messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Políticas para hierarchy_chat_participants
CREATE POLICY "Users can view participants in chats they participate"
  ON public.hierarchy_chat_participants
  FOR SELECT
  USING (
    chat_id IN (
      SELECT chat_id FROM public.hierarchy_chat_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own participation"
  ON public.hierarchy_chat_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

