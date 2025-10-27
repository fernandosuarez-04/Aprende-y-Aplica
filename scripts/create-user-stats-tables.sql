-- Script para crear las tablas de estadísticas de usuarios si no existen
-- Ejecutar en Supabase SQL Editor

-- Crear tabla areas
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL
);

-- Crear tabla niveles
CREATE TABLE IF NOT EXISTS niveles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL
);

-- Crear tabla roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  area_id INTEGER REFERENCES areas(id)
);

-- Crear tabla relaciones
CREATE TABLE IF NOT EXISTS relaciones (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL
);

-- Crear tabla tamanos_empresa
CREATE TABLE IF NOT EXISTS tamanos_empresa (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  min_empleados INTEGER NOT NULL,
  max_empleados INTEGER NOT NULL
);

-- Crear tabla sectores
CREATE TABLE IF NOT EXISTS sectores (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL
);

-- Crear tabla user_perfil
CREATE TABLE IF NOT EXISTS user_perfil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cargo_titulo TEXT,
  rol_id INTEGER REFERENCES roles(id),
  nivel_id INTEGER REFERENCES niveles(id),
  area_id INTEGER REFERENCES areas(id),
  relacion_id INTEGER REFERENCES relaciones(id),
  tamano_id INTEGER REFERENCES tamanos_empresa(id),
  sector_id INTEGER REFERENCES sectores(id),
  pais TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla preguntas
CREATE TABLE IF NOT EXISTS preguntas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  section TEXT NOT NULL,
  bloque TEXT NOT NULL,
  area_id INTEGER REFERENCES areas(id),
  exclusivo_rol_id INTEGER REFERENCES roles(id),
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL,
  opciones JSONB,
  locale TEXT DEFAULT 'es',
  peso NUMERIC DEFAULT 1.0,
  escala JSONB,
  scoring JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  respuesta_correcta TEXT
);

-- Crear tabla respuestas
CREATE TABLE IF NOT EXISTS respuestas (
  id BIGSERIAL PRIMARY KEY,
  pregunta_id BIGINT REFERENCES preguntas(id),
  valor JSONB NOT NULL,
  respondido_en TIMESTAMPTZ DEFAULT NOW(),
  user_perfil_id UUID REFERENCES user_perfil(id)
);

-- Crear tabla adopcion_genai
CREATE TABLE IF NOT EXISTS adopcion_genai (
  id SERIAL PRIMARY KEY,
  pais TEXT NOT NULL,
  indice_aipi NUMERIC NOT NULL,
  fuente TEXT NOT NULL,
  fecha_fuente TEXT NOT NULL
);

-- Crear tabla role_synonyms
CREATE TABLE IF NOT EXISTS role_synonyms (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id),
  alias TEXT NOT NULL
);

-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  'CREADA' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_perfil',
    'preguntas', 
    'respuestas',
    'adopcion_genai',
    'roles',
    'niveles',
    'areas',
    'relaciones',
    'tamanos_empresa',
    'sectores',
    'role_synonyms'
  )
ORDER BY table_name;
