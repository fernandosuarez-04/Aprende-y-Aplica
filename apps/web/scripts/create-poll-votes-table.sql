-- Crear tabla para almacenar los votos de las encuestas
CREATE TABLE IF NOT EXISTS community_poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    option TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar votos duplicados del mismo usuario en la misma encuesta
    UNIQUE(post_id, user_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_post_id ON community_poll_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_user_id ON community_poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_option ON community_poll_votes(option);

-- Habilitar Row Level Security (RLS)
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios votos y los votos de las encuestas públicas
CREATE POLICY "Users can view poll votes for public communities" ON community_poll_votes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM community_posts cp
            JOIN communities c ON cp.community_id = c.id
            WHERE cp.id = community_poll_votes.post_id
            AND c.visibility = 'public'
        )
    );

-- Política para que los usuarios solo puedan insertar sus propios votos
CREATE POLICY "Users can insert their own poll votes" ON community_poll_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propios votos
CREATE POLICY "Users can update their own poll votes" ON community_poll_votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar sus propios votos
CREATE POLICY "Users can delete their own poll votes" ON community_poll_votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_community_poll_votes_updated_at
    BEFORE UPDATE ON community_poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
