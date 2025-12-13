"""
Script para generar queries de traducción de lesson_activities
Lee el archivo SQL y genera los INSERT para content_translations
"""

import re
import json

def extract_activities(sql_content):
    """Extrae los activity_id, title, description y content del SQL"""
    activities = []
    
    # Patrón para encontrar cada VALUE
    # El patrón busca: ('uuid', 'title', 'description', 'type', 'content', ...
    pattern = r"\('([a-f0-9-]{36})',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']*(?:''[^']*)*)'"
    
    matches = re.finditer(pattern, sql_content, re.DOTALL)
    
    for match in matches:
        activity_id = match.group(1)
        title = match.group(2).replace("''", "'")  # Desescapar comillas
        description = match.group(3).replace("''", "'")
        activity_type = match.group(4)
        content = match.group(5).replace("''", "'")
        
        activities.append({
            'id': activity_id,
            'title': title,
            'description': description,
            'type': activity_type,
            'content': content
        })
    
    return activities

def generate_translation_sql(activities):
    """Genera el SQL para insertar traducciones"""
    
    sql_lines = [
        "-- ============================================",
        "-- TRADUCCIONES DE LESSON_ACTIVITIES",
        "-- ============================================",
        "-- Este script inserta traducciones para todas las actividades de lecciones",
        "-- Ejecutar en Supabase SQL Editor",
        "",
        "-- NOTA: Las traducciones a continuación son PLACEHOLDERS",
        "-- Debes reemplazarlas con traducciones reales en inglés y portugués",
        "",
    ]
    
    def escape_sql_string(text):
        """Escapa el texto para uso en string SQL con dollar-quoting"""
        if not text:
            return ""
        # Solo reemplazar comillas simples por dobles para dollar-quoted strings
        text = text.replace("'", "''")
        # Truncar si es muy largo
        if len(text) > 500:
            text = text[:500] + "..."
        return text
    
    for activity in activities:
        activity_id = activity['id']
        title_es = escape_sql_string(activity['title'])
        desc_es = escape_sql_string(activity['description'])
        content_es = escape_sql_string(activity['content'])
        
        # INGLÉS - Usar json_build_object para evitar problemas de escape
        sql_lines.append(f"-- Activity: {activity['title'][:50]}")
        sql_lines.append("INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)")
        sql_lines.append("VALUES (")
        sql_lines.append("  'activity',")
        sql_lines.append(f"  '{activity_id}'::UUID,")
        sql_lines.append("  'en',")
        sql_lines.append("  json_build_object(")
        sql_lines.append(f"    'activity_title', $$TODO: Translate to English - {title_es}$$,")
        sql_lines.append(f"    'activity_description', $$TODO: Translate to English - {desc_es}$$,")
        sql_lines.append(f"    'activity_content', $$TODO: Translate to English - {content_es}$$")
        sql_lines.append("  )::JSONB")
        sql_lines.append(")")
        sql_lines.append("ON CONFLICT (entity_type, entity_id, language_code)")
        sql_lines.append("DO UPDATE SET")
        sql_lines.append("  translations = EXCLUDED.translations,")
        sql_lines.append("  updated_at = NOW();")
        sql_lines.append("")
        
        # PORTUGUÉS
        sql_lines.append("INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)")
        sql_lines.append("VALUES (")
        sql_lines.append("  'activity',")
        sql_lines.append(f"  '{activity_id}'::UUID,")
        sql_lines.append("  'pt',")
        sql_lines.append("  json_build_object(")
        sql_lines.append(f"    'activity_title', $$TODO: Translate to Portuguese - {title_es}$$,")
        sql_lines.append(f"    'activity_description', $$TODO: Translate to Portuguese - {desc_es}$$,")
        sql_lines.append(f"    'activity_content', $$TODO: Translate to Portuguese - {content_es}$$")
        sql_lines.append("  )::JSONB")
        sql_lines.append(")")
        sql_lines.append("ON CONFLICT (entity_type, entity_id, language_code)")
        sql_lines.append("DO UPDATE SET")
        sql_lines.append("  translations = EXCLUDED.translations,")
        sql_lines.append("  updated_at = NOW();")
        sql_lines.append("")
        sql_lines.append("-- " + "-" * 80)
        sql_lines.append("")
    
    return "\n".join(sql_lines)

# Leer el archivo SQL
with open('lesson_activities_rows.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Extraer actividades
activities = extract_activities(sql_content)

print(f"✅ Encontradas {len(activities)} actividades")

# Generar SQL de traducciones
translation_sql = generate_translation_sql(activities)

# Guardar en archivo
with open('lesson_activities_translations.sql', 'w', encoding='utf-8') as f:
    f.write(translation_sql)

print(f"✅ Archivo generado: lesson_activities_translations.sql")
print(f"\n📝 Siguiente paso:")
print(f"   1. Abre el archivo lesson_activities_translations.sql")
print(f"   2. Reemplaza los 'TODO: Translate...' con las traducciones reales")
print(f"   3. Ejecuta el script en Supabase SQL Editor")
