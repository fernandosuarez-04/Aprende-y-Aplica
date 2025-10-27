-- Script para insertar datos de prueba en las tablas vacías
-- Ejecutar en Supabase SQL Editor

-- Insertar datos de prueba en communities (si está vacía)
INSERT INTO communities (id, name, description, slug, image_url, member_count, is_active, created_at, updated_at, visibility, access_type)
VALUES 
  (gen_random_uuid(), 'Desarrolladores React', 'Comunidad para desarrolladores de React', 'desarrolladores-react', 'https://example.com/react.jpg', 25, true, NOW(), NOW(), 'public', 'open'),
  (gen_random_uuid(), 'Diseñadores UX', 'Comunidad de diseñadores de experiencia de usuario', 'disenadores-ux', 'https://example.com/ux.jpg', 15, true, NOW(), NOW(), 'public', 'open'),
  (gen_random_uuid(), 'Backend Developers', 'Comunidad de desarrolladores backend', 'backend-developers', 'https://example.com/backend.jpg', 12, true, NOW(), NOW(), 'public', 'open')
ON CONFLICT (slug) DO NOTHING;

-- Insertar datos de prueba en ai_apps (si está vacía)
INSERT INTO ai_apps (app_id, name, slug, description, long_description, website_url, logo_url, pricing_model, features, use_cases, is_featured, is_verified, view_count, like_count, rating, rating_count, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'ChatGPT', 'chatgpt', 'Asistente de IA conversacional', 'ChatGPT es un modelo de lenguaje desarrollado por OpenAI', 'https://chat.openai.com', 'https://example.com/chatgpt.jpg', 'freemium', 'Conversación, escritura, programación', 'Asistencia, creatividad, productividad', true, true, 100, 50, 4.8, 20, true, NOW(), NOW()),
  (gen_random_uuid(), 'Midjourney', 'midjourney', 'Generador de imágenes con IA', 'Midjourney es una herramienta de generación de imágenes con IA', 'https://midjourney.com', 'https://example.com/midjourney.jpg', 'subscription', 'Generación de imágenes, arte digital', 'Diseño, arte, marketing', true, true, 80, 40, 4.6, 15, true, NOW(), NOW()),
  (gen_random_uuid(), 'GitHub Copilot', 'github-copilot', 'Asistente de programación con IA', 'GitHub Copilot ayuda a los desarrolladores a escribir código', 'https://github.com/features/copilot', 'https://example.com/copilot.jpg', 'subscription', 'Autocompletado de código, sugerencias', 'Programación, desarrollo', true, true, 120, 60, 4.7, 30, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insertar datos de prueba en ai_prompts (si está vacía)
INSERT INTO ai_prompts (prompt_id, title, slug, description, content, tags, difficulty_level, estimated_time_min, use_cases, tips, author_id, is_featured, is_verified, view_count, like_count, download_count, rating, rating_count, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Prompt para escribir emails profesionales', 'emails-profesionales', 'Prompt para generar emails profesionales y efectivos', 'Escribe un email profesional sobre [tema] dirigido a [audiencia]...', 'email, profesional, comunicación', 'Principiante', 5, 'Comunicación empresarial, networking', 'Sé específico con el contexto y el tono deseado', (SELECT id FROM users LIMIT 1), true, true, 30, 15, 7, 4.5, 5, true, NOW(), NOW()),
  (gen_random_uuid(), 'Prompt para generar ideas de contenido', 'ideas-contenido', 'Prompt para generar ideas creativas de contenido', 'Genera 10 ideas de contenido para [tema/niche] dirigido a [audiencia]...', 'contenido, creatividad, marketing', 'Intermedio', 10, 'Marketing, redes sociales, blogs', 'Proporciona contexto específico sobre tu audiencia', (SELECT id FROM users LIMIT 1), true, true, 45, 20, 10, 4.7, 8, true, NOW(), NOW()),
  (gen_random_uuid(), 'Prompt para análisis de datos', 'analisis-datos', 'Prompt para analizar y visualizar datos', 'Analiza los siguientes datos [datos] y proporciona insights clave...', 'datos, análisis, insights', 'Avanzado', 15, 'Análisis de negocio, reportes', 'Incluye ejemplos específicos de los datos', (SELECT id FROM users LIMIT 1), true, true, 20, 10, 5, 4.3, 3, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insertar datos de prueba en news (si está vacía)
INSERT INTO news (id, slug, title, subtitle, language, hero_image_url, tldr, intro, sections, metrics, links, cta, status, published_at, created_by, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'nuevas-tendencias-ia-2024', 'Nuevas Tendencias en IA para 2024', 'Descubre las últimas tendencias en inteligencia artificial', 'es', 'https://example.com/ia-tendencias.jpg', '{"puntos": ["IA generativa", "Machine Learning", "Automatización"]}', 'La inteligencia artificial continúa evolucionando rápidamente...', '{"secciones": [{"titulo": "Tendencias Principales", "contenido": "Las principales tendencias incluyen..."}]}', '{"lecturas": 15, "compartidos": 2}', '{"fuentes": ["https://example.com/fuente1"]}', '{"texto": "Leer más", "url": "/noticias/nuevas-tendencias-ia-2024"}', 'published', NOW(), (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'react-19-novedades', 'React 19: Las Nuevas Características', 'Explorando las novedades de React 19', 'es', 'https://example.com/react-19.jpg', '{"puntos": ["Nuevos hooks", "Mejoras de rendimiento", "Mejor DX"]}', 'React 19 trae consigo importantes mejoras...', '{"secciones": [{"titulo": "Nuevas Características", "contenido": "Las principales novedades son..."}]}', '{"lecturas": 20, "compartidos": 4}', '{"fuentes": ["https://react.dev"]}', '{"texto": "Leer más", "url": "/noticias/react-19-novedades"}', 'published', NOW(), (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'futuro-desarrollo-web', 'El Futuro del Desarrollo Web', 'Tendencias y tecnologías emergentes', 'es', 'https://example.com/futuro-web.jpg', '{"puntos": ["WebAssembly", "Edge Computing", "Progressive Web Apps"]}', 'El desarrollo web está en constante evolución...', '{"secciones": [{"titulo": "Tecnologías Emergentes", "contenido": "Las tecnologías que marcarán el futuro..."}]}', '{"lecturas": 18, "compartidos": 3}', '{"fuentes": ["https://example.com/fuente2"]}', '{"texto": "Leer más", "url": "/noticias/futuro-desarrollo-web"}', 'published', NOW(), (SELECT id FROM users LIMIT 1), NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insertar datos de prueba en reels (si está vacía)
INSERT INTO reels (id, title, description, video_url, thumbnail_url, duration_seconds, author_id, view_count, like_count, comment_count, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Tutorial React Básico', 'Aprende los fundamentos de React en 5 minutos', 'https://example.com/react-tutorial.mp4', 'https://example.com/react-thumb.jpg', 300, (SELECT id FROM users LIMIT 1), 50, 25, 5, true, NOW(), NOW()),
  (gen_random_uuid(), 'Tips de CSS Avanzado', 'Trucos avanzados de CSS que debes conocer', 'https://example.com/css-tips.mp4', 'https://example.com/css-thumb.jpg', 180, (SELECT id FROM users LIMIT 1), 35, 18, 3, true, NOW(), NOW()),
  (gen_random_uuid(), 'Node.js Express Setup', 'Configuración rápida de Express con Node.js', 'https://example.com/nodejs-setup.mp4', 'https://example.com/nodejs-thumb.jpg', 240, (SELECT id FROM users LIMIT 1), 40, 20, 4, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verificar que los datos se insertaron correctamente
SELECT 'users' as tabla, COUNT(*) as total_registros FROM users
UNION ALL
SELECT 'courses' as tabla, COUNT(*) as total_registros FROM courses
UNION ALL
SELECT 'communities' as tabla, COUNT(*) as total_registros FROM communities
UNION ALL
SELECT 'ai_apps' as tabla, COUNT(*) as total_registros FROM ai_apps
UNION ALL
SELECT 'ai_prompts' as tabla, COUNT(*) as total_registros FROM ai_prompts
UNION ALL
SELECT 'news' as tabla, COUNT(*) as total_registros FROM news
UNION ALL
SELECT 'reels' as tabla, COUNT(*) as total_registros FROM reels
ORDER BY tabla;
