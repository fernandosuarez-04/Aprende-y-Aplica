-- Script para insertar datos mínimos de prueba
-- Ejecutar en Supabase SQL Editor

-- Insertar datos mínimos en ai_apps si está vacía
INSERT INTO ai_apps (app_id, name, slug, description, long_description, website_url, logo_url, pricing_model, features, use_cases, is_featured, is_verified, view_count, like_count, rating, rating_count, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'ChatGPT',
  'chatgpt',
  'Asistente de IA conversacional',
  'ChatGPT es un modelo de lenguaje desarrollado por OpenAI',
  'https://chat.openai.com',
  'https://example.com/chatgpt.jpg',
  'freemium',
  'Conversación, escritura, programación',
  'Asistencia, creatividad, productividad',
  true,
  true,
  100,
  50,
  4.8,
  20,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ai_apps LIMIT 1);

-- Insertar datos mínimos en news si está vacía
INSERT INTO news (id, slug, title, subtitle, language, hero_image_url, tldr, intro, sections, metrics, links, cta, status, published_at, created_by, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'nuevas-tendencias-ia-2024',
  'Nuevas Tendencias en IA para 2024',
  'Descubre las últimas tendencias en inteligencia artificial',
  'es',
  'https://example.com/ia-tendencias.jpg',
  '{"puntos": ["IA generativa", "Machine Learning", "Automatización"]}',
  'La inteligencia artificial continúa evolucionando rápidamente...',
  '{"secciones": [{"titulo": "Tendencias Principales", "contenido": "Las principales tendencias incluyen..."}]}',
  '{"lecturas": 15, "compartidos": 2}',
  '{"fuentes": ["https://example.com/fuente1"]}',
  '{"texto": "Leer más", "url": "/noticias/nuevas-tendencias-ia-2024"}',
  'published',
  NOW(),
  (SELECT id FROM users LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM news LIMIT 1);

-- Insertar datos mínimos en reels si está vacía
INSERT INTO reels (id, title, description, video_url, thumbnail_url, duration_seconds, author_id, view_count, like_count, comment_count, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Tutorial React Básico',
  'Aprende los fundamentos de React en 5 minutos',
  'https://example.com/react-tutorial.mp4',
  'https://example.com/react-thumb.jpg',
  300,
  (SELECT id FROM users LIMIT 1),
  50,
  25,
  5,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM reels LIMIT 1);

-- Insertar datos mínimos en user_favorites si está vacía
INSERT INTO user_favorites (id, user_id, favorite_type, favorite_id, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  'ai_app',
  (SELECT app_id FROM ai_apps LIMIT 1),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_favorites LIMIT 1);

-- Verificar el estado después de insertar
SELECT 
  'users' as tabla,
  COUNT(*) as total_registros
FROM users
UNION ALL
SELECT 
  'courses' as tabla,
  COUNT(*) as total_registros
FROM courses
UNION ALL
SELECT 
  'ai_apps' as tabla,
  COUNT(*) as total_registros
FROM ai_apps
UNION ALL
SELECT 
  'news' as tabla,
  COUNT(*) as total_registros
FROM news
UNION ALL
SELECT 
  'reels' as tabla,
  COUNT(*) as total_registros
FROM reels
UNION ALL
SELECT 
  'user_favorites' as tabla,
  COUNT(*) as total_registros
FROM user_favorites
ORDER BY tabla;
