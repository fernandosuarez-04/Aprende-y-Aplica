-- Script para poblar las tablas del Directorio de IA con datos de ejemplo
-- Ejecutar después de create-ai-directory-tables-supabase.sql

-- Insertar prompts de ejemplo
INSERT INTO ai_prompts (title, slug, description, content, category_id, tags, difficulty_level, estimated_time_minutes, use_cases, tips, is_featured, is_verified, view_count, like_count, rating, rating_count) VALUES
(
    'Generador de Contenido para Redes Sociales',
    'generador-contenido-redes-sociales',
    'Prompt para crear contenido atractivo y viral para diferentes plataformas de redes sociales',
    'Eres un experto en marketing digital y creación de contenido viral. Crea contenido para [PLATAFORMA] que sea:

- Atractivo visualmente
- Fácil de entender
- Que genere engagement
- Alineado con las tendencias actuales

Tema: [TEMA]
Audiencia objetivo: [AUDIENCIA]
Tono: [TONO]

Incluye:
1. Hook llamativo
2. Contenido principal
3. Call-to-action
4. Hashtags relevantes
5. Sugerencias visuales',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    ARRAY['marketing', 'redes sociales', 'contenido', 'viral', 'engagement'],
    'intermediate',
    15,
    ARRAY['Marketing en redes sociales', 'Creación de contenido viral', 'Estrategias de engagement'],
    ARRAY['Adapta el tono según la plataforma', 'Usa hashtags trending', 'Incluye elementos visuales'],
    true,
    true,
    1250,
    89,
    4.7,
    45
),
(
    'Asistente de Programación en Python',
    'asistente-programacion-python',
    'Prompt para obtener ayuda con programación en Python, desde conceptos básicos hasta proyectos avanzados',
    'Eres un programador senior experto en Python con 10+ años de experiencia. Ayuda con el siguiente problema de programación:

Lenguaje: Python
Nivel: [NIVEL: principiante/intermedio/avanzado]
Contexto: [CONTEXTO DEL PROYECTO]

Problema específico: [DESCRIBE TU PROBLEMA]

Por favor proporciona:
1. Explicación clara del concepto
2. Código de ejemplo funcional
3. Mejores prácticas
4. Posibles optimizaciones
5. Recursos adicionales para aprender más

Asegúrate de que el código sea:
- Legible y bien comentado
- Siguiendo PEP 8
- Eficiente y escalable
- Con manejo de errores apropiado',
    (SELECT category_id FROM ai_categories WHERE slug = 'desarrollo-programacion'),
    ARRAY['python', 'programación', 'código', 'desarrollo', 'tutorial'],
    'beginner',
    20,
    ARRAY['Aprendizaje de Python', 'Resolución de problemas', 'Mejores prácticas'],
    ARRAY['Practica con ejemplos reales', 'Revisa la documentación oficial', 'Únete a comunidades de Python'],
    true,
    true,
    2100,
    156,
    4.8,
    78
),
(
    'Generador de Ideas de Negocio',
    'generador-ideas-negocio',
    'Prompt para generar ideas innovadoras de negocio basadas en tendencias del mercado',
    'Eres un consultor de negocios y emprendimiento con experiencia en identificar oportunidades de mercado. Genera ideas de negocio innovadoras considerando:

Mercado objetivo: [MERCADO]
Presupuesto inicial: [PRESUPUESTO]
Experiencia del emprendedor: [EXPERIENCIA]
Intereses personales: [INTERESES]

Para cada idea, proporciona:
1. Descripción del concepto
2. Análisis del mercado objetivo
3. Modelo de negocio sugerido
4. Ventajas competitivas
5. Pasos para validar la idea
6. Recursos necesarios
7. Riesgos potenciales
8. Métricas de éxito

Enfócate en:
- Soluciones reales a problemas existentes
- Escalabilidad del negocio
- Sostenibilidad financiera
- Impacto social positivo',
    (SELECT category_id FROM ai_categories WHERE slug = 'marketing-ventas'),
    ARRAY['emprendimiento', 'negocios', 'ideas', 'startup', 'innovación'],
    'intermediate',
    25,
    ARRAY['Emprendimiento', 'Planificación de negocios', 'Análisis de mercado'],
    ARRAY['Valida antes de invertir', 'Estudia la competencia', 'Construye un MVP'],
    true,
    true,
    890,
    67,
    4.5,
    34
);

-- Insertar apps de ejemplo
INSERT INTO ai_apps (name, slug, description, long_description, category_id, website_url, logo_url, pricing_model, pricing_details, features, use_cases, advantages, disadvantages, alternatives, tags, supported_languages, integrations, api_available, mobile_app, desktop_app, browser_extension, is_featured, is_verified, view_count, like_count, rating, rating_count) VALUES
(
    'ChatGPT',
    'chatgpt',
    'Asistente de IA conversacional desarrollado por OpenAI, capaz de mantener conversaciones naturales y ayudar con diversas tareas',
    'ChatGPT es un modelo de lenguaje de gran escala desarrollado por OpenAI. Utiliza la arquitectura GPT (Generative Pre-trained Transformer) para generar respuestas coherentes y contextualmente relevantes en conversaciones naturales. Es capaz de ayudar con tareas como escritura, programación, análisis, creatividad y resolución de problemas.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    'https://chat.openai.com',
    'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    'freemium',
    '{"free": {"requests_per_day": 20, "features": ["basic_chat", "web_search"]}, "plus": {"price": 20, "currency": "USD", "period": "month", "features": ["unlimited_chat", "gpt4_access", "priority_support"]}}',
    ARRAY['Conversación natural', 'Generación de texto', 'Análisis de datos', 'Programación', 'Traducción', 'Resumen de documentos'],
    ARRAY['Asistencia en escritura', 'Tutoría educativa', 'Análisis de código', 'Generación de ideas', 'Traducción de idiomas'],
    ARRAY['Respuestas coherentes', 'Amplio conocimiento', 'Fácil de usar', 'Integración con herramientas'],
    ARRAY['Puede generar información incorrecta', 'Limitaciones en datos recientes', 'Costo en versiones premium'],
    ARRAY['Claude', 'Bard', 'Perplexity', 'You.com'],
    ARRAY['IA conversacional', 'GPT', 'OpenAI', 'asistente virtual', 'chatbot'],
    ARRAY['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Chino', 'Japonés'],
    ARRAY['Slack', 'Discord', 'Microsoft Teams', 'Zapier', 'API REST'],
    true,
    true,
    true,
    true,
    true,
    true,
    15600,
    1200,
    4.6,
    890
),
(
    'Midjourney',
    'midjourney',
    'Generador de imágenes con IA especializado en arte digital y ilustraciones de alta calidad',
    'Midjourney es una herramienta de generación de imágenes mediante inteligencia artificial que permite crear arte digital de alta calidad a partir de descripciones textuales. Utiliza algoritmos avanzados de machine learning para interpretar prompts y generar imágenes únicas, artísticas y detalladas.',
    (SELECT category_id FROM ai_categories WHERE slug = 'arte-ilustracion'),
    'https://www.midjourney.com',
    'https://cdn.midjourney.com/logo.png',
    'subscription',
    '{"basic": {"price": 10, "currency": "USD", "period": "month", "features": ["200_images", "standard_speed"]}, "standard": {"price": 30, "currency": "USD", "period": "month", "features": ["900_images", "fast_speed", "commercial_use"]}, "pro": {"price": 60, "currency": "USD", "period": "month", "features": ["unlimited_images", "turbo_speed", "commercial_use", "stealth_mode"]}}',
    ARRAY['Generación de imágenes', 'Estilos artísticos', 'Alta resolución', 'Variaciones', 'Upscaling', 'Inpainting'],
    ARRAY['Arte digital', 'Ilustraciones', 'Concept art', 'Diseño gráfico', 'Fotografía artística'],
    ARRAY['Calidad artística excepcional', 'Múltiples estilos', 'Control detallado', 'Comunidad activa'],
    ARRAY['Requiere Discord', 'Costo mensual', 'Curva de aprendizaje', 'Limitaciones en texto'],
    ARRAY['DALL-E 2', 'Stable Diffusion', 'Adobe Firefly', 'Canva AI'],
    ARRAY['arte digital', 'IA generativa', 'ilustración', 'diseño', 'creatividad'],
    ARRAY['Inglés', 'Español', 'Francés', 'Alemán', 'Italiano', 'Portugués'],
    ARRAY['Discord', 'API REST'],
    true,
    false,
    false,
    false,
    true,
    true,
    8900,
    756,
    4.7,
    445
),
(
    'GitHub Copilot',
    'github-copilot',
    'Asistente de programación con IA que sugiere código en tiempo real mientras escribes',
    'GitHub Copilot es un asistente de programación impulsado por IA desarrollado por GitHub en colaboración con OpenAI. Utiliza el modelo Codex para sugerir código en tiempo real, completar funciones, generar comentarios y ayudar con la depuración. Se integra directamente en editores de código populares.',
    (SELECT category_id FROM ai_categories WHERE slug = 'desarrollo-programacion'),
    'https://github.com/features/copilot',
    'https://github.githubassets.com/images/modules/site/copilot/copilot-logo.png',
    'subscription',
    '{"individual": {"price": 10, "currency": "USD", "period": "month", "features": ["code_suggestions", "chat", "terminal_access"]}, "business": {"price": 19, "currency": "USD", "period": "month", "features": ["team_management", "security_features", "audit_logs"]}}',
    ARRAY['Sugerencias de código', 'Autocompletado', 'Generación de funciones', 'Comentarios automáticos', 'Depuración', 'Múltiples lenguajes'],
    ARRAY['Desarrollo de software', 'Aprendizaje de programación', 'Productividad en código', 'Refactoring'],
    ARRAY['Ahorro de tiempo', 'Mejores prácticas', 'Múltiples lenguajes', 'Integración nativa'],
    ARRAY['Costo mensual', 'Dependencia de IA', 'Puede sugerir código incorrecto', 'Requiere internet'],
    ARRAY['Tabnine', 'CodeWhisperer', 'Kite', 'IntelliCode'],
    ARRAY['programación', 'IA', 'desarrollo', 'productividad', 'autocompletado'],
    ARRAY['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'],
    ARRAY['VS Code', 'IntelliJ', 'Vim', 'Neovim', 'Sublime Text', 'Atom'],
    true,
    false,
    true,
    false,
    true,
    true,
    12300,
    980,
    4.5,
    567
);

-- Insertar algunos ratings de ejemplo
INSERT INTO ai_prompt_ratings (prompt_id, user_id, rating, review) VALUES
(
    (SELECT prompt_id FROM ai_prompts WHERE slug = 'generador-contenido-redes-sociales'),
    '00000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Excelente prompt, me ha ayudado mucho con mi estrategia de contenido'
),
(
    (SELECT prompt_id FROM ai_prompts WHERE slug = 'asistente-programacion-python'),
    '00000000-0000-0000-0000-000000000002'::uuid,
    4,
    'Muy útil para aprender Python, las explicaciones son claras'
),
(
    (SELECT prompt_id FROM ai_prompts WHERE slug = 'generador-ideas-negocio'),
    '00000000-0000-0000-0000-000000000003'::uuid,
    5,
    'Perfecto para emprendedores, ideas muy innovadoras'
);

-- Insertar algunos ratings de apps
INSERT INTO ai_app_ratings (app_id, user_id, rating, review) VALUES
(
    (SELECT app_id FROM ai_apps WHERE slug = 'chatgpt'),
    '00000000-0000-0000-0000-000000000001'::uuid,
    5,
    'La mejor herramienta de IA conversacional disponible'
),
(
    (SELECT app_id FROM ai_apps WHERE slug = 'midjourney'),
    '00000000-0000-0000-0000-000000000002'::uuid,
    4,
    'Increíble calidad artística, aunque el precio es alto'
),
(
    (SELECT app_id FROM ai_apps WHERE slug = 'github-copilot'),
    '00000000-0000-0000-0000-000000000003'::uuid,
    5,
    'Revolucionario para la productividad en programación'
);

-- Insertar algunos favoritos de ejemplo
INSERT INTO ai_prompt_favorites (prompt_id, user_id) VALUES
(
    (SELECT prompt_id FROM ai_prompts WHERE slug = 'generador-contenido-redes-sociales'),
    '00000000-0000-0000-0000-000000000001'::uuid
),
(
    (SELECT prompt_id FROM ai_prompts WHERE slug = 'asistente-programacion-python'),
    '00000000-0000-0000-0000-000000000002'::uuid
);

INSERT INTO ai_app_favorites (app_id, user_id) VALUES
(
    (SELECT app_id FROM ai_apps WHERE slug = 'chatgpt'),
    '00000000-0000-0000-0000-000000000001'::uuid
),
(
    (SELECT app_id FROM ai_apps WHERE slug = 'github-copilot'),
    '00000000-0000-0000-0000-000000000003'::uuid
);
