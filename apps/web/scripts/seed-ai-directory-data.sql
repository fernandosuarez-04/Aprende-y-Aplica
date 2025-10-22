-- Script para poblar las tablas del Directorio de IA con datos de ejemplo
-- Basado en las imágenes proporcionadas

-- Insertar apps de IA de ejemplo
INSERT INTO ai_apps (
    name, slug, description, long_description, category_id, website_url, 
    pricing_model, features, use_cases, advantages, disadvantages, 
    alternatives, tags, supported_languages, is_featured, is_verified
) VALUES
(
    'ChatGPT',
    'chatgpt',
    'Asistente de IA conversacional avanzado para tareas de escritura, análisis y resolución de problemas.',
    'ChatGPT es un modelo de lenguaje desarrollado por OpenAI que puede mantener conversaciones naturales, ayudar con tareas de escritura, análisis de documentos, generación de código y resolución de problemas complejos.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    'https://chat.openai.com',
    'freemium',
    ARRAY['Chat conversacional', 'Generación de texto', 'Análisis de documentos', 'Generación de código', 'Traducción', 'Resumen de texto'],
    ARRAY['Escritura de contenido', 'Análisis de documentos', 'Generación de código', 'Traducción', 'Resolución de problemas', 'Educación y tutoría'],
    ARRAY['Respuestas rápidas y precisas', 'Múltiples idiomas', 'Integración con APIs', 'Actualizaciones constantes', 'Gran base de conocimiento'],
    ARRAY['Límites de uso en plan gratuito', 'Puede generar información incorrecta', 'Requiere conexión a internet', 'No tiene acceso a información en tiempo real'],
    ARRAY['Claude 3.5 Sonnet', 'Google Bard', 'Perplexity AI', 'You.com', 'Microsoft Copilot'],
    ARRAY['Chat', 'Escritura', 'Análisis', 'IA', 'Conversacional'],
    ARRAY['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués'],
    true,
    true
),
(
    'Claude 3.5 Sonnet',
    'claude-3-5-sonnet',
    'Modelo de IA más avanzado de Anthropic, especializado en análisis profundo y razonamiento complejo.',
    'El modelo de IA más avanzado de Anthropic, especializado en análisis profundo, razonamiento complejo y generación de contenido de alta calidad. Destaca por su capacidad de análisis de documentos largos y su enfoque en la seguridad y utilidad.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    'https://claude.ai',
    'freemium',
    ARRAY['Análisis de documentos largos', 'Razonamiento complejo', 'Generación de código', 'Análisis de imágenes', 'Generación de contenido técnico', 'Traducción avanzada'],
    ARRAY['Análisis de documentos largos y complejos', 'Generación de código y debugging', 'Análisis de datos y visualización', 'Investigación académica', 'Generación de contenido técnico', 'Traducción y localización'],
    ARRAY['Capacidad excepcional para analizar documentos largos', 'Razonamiento lógico superior', 'Generación de código de alta calidad', 'Análisis de imágenes y documentos visuales', 'Enfoque en seguridad y utilidad'],
    ARRAY['Límites de uso en el plan gratuito', 'Puede ser lento con tareas muy complejas', 'Requiere conexión a internet constante', 'Dependiente de la calidad del prompt', 'No tiene acceso a información en tiempo real'],
    ARRAY['ChatGPT', 'Google Bard', 'Perplexity AI', 'You.com', 'Microsoft Copilot'],
    ARRAY['Análisis', 'Escritura', 'IA', 'Documentos', 'Código'],
    ARRAY['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués'],
    true,
    true
),
(
    'Midjourney',
    'midjourney',
    'Generador de imágenes con IA de alta calidad para arte digital y diseño creativo.',
    'Midjourney es una herramienta de generación de imágenes con IA que permite crear arte digital de alta calidad a partir de descripciones de texto. Es ampliamente utilizada por artistas, diseñadores y creadores de contenido.',
    (SELECT category_id FROM ai_categories WHERE slug = 'arte-ilustracion'),
    'https://midjourney.com',
    'paid',
    ARRAY['Generación de imágenes', 'Arte digital', 'Múltiples estilos', 'Alta resolución', 'Control de parámetros', 'Comunidad activa'],
    ARRAY['Arte digital', 'Diseño gráfico', 'Ilustración', 'Concept art', 'Marketing visual', 'Contenido para redes sociales'],
    ARRAY['Calidad artística excepcional', 'Múltiples estilos disponibles', 'Comunidad creativa activa', 'Resultados consistentes', 'Control granular de parámetros'],
    ARRAY['Solo disponible en Discord', 'Requiere suscripción de pago', 'Tiempo de procesamiento variable', 'Limitaciones en resolución gratuita', 'Curva de aprendizaje para prompts'],
    ARRAY['DALL-E 3', 'Stable Diffusion', 'Adobe Firefly', 'Canva AI', 'Runway ML'],
    ARRAY['Imágenes', 'Arte', 'IA', 'Diseño', 'Creatividad'],
    ARRAY['Inglés'],
    true,
    true
),
(
    'DALL-E 3',
    'dall-e-3',
    'Generador de imágenes con IA de OpenAI, integrado con ChatGPT para crear contenido visual de alta calidad.',
    'DALL-E 3 es la última versión del generador de imágenes de OpenAI, integrado directamente con ChatGPT. Permite crear imágenes de alta calidad a partir de descripciones de texto con un enfoque en la seguridad y la creatividad.',
    (SELECT category_id FROM ai_categories WHERE slug = 'arte-ilustracion'),
    'https://openai.com/dall-e-3',
    'paid',
    ARRAY['Generación de imágenes', 'Integración con ChatGPT', 'Múltiples estilos', 'Alta resolución', 'Filtros de seguridad', 'Edición de imágenes'],
    ARRAY['Arte digital', 'Diseño gráfico', 'Ilustración', 'Marketing visual', 'Contenido educativo', 'Prototipado visual'],
    ARRAY['Integración perfecta con ChatGPT', 'Filtros de seguridad avanzados', 'Calidad de imagen consistente', 'Fácil de usar', 'Resultados predecibles'],
    ARRAY['Requiere suscripción de pago', 'Limitaciones en contenido sensible', 'Tiempo de procesamiento', 'Dependiente de la calidad del prompt', 'No permite edición directa'],
    ARRAY['Midjourney', 'Stable Diffusion', 'Adobe Firefly', 'Canva AI', 'Runway ML'],
    ARRAY['Imágenes', 'Arte', 'IA', 'Diseño', 'ChatGPT'],
    ARRAY['Inglés', 'Español'],
    true,
    true
),
(
    'Runway ML',
    'runway-ml',
    'Suite avanzada de IA para creación y edición de video usando machine learning.',
    'Runway ML es una plataforma avanzada de IA que ofrece herramientas de machine learning para la creación y edición de video. Incluye efectos especiales, automatización de tareas de edición y generación de contenido visual.',
    (SELECT category_id FROM ai_categories WHERE slug = 'video-audio'),
    'https://runwayml.com',
    'freemium',
    ARRAY['Edición de video con IA', 'Efectos especiales', 'Generación de video', 'Automatización', 'Múltiples herramientas', 'Colaboración en tiempo real'],
    ARRAY['Edición de video profesional', 'Efectos especiales', 'Generación de contenido', 'Automatización de tareas', 'Post-producción', 'Marketing visual'],
    ARRAY['Herramientas de IA avanzadas', 'Interfaz intuitiva', 'Múltiples funciones en una plataforma', 'Colaboración en tiempo real', 'Resultados profesionales'],
    ARRAY['Curva de aprendizaje', 'Limitaciones en plan gratuito', 'Requiere conexión estable', 'Procesamiento en la nube', 'Costos para uso intensivo'],
    ARRAY['Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'Loom AI', 'Synthesia'],
    ARRAY['Video', 'Edición', 'IA', 'Efectos', 'Automatización'],
    ARRAY['Inglés'],
    true,
    true
),
(
    'GitHub Copilot',
    'github-copilot',
    'Asistente de programación con IA desarrollado por GitHub y OpenAI para sugerencias de código en tiempo real.',
    'GitHub Copilot es un asistente de programación con IA que proporciona sugerencias de código en tiempo real, completación de funciones y generación de tests. Desarrollado por GitHub en colaboración con OpenAI.',
    (SELECT category_id FROM ai_categories WHERE slug = 'desarrollo-programacion'),
    'https://github.com/features/copilot',
    'paid',
    ARRAY['Sugerencias de código', 'Completación automática', 'Generación de tests', 'Múltiples lenguajes', 'Integración con IDEs', 'Análisis de contexto'],
    ARRAY['Desarrollo de software', 'Generación de código', 'Debugging', 'Refactoring', 'Documentación', 'Testing'],
    ARRAY['Sugerencias precisas y contextuales', 'Soporte para múltiples lenguajes', 'Integración con IDEs populares', 'Acelera el desarrollo', 'Aprende del código existente'],
    ARRAY['Requiere suscripción de pago', 'Puede generar código inseguro', 'Dependiente de la calidad del contexto', 'No siempre entiende la intención', 'Requiere revisión manual'],
    ARRAY['Tabnine', 'CodeWhisperer', 'Cursor', 'Replit Ghostwriter', 'Codeium'],
    ARRAY['Programación', 'IA', 'Código', 'Desarrollo', 'Automatización'],
    ARRAY['Inglés'],
    true,
    true
),
(
    'Zapier AI',
    'zapier-ai',
    'Plataforma de automatización de workflows con IA para conectar aplicaciones y automatizar tareas repetitivas.',
    'Plataforma de automatización de workflows con IA para conectar aplicaciones y automatizar tareas repetitivas. Permite crear flujos de trabajo complejos sin programación, ideal para empresas que necesitan optimizar sus procesos operativos.',
    (SELECT category_id FROM ai_categories WHERE slug = 'productividad-automatizacion'),
    'https://zapier.com',
    'freemium',
    ARRAY['Automatización de workflows', 'Integración de aplicaciones', 'IA para optimización', 'Triggers inteligentes', 'Múltiples conectores', 'Análisis de procesos'],
    ARRAY['Automatización de tareas', 'Integración de sistemas', 'Optimización de procesos', 'Reducción de trabajo manual', 'Flujos de trabajo complejos', 'Conectividad empresarial'],
    ARRAY['Más de 5000 aplicaciones conectadas', 'Interfaz visual intuitiva', 'IA para optimización automática', 'Escalabilidad empresarial', 'Monitoreo en tiempo real'],
    ARRAY['Limitaciones en plan gratuito', 'Curva de aprendizaje para workflows complejos', 'Dependiente de APIs de terceros', 'Costos por tarea en planes avanzados', 'Requiere configuración inicial'],
    ARRAY['Microsoft Power Automate', 'IFTTT', 'Integromat', 'Automate.io', 'Pabbly Connect'],
    ARRAY['Automatización', 'Workflows', 'IA', 'Integración', 'Productividad'],
    ARRAY['Inglés', 'Español'],
    true,
    true
),
(
    'NotebookLM',
    'notebooklm',
    'Herramienta de IA de Google para crear y gestionar notebooks inteligentes con análisis automático.',
    'Herramienta de IA de Google para crear y gestionar notebooks inteligentes. Permite organizar información, generar resúmenes automáticos, crear conexiones entre ideas y colaborar en proyectos de investigación de manera eficiente.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    'https://notebooklm.google.com',
    'freemium',
    ARRAY['Notebooks inteligentes', 'Análisis automático', 'Resúmenes generados por IA', 'Conexiones entre ideas', 'Colaboración en tiempo real', 'Integración con Google Workspace'],
    ARRAY['Investigación académica', 'Organización de información', 'Generación de resúmenes', 'Análisis de documentos', 'Colaboración en proyectos', 'Gestión de conocimiento'],
    ARRAY['Integración con Google Workspace', 'IA para análisis automático', 'Interfaz familiar de Google', 'Colaboración en tiempo real', 'Gratuito para uso personal'],
    ARRAY['Limitado a documentos de Google', 'Requiere cuenta de Google', 'Funciones avanzadas en planes de pago', 'Dependiente de la calidad de los documentos', 'Limitaciones en procesamiento de archivos grandes'],
    ARRAY['Obsidian', 'Notion', 'Roam Research', 'Logseq', 'RemNote'],
    ARRAY['Notebook', 'Google', 'IA', 'Investigación', 'Análisis'],
    ARRAY['Inglés', 'Español'],
    true,
    true
),
(
    'Linear',
    'linear',
    'Plataforma de gestión de proyectos y desarrollo de software con IA integrada para equipos de desarrollo.',
    'Plataforma de gestión de proyectos y desarrollo de software con IA integrada. Diseñada para equipos de desarrollo, incluye seguimiento de issues, gestión de sprints, automatización de workflows y análisis de productividad.',
    (SELECT category_id FROM ai_categories WHERE slug = 'desarrollo-programacion'),
    'https://linear.app',
    'freemium',
    ARRAY['Gestión de issues', 'Sprints y roadmaps', 'IA para automatización', 'Análisis de productividad', 'Integración con Git', 'Colaboración en equipo'],
    ARRAY['Gestión de proyectos de software', 'Seguimiento de bugs', 'Planificación de sprints', 'Análisis de productividad', 'Colaboración en equipo', 'Automatización de workflows'],
    ARRAY['Interfaz moderna y rápida', 'IA para automatización inteligente', 'Integración con herramientas de desarrollo', 'Análisis de productividad avanzado', 'Colaboración en tiempo real'],
    ARRAY['Curva de aprendizaje inicial', 'Limitaciones en plan gratuito', 'Requiere adopción del equipo', 'Dependiente de la configuración inicial', 'Costos para equipos grandes'],
    ARRAY['Jira', 'Asana', 'Monday.com', 'Trello', 'ClickUp'],
    ARRAY['Desarrollo', 'Proyectos', 'IA', 'Gestión', 'Colaboración'],
    ARRAY['Inglés'],
    true,
    true
),
(
    'Figma AI',
    'figma-ai',
    'Herramienta de diseño con IA integrada para crear interfaces de usuario, prototipos y diseños colaborativos.',
    'Herramienta de diseño con IA integrada para crear interfaces de usuario, prototipos y diseños colaborativos. Incluye generación automática de componentes, sugerencias de diseño y automatización de tareas de diseño.',
    (SELECT category_id FROM ai_categories WHERE slug = 'diseno-ui-ux'),
    'https://figma.com',
    'freemium',
    ARRAY['Diseño de interfaces', 'Prototipado', 'IA para sugerencias', 'Colaboración en tiempo real', 'Generación de componentes', 'Automatización de tareas'],
    ARRAY['Diseño de UI/UX', 'Prototipado de aplicaciones', 'Diseño de sistemas', 'Colaboración en diseño', 'Generación de componentes', 'Automatización de workflows'],
    ARRAY['Colaboración en tiempo real', 'IA para sugerencias inteligentes', 'Ecosistema de plugins', 'Generación automática de componentes', 'Integración con herramientas de desarrollo'],
    ARRAY['Requiere conexión a internet', 'Limitaciones en plan gratuito', 'Curva de aprendizaje para funciones avanzadas', 'Dependiente de plugins para IA', 'Costos para equipos grandes'],
    ARRAY['Adobe XD', 'Sketch', 'Framer', 'InVision', 'Principle'],
    ARRAY['Diseño', 'UI/UX', 'IA', 'Prototipado', 'Colaboración'],
    ARRAY['Inglés'],
    true,
    true
);

-- Insertar prompts de ejemplo
INSERT INTO ai_prompts (
    title, slug, description, content, category_id, tags, difficulty_level, 
    estimated_time_minutes, use_cases, tips, is_featured, is_verified
) VALUES
(
    'Prompt para Análisis de Documentos',
    'analisis-documentos-avanzado',
    'Prompt especializado para análisis profundo de documentos largos y complejos.',
    'Actúa como un analista experto en documentos. Tu tarea es analizar el siguiente documento de manera exhaustiva:

DOCUMENTO: [INSERTAR DOCUMENTO AQUÍ]

Por favor, proporciona:

1. **Resumen Ejecutivo** (2-3 párrafos)
2. **Puntos Clave** (lista numerada de 5-7 puntos principales)
3. **Análisis de Contenido**:
   - Tema principal y subtemas
   - Argumentos presentados
   - Evidencia utilizada
   - Conclusiones del autor
4. **Evaluación Crítica**:
   - Fortalezas del documento
   - Debilidades o limitaciones
   - Credibilidad de las fuentes
5. **Implicaciones Prácticas** (cómo se puede aplicar esta información)
6. **Preguntas para Profundizar** (3-5 preguntas que surgen del análisis)

Mantén un tono profesional y objetivo, citando secciones específicas cuando sea relevante.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    ARRAY['análisis', 'documentos', 'investigación', 'resumen', 'crítico'],
    'intermediate',
    15,
    ARRAY['Análisis de informes', 'Revisión de literatura', 'Evaluación de propuestas', 'Estudio de casos'],
    ARRAY['Incluye el documento completo para mejor análisis', 'Especifica el tipo de documento si es relevante', 'Menciona el contexto o propósito del análisis'],
    true,
    true
),
(
    'Prompt para Generación de Código',
    'generacion-codigo-optimizado',
    'Prompt para generar código limpio, optimizado y bien documentado en múltiples lenguajes.',
    'Actúa como un desarrollador senior experto. Genera código de alta calidad siguiendo las mejores prácticas:

REQUERIMIENTOS: [DESCRIBIR LA FUNCIONALIDAD AQUÍ]
LENGUAJE: [ESPECIFICAR EL LENGUAJE DE PROGRAMACIÓN]
FRAMEWORK: [ESPECIFICAR EL FRAMEWORK SI ES RELEVANTE]

Por favor, proporciona:

1. **Código Principal**:
   - Implementación completa y funcional
   - Comentarios explicativos
   - Manejo de errores
   - Optimizaciones de rendimiento

2. **Documentación**:
   - Descripción de la función/clase
   - Parámetros de entrada
   - Valor de retorno
   - Ejemplos de uso

3. **Tests**:
   - Casos de prueba básicos
   - Casos edge
   - Tests de rendimiento si es relevante

4. **Consideraciones**:
   - Seguridad
   - Escalabilidad
   - Mantenibilidad
   - Alternativas de implementación

Sigue las convenciones del lenguaje especificado y las mejores prácticas de la industria.',
    (SELECT category_id FROM ai_categories WHERE slug = 'desarrollo-programacion'),
    ARRAY['código', 'programación', 'desarrollo', 'optimización', 'testing'],
    'advanced',
    20,
    ARRAY['Desarrollo de software', 'Prototipado rápido', 'Refactoring', 'Implementación de algoritmos'],
    ARRAY['Sé específico sobre los requerimientos', 'Menciona el lenguaje y framework', 'Incluye casos de uso específicos', 'Especifica el nivel de complejidad'],
    true,
    true
),
(
    'Prompt para Creación de Contenido',
    'creacion-contenido-engaging',
    'Prompt para crear contenido atractivo y optimizado para diferentes plataformas y audiencias.',
    'Actúa como un creador de contenido experto y especialista en marketing digital. Crea contenido atractivo y optimizado:

TIPO DE CONTENIDO: [POST, ARTÍCULO, EMAIL, ETC.]
PLATAFORMA: [RED SOCIAL, BLOG, NEWSLETTER, ETC.]
AUDIENCIA OBJETIVO: [DESCRIBIR LA AUDIENCIA]
TEMA: [ESPECIFICAR EL TEMA]
TONO: [PROFESIONAL, CASUAL, TÉCNICO, ETC.]

Por favor, crea:

1. **Título Atractivo** (3 opciones diferentes)
2. **Contenido Principal**:
   - Hook inicial impactante
   - Desarrollo del tema
   - Puntos clave estructurados
   - Call-to-action efectivo

3. **Elementos Visuales Sugeridos**:
   - Tipo de imágenes
   - Colores recomendados
   - Elementos gráficos

4. **Optimización**:
   - Hashtags relevantes (si aplica)
   - Palabras clave SEO
   - Timing de publicación sugerido

5. **Métricas de Éxito** (cómo medir el rendimiento)

Mantén el tono especificado y asegúrate de que el contenido sea valioso para la audiencia objetivo.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    ARRAY['contenido', 'marketing', 'redes sociales', 'SEO', 'engagement'],
    'beginner',
    10,
    ARRAY['Marketing digital', 'Redes sociales', 'Blogging', 'Email marketing', 'Contenido educativo'],
    ARRAY['Define claramente la audiencia objetivo', 'Especifica el tono y estilo', 'Incluye el contexto de la plataforma', 'Menciona objetivos específicos'],
    true,
    true
),
(
    'Prompt para Análisis de Datos',
    'analisis-datos-insights',
    'Prompt especializado para análisis de datos y generación de insights accionables.',
    'Actúa como un analista de datos senior y científico de datos. Analiza los siguientes datos y proporciona insights accionables:

DATOS: [INSERTAR DATOS O DESCRIPCIÓN DE LOS DATOS]
CONTEXTO: [DESCRIBIR EL CONTEXTO DEL NEGOCIO/PROYECTO]
OBJETIVO: [ESPECIFICAR EL OBJETIVO DEL ANÁLISIS]

Por favor, proporciona:

1. **Resumen Ejecutivo**:
   - Hallazgos principales
   - Insights clave
   - Recomendaciones prioritarias

2. **Análisis Descriptivo**:
   - Estadísticas principales
   - Tendencias identificadas
   - Patrones significativos

3. **Análisis Exploratorio**:
   - Correlaciones importantes
   - Segmentaciones relevantes
   - Anomalías detectadas

4. **Insights Accionables**:
   - Oportunidades identificadas
   - Riesgos potenciales
   - Recomendaciones específicas

5. **Visualizaciones Sugeridas**:
   - Tipos de gráficos recomendados
   - Elementos clave a destacar

6. **Próximos Pasos**:
   - Acciones inmediatas
   - Análisis adicionales recomendados
   - Métricas de seguimiento

Mantén un enfoque práctico y orientado a resultados.',
    (SELECT category_id FROM ai_categories WHERE slug = 'analisis-datos'),
    ARRAY['datos', 'análisis', 'insights', 'estadísticas', 'visualización'],
    'advanced',
    25,
    ARRAY['Análisis de negocio', 'Investigación de mercado', 'Optimización de procesos', 'Toma de decisiones'],
    ARRAY['Proporciona contexto del negocio', 'Especifica el objetivo del análisis', 'Incluye formato de datos si es relevante', 'Menciona limitaciones de los datos'],
    true,
    true
),
(
    'Prompt para Traducción Profesional',
    'traduccion-profesional-contexto',
    'Prompt para traducciones profesionales que mantienen el contexto cultural y técnico.',
    'Actúa como un traductor profesional experto con conocimiento profundo de ambos idiomas y culturas. Realiza una traducción profesional del siguiente texto:

TEXTO ORIGINAL: [INSERTAR TEXTO AQUÍ]
IDIOMA ORIGEN: [ESPECIFICAR IDIOMA]
IDIOMA DESTINO: [ESPECIFICAR IDIOMA]
CONTEXTO: [DESCRIBIR EL CONTEXTO: TÉCNICO, COMERCIAL, ACADÉMICO, ETC.]
AUDIENCIA: [ESPECIFICAR LA AUDIENCIA OBJETIVO]

Por favor, proporciona:

1. **Traducción Principal**:
   - Traducción fluida y natural
   - Mantenimiento del tono original
   - Adaptación cultural apropiada

2. **Notas de Traducción**:
   - Decisiones de traducción importantes
   - Adaptaciones culturales realizadas
   - Términos técnicos explicados

3. **Alternativas**:
   - Otras opciones de traducción
   - Variaciones según el contexto
   - Niveles de formalidad

4. **Verificación de Calidad**:
   - Coherencia terminológica
   - Fluidez del texto
   - Precisión del mensaje

5. **Recomendaciones**:
   - Sugerencias de mejora
   - Consideraciones adicionales
   - Validación con nativos

Mantén la fidelidad al mensaje original mientras aseguras la naturalidad en el idioma destino.',
    (SELECT category_id FROM ai_categories WHERE slug = 'contenido-escritura'),
    ARRAY['traducción', 'idiomas', 'cultural', 'profesional', 'contexto'],
    'intermediate',
    12,
    ARRAY['Traducción de documentos', 'Localización de contenido', 'Comunicación internacional', 'Contenido técnico'],
    ARRAY['Especifica el contexto y audiencia', 'Menciona el nivel de formalidad', 'Incluye términos técnicos si los hay', 'Especifica variantes regionales si es relevante'],
    true,
    true
);

-- Actualizar contadores de visualización para simular datos reales
UPDATE ai_apps SET view_count = FLOOR(RANDOM() * 10000) + 100;
UPDATE ai_prompts SET view_count = FLOOR(RANDOM() * 5000) + 50;

-- Actualizar ratings para simular datos reales
UPDATE ai_apps SET 
    rating = ROUND((RANDOM() * 2 + 3)::numeric, 2),
    rating_count = FLOOR(RANDOM() * 500) + 10;

UPDATE ai_prompts SET 
    rating = ROUND((RANDOM() * 2 + 3)::numeric, 2),
    rating_count = FLOOR(RANDOM() * 200) + 5;
