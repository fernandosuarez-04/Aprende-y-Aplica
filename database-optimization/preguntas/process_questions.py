#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script genérico para procesar preguntas de cualquier rol del CSV y generar SQL
Uso: python process_questions.py <rol_prefix> <rol_id> <area_id> <nivel_id> <codigo_prefix>
Ejemplo: python process_questions.py cto 3 9 2 CTO
"""

import csv
import json
import re
import sys
import os

# Configuración de roles (rol_prefix, rol_id, area_id, nivel_id, codigo_prefix, nombre_rol)
ROLES_CONFIG = {
    'ceo': ('ceo', 1, 1, 6, 'CEO', 'CEO'),
    'cto': ('cto', 3, 9, 2, 'CTO', 'CTO / Director(a) de Tecnología'),
    'cmo': ('dir_marketing', 2, 3, 2, 'CMO', 'CMO / Director(a) de Marketing'),
    'lider_gerente_ventas': ('lider_gerente_ventas', 6, 2, 3, 'LGV', 'Líder/Gerente de Ventas'),
    'direccion_ventas': ('direccion_ventas', 11, 2, 2, 'DV', 'Dirección de Ventas'),
    'gerente_marketing': ('gerente_marketing', 4, 3, 3, 'GM', 'Gerente de Marketing'),
    'analista_ti': ('analista_ti', 7, 9, 4, 'ATI', 'Analista/Especialista TI'),
    'gerente_ti': ('gerente_ti', 5, 9, 3, 'GTI', 'Gerente de TI'),
    'academia_investigacion': ('academia_investigacion', 8, 10, 3, 'AC', 'Academia/Investigación'),
    'educacion_docentes': ('educacion_docentes', 9, 10, 3, 'ED', 'Educación/Docentes'),
    'diseno_industrias_creativas': ('diseno_industrias_creativas', 10, 11, 3, 'DIC', 'Diseño/Industrias Creativas'),
    'dir_operaciones': ('dir_operaciones', 12, 4, 2, 'DO', 'Dirección de Operaciones'),
    'dir_finanzas': ('dir_finanzas', 13, 5, 2, 'DF', 'Dirección de Finanzas (CFO)'),
    'dir_rrhh': ('dir_rrhh', 14, 6, 2, 'DRH', 'Dirección de RRHH'),
    'dir_contabilidad': ('dir_contabilidad', 15, 7, 2, 'DC', 'Dirección/Jefatura de Contabilidad'),
    'dir_compras_supply': ('dir_compras_supply', 16, 8, 2, 'DCS', 'Dirección de Compras / Supply'),
    'miembros_ventas': ('miembros_ventas', 17, 2, 4, 'MV', 'Miembros de Ventas'),
    'miembros_marketing': ('miembros_marketing', 18, 3, 4, 'MM', 'Miembros de Marketing'),
    'miembros_operaciones': ('miembros_operaciones', 19, 4, 4, 'MO', 'Miembros de Operaciones'),
    'miembros_finanzas': ('miembros_finanzas', 20, 5, 4, 'MF', 'Miembros de Finanzas'),
    'miembros_rrhh': ('miembros_rrhh', 21, 6, 4, 'MRH', 'Miembros de RRHH'),
    'miembros_contabilidad': ('miembros_contabilidad', 22, 7, 4, 'MC', 'Miembros de Contabilidad'),
    'miembros_compras': ('miembros_compras', 23, 8, 4, 'MCP', 'Miembros de Compras'),
    'gerencia_media': ('gerencia_media', 24, 1, 3, 'GEM', 'Gerencia Media'),
    'freelancer': ('freelancer', 25, 1, 4, 'FL', 'Freelancer'),
    'consultor': ('consultor', 26, 1, 4, 'CON', 'Consultor'),
    'direccion_gobierno': ('dir_gob_politicaspublicas', 27, 10, 2, 'DG', 'Dirección de Gobierno / Políticas Públicas'),
    'miembros_gobierno': ('miembros_gobierno', 28, 10, 4, 'MG', 'Miembros de Gobierno / Sector público'),
}

def parse_json_field(field):
    """Parsea un campo JSON que puede estar en formato string"""
    if not field or field.strip() == '':
        return None
    try:
        if isinstance(field, (dict, list)):
            return field
        # El CSV reader de Python ya maneja las comillas dobles escapadas,
        # pero si el campo viene como string con comillas, intentar parsearlo directamente
        field_str = str(field).strip()
        # Si empieza y termina con comillas, quitarlas
        if field_str.startswith('"') and field_str.endswith('"'):
            field_str = field_str[1:-1]
        # Intentar parsear directamente
        return json.loads(field_str)
    except:
        try:
            # Intentar reemplazar comillas simples por dobles
            field_str = str(field).replace("'", '"')
            # Si empieza y termina con comillas, quitarlas
            if field_str.startswith('"') and field_str.endswith('"'):
                field_str = field_str[1:-1]
            return json.loads(field_str)
        except:
            return None

def convert_likert_to_scale(opciones):
    """Convierte opciones Likert al formato de escala A-E"""
    if not opciones:
        return None
    
    if isinstance(opciones, list):
        converted = []
        labels = ['A)', 'B)', 'C)', 'D)', 'E)']
        standard_opciones = [
            "A) Nunca",
            "B) Rara vez (≤ 1/mes)",
            "C) Ocasional (2–3/mes)",
            "D) Frecuente (semanal)",
            "E) Muy frecuente (diaria)"
        ]
        
        # Mapeo mejorado para reconocer variaciones y normalizar al formato estándar
        likert_keywords = {
            "nunca": 0,
            "raramente": 1,
            "rara vez": 1,
            "casi nunca": 1,  # "Casi nunca" es más cercano a "Rara vez" que a "Nunca"
            "menos de 1 vez": 1,
            "menos de una vez": 1,
            "a veces": 2,
            "algunas veces": 2,
            "ocasional": 2,
            "ocasionalmente": 2,
            "frecuentemente": 3,
            "frecuente": 3,
            "semanal": 3,
            "semanalmente": 3,
            "casi a diario": 3,
            "siempre": 4,
            "casi siempre": 4,
            "diariamente": 4,
            "diaria": 4,
            "varias veces al día": 4,
            "muy frecuente": 4
        }
        
        for idx, opt in enumerate(opciones):
            opt_clean = str(opt).strip().strip('"').strip("'")
            
            # Remover prefijo existente si lo tiene para analizar el contenido
            opt_text = opt_clean
            if opt_clean.startswith(('A)', 'B)', 'C)', 'D)', 'E)', 'a)', 'b)', 'c)', 'd)', 'e)')):
                opt_text = opt_clean[2:].strip()
            
            # Intentar mapear basándose en palabras clave
            # Ordenar por longitud descendente para buscar frases completas antes que palabras individuales
            opt_lower = opt_text.lower()
            mapped_idx = None
            
            # Ordenar keywords por longitud descendente para priorizar frases completas
            sorted_keywords = sorted(likert_keywords.items(), key=lambda x: len(x[0]), reverse=True)
            
            for keyword, label_idx in sorted_keywords:
                if keyword in opt_lower:
                    mapped_idx = label_idx
                    break
            
            # Si no se encontró mapeo, usar el índice de la lista (asumiendo orden)
            if mapped_idx is None:
                mapped_idx = min(idx, 4)  # Asegurar que no exceda E
            
            # Siempre usar el formato estándar para mantener consistencia
            if mapped_idx < len(standard_opciones):
                converted.append(standard_opciones[mapped_idx])
            else:
                converted.append(standard_opciones[4])  # E) como fallback
        
        # Asegurar que siempre tengamos exactamente 5 opciones
        while len(converted) < 5:
            converted.append(standard_opciones[len(converted)])
        
        return converted[:5]  # Limitar a 5 opciones máximo
    
    return opciones

def format_opciones_sql(opciones):
    """Formatea las opciones como array JSON para SQL"""
    if not opciones:
        return 'null'
    
    if isinstance(opciones, str):
        try:
            opciones = json.loads(opciones)
        except:
            opciones = [opciones]
    
    formatted = json.dumps(opciones, ensure_ascii=False)
    # Escapar comillas simples para SQL
    formatted = formatted.replace("'", "''")
    return f"'{formatted}'"

def format_escala_sql(escala, tipo):
    """Formatea la escala según el tipo de pregunta"""
    if tipo == 'likert_1_5_frecuencia' or 'ADOPCION' in tipo.upper():
        return """'{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}'"""
    return 'null'

def format_scoring_sql(scoring, tipo, respuesta_correcta, tipo_pregunta=None):
    """Formatea el scoring según el tipo de pregunta"""
    if tipo == 'likert_1_5_frecuencia' or 'ADOPCION' in tipo.upper() or tipo_pregunta == 'adopcion':
        return """'{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}'"""
    elif tipo == 'opcion_multiple_unica' or 'CONOCIMIENTO' in tipo.upper() or tipo_pregunta == 'conocimiento':
        return """'{"Correcta": 100, "Incorrecta": 0}'"""
    return 'null'

def get_dimension(text, bloque):
    """Infiere dimensiones basándose en el texto de la pregunta
    Valores válidos: Conocimiento, Aplicación, Productividad, Estrategia, Inversión
    """
    dimensions = []
    text_lower = text.lower()

    if bloque == 'Conocimiento':
        dimensions.append("Conocimiento")

    # Mapeo a valores válidos únicamente
    if any(keyword in text_lower for keyword in ["estrategia", "planifica", "priorizar", "gobernanza", "roadmap", "iniciativas", "impacto estratégico", "modelo de negocio"]):
        dimensions.append("Estrategia")
    if any(keyword in text_lower for keyword in ["productividad", "eficiencia", "ahorro", "optimizar", "automatizar", "tiempo", "resultados", "impacto en p&l", "métricas", "kpi", "reportes", "insights"]):
        dimensions.append("Productividad")
    if any(keyword in text_lower for keyword in ["inversión", "presupuesto", "financiamiento", "roi", "costo", "financiero"]):
        dimensions.append("Inversión")
    if any(keyword in text_lower for keyword in ["uso", "utiliza", "aplica", "herramientas", "implementar", "adopción", "experimentos", "casos de uso", "copilot", "datos", "analítica", "información"]):
        dimensions.append("Aplicación")
    # Riesgo, seguridad, ética → mapear a Estrategia
    if any(keyword in text_lower for keyword in ["riesgo", "seguridad", "ética", "confidencial", "privacidad", "cumplimiento", "sesgos", "auditoría", "guardrails"]):
        dimensions.append("Estrategia")
    # Talento, capacitación → mapear a Aplicación o Estrategia
    if any(keyword in text_lower for keyword in ["talento", "capacitación", "equipo", "habilidades", "formación", "upskilling"]):
        dimensions.append("Aplicación")

    # Si no se encontraron dimensiones específicas, usar valores por defecto según el bloque
    if not dimensions:
        if bloque == 'Conocimiento':
            dimensions.append("Conocimiento")
        else:  # Adopción
            dimensions.append("Aplicación")

    dims_json = json.dumps(list(set(dimensions)), ensure_ascii=False)
    return f"'{dims_json}'::jsonb"

def escape_sql_string(text):
    """Escapa comillas simples para SQL"""
    if not text:
        return ''
    return text.replace("'", "''")

def generate_sql_insert(row, rol_config, pregunta_num=None, tipo_pregunta=None, dificultad=None):
    """Genera una línea INSERT SQL para una pregunta"""
    rol_prefix, rol_id, area_id, nivel_id, codigo_prefix, nombre_rol = rol_config
    
    # Generar código
    if tipo_pregunta == 'adopcion':
        codigo = f'{codigo_prefix}-A{pregunta_num}'
    elif tipo_pregunta == 'conocimiento':
        codigo = f'{codigo_prefix}-C{pregunta_num}'
    else:
        codigo = row.get('codigo', '').strip().strip('"')
        if not codigo:
            return None
    
    section = 'Cuestionario'
    bloque = row.get('bloque', '').strip().strip('"')
    if bloque == 'Adopción/uso':
        bloque = 'Adopción'
    if not bloque:
        bloque = 'Conocimiento' if 'CONOCIMIENTO' in codigo.upper() else 'Adopción'
    
    # Campos de rol y área
    area_id_sql = f"'{area_id}'"
    exclusivo_rol_id_sql = f"'{rol_id}'"
    
    texto_raw = row.get('texto', '').strip().strip('"')
    texto_original = texto_raw  # Guardar original para limpiar después
    if not texto_raw:
        return None
    
    tipo = row.get('tipo', '').strip().strip('"')
    if not tipo:
        if 'ADOPCION' in codigo.upper():
            tipo = 'likert_1_5_frecuencia'
        else:
            tipo = 'opcion_multiple_unica'
    
    # Determinar tipo SQL
    if 'likert' in tipo.lower() or 'ADOPCION' in codigo.upper():
        tipo_sql = 'Multiple Choice (escala Likert A–E)'
    else:
        tipo_sql = 'Multiple Choice (una respuesta)'
    
    # Opciones
    opciones_raw = row.get('opciones', '').strip().strip('"')
    opciones = parse_json_field(opciones_raw)
    
    # Si no es JSON, intentar parsear como string separado por " | "
    if not opciones and opciones_raw:
        if ' | ' in opciones_raw:
            opciones = [opt.strip() for opt in opciones_raw.split(' | ')]
        elif isinstance(opciones_raw, str):
            opciones = parse_json_field(opciones_raw)
    
    if not opciones:
        if tipo_sql == 'Multiple Choice (escala Likert A–E)':
            opciones = ["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]
        else:
            # Intentar extraer opciones del texto si están incluidas
            # Buscar patrones como "(A) texto. (B) texto." o "A) texto. B) texto."
            # Usar texto_raw (sin escapar) para la extracción
            if texto_raw:
                # Primero intentar con paréntesis: (A) texto. (B) texto.
                if '(A)' in texto_raw or '(B)' in texto_raw:
                    pattern_parentesis = r'\(([A-E])\)\s+([^\(]+?)(?=\s*\([A-E]\)|$)'
                    matches_parentesis = re.findall(pattern_parentesis, texto_raw)
                    if len(matches_parentesis) >= 4:
                        opciones = [f"{match[0]}) {match[1].strip().rstrip('.')}" for match in matches_parentesis[:4]]
                    elif len(matches_parentesis) > 0:
                        # Si encontramos algunas pero no todas, usar las que encontramos
                        opciones = [f"{match[0]}) {match[1].strip().rstrip('.')}" for match in matches_parentesis]
                
                if not opciones:
                    # Buscar patrones como "A) texto. B) texto. C) texto. D) texto."
                    pattern = r'([A-E]\))\s+([^A-E\)]+?)(?=\s+[A-E]\)|$)'
                    matches = re.findall(pattern, texto_raw)
                    if len(matches) >= 4:
                        opciones = [f"{match[0]} {match[1].strip().rstrip('.')}" for match in matches[:4]]
                
                if not opciones and ('(A)' in texto_raw or 'A)' in texto_raw):
                    # Patrón alternativo: dividir por (A), (B), (C), (D) o A), B), C), D)
                    parts = None
                    if '(A)' in texto_raw:
                        # Dividir por (A), (B), etc.
                        parts = re.split(r'\s*\(([A-E])\)\s*', texto_raw)
                        if len(parts) >= 8:  # Debería tener: [texto_antes, 'A', opcion_a, 'B', opcion_b, ...]
                            opciones = []
                            for i in range(1, len(parts), 2):
                                if i+1 < len(parts):
                                    letra = parts[i]
                                    opcion_texto = parts[i+1].strip().rstrip('.')
                                    opciones.append(f"{letra}) {opcion_texto}")
                                    if len(opciones) >= 4:
                                        break
                    elif 'A)' in texto_raw:
                        parts = re.split(r'\s+([A-E]\))', texto_raw)
                        if len(parts) >= 8:  # Debería tener: [texto_antes, 'A)', opcion_a, 'B)', opcion_b, ...]
                            opciones = []
                            for i in range(1, len(parts), 2):
                                if i+1 < len(parts):
                                    opcion = f"{parts[i]} {parts[i+1].strip()}"
                                    opciones.append(opcion)
                                    if len(opciones) >= 4:
                                        break
                        if len(opciones) >= 4:
                            opciones = opciones[:4]
            
            if not opciones:
                print(f"ADVERTENCIA: Pregunta {codigo} no tiene opciones definidas")
                opciones = ["A) Opción A", "B) Opción B", "C) Opción C", "D) Opción D"]
    
    # Limpiar el texto removiendo las opciones si fueron extraídas del texto
    if opciones and len(opciones) > 0 and opciones != ["A) Opción A", "B) Opción B", "C) Opción C", "D) Opción D"]:
        # Si las opciones fueron extraídas del texto, removerlas del texto
        texto_limpio = texto_original
        # Remover opciones con paréntesis: (A) texto. (B) texto.
        for opt in opciones:
            # Extraer el texto de la opción sin el prefijo
            opt_text = opt
            if opt.startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
                opt_text = opt[3:].strip()
            # Buscar y remover la opción del texto
            # Patrón para (A) texto o A) texto
            pattern_remove = re.escape(opt_text)
            # Intentar remover con paréntesis primero
            texto_limpio = re.sub(r'\([A-E]\)\s*' + pattern_remove + r'\.?\s*', '', texto_limpio, flags=re.IGNORECASE)
            # Si no se removió, intentar sin paréntesis
            texto_limpio = re.sub(r'[A-E]\)\s*' + pattern_remove + r'\.?\s*', '', texto_limpio, flags=re.IGNORECASE)
        texto_raw = texto_limpio.strip()
    
    texto = escape_sql_string(texto_raw)
    
    if tipo_sql == 'Multiple Choice (escala Likert A–E)':
        opciones = convert_likert_to_scale(opciones)
    else:
        if opciones and isinstance(opciones, list):
            formatted_opciones = []
            labels = ['A)', 'B)', 'C)', 'D)', 'E)']
            for idx, opt in enumerate(opciones):
                opt_str = str(opt).strip().strip('"').strip("'")
                # Detectar prefijos en mayúsculas o minúsculas
                if opt_str.startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
                    formatted_opciones.append(opt_str)
                elif opt_str.startswith(('a)', 'b)', 'c)', 'd)', 'e)')):
                    # Normalizar a mayúsculas
                    opt_str = opt_str[0].upper() + opt_str[1:]
                    formatted_opciones.append(opt_str)
                else:
                    if idx < len(labels):
                        formatted_opciones.append(f"{labels[idx]} {opt_str}")
                    else:
                        formatted_opciones.append(opt_str)
            opciones = formatted_opciones
    
    opciones_sql = format_opciones_sql(opciones)
    
    locale = row.get('locale', '').strip().strip('"')
    if not locale or locale == 'es-MX':
        locale = 'MX/LATAM'
    
    peso = row.get('peso', '').strip().strip('"')
    if not peso or peso == '1' or peso == '1""' or '"1"' in peso:
        peso = '8.333333'
    
    escala_raw = row.get('escala', '').strip().strip('"')
    escala_sql = format_escala_sql(escala_raw, tipo)
    
    respuesta_correcta = row.get('respuesta_correcta', '').strip().strip('"')
    # Si respuesta_correcta parece ser un JSON (probablemente es la columna dimension desplazada), ignorarlo
    if respuesta_correcta and respuesta_correcta.startswith('{'):
        respuesta_correcta = ''
    
    # Fallback para cuando DictReader no mapea correctamente por columnas vacías
    if not respuesta_correcta and 'dimension' in row and row['dimension'].startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
        respuesta_correcta = row['dimension']
    elif not respuesta_correcta and 'exclusivo_nivel_id' in row and row['exclusivo_nivel_id'].startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
        respuesta_correcta = row['exclusivo_nivel_id']
    
    if tipo_pregunta == 'adopcion':
        # Para preguntas de adopción, respuesta_correcta siempre es null
        respuesta_correcta_sql = 'null'
    elif respuesta_correcta and tipo_pregunta == 'conocimiento':
        respuesta_clean = respuesta_correcta.strip()
        labels = ['A)', 'B)', 'C)', 'D)', 'E)']
        encontrada = False
        
        # Si la respuesta ya tiene el formato correcto (A) texto, B) texto, etc.)
        if respuesta_clean.startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
            # Verificar que esta opción existe en la lista de opciones
            for opt in opciones:
                opt_clean = str(opt).strip().strip('"').strip("'")
                if opt_clean == respuesta_clean or opt_clean.startswith(respuesta_clean[:2]):
                    respuesta_correcta_sql = f"'{escape_sql_string(opt_clean)}'"
                    encontrada = True
                    break
            if not encontrada:
                respuesta_correcta_sql = f"'{escape_sql_string(respuesta_clean)}'"
                encontrada = True
        # Si la respuesta es solo una letra (A, B, C, D, E), mapearla directamente al índice
        elif len(respuesta_clean) == 1 and respuesta_clean.upper() in ['A', 'B', 'C', 'D', 'E']:
            idx = ord(respuesta_clean.upper()) - ord('A')
            if idx < len(opciones):
                opt_clean = str(opciones[idx]).strip().strip('"').strip("'")
                if opt_clean.startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
                    respuesta_correcta_sql = f"'{escape_sql_string(opt_clean)}'"
                else:
                    respuesta_correcta_sql = f"'{escape_sql_string(f'{labels[idx]} {opt_clean}')}'"
                encontrada = True
        
        # Si no es solo una letra, buscar por coincidencia de texto (solo el texto, sin prefijo)
        if not encontrada:
            respuesta_clean_sin_prefijo = respuesta_clean
            # Remover prefijo si existe
            if respuesta_clean.startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
                respuesta_clean_sin_prefijo = respuesta_clean[3:].strip()
            
            for idx, opt in enumerate(opciones):
                opt_clean = str(opt).strip().strip('"').strip("'")
                opt_sin_etiqueta = opt_clean
                if opt_clean.startswith(('A)', 'B)', 'C)', 'D)', 'E)')):
                    opt_sin_etiqueta = opt_clean[3:].strip()
                
                # Coincidencia exacta o parcial del texto (sin prefijos)
                if opt_sin_etiqueta == respuesta_clean_sin_prefijo or respuesta_clean_sin_prefijo in opt_sin_etiqueta or opt_sin_etiqueta in respuesta_clean_sin_prefijo:
                    respuesta_correcta_sql = f"'{escape_sql_string(opt_clean)}'"
                    encontrada = True
                    break
            
            if not encontrada:
                respuesta_correcta_sql = f"'{escape_sql_string(respuesta_correcta)}'"
    elif respuesta_correcta:
        respuesta_correcta = escape_sql_string(respuesta_correcta)
        respuesta_correcta_sql = f"'{respuesta_correcta}'"
    else:
        respuesta_correcta_sql = 'null'
    
    scoring_raw = row.get('scoring', '').strip().strip('"')
    scoring_sql = format_scoring_sql(scoring_raw, tipo, respuesta_correcta, tipo_pregunta)
    
    dimension_sql = get_dimension(texto, bloque)
    
    nivel_sql = str(nivel_id) if nivel_id else 'null'
    
    if dificultad:
        dificultad_sql = str(dificultad)
    else:
        dificultad_sql = 'null'
    
    sql = f"""('{codigo}', '{section}', '{bloque}', {area_id_sql}, {exclusivo_rol_id_sql}, '{texto}', '{tipo_sql}', {opciones_sql}, '{locale}', '{peso}', {escala_sql}, {scoring_sql}, now(), {respuesta_correcta_sql}, {dimension_sql}, {nivel_sql}, {dificultad_sql})"""
    
    return sql

def main():
    if len(sys.argv) < 2:
        print("Uso: python process_questions.py <rol_key>")
        print("Roles disponibles:", ", ".join(ROLES_CONFIG.keys()))
        sys.exit(1)
    
    rol_key = sys.argv[1].lower()
    if rol_key not in ROLES_CONFIG:
        print(f"Error: Rol '{rol_key}' no encontrado")
        print("Roles disponibles:", ", ".join(ROLES_CONFIG.keys()))
        sys.exit(1)
    
    rol_config = ROLES_CONFIG[rol_key]
    rol_prefix, rol_id, area_id, nivel_id, codigo_prefix, nombre_rol = rol_config
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'preguntas-ceo.csv')
    
    # Leer CSV
    questions = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        header_map = {h: i for i, h in enumerate(header)}
        respuesta_correcta_idx = header_map.get('respuesta_correcta', -1)
        
        for row_list in reader:
            if len(row_list) <= header_map.get('codigo', 0):
                continue
                
            # Crear diccionario mapeando manualmente
            row = {}
            for key, idx in header_map.items():
                if idx < len(row_list):
                    row[key] = row_list[idx]
                else:
                    row[key] = ''
            
            # Si respuesta_correcta está vacío pero hay datos en el índice siguiente, usar ese como fallback
            if respuesta_correcta_idx >= 0 and not row.get('respuesta_correcta', '').strip():
                if respuesta_correcta_idx + 1 < len(row_list) and row_list[respuesta_correcta_idx + 1].strip():
                    row['respuesta_correcta'] = row_list[respuesta_correcta_idx + 1]
            
            codigo = row.get('codigo', '').strip()
            codigo_lower = codigo.lower()
            
            # Buscar por prefijo exacto o variaciones comunes
            # Caso especial para analista_ti que en CSV aparece como analista_especialista_ti
            if rol_prefix == 'analista_ti':
                if codigo_lower.startswith('analista_especialista_ti_'):
                    questions.append(row)
            elif (codigo_lower.startswith(rol_prefix.lower() + '_') or 
                codigo_lower.startswith(rol_prefix.lower() + '_dir_') or
                codigo_lower.startswith(rol_prefix.lower() + '_direccion_') or
                (rol_prefix.lower() in codigo_lower and ('CONOCIMIENTO' in codigo.upper() or 'ADOPCION' in codigo.upper()))):
                questions.append(row)
    
    # Separar por tipo
    conocimiento = [q for q in questions if 'CONOCIMIENTO' in q.get('codigo', '').upper()]
    adopcion = [q for q in questions if 'ADOPCION' in q.get('codigo', '').upper()]
    
    # Ordenar por número de pregunta
    conocimiento.sort(key=lambda x: int(re.search(r'Q(\d+)', x.get('codigo', 'Q0')).group(1)) if re.search(r'Q(\d+)', x.get('codigo', 'Q0')) else 0)
    adopcion.sort(key=lambda x: int(re.search(r'Q(\d+)', x.get('codigo', 'Q0')).group(1)) if re.search(r'Q(\d+)', x.get('codigo', 'Q0')) else 0)
    
    print(f"Total preguntas {nombre_rol}: {len(questions)}")
    print(f"Conocimiento: {len(conocimiento)}, Adopción: {len(adopcion)}")
    
    # Organizar en 5 niveles (12 preguntas cada uno: 6 conocimiento + 6 adopción)
    niveles = []
    for nivel in range(5):
        nivel_num = nivel + 1
        conocimiento_nivel = conocimiento[nivel * 6:(nivel + 1) * 6]
        adopcion_nivel = adopcion[nivel * 6:(nivel + 1) * 6]
        niveles.append({
            'nivel': nivel_num,
            'conocimiento': conocimiento_nivel,
            'adopcion': adopcion_nivel
        })
    
    # Generar SQL
    sql_lines = []
    sql_lines.append("-- ============================================================================")
    sql_lines.append(f"-- PREGUNTAS PARA {nombre_rol.upper()}")
    sql_lines.append("-- ============================================================================")
    sql_lines.append("-- Rol incluido:")
    sql_lines.append(f"--   - Rol ID {rol_id}: {nombre_rol} (area_id: {area_id}, nivel_id: {nivel_id})")
    sql_lines.append("-- ============================================================================")
    sql_lines.append("")
    sql_lines.append(f"-- ============================================================================")
    sql_lines.append(f"-- ROL {rol_id}: {nombre_rol}")
    sql_lines.append("-- ============================================================================")
    sql_lines.append("")
    
    # ADOPCIÓN
    sql_lines.append(f"-- ADOPCIÓN - Rol {rol_id}")
    sql_lines.append('INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id", "dificultad") VALUES')
    
    adopcion_sqls = []
    pregunta_num = 1
    for nivel_data in niveles:
        dificultad_nivel = nivel_data['nivel']
        for q in nivel_data['adopcion']:
            sql = generate_sql_insert(q, rol_config, pregunta_num, 'adopcion', dificultad_nivel)
            if sql:
                adopcion_sqls.append(sql)
                pregunta_num += 1
    
    sql_lines.append(',\n\n'.join(adopcion_sqls) + ';')
    sql_lines.append("")
    
    # CONOCIMIENTO
    sql_lines.append(f"-- CONOCIMIENTO - Rol {rol_id}")
    sql_lines.append('INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id", "dificultad") VALUES')
    
    conocimiento_sqls = []
    pregunta_num = 1
    for nivel_data in niveles:
        dificultad_nivel = nivel_data['nivel']
        for q in nivel_data['conocimiento']:
            sql = generate_sql_insert(q, rol_config, pregunta_num, 'conocimiento', dificultad_nivel)
            if sql:
                conocimiento_sqls.append(sql)
                pregunta_num += 1
    
    sql_lines.append(',\n\n'.join(conocimiento_sqls) + ';')
    sql_lines.append("")
    
    # Escribir archivo
    output = '\n'.join(sql_lines)
    sql_filename = f'preguntas-{rol_key}.sql'
    sql_path = os.path.join(script_dir, sql_filename)
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(output)
    
    print(f"\nArchivo generado: {sql_filename}")
    print(f"Total líneas SQL: {len(sql_lines)}")

if __name__ == '__main__':
    main()

