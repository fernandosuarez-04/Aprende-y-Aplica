-- =====================================================
-- Migración: Agregar columna 'slug' a work_teams
-- Fecha: 2025-12-31
-- Descripción: Permite URLs amigables para equipos
-- =====================================================

-- Paso 1: Agregar la columna slug (nullable inicialmente)
ALTER TABLE work_teams 
ADD COLUMN IF NOT EXISTS slug VARCHAR(150);

-- Paso 2: Crear función para generar slug desde el nombre
-- Usamos prefijo 'p_' para los parámetros para evitar ambigüedad
CREATE OR REPLACE FUNCTION generate_team_slug(p_team_name TEXT, p_team_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convertir a minúsculas y reemplazar espacios/caracteres especiales
    base_slug := lower(trim(p_team_name));
    base_slug := regexp_replace(base_slug, '[áàâã]', 'a', 'g');
    base_slug := regexp_replace(base_slug, '[éèê]', 'e', 'g');
    base_slug := regexp_replace(base_slug, '[íìî]', 'i', 'g');
    base_slug := regexp_replace(base_slug, '[óòôõ]', 'o', 'g');
    base_slug := regexp_replace(base_slug, '[úùû]', 'u', 'g');
    base_slug := regexp_replace(base_slug, '[ñ]', 'n', 'g');
    base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Limitar longitud
    IF length(base_slug) > 100 THEN
        base_slug := substring(base_slug from 1 for 100);
    END IF;
    
    -- Si está vacío, usar 'equipo'
    IF base_slug = '' THEN
        base_slug := 'equipo';
    END IF;
    
    final_slug := base_slug;
    
    -- Verificar unicidad y agregar sufijo si es necesario
    WHILE EXISTS (SELECT 1 FROM work_teams wt WHERE wt.slug = final_slug AND wt.team_id != p_team_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Actualizar equipos existentes con slugs
UPDATE work_teams 
SET slug = generate_team_slug(name, team_id)
WHERE slug IS NULL;

-- Paso 4: Hacer la columna NOT NULL y agregar índice único
ALTER TABLE work_teams 
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_work_teams_slug 
ON work_teams(slug);

-- Paso 5: Crear trigger para auto-generar slug en nuevos equipos
CREATE OR REPLACE FUNCTION auto_generate_team_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_team_slug(NEW.name, NEW.team_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_team_slug ON work_teams;
CREATE TRIGGER trigger_auto_team_slug
    BEFORE INSERT ON work_teams
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_team_slug();

-- Verificar la migración
SELECT team_id, name, slug FROM work_teams LIMIT 10;
