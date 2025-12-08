BUG #2 - ALTO: Carga Lenta en "Talleres" [/admin/workshops]
Problema: Muestra placeholders vacíos durante ~2 segundos antes de renderizar contenido
Severidad: Alta
BUG #3 - ALTO: Carga Lenta en "Noticias" [/admin/news]
Problema: Carga con placeholders ~3 segundos sin mostrar encabezado ni botones inicialmente
Severidad: Alta
BUG #4 - ALTO: Carga Incompleta en "LIA Analytics" [/admin/lia-analytics]
Problema: Tarda ~3 segundos en cargar gráficos y datos
Severidad: Media-Alta
BUG #5 - MEDIO: Carga Lenta en "Reportes" [/admin/reportes]
Problema: Tarda ~4 segundos con mensaje "Cargando reportes..."
Severidad: Media
BUGS FUNCIONALES (Encontrados mediante interacción):BUG #6 - MEDIO: Falta de Mensaje "Sin Resultados" en Búsquedas
Ubicación: Página de Usuarios - Campo de búsqueda
Problema: Al buscar texto que no existe (ej: "XXXXXXXXXX"), la tabla desaparece pero NO muestra mensaje como "Sin resultados encontrados"
Impacto: Usuario confundido sobre si la búsqueda funcionó o si hay un error
Severidad: Media
BUG #7 - MEDIO: Filtro de Roles NO responde a clics directos
Ubicación: Página de Usuarios - Dropdown "Todos los roles"
Problema: Al hacer clic en opciones del dropdown (ej: "Instructor"), el filtro NO se aplica automáticamente. Solo funciona si se usa form_input (selección mediante programa)
Impacto: El usuario debe intentar múltiples veces o el filtro parece no funcionar
Severidad: Media (pero afecta la experiencia del usuario)
BUG #8 - MEDIO: Validación de Campos Requeridos Poco Visible
Ubicación: Modal "Editar Taller" - Campo "Título"
Problema: Al dejar el campo Título vacío y hacer clic en "Guardar Cambios", aparece un tooltip muy pequeño que dice "Completa este campo". El mensaje es difícil de ver y poco prominente
Impacto: Validación deficiente que confunde al usuario
Severidad: Media (Afecta UX pero el formulario se valida)
RESUMEN
Bugs Críticos: 1 (Estadísticas de Usuarios no carga)
Bugs Altos: 4 (Cargas lentas y UX pobre)
Bugs Medios: 3 (Validaciones, filtros, mensajes)
Total: 8 bugs encontrados


BUGS FUNCIONALES CRÍTICOS:
BUG #5 - CRÍTICO: Página "Crear Nuevo Curso" retorna 404
URL: /instructor/courses/new

Problema: La página no existe o no está disponible. El botón "Crear Nuevo Curso" lleva a un error 404

Impacto: El instructor NO puede crear nuevos cursos - funcionalidad crítica bloqueada

Severidad: CRÍTICO

BUGS DE INTERFAZ/NAVEGACIÓN:
BUG #6 - MEDIO: Menú Lateral con Problemas de Navegación
Ubicación: Menú lateral del panel de instructor

Problema:

El ícono del menú se comporta como toggle (abre/cierra) en lugar de navegar directamente

El texto se trunca cuando el menú está colapsado (muestra "T...s" en lugar de "Talleres")

Los usuarios deben hacer clic dos veces o en el texto específicamente para navegar

Severidad: Media

BUG #7 - BAJO: Interfaz del Menú Confusa
Problema: El menú tiene dos estados (expandido/colapsado) pero los usuarios podrían no entender que necesitan hacer clic en el texto específicamente para navegar

Severidad: Baja