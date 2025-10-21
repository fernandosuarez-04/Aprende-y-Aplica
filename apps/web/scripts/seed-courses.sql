-- Script para insertar cursos de prueba en la base de datos
-- Ejecutar este script en Supabase SQL Editor

-- Insertar cursos de prueba con diferentes categorías
INSERT INTO courses (
  id,
  title,
  description,
  category,
  level,
  instructor_id,
  duration_total_minutes,
  thumbnail_url,
  slug,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Introducción a la Inteligencia Artificial',
  'Aprende los conceptos fundamentales de la inteligencia artificial, desde algoritmos básicos hasta aplicaciones prácticas en el mundo real.',
  'IA',
  'beginner',
  (SELECT id FROM users LIMIT 1), -- Usar el primer usuario como instructor
  480, -- 8 horas
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
  'introduccion-ia',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Machine Learning Avanzado',
  'Profundiza en técnicas avanzadas de machine learning, incluyendo deep learning, redes neuronales y algoritmos de optimización.',
  'IA',
  'advanced',
  (SELECT id FROM users LIMIT 1),
  720, -- 12 horas
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
  'machine-learning-avanzado',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Análisis de Datos con Python',
  'Domina las herramientas esenciales para el análisis de datos usando Python, pandas, numpy y visualización con matplotlib.',
  'Datos',
  'intermediate',
  (SELECT id FROM users LIMIT 1),
  600, -- 10 horas
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=300&fit=crop',
  'analisis-datos-python',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Big Data y Analytics',
  'Explora el mundo del Big Data con herramientas como Hadoop, Spark y técnicas de procesamiento de datos masivos.',
  'Datos',
  'advanced',
  (SELECT id FROM users LIMIT 1),
  900, -- 15 horas
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  'big-data-analytics',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Desarrollo Web con React',
  'Aprende a crear aplicaciones web modernas usando React, hooks, context y las mejores prácticas de desarrollo.',
  'Desarrollo',
  'intermediate',
  (SELECT id FROM users LIMIT 1),
  540, -- 9 horas
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
  'desarrollo-web-react',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Node.js y APIs REST',
  'Construye APIs robustas y escalables usando Node.js, Express y las mejores prácticas de desarrollo backend.',
  'Desarrollo',
  'intermediate',
  (SELECT id FROM users LIMIT 1),
  600, -- 10 horas
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop',
  'nodejs-apis-rest',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Diseño UX/UI Moderno',
  'Crea experiencias de usuario excepcionales con principios de diseño UX/UI, herramientas de prototipado y metodologías ágiles.',
  'Diseño',
  'beginner',
  (SELECT id FROM users LIMIT 1),
  420, -- 7 horas
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
  'diseno-ux-ui-moderno',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Figma para Diseñadores',
  'Domina Figma desde cero: componentes, sistemas de diseño, prototipado interactivo y colaboración en equipo.',
  'Diseño',
  'beginner',
  (SELECT id FROM users LIMIT 1),
  360, -- 6 horas
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
  'figma-para-disenadores',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Marketing Digital Avanzado',
  'Estrategias completas de marketing digital: SEO, SEM, redes sociales, email marketing y analytics.',
  'Marketing',
  'intermediate',
  (SELECT id FROM users LIMIT 1),
  480, -- 8 horas
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  'marketing-digital-avanzado',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Gestión de Proyectos Ágiles',
  'Aprende metodologías ágiles, Scrum, Kanban y herramientas para la gestión eficiente de proyectos.',
  'Negocios',
  'intermediate',
  (SELECT id FROM users LIMIT 1),
  420, -- 7 horas
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
  'gestion-proyectos-agiles',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Ciberseguridad Fundamental',
  'Protege sistemas y datos con fundamentos de ciberseguridad, análisis de vulnerabilidades y mejores prácticas.',
  'IT & Software',
  'beginner',
  (SELECT id FROM users LIMIT 1),
  540, -- 9 horas
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
  'ciberseguridad-fundamental',
  true,
  NOW(),
  NOW()
);

-- Verificar que los cursos se insertaron correctamente
SELECT 
  id,
  title,
  category,
  level,
  duration_total_minutes,
  is_active,
  created_at
FROM courses 
WHERE is_active = true
ORDER BY created_at DESC;
