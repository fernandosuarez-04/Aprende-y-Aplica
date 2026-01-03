#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para quitar los incisos (A), B), C), D), E)) de las opciones y respuestas correctas
en los archivos SQL de preguntas.
"""

import re
import os
import glob

def process_sql_file(file_path):
    """Procesa un archivo SQL y quita los incisos"""
    print(f"Procesando: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = False
    
    # Reemplazar incisos en opciones: "A) texto" -> "texto"
    # Buscar dentro de arrays JSON: ["A) ...", "B) ...", ...]
    patterns_opciones = [
        (r'"A\)\s*', '"'),  # "A) " -> "
        (r'"B\)\s*', '"'),  # "B) " -> "
        (r'"C\)\s*', '"'),  # "C) " -> "
        (r'"D\)\s*', '"'),  # "D) " -> "
        (r'"E\)\s*', '"'),  # "E) " -> "
    ]
    
    for pattern, replacement in patterns_opciones:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            changes_made = True
    
    # Reemplazar incisos en respuesta_correcta: 'A) texto' -> 'texto'
    # El formato es: now(), 'A) texto...', '[...]'
    # Buscar y reemplazar directamente los patrones después de now(),
    respuesta_patterns = [
        (r"now\(\)\,\s*'A\)\s+", "now(), '"),
        (r"now\(\)\,\s*'B\)\s+", "now(), '"),
        (r"now\(\)\,\s*'C\)\s+", "now(), '"),
        (r"now\(\)\,\s*'D\)\s+", "now(), '"),
        (r"now\(\)\,\s*'E\)\s+", "now(), '"),
    ]
    
    for pattern, replacement in respuesta_patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            changes_made = True
    
    if changes_made:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Actualizado: {file_path}")
        return True
    else:
        print(f"  - Sin cambios: {file_path}")
        return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    sql_files = glob.glob('preguntas-*.sql')
    
    if not sql_files:
        print("No se encontraron archivos SQL")
        return
    
    print(f"Encontrados {len(sql_files)} archivos SQL para procesar\n")
    
    updated_count = 0
    for sql_file in sorted(sql_files):
        if process_sql_file(sql_file):
            updated_count += 1
        print()
    
    print(f"\nProceso completado: {updated_count} archivos actualizados de {len(sql_files)} totales")

if __name__ == '__main__':
    main()
