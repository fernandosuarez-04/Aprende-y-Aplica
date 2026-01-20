Basado en los documentos proporcionados, se han identificado las siguientes decisiones clave para flexibilizar las estructuras jerárquicas y organizacionales de la plataforma:
--------------------------------------------------------------------------------
1. Transición de Niveles Fijos a Estructura de Árbol (Nodos)
• Qué era antes (estado actual): La estructura era rígida y limitada a tres niveles fijos: Región, Zona y Equipo (u Oficina).
• Qué se propone ahora (nuevo comportamiento): Implementar una estructura de árbol basada en nodos dinámicos. En este modelo, cada nodo tiene una clave, un título y una referencia a su "padre" (parent key), permitiendo una profundidad ilimitada de niveles.
• Motivación / problema que resuelve: Las organizaciones grandes (como BBVA o FEMSA) tienen estructuras complejas que superan los tres niveles (divisiones, regiones, subregiones, zonas, sucursales, etc.). El modelo anterior no permitía representar fielmente estas jerarquías.
• Impacto:
    ◦ Datos/Backend: Cambio a tablas de nodos simples con relaciones parent-child. Uso de algoritmos de búsqueda de árbol para procesar la información.
    ◦ UI: La interfaz debe mostrar visualmente la jerarquía de árbol en lugar de campos desplegables fijos.
    ◦ Performance: Se utilizan condiciones de filtrado "Where" dinámicas basadas en las claves de los nodos seleccionados para generar reportes en tiempo real.
• Riesgos o puntos no resueltos: No se detalla cómo se gestionará la visualización en la UI si el árbol se vuelve demasiado profundo o extenso para la pantalla.
--------------------------------------------------------------------------------
2. Personalización de Etiquetas (Etiquetado del Cliente)
• Qué era antes (estado actual): Los niveles tenían nombres predefinidos por el sistema (Región, Zona, Equipo).
• Qué se propone ahora (nuevo comportamiento): Capacidad de modificar las etiquetas para que el sistema utilice la terminología propia de cada cliente (ej. "Divisional", "Célula", "Planta").
• Motivación / problema que resuelve: Facilita que el cliente reconozca su propia estructura dentro de la plataforma y evita confusiones terminológicas.
• Impacto:
    ◦ UI: Los nombres de los filtros y encabezados de reportes deben ser dinámicos según la configuración del cliente.
    ◦ Backend: Se requiere una capa de mapeo de etiquetas por organización.
• Riesgos o puntos no resueltos: Decisión incompleta. No se especifica si habrá un límite de caracteres para estas etiquetas o cómo afectará a la consistencia de los reportes descargables en formato PDF o Excel.
--------------------------------------------------------------------------------
3. Independencia y Cruce de Estructuras (Geográfica vs. Orgánica)
• Qué era antes (estado actual): Se manejaba una única estructura jerárquica.
• Qué se propone ahora (nuevo comportamiento): Manejar dos estructuras independientes: una geográfica y otra orgánica (organizacional), permitiendo realizar cruces de información entre ambas.
• Motivación / problema que resuelve: Permite responder preguntas complejas de negocio, como saber el avance de capacitación del área de "Finanzas" (orgánico) específicamente en la región "Noreste" (geográfico).
• Impacto:
    ◦ Datos: Los usuarios deben poder estar asociados a nodos de ambas estructuras simultáneamente.
    ◦ UI: Implementación de filtros múltiples que permitan seleccionar criterios de ambas jerarquías.
• Riesgos o puntos no resueltos: Decisión incompleta. Falta información sobre el impacto en permisos; por ejemplo, si un gerente regional puede ver datos de su región pero solo de ciertas áreas orgánicas.
--------------------------------------------------------------------------------
4. Implementación de Campos Demográficos Libres
• Qué era antes (estado actual): El sistema tenía campos limitados para clasificar a los usuarios.
• Qué se propone ahora (nuevo comportamiento): Incorporar entre 16 y 28 campos demográficos libres que funcionen como etiquetas configurables (ej. edad, antigüedad, nivel de puesto, sindicalizado).
• Motivación / problema que resuelve: Cada empresa tiene su propia "llave" de análisis y necesita realizar "cortes" de información que no siempre son jerárquicos, sino basados en atributos del personal.
• Impacto:
    ◦ Backend/Datos: Requiere una estructura de datos flexible (posiblemente tablas de atributos llave-valor) para almacenar estos campos variables.
    ◦ UI: Los filtros de búsqueda deben autogenerarse basados en los campos activos del cliente.
• Riesgos o puntos no resueltos: Posible impacto en la performance al realizar filtrados complejos sobre miles de registros con múltiples etiquetas dinámicas.
--------------------------------------------------------------------------------
Resumen de Información Faltante
Para considerar estas decisiones como completas desde una perspectiva técnica de desarrollo, faltarían los siguientes datos:
1. Permisos: No se menciona cómo la nueva estructura de árbol afecta la herencia de permisos (ej. si doy permiso en un nodo padre, ¿se propaga automáticamente a los hijos?) [Información no disponible en las fuentes].
2. Interfaz de Configuración: No se detalla si el cliente podrá configurar su propio árbol mediante una interfaz "drag-and-drop" o si será una carga masiva vía archivo (aunque se mencionan "plantillas" y "subir archivos", no hay especificidad técnica).
3. Límites de Escalabilidad: Se menciona que más de 4 niveles es una "barbaridad" o "jalada", pero técnicamente el nuevo modelo de nodos permite niveles infinitos; no se define un límite de software.


Basado en las transcripciones de las reuniones proporcionadas, se presenta la lista priorizada de requerimientos para la flexibilización de la plataforma y su integración con inteligencia artificial.
--------------------------------------------------------------------------------
A) Requerimientos Funcionales (RF)
RF-1: Implementación de Estructura Jerárquica de Árbol Dinámico
• Enunciado: El sistema debe permitir la creación de estructuras organizacionales y geográficas basadas en nodos (árbol) con niveles ilimitados, reemplazando la estructura rígida de tres niveles.
• Criterios de aceptación:
    ◦ Escenario 1: Crear niveles profundos.
        ▪ Given: Que el administrador está en el módulo de configuración organizacional.
        ▪ When: Crea una jerarquía que incluye División > Región > Subregión > Zona > Sucursal.
        ▪ Then: El sistema debe guardar la relación de parentesco de cada nodo y permitir la visualización correcta de los 5 niveles en la interfaz de árbol.
    ◦ Escenario 2: Consulta de reportes por nodo.
        ▪ Given: Que existen usuarios asignados a diferentes sub-nodos.
        ▪ When: El administrador selecciona un nodo "Padre" para generar un reporte de avance.
        ▪ Then: El sistema debe aplicar un algoritmo de búsqueda recursiva para incluir a todos los usuarios de los nodos "hijos" en el reporte final.
• Datos involucrados: Nodos (Clave, Título, Clave del Padre/ParentKey), Usuarios.
• Dependencias: Cambio estructural en el modelo de datos (tablas de nodos), API de búsqueda recursiva de árbol, UI de visualización jerárquica.
RF-2: Cruce de Estructuras Independientes (Geográfica vs. Orgánica)
• Enunciado: El sistema debe permitir asociar a un usuario a dos estructuras jerárquicas distintas (geográfica y orgánica) para realizar cruces de información en reportes.
• Criterios de aceptación:
    ◦ Escenario 1: Asignación dual.
        ▪ Given: Un nuevo colaborador ingresa a la empresa.
        ▪ When: Se le asigna a la región "Noreste" (geográfica) y al área de "Finanzas" (orgánica).
        ▪ Then: El perfil del usuario debe reflejar ambas pertenencias sin conflicto.
    ◦ Escenario 2: Reporte de cruce de información.
        ▪ Given: Un administrador necesita datos específicos de un segmento.
        ▪ When: Filtra el avance de capacitación de "Cajeros Tipo B" (orgánico) dentro de la "División Centro" (geográfico).
        ▪ Then: El sistema debe mostrar solo a los usuarios que cumplan ambas condiciones simultáneamente.
• Datos involucrados: Estructura Geográfica, Estructura Orgánica, Usuario.
• Dependencias: Modelo de datos (relaciones múltiples para el usuario), UI de filtros de reportes con selección múltiple.
RF-3: Personalización de Etiquetas de Niveles (White Label)
• Enunciado: El administrador del cliente debe poder renombrar las etiquetas de los niveles de la estructura para que coincidan con su terminología interna.
• Criterios de aceptación:
    ◦ Escenario 1: Renombrado de niveles.
        ▪ Given: Un cliente que utiliza el término "Células" en lugar de "Equipos".
        ▪ When: Cambia la etiqueta global en la configuración de branding.
        ▪ Then: Todos los encabezados, filtros y reportes de la plataforma deben mostrar el término "Células".
    ◦ Escenario 2: Consistencia en la UI.
        ▪ Given: Que se han personalizado las etiquetas para un cliente específico.
        ▪ When: Un usuario final navega por la plataforma.
        ▪ Then: No debe aparecer ninguna referencia a los nombres de niveles "por defecto" (Región/Zona).
• Datos involucrados: Configuración de Branding (Labels de niveles), Organización.
• Dependencias: Backend (mapeo dinámico de etiquetas), UI dinámica que consuma las etiquetas configuradas.
RF-4: Gestión de Campos Demográficos Libres
• Enunciado: El sistema debe ofrecer entre 16 y 28 campos demográficos configurables para segmentar a los usuarios según necesidades específicas del cliente (ej. edad, sindicalizado, antigüedad).
• Criterios de aceptación:
    ◦ Escenario 1: Configuración de campos.
        ▪ Given: Que el cliente requiere segmentar por "Personal Sindicalizado".
        ▪ When: Habilita uno de los campos libres y le asigna el nombre respectivo.
        ▪ Then: El campo debe estar disponible para carga masiva y filtros de búsqueda.
    ◦ Escenario 2: Filtrado por demográfico en reportes.
        ▪ Given: Que los usuarios tienen cargada su "Antigüedad" en un campo libre.
        ▪ When: Se genera un reporte filtrando a usuarios con "> 5 años".
        ▪ Then: El sistema debe segmentar la muestra basándose exclusivamente en ese valor demográfico.
• Datos involucrados: Usuario, Campos Demográficos (1-28).
• Dependencias: Modelo de datos flexible (EAV o columnas dinámicas), API de filtrado dinámico.
RF-5: Interacción con Asistente de IA (Lía) en Cursos
• Enunciado: El sistema debe integrar a la asistente "Lía" para guiar al usuario en el aprendizaje, responder dudas del contenido y facilitar la realización de actividades prácticas.
• Criterios de aceptación:
    ◦ Escenario 1: Consulta de contenido.
        ▪ Given: Un usuario está viendo una lección de "IA Invisible".
        ▪ When: Le pregunta a Lía: "¿En qué parte del video se habla de los algoritmos de recomendación?".
        ▪ Then: Lía debe identificar el punto exacto basándose en la transcripción del video y responder al usuario.
    ◦ Escenario 2: Retroalimentación de actividades.
        ▪ Given: El usuario completa una actividad práctica con la IA.
        ▪ When: Envía su respuesta a la instrucción de Lía.
        ▪ Then: Lía debe evaluar la respuesta basándose en el perfil profesional del usuario (rol) y proporcionar retroalimentación personalizada.
• Datos involucrados: Transcripciones de video, Resúmenes de lecciones, Perfil de Usuario (Rol/Nombre), Chat History.
• Dependencias: Integración con API de LLM, Motor de búsqueda semántica (RAG), UI de Chat lateral en el módulo de cursos.
--------------------------------------------------------------------------------
B) Requerimientos No Funcionales (RNF)
1. RNF-1: Responsividad de la Interfaz (Mobile First): La plataforma debe ser accesible y funcional desde dispositivos móviles (celulares y tablets), asegurando que los cursos y encuestas se visualicen correctamente sin necesidad de una App nativa inicial.
    ◦ Métrica/Umbral: Diseño 100% responsive (Web Mobile) verificado en navegadores Chrome y Safari móviles.
2. RNF-2: Escalabilidad de la Estructura de Datos: El sistema debe ser capaz de procesar estructuras de hasta 100,000 usuarios distribuidos en múltiples niveles de árbol sin degradar el tiempo de respuesta de los filtros.
    ◦ Métrica/Umbral: No especificado (Se menciona como crítico para "clientes grandes" como FEMSA o Coppel).
3. RNF-3: Rendimiento en Generación de Contenido por IA: El proceso de generación de bases, temarios y planes instruccionales mediante IA debe realizarse de manera significativamente más rápida que el método manual.
    ◦ Métrica/Umbral: Reducción del tiempo de creación de un curso de 1 mes a menos de 1 semana.
4. RNF-4: Veracidad de las Respuestas de la IA (Control de Alucinaciones): El asistente de IA debe limitar sus respuestas a fuentes validadas y al contexto de la organización para evitar inventar información.
    ◦ Métrica/Umbral: El sistema debe permitir una etapa de validación humana (QA) antes de que las recomendaciones de la IA se integren en reportes finales.
5. RNF-5: Disponibilidad de Asistencia 24/7: El asistente virtual debe estar disponible en todo momento para actuar como tutor o guía de navegación sin intervención humana.
    ◦ Métrica/Umbral: No especificado (Se asume disponibilidad continua por ser un servicio automatizado).


Basado en los documentos proporcionados, "hacerlo más flexible" significa que el sistema debe dejar de estar atado a una configuración rígida y predefinida para adaptarse a la terminología, estructura y necesidades de reporte específicas de cada organización. Según Ernesto Hernández, implica que la plataforma no establezca niveles fijos, sino que sea "abierta y configurable" para que el cliente decida cómo organizar sus grupos.
A continuación, se clasifica esta flexibilidad según la taxonomía solicitada:
Estructura jerárquica
• Cambio propuesto: Transición de un modelo rígido de tres niveles (Región, Zona, Equipo) a uno de nodos o árboles dinámicos. Esto permite representar estructuras complejas de empresas grandes como BBVA o FEMSA, que incluyen divisiones, regiones y subregiones geográficas.
• Supuestos: Cada nodo de la estructura se define mediante una clave, un título y una referencia a su "padre" (ParentKey).
• Lo que NO está definido: Si existe un límite técnico real para la profundidad del árbol, aunque los participantes sugieren que más de cuatro niveles es "una barbaridad" o "una jalada" por su complejidad administrativa.
Configurabilidad
• Cambio propuesto: Capacidad de modificar las etiquetas para que el cliente use sus propios nombres (ej. cambiar "Equipos" por "Células"). Además, se proponen entre 16 y 28 campos demográficos libres (como edad, antigüedad o nivel de puesto) para que cada empresa realice sus propios "cortes" de información. La IA (Lía) también personaliza el contenido basándose en el perfil y rol profesional del usuario.
• Supuestos: El sistema de "branding" permite cargar logos y paletas de colores específicas por empresa para que parezca una plataforma propia (caja blanca).
• Lo que NO está definido: Cómo se gestionará la validación de datos en esos campos demográficos libres para asegurar la consistencia en los reportes [Información no disponible en las fuentes].
Reglas de pertenencia
• Cambio propuesto: Permitir que un usuario pertenezca simultáneamente a dos estructuras independientes: una división geográfica (ej. Norte) y una estructura orgánica (ej. Finanzas o área comercial).
• Supuestos: Un colaborador puede ser filtrado por su ubicación física y su función laboral al mismo tiempo para reportes de avance (ej. "cajeros tipo B en la división centro").
• Lo que NO está definido: Si un mismo usuario puede estar asignado a múltiples nodos dentro de la misma jerarquía (por ejemplo, pertenecer a dos zonas geográficas distintas al mismo tiempo).
Filtros/visualización
• Cambio propuesto: Implementación de visualizaciones en formato de árbol para la estructura organizacional y el uso de filtros dinámicos que se autogeneran según los niveles definidos por el cliente. Los reportes se generan en tiempo real aplicando condiciones de filtrado basadas en los nodos seleccionados.
• Supuestos: El sistema utiliza algoritmos de búsqueda recursiva para procesar la información de los nodos hijos cuando se selecciona un nodo padre.
• Lo que NO está definido: No se detalla cómo se resolverá visualmente la UI si el árbol jerárquico es masivo (miles de nodos) para mantener la usabilidad.
Permisos/visibilidad
• Cambio propuesto: El acceso a la información y la interacción con la IA están condicionados por los permisos del usuario y su rol dentro de la organización. Se menciona la necesidad de anonimizar nombres en ciertos reportes sensibles (como atención clínica) por confidencialidad.
• Supuestos: Un administrador puede emitir reportes basados en la estructura que él mismo configuró.
• Lo que NO está definido: No hay detalle sobre si los permisos se heredan automáticamente de los nodos padres a los hijos en la nueva estructura de árbol.
Escalabilidad
• Cambio propuesto: El sistema debe ser capaz de manejar organizaciones con más de 100,000 empleados, como el caso de Oxxo o FEMSA. Se menciona que el uso de estructuras de árbol es la solución para mantener esta flexibilidad sin comprometer la rentabilidad del desarrollo.
• Supuestos: Los procesos de cálculo y filtrado son lo suficientemente eficientes para arrojar resultados inmediatos incluso con muestras grandes de datos.
• Lo que NO está definido: No se menciona el uso de técnicas como lazy-loading para la carga de nodos en la interfaz, ni tiempos de respuesta específicos para bases de datos de gran escala [Información no disponible en las fuentes].


Basado en las transcripciones de las reuniones, se deriva el siguiente modelo conceptual y reglas de negocio para soportar la transición hacia una plataforma flexible y dinámica.
1. Modelo Conceptual (Entidades y Relaciones)
Entidad
Descripción
Campos Clave mencionados
Estado
Organización (Cliente)
Empresa que adquiere la plataforma y define su propia estructura.
ID, Nombre, Configuración de Branding (Logo, Colores).
Explícito
Nodo (Estructura)
Elemento base de la jerarquía que reemplaza los niveles fijos (Región, Zona, Equipo).
Clave (ID), Título, ParentKey (ID del padre).
Explícito
Tipo de Estructura
Clasificación para separar las jerarquías (Geográfica vs. Orgánica).
ID, Nombre (Geográfica, Orgánica).
Explícito
Usuario
Persona que pertenece a la organización y se capacita.
ID, Nombre, Apellido, Rol profesional.
Explícito
Campo Demográfico
Campos libres (16 a 28) para segmentación adicional (edad, antigüedad, etc.).
ID del campo, Nombre/Etiqueta del campo, Valor.
Explícito
Instrumento (Evaluación)
Encuesta o cuestionario ligado a personas o áreas.
ID, Título, Tipo de vinculación (Persona/Área/Contrato).
Explícito
Curso / Lección
Contenido educativo con videos y actividades.
ID, Título, Transcripción, Resumen (IA).
Explícito
Relaciones y Cardinalidades
• Organización a Nodo (1:N): Una organización puede tener múltiples nodos para definir su jerarquía. (Explícito)
• Nodo a Nodo (1:N - Recursiva): Un nodo "padre" puede tener múltiples nodos "hijos", permitiendo niveles ilimitados. (Explícito)
• Usuario a Nodo (N:N): Un usuario puede pertenecer simultáneamente a un nodo de la estructura geográfica y a otro de la estructura orgánica. (Inferido)
• Usuario a Campo Demográfico (1:N): Cada usuario tiene asociados múltiples valores en los campos demográficos libres. (Explícito)
• Instrumento a Usuario/Nodo (N:N): Las evaluaciones se pueden aplicar a personas individuales o a áreas completas (nodos). (Explícito)
--------------------------------------------------------------------------------
2. Reglas de Negocio
1. Estructura Jerárquica Dinámica: La jerarquía no debe tener niveles fijos; se debe construir mediante una relación de "nodos" y "claves de padre" (ParentKey). (Explícito)
2. Independencia de Dimensiones: El sistema debe soportar al menos dos estructuras independientes (Geográfica y Orgánica) para permitir cruces de información. (Explícito)
3. Etiquetado Personalizado (White Label): Los nombres de los niveles (ej. "División", "Célula") deben ser configurables por el cliente para que la interfaz sea reconocible. (Explícito)
4. Cruce de Información en Reportes: El sistema debe permitir filtrar datos combinando nodos de ambas estructuras (ej. "Finanzas" + "Noreste") mediante operadores lógicos (AND/OR). (Explícito)
5. Límite de Profundidad Sugerido: Aunque el modelo permite niveles infinitos, se recomienda no exceder los 4 niveles para evitar complejidad excesiva en la administración. (Inferido)
6. Personalización por Rol: La asistente de IA (Lía) debe adaptar su lenguaje y ejemplos basándose en el "Perfil Profesional" o "Rol" del usuario (ej. Director vs. Operativo). (Explícito)
7. Validación de Respuestas de IA (QA): Las recomendaciones generadas por la IA no deben entregarse al cliente final sin una revisión previa por parte de un consultor humano para evitar alucinaciones. (Explícito)
8. Vinculación Flexible de Instrumentos: Los instrumentos de evaluación pueden ligarse a personas, áreas (nodos) o contratos, dependiendo de la necesidad del diagnóstico. (Explícito)
9. Persistencia de Contexto: El asistente de IA debe recordar el historial de conversación y el contexto de la organización del usuario para ofrecer respuestas acertadas. (Explícito)
10. Unicidad de Claves: Cada nodo en la estructura debe tener una clave única para permitir el correcto funcionamiento de los algoritmos de búsqueda de árbol. (Inferido)
11. Herencia de Permisos: No se especifica si al dar permiso en un nodo padre este se propaga automáticamente a los nodos hijos. (No definido)
12. Movimientos en el Árbol: No se detalla el comportamiento del sistema cuando un nodo con hijos es movido a otra rama del árbol (reestructuración). (No definido)
13. Orden de Visualización: No se menciona si los nodos tienen un campo de "orden" específico para su despliegue en la UI (alfabético vs. manual). (No definido)



Basado en las transcripciones de las reuniones, se han detectado inconsistencias críticas entre la visión técnica actual y las necesidades de negocio planteadas, así como riesgos legales y operativos significativos.
A continuación, se presenta el análisis de ambigüedades, contradicciones y el listado priorizado de preguntas.
Ambigüedades y Contradicciones Detectadas
1. Estructura Jerárquica (Rígida vs. Árbol): Existe una contradicción clara. Ernesto menciona que su sistema tiene 3 niveles fijos (Región, Zona, Equipo) y que más de 4 es una "barbaridad". Sin embargo, Adrián Lago explica que para clientes grandes (FEMSA, Coppel) la única solución viable es una estructura de árbol (nodos) ilimitada. Ernesto admite que debe "checar cómo hacerlo flexible".
2. Conflicto de Marca (Sofía): Ambas plataformas utilizan el nombre "Sofía" para su IA. Cynthia advierte sobre posibles problemas legales de derechos de autor con otras plataformas existentes.
3. Estrategia de Producto (Litmos vs. Sofía): Ernesto sugiere usar Litmos para clientes grandes como Oxxo porque su plataforma no está lista, pero Adrián Plata insiste en que necesitan su propia plataforma con IA para ser competitivos.
4. Mobile vs. Web: Ernesto sostiene que la tendencia es Web Responsive y que las Apps son para seguimiento mínimo. Adrián Plata contradice esto afirmando que el mercado pide Mobile First, especialmente para trabajadores que no están frente a una PC (como instaladores de cable).
5. Validación de IA (Alucinaciones): Ernesto pregunta si hay un modelo de "QA" para evitar que la IA invente datos. Adrián Lago admite que no tienen modelos adversarios y que la responsabilidad recae totalmente en el consultor humano.
--------------------------------------------------------------------------------
Top 15 Preguntas Priorizadas por Riesgo/Impacto
#
Pregunta
Riesgo
Decisión que desbloquea
Rol Responsable
Pruebas de Validación
1
¿Se migrará el modelo de datos de 3 niveles fijos a una estructura de árbol (nodos) dinámica?
Alto
Arquitectura de base de datos y capacidad de vender a empresas grandes.
Fernando (Dev) / Ernesto
Carga masiva de 100k usuarios con 6+ niveles de profundidad.
2
¿Cómo se controlarán automáticamente las alucinaciones de la IA sin depender 100% de un humano?
Alto
Fiabilidad del producto y escalabilidad de la consultoría.
Fernando (AI)
Test ciego de respuestas de IA vs. datos reales de la base de datos.
3
¿Se desarrollará una App Nativa o solo Web Responsive para el usuario final?
Alto
Estrategia de usabilidad y alcance a trabajadores de campo.
Adrián Plata / Ernesto
Prueba de usabilidad en transporte público/zonas de baja señal.
4
¿Qué nombre se registrará legalmente para evitar conflictos de marca?
Alto
Lanzamiento comercial y branding.
Ernesto / Legal
Búsqueda fonética y registro en el IMPI.
5
¿Quién proporcionará y costeará las 5-6 personas para edición de videos de cursos?
Medio
Capacidad de generar los 20 cursos necesarios para el lanzamiento.
Adrián Plata
Cronograma de producción: 1 curso completo por semana.
6
¿Se integrará un modelo adversario para el QA de la IA de forma nativa?
Medio
Automatización de la confianza en las respuestas de "Lía".
Fernando (AI)
Implementación de un agente que critique la respuesta de Lía antes de mostrarla.
7
¿El sistema permitirá que un usuario pertenezca a dos nodos de estructuras distintas (Geográfica y Orgánica)?
Medio
Reportes cruzados (ej: "Finanzas" de "Norte").
Fernando (Dev)
Query de base de datos que cruce IDs de dos árboles distintos.
8
¿Cómo se resolverá la baja calidad estética de los cursos importados vía Scorm?
Medio
Compatibilidad con contenidos previos de los clientes.
Fernando (Dev)
Prueba de carga de archivo Scorm y revisión de UI.
9
¿Se implementará el reconocimiento de voz a texto en el módulo de seguimiento?
Bajo
Facilidad de uso para usuarios que no pueden escribir (en camión/calle).
Fernando (Dev)
Prueba de dictado en ambiente con ruido ambiental.
10
¿El cliente tendrá un editor "Drag & Drop" para configurar su jerarquía?
Bajo
Autogestión del cliente (Self-service).
Fernando (Dev)
Test de configuración de árbol por un usuario no técnico.
11
¿Cuál será la política de "Caja Blanca" para sub-consultores?
Bajo
Modelo de negocio de maquila.
Ernesto
Demo de cambio de logos y colores en < 5 minutos.
12
¿Se anonimizarán los datos de atención clínica por confidencialidad?
Medio
Cumplimiento legal de datos sensibles.
Adrián Lago
Auditoría de vista de administrador en el módulo de salud.
13
¿Cómo se calculará el ROI de la IA en la creación de contenidos?
Bajo
Argumento de venta para clientes.
Adrián Plata
Comparativa de horas/hombre: Manual vs. Generador de IA.
14
¿Qué pasará con el historial de Lía si el usuario cambia de rol o empresa?
Bajo
Persistencia y contexto de aprendizaje.
Fernando (Dev)
Migración de perfil de usuario entre nodos.
15
¿Se utilizarán fuentes externas (Google Search) o solo base de datos curada?
Bajo
Calidad y veracidad del contenido pedagógico.
Fernando (AI)
Test de "fuentes prohibidas" (Wikipedia/YouTube).
--------------------------------------------------------------------------------
Plan Mínimo de Validación Sugerido
1. Demo / UX Review (Semana 1):
    ◦ Presentar a Adrián Plata una versión Web Mobile de la plataforma para validar si cumple con la "usabilidad en el camión" que él exige.
    ◦ Probar el flujo de personalización de etiquetas de la jerarquía (renombrar "Equipos" a "Células").
2. QA Técnico (Semana 2):
    ◦ Prueba de Estrés Jerárquico: Cargar una estructura tipo "FEMSA" con 100,000 usuarios y 5 niveles para validar que los filtros de reportes no se rompan.
    ◦ Hallucination Test: Ejecutar 50 preguntas complejas sobre la NOM-035 y comparar la respuesta de la IA contra el estándar legal.
3. Migración de Datos (Semana 3):
    ◦ Si se decide cambiar de "niveles fijos" a "árbol de nodos", mapear la base de datos actual de Sofía al nuevo modelo de ParentKey.
4. Rollout Controlado (Semana 4):
    ◦ Lanzamiento con una "empresa chiquita" (propuesto por Ernesto) para probar el módulo de transformación conductual y el seguimiento vía IA.
    ◦ Monitorear la tasa de completación de cursos, que fue un problema detectado previamente.