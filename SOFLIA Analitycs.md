SofLIA – Planeador de Actividades

Fecha:  11/02/25
Auditor: Israel
Versión: 1.0

---

1. Resumen Ejecutivo

El presente documento detalla la auditoría funcional, UX, técnica y estratégica del módulo Planeador de Actividades de SofLIA. El objetivo es evaluar su alineación con:

* Propuesta de valor educativa
* Experiencia de usuario
* Coherencia pedagógica
* Escalabilidad operativa
* Capacidad de medición y mejora continua

Se identifican fortalezas estructurales en personalización inicial y claridad de propósito, junto con oportunidades relevantes en precisión semántica, lógica de configuración, consistencia temporal y profundidad adaptativa.

---

2. Alcance de la Auditoría

La revisión incluyó:

* Flujo de creación del plan de estudio
* Mensajería inicial del asistente LIA
* Opciones de configuración de sesiones
* Definición de ritmo de estudio
* Coherencia entre duración de lecciones y recomendaciones
* Claridad en decisiones UX

No se evaluó:

* Integración backend
* Base de datos
* Motor adaptativo interno (si existe)
* Analítica avanzada

---

3. Evaluación Funcional

3.1 Personalización Inicial

Fortaleza:

* Identificación nominal del usuario.
* Reconocimiento automático del curso asignado.
* Explicación clara de duración promedio por lección.

Oportunidad:

* No se valida disponibilidad semanal real del usuario.
* No se pregunta por objetivo (certificación, aplicación práctica, exploración).
* No existe diagnóstico inicial de nivel.

Recomendación:
Incorporar 2–3 preguntas estratégicas antes de configurar sesiones:

* Horas disponibles por semana
* Fecha objetivo de finalización
* Nivel percibido en el tema

---

3.2 Configuración de Duración de Sesiones

Se presentan tres opciones:

* 30 min (Rápidas)
* 45 min (Normales)
* 60 min (Largas)

Observación crítica:
Posteriormente se presenta un segundo bloque de selección de ritmo con rangos distintos (60–90, 45–60, 20–35), lo que puede generar fricción cognitiva y ambigüedad conceptual.

Problema detectado:
Hay superposición semántica entre “duración de sesión” y “ritmo de estudio”.

Riesgo:
Confusión del usuario y configuración incoherente.

Recomendación estructural:
Separar claramente:

* Duración por sesión (tiempo por bloque)
* Frecuencia semanal (número de sesiones)
* Intensidad total semanal (minutos acumulados)

---

3.3 Coherencia Pedagógica

La duración promedio por lección es de 15 minutos.

Recomendación actual: sesiones de 30–60 minutos.

Análisis:
Esto implica 2–4 lecciones por sesión, lo cual es razonable.

Oportunidad de mejora:
No se comunica explícitamente cuántas lecciones se cubrirán por sesión según la opción seleccionada.

Recomendación:
Mostrar equivalencias claras:

* 30 min → ~2 lecciones
* 45 min → ~3 lecciones
* 60 min → ~4 lecciones

Esto mejora previsibilidad y reduce incertidumbre.

---

4. Evaluación UX

4.1 Claridad Conversacional

La voz de LIA es cercana y clara.

Sin embargo:

* Se presentan múltiples decisiones consecutivas.
* No se visualiza progreso del flujo.
* No existe indicador de pasos (ej. Paso 1 de 3).

Recomendación UX:
Agregar:

* Barra de progreso
* Confirmación visual de selección
* Resumen final antes de crear el plan

---

4.2 Carga Cognitiva

El usuario debe interpretar:

* Duración por sesión
* Ritmo de estudio
* Recomendación basada en lecciones

La arquitectura actual puede generar micro-fricción.

Recomendación:
Reducir decisiones y guiar con una recomendación destacada basada en heurística.

Ejemplo:

“Basado en cursos similares, recomendamos 45 min por sesión, 3 veces por semana.”

---

5. Evaluación Estratégica

5.1 Alineación con Retención

El planeador no parece incorporar:

* Micro-métricas de adherencia
* Replanificación automática
* Ajuste dinámico según cumplimiento

Riesgo:
El plan puede volverse estático y perder efectividad en 2–3 semanas.

Recomendación avanzada:
Incorporar:

* Revisión semanal automática
* Ajuste dinámico si el usuario incumple sesiones
* Alertas inteligentes (no invasivas)

---

5.2 Medición y ROI Educativo

No se evidencia:

* Estimación de fecha de finalización
* Visualización de progreso proyectado
* Cálculo de tiempo total requerido

Recomendación estratégica:
Mostrar:

* Tiempo total del curso
* Fecha estimada de finalización según configuración
* Impacto de cambiar el ritmo

Esto aumenta percepción de control y compromiso.

---

6. Riesgos Identificados

1. Ambigüedad entre duración e intensidad.
2. Posible inconsistencia entre selección y resultado final.
3. Ausencia de modelado adaptativo explícito.
4. Falta de transparencia en proyección temporal.

---

7. Recomendaciones Prioritarias

Prioridad Alta

* Unificar lógica de duración vs. ritmo.
* Mostrar equivalencia lecciones/sesión.
* Agregar estimación de fecha de finalización.

Prioridad Media

* Incorporar diagnóstico inicial.
* Implementar revisión semanal automática.

Prioridad Estratégica

* Convertir el planeador en motor adaptativo dinámico.
* Integrar métricas de adherencia y ajuste automático.

---

8. Conclusión

El Planeador de Actividades de SofLIA presenta una base sólida en personalización inicial y claridad pedagógica básica. Sin embargo, requiere mayor precisión conceptual, reducción de fricción cognitiva y evolución hacia un modelo adaptativo dinámico para maximizar adherencia, finalización y percepción de valor.

Con ajustes estructurales relativamente simples, el módulo puede evolucionar de un configurador estático a un sistema inteligente de gestión del aprendizaje.

