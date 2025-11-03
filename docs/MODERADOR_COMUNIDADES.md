Filtrado de Contenido Ofensivo en Posts y Comentarios

Antes que nada, se debe implementar un filtro de contenido inapropiado para interceptar textos con insultos, lenguaje racista, estafas u otras malas palabras. Actualmente, la API que crea posts solo valida que el contenido no esté vacío
GitHub
 y luego guarda el texto tal cual en la base de datos
GitHub
, sin filtrar lenguaje ofensivo. De igual forma, la API de comentarios verifica que haya contenido y que no exceda cierto tamaño, pero no chequea palabras prohibidas
GitHub
. Para resolver esto:

Definir una lista de palabras prohibidas: Crear un listado (en español y otros idiomas relevantes) de insultos, términos racistas, lenguaje vulgar y frases asociadas a estafas. Esta lista podría ubicarse en un archivo de configuración o en la base de datos para fácil mantenimiento.

Función de detección: Implementar una función utilitaria (por ejemplo, containsForbiddenContent(texto: string): boolean) que revise el contenido del post o comentario buscando las palabras/frases prohibidas. Puede usar comparaciones case-insensitive y considerar variaciones (e.g. tildes o mayúsculas) para no dejar brechas.

Herramientas adicionales (opcional): Considerar usar una librería de filtrado de texto o un servicio de moderación de contenido para detectar lenguaje ofensivo y spam. Esto podría mejorar la detección de frases ofensivas complejas o nuevas formas de evadir filtros, aunque inicialmente un enfoque con lista de palabras puede ser suficiente.

Integración del Filtro en las Rutas de API de Comunidades

Una vez definido el filtro, hay que integrarlo en el backend para bloquear contenido ofensivo al momento de crear publicaciones o comentarios. En la rama develop del repositorio, las rutas Next.js API relevantes son:

Ruta de creación de posts: apps/web/src/app/api/communities/[slug]/posts/route.ts. Después de verificar que el contenido no esté vacío
GitHub
, agregar una validación adicional: si containsForbiddenContent(content) es true, responder con un error 400 y un mensaje claro (por ejemplo: "El contenido contiene lenguaje inapropiado, se ha bloqueado tu publicación"). De este modo, se evita insertar ese post en la tabla community_posts. Actualmente, la inserción ocurre inmediatamente tras las validaciones básicas
GitHub
; allí debe intercalarse el nuevo filtro antes del .insert(...).

Ruta de creación de comentarios: apps/web/src/app/api/communities/[slug]/posts/[postId]/comments/route.ts. Análogamente, tras las comprobaciones de longitud y contenido no vacío
GitHub
, incorporar la misma verificación. Si el comentario incluye texto prohibido, retornar un error (400) con mensaje indicando que el contenido es inapropiado y fue rechazado.

Evitar falsos positivos: En estas validaciones, es importante asegurarse de que el filtro no bloquee por error palabras inocentes que contengan partes de palabras prohibidas. Por ejemplo, si "sexo" es palabra prohibida, no bloquear "contexto". El uso de delimitadores (espacios, puntuación) o regex bien diseñados ayudará en este aspecto.

Integrando estas comprobaciones en el backend, ningún post o comentario ofensivo llegará a persistirse en la base de datos.

Sistema de Advertencias Graduales por Usuario

Con el filtro en marcha, se debe implementar un sistema de advertencias que lleve el control de reincidencias por parte de cada usuario. La idea es permitir hasta 3 infracciones con advertencia, y a la cuarta proceder a un banneo definitivo. Para lograrlo:

Registrar las infracciones en la base de datos: Crear una nueva tabla (ej. user_warnings) con campos como user_id, timestamp (fecha de la infracción) y reason (motivo, p. ej. "Lenguaje inapropiado"). Cada vez que un usuario intente publicar contenido prohibido, se inserta un registro en esta tabla con su ID. Alternativamente, se puede añadir un campo acumulador warnings_count en la tabla de usuarios, pero la tabla separada permite histórico de incidencias.

Incrementar advertencia al bloquear contenido: En las rutas API de creación (posts/comments), cuando se detecte contenido ofensivo, además de retornar el error se debe guardar la advertencia. Por ejemplo, tras detectar containsForbiddenContent, realizar algo como:

await supabase.from('user_warnings').insert({ 
    user_id: user.id, 
    reason: 'contenido_ofensivo' 
});


De esta forma queda constancia de la infracción.

Contar advertencias actuales: Después de registrar la nueva advertencia, consultar cuántas advertencias activas tiene ese usuario. Esto puede hacerse con un SELECT count(*) de user_warnings filtrado por user_id (y quizá un período de tiempo si las advertencias expiran, aunque no se indicó, asumiremos que son acumulativas sin expirar). Si la cantidad de advertencias del usuario < 4, entonces el flujo sigue normal (el post se bloqueó pero el usuario aún no está baneado, solo se le informa de la advertencia).

En esencia, las primeras, segunda y tercera infracciones se manejarán solo como advertencias registradas, permitiendo al usuario continuar usando la plataforma (sin publicar ese contenido bloqueado).

Baneo Automático en la Cuarta Infracción

Cuando el mismo usuario acumule 3 advertencias previas y vuelve a intentar publicar contenido prohibido por cuarta vez, el sistema debe banear al usuario automáticamente, tal como se solicita. El plan para implementar esto es:

Detección de la cuarta infracción: En el paso anterior, tras insertar la nueva advertencia, si el conteo de advertencias del usuario alcanza 4 (o más), significa que se ha sobrepasado el límite de 3. En ese momento, en lugar de solo retornar un error, se debe marcar al usuario como baneado.

Marcar usuario como baneado: Una forma clara es añadir un campo booleano is_banned en la tabla de usuarios (si aún no existe) para indicar esta condición. Al detectar la cuarta infracción, ejecutar una actualización:

await supabase.from('users')
  .update({ is_banned: true })
  .eq('id', user.id);


Esto persistirá el estado de baneado del usuario en la base de datos. A partir de ese momento, ese usuario ya no debería poder usar las funcionalidades del sistema.

Invalidar sesión actual: Idealmente, tras banear, se debería invalidar cualquier sesión activa del usuario. Dado que el proyecto usa un sistema de sesiones personalizado con cookies (tabla user_session y SessionService)
GitHub
GitHub
, se puede marcar sus sesiones como revoked o borrarlas. Por ejemplo, llamar a SessionService.destroySession() para ese usuario en ese contexto, o hacer un update en user_session donde user_id = user.id estableciendo revoked: true. Esto forzará a que el usuario quede deslogueado inmediatamente tras ser baneado.

Prevención de nuevos ingresos: También habrá que actualizar la lógica de autenticación para que un usuario baneado no pueda volver a iniciar sesión. Por ejemplo, en SessionService.getCurrentUser o durante el login, verificar is_banned y en caso true, impedir el login (retornando error "Usuario baneado"). De esta manera el baneo es efectivo en todo el sistema.

El baneo debe ocurrir automáticamente una vez el usuario alcanza la cuarta incidencia, sin intervención manual, cumpliendo con la directiva de la pregunta. A partir de entonces, ese usuario queda bloqueado del sistema (no podrá crear posts, comentarios, ni posiblemente autenticarse).

Notificación y Experiencia para el Usuario

Es importante mantener al usuario informado sobre estas medidas disciplinarias:

Mensajes en la interfaz: Cuando el backend retorne un error por contenido inapropiado, incluir en el mensaje la información de la advertencia. Por ejemplo: "Contenido inapropiado detectado. Esta es tu advertencia 2/3." Esto se puede enviar en el campo error del JSON de respuesta. El frontend ya muestra los mensajes de error devueltos por la API (usa alert() con el texto de error de la respuesta
GitHub
), por lo que el usuario verá el aviso junto con el conteo de advertencias.

Última advertencia clara: Al tercer incidente, el mensaje debe indicar que es la última advertencia (e.g. "Advertencia 3/3: Una infracción más resultará en banneo."). Esto dejará claro al usuario que no habrá más tolerancia.

Mensaje de banneo: Si el usuario intenta la cuarta vez y es baneado, la respuesta del servidor podría ser un código 403 Forbidden con un mensaje como "Has sido baneado del sistema por reiteradas violaciones de las reglas." El frontend mostrará ese mensaje en un alert, y seguidamente podría redirigir al usuario fuera de la sección comunitaria o al inicio de sesión. Como medida adicional, tras el banneo automático se puede forzar un logout (por ejemplo, borrando la cookie de sesión), de modo que cualquier nueva acción requiera iniciar sesión y en ese punto se le negará acceso por estar baneado.

Comunicación opcional: Considerar enviar un correo electrónico automático al usuario baneado explicando la razón del ban y el historial de advertencias, si el sistema de email está habilitado. Esto sirve como constancia y puede disminuir consultas al soporte.

Resumen de Cambios Técnicos

Filtro de texto prohibido: implementar utilidades y listas para identificar contenido ofensivo en texto de posts/comentarios.

Validaciones en API: modificar las rutas Next.js API de creación de posts y comentarios para usar el filtro antes de grabar datos (retornando error 400 si se detecta contenido prohibido)
GitHub
GitHub
.

Registro de advertencias: crear mecanismo de persistencia (tabla user_warnings o campo en users) y lógica en backend para sumar una advertencia cada vez que se bloquea un post/comentario por lenguaje inapropiado.

Contador y lógica de ban: después de agregar una advertencia, contabilizar las del usuario y, si alcanza 4, marcar is_banned=true para ese usuario en la base de datos y terminar sus sesiones activas.

Ajustes en autenticación: asegurar que is_banned se verifique en el flujo de login/sesión (por ejemplo, en SessionService.getCurrentUser) para bloquear acceso a usuarios baneados.

Feedback al usuario: mejorar los mensajes de error enviados por las APIs para indicar advertencias y ban, y ajustar el frontend para presentar esos mensajes claramente (usando los mecanismos de alerta ya existentes
GitHub
).