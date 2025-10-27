-- Script para poblar las tablas de estadísticas de usuarios con datos de ejemplo
-- Ejecutar en Supabase SQL Editor

-- Insertar áreas
INSERT INTO areas (id, slug, nombre) VALUES 
(1, 'tecnologia', 'Tecnología'),
(2, 'marketing', 'Marketing'),
(3, 'ventas', 'Ventas'),
(4, 'recursos-humanos', 'Recursos Humanos'),
(5, 'finanzas', 'Finanzas'),
(6, 'operaciones', 'Operaciones')
ON CONFLICT (id) DO NOTHING;

-- Insertar niveles
INSERT INTO niveles (id, slug, nombre) VALUES 
(1, 'junior', 'Junior'),
(2, 'mid-level', 'Mid-Level'),
(3, 'senior', 'Senior'),
(4, 'lead', 'Lead'),
(5, 'manager', 'Manager'),
(6, 'director', 'Director')
ON CONFLICT (id) DO NOTHING;

-- Insertar roles
INSERT INTO roles (id, slug, nombre, area_id) VALUES 
(1, 'desarrollador-frontend', 'Desarrollador Frontend', 1),
(2, 'desarrollador-backend', 'Desarrollador Backend', 1),
(3, 'data-scientist', 'Data Scientist', 1),
(4, 'marketing-manager', 'Marketing Manager', 2),
(5, 'content-creator', 'Content Creator', 2),
(6, 'sales-representative', 'Sales Representative', 3),
(7, 'account-manager', 'Account Manager', 3),
(8, 'hr-specialist', 'HR Specialist', 4),
(9, 'financial-analyst', 'Financial Analyst', 5),
(10, 'operations-manager', 'Operations Manager', 6)
ON CONFLICT (id) DO NOTHING;

-- Insertar relaciones
INSERT INTO relaciones (id, slug, nombre) VALUES 
(1, 'empleado', 'Empleado'),
(2, 'freelancer', 'Freelancer'),
(3, 'consultor', 'Consultor'),
(4, 'estudiante', 'Estudiante'),
(5, 'emprendedor', 'Emprendedor')
ON CONFLICT (id) DO NOTHING;

-- Insertar tamaños de empresa
INSERT INTO tamanos_empresa (id, slug, nombre, min_empleados, max_empleados) VALUES 
(1, 'startup', 'Startup', 1, 10),
(2, 'pequena', 'Pequeña', 11, 50),
(3, 'mediana', 'Mediana', 51, 200),
(4, 'grande', 'Grande', 201, 1000),
(5, 'enterprise', 'Enterprise', 1001, 999999)
ON CONFLICT (id) DO NOTHING;

-- Insertar sectores
INSERT INTO sectores (id, slug, nombre) VALUES 
(1, 'tecnologia', 'Tecnología'),
(2, 'finanzas', 'Finanzas'),
(3, 'salud', 'Salud'),
(4, 'educacion', 'Educación'),
(5, 'retail', 'Retail'),
(6, 'manufactura', 'Manufactura'),
(7, 'consultoria', 'Consultoría'),
(8, 'gobierno', 'Gobierno')
ON CONFLICT (id) DO NOTHING;

-- Insertar perfiles de usuario de ejemplo
INSERT INTO user_perfil (
  id,
  user_id,
  cargo_titulo,
  rol_id,
  nivel_id,
  area_id,
  relacion_id,
  tamano_id,
  sector_id,
  pais,
  creado_en,
  actualizado_en
) VALUES 
(
  gen_random_uuid(),
  '8365d552-f342-4cd7-ae6b-dff8063a1377',
  'Desarrollador Frontend Senior',
  1,
  3,
  1,
  1,
  3,
  1,
  'México',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Marketing Manager',
  4,
  5,
  2,
  1,
  4,
  2,
  'España',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Data Scientist',
  3,
  3,
  1,
  1,
  5,
  1,
  'Argentina',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Sales Representative',
  6,
  2,
  3,
  1,
  2,
  5,
  'Colombia',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'HR Specialist',
  8,
  2,
  4,
  1,
  3,
  7,
  'Chile',
  NOW(),
  NOW()
);

-- Insertar preguntas de ejemplo
INSERT INTO preguntas (
  id,
  codigo,
  section,
  bloque,
  area_id,
  texto,
  tipo,
  opciones,
  locale,
  peso,
  created_at
) VALUES 
(
  1,
  'EXP_001',
  'Experiencia General',
  'Introducción',
  1,
  '¿Cuál es tu nivel de experiencia con herramientas de IA?',
  'multiple_choice',
  '{"opciones": ["Principiante", "Intermedio", "Avanzado", "Experto"]}',
  'es',
  1.0,
  NOW()
),
(
  2,
  'EXP_002',
  'Experiencia General',
  'Introducción',
  1,
  '¿Qué herramientas de IA utilizas regularmente?',
  'multiple_choice',
  '{"opciones": ["ChatGPT", "Claude", "Midjourney", "Stable Diffusion", "GitHub Copilot", "Otras"]}',
  'es',
  1.0,
  NOW()
),
(
  3,
  'EXP_003',
  'Experiencia Laboral',
  'Contexto',
  2,
  '¿Cómo integras la IA en tu trabajo diario?',
  'open_text',
  NULL,
  'es',
  1.5,
  NOW()
),
(
  4,
  'EXP_004',
  'Experiencia Laboral',
  'Contexto',
  3,
  '¿Qué beneficios has observado al usar IA en ventas?',
  'multiple_choice',
  '{"opciones": ["Aumento en conversiones", "Mejor segmentación", "Automatización de procesos", "Mejor análisis de datos", "Ninguno"]}',
  'es',
  1.2,
  NOW()
),
(
  5,
  'EXP_005',
  'Satisfacción',
  'Evaluación',
  4,
  '¿Qué tan satisfecho estás con las herramientas de IA disponibles?',
  'scale',
  '{"escala": {"min": 1, "max": 10, "etiquetas": {"1": "Muy insatisfecho", "10": "Muy satisfecho"}}}',
  'es',
  1.0,
  NOW()
);

-- Insertar respuestas de ejemplo
INSERT INTO respuestas (
  id,
  pregunta_id,
  valor,
  respondido_en,
  user_perfil_id
) VALUES 
(
  1,
  1,
  '"Intermedio"',
  NOW(),
  (SELECT id FROM user_perfil LIMIT 1)
),
(
  2,
  2,
  '["ChatGPT", "GitHub Copilot"]',
  NOW(),
  (SELECT id FROM user_perfil LIMIT 1)
),
(
  3,
  3,
  '"Utilizo ChatGPT para generar código y documentación, y GitHub Copilot para acelerar el desarrollo."',
  NOW(),
  (SELECT id FROM user_perfil LIMIT 1)
),
(
  4,
  4,
  '"Aumento en conversiones"',
  NOW(),
  (SELECT id FROM user_perfil OFFSET 1 LIMIT 1)
),
(
  5,
  5,
  '8',
  NOW(),
  (SELECT id FROM user_perfil LIMIT 1)
);

-- Insertar datos de adopción GenAI
INSERT INTO adopcion_genai (
  id,
  pais,
  indice_aipi,
  fuente,
  fecha_fuente
) VALUES 
(1, 'México', 7.2, 'Estudio Nacional de IA 2024', '2024-01-15'),
(2, 'España', 8.1, 'Reporte Europeo de Adopción IA', '2024-02-01'),
(3, 'Argentina', 6.8, 'Análisis Regional IA', '2024-01-20'),
(4, 'Colombia', 7.5, 'Estudio Latinoamericano IA', '2024-02-10'),
(5, 'Chile', 8.3, 'Reporte Andino de Tecnología', '2024-01-25'),
(6, 'Brasil', 7.9, 'Estudio Brasileño de IA', '2024-02-05'),
(7, 'Perú', 6.5, 'Análisis Peruano de IA', '2024-01-30'),
(8, 'Uruguay', 8.7, 'Reporte Uruguayo de Innovación', '2024-02-15');

-- Verificar datos insertados
SELECT 'Áreas' as tabla, COUNT(*) as total FROM areas
UNION ALL
SELECT 'Niveles', COUNT(*) FROM niveles
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Relaciones', COUNT(*) FROM relaciones
UNION ALL
SELECT 'Tamaños Empresa', COUNT(*) FROM tamanos_empresa
UNION ALL
SELECT 'Sectores', COUNT(*) FROM sectores
UNION ALL
SELECT 'Perfiles Usuario', COUNT(*) FROM user_perfil
UNION ALL
SELECT 'Preguntas', COUNT(*) FROM preguntas
UNION ALL
SELECT 'Respuestas', COUNT(*) FROM respuestas
UNION ALL
SELECT 'Adopción GenAI', COUNT(*) FROM adopcion_genai;
