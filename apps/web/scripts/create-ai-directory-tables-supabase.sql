-- Script para crear las tablas del Directorio de IA en Supabase
-- Versión optimizada para Supabase con manejo correcto de auth.users

-- Habilitar la extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla para categorías de prompts y apps
CREATE TABLE IF NOT EXISTS ai_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para prompts de IA
CREATE TABLE IF NOT EXISTS ai_prompts (
    prompt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    content TEXT NOT NULL, -- El prompt completo
    category_id UUID REFERENCES ai_categories(category_id),
    tags TEXT[], -- Array de tags
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
    estimated_time_minutes INTEGER,
    use_cases TEXT[], -- Casos de uso
    tips TEXT[], -- Consejos para usar el prompt
    author_id UUID, -- Referencia a auth.users(id) - sin FK constraint por ahora
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para apps de IA
CREATE TABLE IF NOT EXISTS ai_apps (
    app_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    long_description TEXT,
    category_id UUID REFERENCES ai_categories(category_id),
    website_url TEXT,
    logo_url TEXT,
    pricing_model VARCHAR(50) NOT NULL, -- free, freemium, paid, subscription
    pricing_details JSONB, -- Detalles de precios
    features TEXT[], -- Características principales
    use_cases TEXT[], -- Casos de uso
    advantages TEXT[], -- Ventajas
    disadvantages TEXT[], -- Desventajas
    alternatives TEXT[], -- Alternativas
    tags TEXT[], -- Tags para búsqueda
    supported_languages TEXT[], -- Idiomas soportados
    integrations TEXT[], -- Integraciones disponibles
    api_available BOOLEAN DEFAULT FALSE,
    mobile_app BOOLEAN DEFAULT FALSE,
    desktop_app BOOLEAN DEFAULT FALSE,
    browser_extension BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para ratings de prompts
CREATE TABLE IF NOT EXISTS ai_prompt_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES ai_prompts(prompt_id) ON DELETE CASCADE,
    user_id UUID, -- Referencia a auth.users(id) - sin FK constraint por ahora
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prompt_id, user_id)
);

-- Tabla para ratings de apps
CREATE TABLE IF NOT EXISTS ai_app_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID REFERENCES ai_apps(app_id) ON DELETE CASCADE,
    user_id UUID, -- Referencia a auth.users(id) - sin FK constraint por ahora
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_id, user_id)
);

-- Tabla para favoritos de prompts
CREATE TABLE IF NOT EXISTS ai_prompt_favorites (
    favorite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES ai_prompts(prompt_id) ON DELETE CASCADE,
    user_id UUID, -- Referencia a auth.users(id) - sin FK constraint por ahora
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prompt_id, user_id)
);

-- Tabla para favoritos de apps
CREATE TABLE IF NOT EXISTS ai_app_favorites (
    favorite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID REFERENCES ai_apps(app_id) ON DELETE CASCADE,
    user_id UUID, -- Referencia a auth.users(id) - sin FK constraint por ahora
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_id, user_id)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_tags ON ai_prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_featured ON ai_prompts(is_featured);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active ON ai_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_rating ON ai_prompts(rating DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_created ON ai_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_author ON ai_prompts(author_id);

CREATE INDEX IF NOT EXISTS idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_tags ON ai_apps USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_apps_featured ON ai_apps(is_featured);
CREATE INDEX IF NOT EXISTS idx_ai_apps_active ON ai_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_apps_rating ON ai_apps(rating DESC);
CREATE INDEX IF NOT EXISTS idx_ai_apps_created ON ai_apps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_apps_pricing ON ai_apps(pricing_model);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_categories_updated_at 
    BEFORE UPDATE ON ai_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at 
    BEFORE UPDATE ON ai_prompts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_apps_updated_at 
    BEFORE UPDATE ON ai_apps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompt_ratings_updated_at 
    BEFORE UPDATE ON ai_prompt_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_app_ratings_updated_at 
    BEFORE UPDATE ON ai_app_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar ratings automáticamente
CREATE OR REPLACE FUNCTION update_prompt_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_prompts 
    SET 
        rating = (SELECT AVG(rating) FROM ai_prompt_ratings WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id)),
        rating_count = (SELECT COUNT(*) FROM ai_prompt_ratings WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id))
    WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_app_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_apps 
    SET 
        rating = (SELECT AVG(rating) FROM ai_app_ratings WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)),
        rating_count = (SELECT COUNT(*) FROM ai_app_ratings WHERE app_id = COALESCE(NEW.app_id, OLD.app_id))
    WHERE app_id = COALESCE(NEW.app_id, OLD.app_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prompt_rating_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON ai_prompt_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_prompt_rating();

CREATE TRIGGER update_app_rating_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON ai_app_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_app_rating();

-- Insertar categorías iniciales
INSERT INTO ai_categories (name, slug, description, icon, color) VALUES
('Contenido y Escritura', 'contenido-escritura', 'Herramientas para creación de contenido y escritura', 'pen-tool', '#3B82F6'),
('Arte e Ilustración', 'arte-ilustracion', 'Herramientas para creación artística e ilustración', 'palette', '#8B5CF6'),
('Desarrollo y Programación', 'desarrollo-programacion', 'Herramientas para desarrollo de software', 'code', '#10B981'),
('Productividad y Automatización', 'productividad-automatizacion', 'Herramientas para mejorar la productividad', 'zap', '#F59E0B'),
('Video y Audio', 'video-audio', 'Herramientas para edición de video y audio', 'video', '#EF4444'),
('Música y Audio', 'musica-audio', 'Herramientas para creación musical', 'music', '#EC4899'),
('Análisis de Datos', 'analisis-datos', 'Herramientas para análisis y visualización de datos', 'bar-chart', '#06B6D4'),
('Educación y Aprendizaje', 'educacion-aprendizaje', 'Herramientas educativas y de aprendizaje', 'book-open', '#84CC16'),
('Marketing y Ventas', 'marketing-ventas', 'Herramientas para marketing y ventas', 'trending-up', '#F97316'),
('Diseño y UI/UX', 'diseno-ui-ux', 'Herramientas de diseño y experiencia de usuario', 'layers', '#6366F1')
ON CONFLICT (slug) DO NOTHING;

-- Habilitar Row Level Security (RLS) para las tablas
ALTER TABLE ai_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_app_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_app_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ai_categories (lectura pública)
CREATE POLICY "ai_categories_select_policy" ON ai_categories
    FOR SELECT USING (is_active = true);

-- Políticas de RLS para ai_prompts (lectura pública, escritura solo para usuarios autenticados)
CREATE POLICY "ai_prompts_select_policy" ON ai_prompts
    FOR SELECT USING (is_active = true);

CREATE POLICY "ai_prompts_insert_policy" ON ai_prompts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ai_prompts_update_policy" ON ai_prompts
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NOT NULL);

-- Políticas de RLS para ai_apps (lectura pública, escritura solo para usuarios autenticados)
CREATE POLICY "ai_apps_select_policy" ON ai_apps
    FOR SELECT USING (is_active = true);

CREATE POLICY "ai_apps_insert_policy" ON ai_apps
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ai_apps_update_policy" ON ai_apps
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Políticas de RLS para ratings (solo usuarios autenticados)
CREATE POLICY "ai_prompt_ratings_select_policy" ON ai_prompt_ratings
    FOR SELECT USING (true);

CREATE POLICY "ai_prompt_ratings_insert_policy" ON ai_prompt_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_prompt_ratings_update_policy" ON ai_prompt_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_prompt_ratings_delete_policy" ON ai_prompt_ratings
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "ai_app_ratings_select_policy" ON ai_app_ratings
    FOR SELECT USING (true);

CREATE POLICY "ai_app_ratings_insert_policy" ON ai_app_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_app_ratings_update_policy" ON ai_app_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_app_ratings_delete_policy" ON ai_app_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas de RLS para favoritos (solo usuarios autenticados)
CREATE POLICY "ai_prompt_favorites_select_policy" ON ai_prompt_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_prompt_favorites_insert_policy" ON ai_prompt_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_prompt_favorites_delete_policy" ON ai_prompt_favorites
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "ai_app_favorites_select_policy" ON ai_app_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_app_favorites_insert_policy" ON ai_app_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_app_favorites_delete_policy" ON ai_app_favorites
    FOR DELETE USING (auth.uid() = user_id);
