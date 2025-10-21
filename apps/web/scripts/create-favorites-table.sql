-- Script para crear la tabla de favoritos
-- Ejecutar este script en Supabase SQL Editor

-- Crear tabla de favoritos
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados
  UNIQUE(user_id, course_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_course_id ON user_favorites(course_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios favoritos
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política para que los usuarios solo puedan insertar sus propios favoritos
CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política para que los usuarios solo puedan eliminar sus propios favoritos
CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_favorites_updated_at 
  BEFORE UPDATE ON user_favorites 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_favorites'
ORDER BY ordinal_position;
