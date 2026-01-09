# Actualización de Propuesta de

Implementación – Permisos Jerárquicos por Región, Zona y Equipo (Req. 41)

## [Contexto

y Roles Actuales]()

En la plataforma actualmente existen **dos tipos de usuarios globales** :
el usuario **Administrador** (con privilegios a nivel plataforma) y el
usuario **Business** (usuarios de negocio que operan dentro de
organizaciones). **Dentro de cada organización** , la gestión de acceso se
basa en tres roles internos predeterminados: **owner**, **administrador** y **member**.

·
El **owner** de una organización es el
superusuario de esa organización: tiene control total sobre los datos y la
configuración de su empresa en la plataforma.

·
El **administrador** (rol interno de
organización) por defecto posee amplios permisos de gestión dentro de su
organización, aunque tradicionalmente limitados por ciertas restricciones (por
ejemplo, no puede eliminar al owner ni manejar configuraciones globales).

·
El **member** es el rol base de miembro de la
organización, con permisos limitados típicamente a uso básico de la plataforma
(acceso a sus propios datos o funcionalidades autorizadas, pero sin capacidad
de administración sobre otros usuarios u opciones avanzadas).

**Situación Actual:** hasta ahora la estructura de
permisos dentro de una organización es _plana_ . Esto significa que todos
los administradores y miembros operan a un mismo nivel de visibilidad dentro de
la empresa: no hay divisiones internas por región, zona o equipo que restrinjan
el alcance de los datos que cada usuario puede ver o las acciones que puede
ejecutar. La propuesta de requerimiento 41 busca modificar y ampliar este
modelo de permisos interno, aprovechando los roles existentes (owner, administrador, member) para introducir **permisos
jerárquicos por Región, Zona y Equipo** dentro de cada organización.

## [Modelo Jerárquico Opcional (Modularidad y Configuración Flexible)]()

Se propone que la funcionalidad de jerarquías de región/zona/equipo sea
**modular y configurable por cada organización** , de modo que las empresas
puedan **activarla o desactivarla según su tamaño y necesidades** :

·
**Organizaciones Pequeñas
(Estructura Plana):** Si la organización decide **no
activar la jerarquía** , el sistema mantiene la estructura tradicional plana.
En este modo, los usuarios **no necesitan ser asignados** a ninguna región,
zona o equipo específico. Todos los miembros y administradores continúan
operando con visibilidad completa sobre la información de la organización
(salvo las limitaciones propias de su rol). Esta configuración es ideal para
empresas pequeñas o equipos sencillos donde segmentar por ubicación/equipo no
es necesario.

·
**Organizaciones Grandes
(Jerarquía Activada):** Si la organización **activa el
modelo jerárquico** , se introducirán niveles internos de **Región** , **Zona**
y **Equipo** . A partir de ese momento, **será obligatorio asignar** cada
usuario (excepto el owner) a un equipo específico dentro de una zona y región.
Asimismo, **todas las nuevas entidades y datos** relevantes (por ejemplo,
registros, proyectos, clientes, etc. según la aplicación) deberán asociarse a
un equipo (y por ende a una zona y región) para respetar las restricciones
jerárquicas. Al activar esta opción, la plataforma aplicará automáticamente las
reglas de visibilidad y permisos basadas en la ubicación jerárquica del
usuario.

La posibilidad de alternar esta configuración le otorga flexibilidad al
sistema. **Cada organización puede elegir** el esquema que mejor se adapte a
su operativa, incluso cambiarlo si sus necesidades evolucionan. La **opción de
jerarquía** estará disponible en el **panel de configuración de la
organización** (accesible solo para el owner), donde se podrá activar o desactivar
el modelo jerárquico en cualquier momento.

**Nota:** Por defecto, las organizaciones
existentes comenzarán con la jerarquía **desactivada** (preservando el
comportamiento actual). Si el owner decide habilitarla, deberá completar
la configuración inicial de regiones, zonas y equipos, y asignar a cada usuario
a su posición correspondiente. En sentido inverso, si la jerarquía está activa
y se opta por desactivarla, la estructura retorna a plana (ver detalles en la
sección de _Comportamiento con Jerarquía Desactivada_ más adelante).

## [Asignación de Roles Jerárquicos y Experiencia de Usuario]()

Con la jerarquía activada, se mantienen los **tres roles internos**
(owner, administrador, member), pero sus permisos y visibilidad se
**ajustan de forma contextual** según la región/zona/equipo asignados:

- **Rol \*\***owner\***\* (Propietario de la
  organización):** No sufre restricciones
  jerárquicas. El owner mantiene **control total de la organización** sin
  importar la jerarquía. Puede ver y gestionar **todos los datos** de
  todas las regiones, zonas y equipos. Además, es el único que puede
  configurar la jerarquía misma: definir las regiones, crear zonas y
  equipos, y activar o desactivar el modelo jerárquico. En la interfaz, el
  owner dispondrá de herramientas para asignar usuarios a
  regiones/zonas/equipos y cambiar sus roles. Por ejemplo, podrá designar
  qué usuarios serán administradores o miembros de una determinada región o
  equipo. _El owner actúa como administrador global de la organización_ ,
  teniendo también la facultad de modificar la configuración en el panel de
  administración (por ejemplo, renombrar equipos, reorganizar zonas, etc.,
  si la aplicación lo permite).
- **Rol \*\***administrador\***\* (Interno de
  organización):** Con jerarquía activa, los
  administradores pasan a tener un **ámbito delimitado** :

·
Cada administrador deberá estar **asignado
a una región, zona o equipo específico** según la estructura definida. Su
visibilidad y acciones administrativas **se restringen a esa unidad jerárquica
y sus inferiores** .

·
Por ejemplo: un _administrador
regional_ asignado a la “Región Norte” podrá ver y administrar los datos de **todas
las zonas y equipos** dentro de la Región Norte, pero **no podrá acceder**
a información de la Región Sur u otras regiones. Análogamente, un _administrador
de zona_ en la “Zona Centro” (perteneciente a la Región Norte) gestionará
únicamente los equipos de esa zona, sin alcance a otras zonas. Si un
administrador está asignado directamente a un equipo específico, entonces sus
privilegios administrativos se limitan **solo a ese equipo** (funcionando
efectivamente como un líder o encargado de equipo con capacidades ampliadas
sobre sus miembros).

·En términos de UX, la aplicación
reflejará estos límites: los menús, listas y dashboards que vea un
administrador se filtrarán automáticamente para mostrar únicamente los
contenidos de su ámbito (región/zona/equipo). Ciertas funciones de gestión
(crear usuarios, ver reportes, asignar tareas, etc.) solo estarán disponibles
dentro de la sección de la jerarquía que le corresponde.

- **Si la jerarquía está desactivada** , todos
  los administradores funcionan como hasta ahora, con acceso completo a toda
  la organización (excepto funciones reservadas al owner). La UI en ese caso
  no muestra ningún indicador de región/zona, y los administradores pueden
  gestionar cualquier elemento de la empresa.
- **Rol \*\***member\***\* (Miembro estándar):** Con jerarquía activa, cada miembro se inscribe en un **equipo
  específico** (el nivel más bajo de la jerarquía) y su interacción con la
  plataforma queda **limitada a ese contexto de equipo** :

·
Un miembro **solo puede ver y
colaborar** en los datos que pertenecen a su propio equipo (y, por extensión,
su zona/región). Por ejemplo, podrá ver las oportunidades, clientes o
contenidos asignados a su equipo, pero **no verá información de equipos
hermanos** ni de otras zonas o regiones.

·En la práctica, la experiencia de
usuario para un miembro estará segmentada: los listados, búsquedas y reportes
que encuentre estarán pre-filtrados a su equipo. Cualquier intento de acceder a
datos de otro equipo (por URL directa u otros medios) será bloqueado por el
sistema de seguridad.

- **Con jerarquía desactivada** , un miembro
  continúa con la experiencia tradicional: dependiendo de las políticas
  actuales de la plataforma, podría ver datos de toda la organización que
  sean relevantes (por ejemplo, un miembro podría ver un catálogo general de
  clientes o proyectos de la empresa) aunque sin permisos de edición más que
  en aquellos elementos donde se le otorgue acceso. En un esquema plano, la
  noción de “equipo” no se aplica, por lo que todos los miembros comparten
  esencialmente el mismo ámbito global dentro de la organización (limitado
  solo por sus permisos funcionales).
- **Ajustes en el Panel de Configuración de la Organización:** Se habilitarán controles adicionales para gestionar estos roles
  jerárquicos:

·
El owner podrá **asignar o reubicar** a los
usuarios en distintas regiones/zonas/equipos desde una vista de administración
de usuarios. Por ejemplo, podrá cambiar a un administrador de la Región Norte
hacia la Región Sur, o mover un miembro de un equipo a otro si cambia de área.

·
También se podrá **promocionar o
degradar** roles dentro del contexto jerárquico sin esfuerzo. Ejemplo: el
owner puede cambiar a un usuario de rol member a administrador de cierto equipo
si necesita que tenga más privilegios en ese ámbito, o viceversa.

·
Si la plataforma lo soporta,
podría permitirse **redefinir nombres o alcances de roles** de forma
amigable (p. ej., permitir que en la interfaz se etiquete a ciertos
administradores como “Gerentes de Zona” u “Líderes de Equipo” para reflejar
mejor sus responsabilidades, aunque internamente sigan siendo rol administrador con ámbito limitado).

·
La interfaz dejará claro en qué
región/zona/equipo está cada usuario. Para los administradores especialmente,
se mostrará junto a su rol el ámbito asignado (por ejemplo: “Administrador –
Zona Centro (Región Norte)”), facilitando al owner y a otros admins globales
identificar responsabilidades.

·
**Experiencia para el Usuario:** Estos cambios se implementarán cuidando la usabilidad. Los usuarios
solo verán opciones relevantes a su nivel. Por ejemplo, un administrador de
zona no verá menús para gestionar regiones completas, y un miembro de equipo no
verá listados globales. Esta contextualización de la UX evitará confusión y
reforzará las políticas de permisos de forma natural.

En resumen, el modelo jerárquico utiliza los **roles existentes
adaptándolos a niveles jerárquicos** : - El **owner** sigue siendo el
administrador máximo de la organización (sin límites de alcance). - Los **administradores**
continúan teniendo capacidades de gestión, pero **acotadas al segmento
organizativo** al que pertenezcan. - Los **miembros** continúan siendo
usuarios finales con permisos básicos, circunscritos a su equipo cuando la
jerarquía está activa.

## [Impacto Técnico y Consideraciones de Migración]()

La introducción de permisos jerárquicos opcionales implica varios
ajustes en la arquitectura, la seguridad y los datos. A continuación, se
detallan las áreas clave afectadas y cómo se abordarán, garantizando que la
funcionalidad sea **opcional y retrocompatible** con el modo plano.

### [Seguridad y Control de Acceso]()

Implementar la
jerarquía requiere reforzar las comprobaciones de seguridad para que cada
usuario **solo acceda a los datos permitidos según su región/zona/equipo** .
Los cambios propuestos incluyen:

·
**Extensiones al Modelo de Datos:** Se añadirán atributos de ubicación jerárquica a las entidades
relevantes. Por ejemplo, los registros de clientes, proyectos, ventas u otros
objetos manejados en la plataforma incluirán campos de identificación de
equipo, zona y región. De esta forma, cada dato queda etiquetado con la unidad
organizativa a la que pertenece.

·
**Filtrado Automático por Ámbito:** El sistema de autorización (middlewares, servicios o consultas a la
base de datos) se actualizará para filtrar los datos **en cada solicitud**
según el usuario:

·
Si el usuario es un administrador
con jerarquía activa, el sistema comprobará qué región/zona/equipo tiene
asignada y **limitará los resultados** a esa área. Por ejemplo, una consulta
de un administrador sobre “todos los clientes” realmente recuperará “todos los
clientes de la región (o zona/equipo) asignada al administrador”. Esto se puede
lograr incorporando condiciones en las consultas SQL/NoSQL (WHERE region_id =
X, etc.) o mediante reglas en la capa de negocio que descarten datos fuera de
alcance.

·
Si el usuario es un miembro, se
aplicará un filtro análogo a su **equipo específico** . El miembro solo
recibirá o podrá modificar registros cuyo identificador de equipo coincida con
el suyo.

·
El owner será la excepción: las reglas de seguridad reconocerán al owner de la
organización y **no filtrarán** sus datos por región, dado que tiene derecho
a la vista global.

·
**Verificación en Funciones
Críticas:** Además del filtrado de lecturas, todas las
operaciones de modificación (creación, edición, eliminación) incorporarán
validaciones de permiso jerárquico. Por ejemplo, si un administrador de zona
intenta editar un recurso etiquetado en otra zona, la operación será bloqueada
y logueada como intento no autorizado. Este refuerzo cubrirá rutas de API,
métodos del backend y cualquier lógica de negocio importante, para evitar _escalación
de privilegios_ indebida.

·
**Modo Opcional (Jerarquía
Desactivada):** Cuando la jerarquía esté **desactivada
para una organización** , estas reglas de filtrado **no se aplicarán** . En
otras palabras, el sistema detectará que la organización opera en modo plano y
procederá con el control de acceso tradicional:

·
Un administrador interno podrá
acceder a todos los datos de su organización (ya que no hay segmentos internos
que restringir).

·
Un miembro tendrá acceso acorde a
las políticas pre-existentes (por ejemplo, podría ver datos globales de la
empresa que estén permitidos para su rol, dado que no hay un campo de
región/equipo que lo limite).

·
El código de seguridad, en este
caso, ignorará los campos de región/zona/equipo (que podrían estar vacíos o
neutros) y tratará todas las solicitudes con el alcance de organización
completa.

·
**Protección de Datos Sensibles:** Cabe destacar que estos cambios se suman a la seguridad existente; es
decir, la jerarquía complementa la matriz de permisos actual. Un miembro no
obtendrá permisos nuevos por estar en un equipo, solo verá _menos_ datos
(los de su equipo), mientras que un administrador verá menos datos que antes si
su ámbito se restringe. Ningún usuario ganará acceso a información que antes no
podía ver; simplemente se evitará que usuarios vean información que antes
podían ver **solo en caso de activar la segmentación** . De este modo, la
confidencialidad por áreas se garantiza para organizaciones que lo requieran,
sin sacrificar la integridad de las reglas de negocio originales.

En términos de
implementación, estas medidas de seguridad aprovechan la infraestructura
existente: - Se utilizarán mecanismos de **control de acceso basado en
atributos (ABAC)** agregando el atributo de ubicación (región/zona/equipo)
como factor determinante. - Donde actualmente existan checks del tipo “si
usuario es admin entonces permitir”, se refinarán a “si usuario es admin **y
el recurso está dentro de su alcance** entonces permitir”. - Todas las nuevas
verificaciones tendrán en cuenta el flag de configuración de jerarquía: _solo_
se ejecutarán cuando la jerarquía esté activa para esa organización, evitando
sobrecarga innecesaria en organizaciones que optaron por no usarla.

### [Migración de Datos y Usuarios]()

Para
introducir esta nueva funcionalidad sin interrumpir el servicio, se planifican
las siguientes acciones migratorias y de configuración:

·
**Esquema de Base de Datos:** Se realizará una migración no disruptiva que agregue las nuevas tablas
y campos necesarios:

·
Tablas para **Regiones** , **Zonas**
y **Equipos** , incluyendo relaciones jerárquicas (por ejemplo, cada zona
referenciando a su región padre, cada equipo a su zona padre, y ambas a la
organización dueña).

·
Campos de referencia (claves
foráneas o equivalentes) en las tablas de usuarios (perfil dentro de la
organización) y en las tablas de datos sujetos a segmentación (p. ej.,
clientes, proyectos, tickets, etc.) para almacenar la asociación a
equipo/zona/región.

·
Un campo booleano jerarquia_activada en la entidad Organización para reflejar la preferencia configurada.

·
Estas migraciones se diseñarán con
valores por omisión que **no afecten datos existentes** (por ejemplo, jerarquia_activada por defecto en _false_ , campos de región/zona en NULL o un valor
neutro indicando “no asignado” para todos los registros actuales).

·
**Datos Existentes en Modo Plano:** Tras la migración, las organizaciones continuarán en modo plano a
menos que se indique lo contrario. Los datos existentes (usuarios y registros)
no tendrán asignación a región/zona/equipo, pero esto no causará problemas ya
que el sistema seguirá operando en modo tradicional mientras jerarquia_activada =
false.

·
Es importante señalar que, con la
jerarquía inactiva, esos campos vacíos no se usan en absoluto en las consultas
ni vistas, manteniendo la continuidad total de la aplicación para los usuarios.

·
**Proceso para Activar la
Jerarquía en Organizaciones Existentes:** Si una
organización existente decide habilitar la jerarquía, se recomendará un proceso
guiado:

·
**Definir Estructura:** El owner deberá ingresar al panel de configuración y crear las
entradas de Regiones, Zonas y Equipos según la estructura deseada. Por ejemplo,
podría dar de alta “Región Norte” y “Región Sur”, luego dentro de “Región
Norte” crear “Zona Centro” y “Zona Costa”, etc., hasta definir todos los
equipos básicos.

·
**Asignar Usuarios:** A continuación, el owner asignará cada usuario (administradores y
miembros) a su lugar correspondiente. Para facilitar esto, la interfaz podría
listar a todos los usuarios sin asignación y permitir asignarlos mediante menús
desplegables de región/zona/equipo. Es **obligatorio** que todos los
usuarios queden asignados a algún equipo antes de confirmar la activación
definitiva de la jerarquía, garantizando que nadie quede “fuera” de la
estructura (de lo contrario, esos usuarios no podrían ver nada al aplicarse los
filtros).

·
**Asignación de Datos Históricos:** Los datos ya existentes (por ejemplo, registros creados antes de la
jerarquía) idealmente también deberían asociarse a alguna unidad. El sistema
podría ayudar asignando automáticamente todos los registros actuales a una
región/zona/equipo predeterminados (como una “Unidad por Defecto”) que el owner
puede luego redistribuir manualmente, **o** requerir que el owner distribuya
los datos principales (como reasignar proyectos o cuentas a responsables
regionales) antes de completar la activación. Este punto se definirá
cuidadosamente para no perder información: por defecto, podríamos optar por
asignar todo al primer nivel (ej. todos los datos existentes quedan
temporariamente bajo una región/zone genérica) y luego permitir refinarlos.

·
**Confirmación y Aplicación:** Una vez completados los pasos anteriores, el owner confirma la
activación. A partir de ese momento, jerarquia_activada pasa a _true_ para esa organización y todas las restricciones de
seguridad y vistas filtradas comienzan a regir. Es importante que este cambio
sea atómico y comunicado a todos los usuarios de la organización (posiblemente
vía notificación) para que comprendan el nuevo comportamiento.

·
**Organizaciones Nuevas:** En el caso de empresas que se creen en el futuro, se les podrá
preguntar durante la configuración inicial si desean habilitar la jerarquía. Si
la activan desde el inicio, se les guiará por el mismo proceso de definir
estructura y cargar usuarios en equipos. Si optan por no activarla, simplemente
se crea la organización en modo plano sin requerir definiciones adicionales.

·
**Desactivación de la Jerarquía:** Si una organización con jerarquía activa decide volver a un modelo
plano (desactivar la jerarquía), el sistema deberá manejarlo con cuidado:

·
El owner podrá desmarcar la opción
de jerarquía en la configuración. Al hacerlo, jerarquia_activada se cambia a _false_ .

·
Inmediatamente, **todas las
restricciones de visibilidad internas se eliminan** : los administradores
recuperan acceso completo a todo y los miembros podrían ver información más
amplia de la organización (según los permisos base del rol).

·
Los datos conservarán sus
etiquetas de región/zona/equipo en la base de datos, pero el sistema dejará de
utilizarlas para filtrar. Esto significa que la estructura puede quedar
“dormida”: si en el futuro se reactiva la jerarquía, esas asociaciones previas
podrían reutilizarse. De hecho, permitir desactivar sin borrar la estructura
facilita experimentar con el modelo sin pérdida de la configuración realizada.

·
En la interfaz, al desactivar la
jerarquía desaparecerán los campos y divisiones por región; todo se presentará
nuevamente unificado. Los usuarios que antes estaban en distintos equipos ahora
verán el contenido total de la organización. **Nota:** Es recomendable
advertir al owner sobre las implicaciones antes de confirmar la desactivación,
para evitar revelaciones de datos inadvertidas. Por ejemplo, si ciertos datos
estaban ocultos de algunos usuarios por la jerarquía, al desactivar se harán
visibles; el owner debe estar consciente de ello.

·
**Pruebas y Validación:** Este cambio migratorio requerirá amplias pruebas:

·
Asegurar que organizaciones que no
toquen la configuración sigan funcionando exactamente igual que antes de la
migración.

·
Verificar que al activar la
jerarquía y luego desactivarla se retorna al estado original sin residuos (los
filtros se omiten correctamente, etc.).

·
Migraciones de rollback por si
hubiera algún problema en producción, garantizando que se pueda desactivar la
feature flag globalmente si algo falla, sin corromper datos.

En resumen, la
migración se diseña para ser **lo más transparente posible** para quienes no
utilicen la funcionalidad, y para ofrecer herramientas de transición seguras
para quienes sí la activen. La clave es mantener la integridad de los datos y
no forzar cambios a menos que la organización expresamente adopte el modelo
jerárquico.

### [Dashboards y Reportes]()

Los mecanismos de
reporte y visualización de métricas (dashboards) deberán adaptarse para
soportar la segmentación opcional por región/zona/equipo:

·
**Dashboards Generales de la
Organización:** Con la jerarquía desactivada, los
administradores ven los dashboards globales con información agregada de toda la
organización, como ha sido hasta ahora. **Cuando la jerarquía está activada** ,
estos dashboards generales seguirán existiendo pero su acceso será
principalmente para el owner (y potencialmente para roles especiales con vista
global). El owner podría ver, por ejemplo, un panel comparativo entre regiones,
con métricas de cada región lado a lado.

·
**Dashboards Específicos por
Ámbito:** Para administradores jerárquicos, la
plataforma mostrará dashboards **filtrados a su alcance** :

·
Un administrador de región verá un
panel con las métricas **de su región** exclusivamente (sumando todos sus
zonas/equipos). Podría incluir gráficos de rendimiento por zona dentro de esa
región, permitiéndole identificar qué zonas están cumpliendo sus objetivos.

·
Un administrador de zona verá
métricas **de su zona** (sumatoria de sus equipos), posiblemente con
desglose por equipo en esa zona.

·
Un administrador de un equipo verá
únicamente los datos **de su equipo** . Esto lo convierte en un
mini-dashboard focalizado, útil para un líder de equipo que quiera ver, por
ejemplo, las ventas de su equipo ese mes, sin ruido de otras áreas.

·
Los miembros normalmente no
tendrían dashboards administrativos, pero podrían ver algunas estadísticas de
su propio desempeño o de su equipo si la plataforma las ofrece. En ese caso,
igualmente se limitarían a datos de su equipo.

·
**Interfaz y Experiencia de
Reportes:** La UI deberá reflejar claramente el
contexto:

·
Si la jerarquía está activa, los
dashboards podrían incluir un filtro o etiqueta que indique “Vista: Región X” o
“Zona Y” según corresponda, para que el usuario sepa que está viendo solo una
porción de la información global.

·
El owner, al tener visibilidad
completa, podría tener la opción de _filtrar por región/zona_ en sus
dashboards globales. Es decir, además de ver todo comparado, podría seleccionar
“Ver únicamente Región Norte” para profundizar, emulando la vista que tendría
un admin regional.

·
En caso de jerarquía desactivada,
dichos filtros por ubicación no aparecerán en la interfaz ya que no aplican.
Todos los gráficos y reportes se basarán en la totalidad de los datos de la
organización.

·
**Implementación Técnica de
Reportes:** Desde el punto de vista técnico, los
endpoints o consultas que alimentan los dashboards incorporarán lógica similar
a la de seguridad:

·
Al solicitar datos para los
gráficos, el backend verificará el rol y ámbito del usuario solicitante. Si se
trata de un admin con jerarquía activa, agregará las condiciones de región/zona
en la agregación de datos.

·
Ya que los dashboards suelen
implicar agregaciones (sumas totales, promedios, etc.), es importante optimizar
estas consultas. Se pueden crear **vistas materializadas o índices** basados
en región/zona para acelerar la obtención de métricas segmentadas, evitando
recalcular sobre toda la data cuando no es necesario.

·
Nuevamente, cuando la jerarquía
esté desactivada para esa org, las consultas de dashboard ignorarán cualquier
criterio de región (o considerarán todos los registros porque esencialmente
todos pertenecen a la única “región” implícita que es la organización entera).

·
**Reportes Exportables:** Si la plataforma permite exportar informes o datos, se aplicará el
mismo principio. Un administrador regional que exporte un informe recibirá solo
filas correspondientes a su región. El owner, en cambio, podría exportar
informes globales o segmentados a voluntad. Esto asegura consistencia en la
autorización de datos en todos los canales.

En resumen, los
dashboards y reportes se **adaptarán dinámicamente** según la configuración:

- _Modo Plano:_ métricas globales únicamente. - _Modo Jerárquico:_
  métricas globales para owner y posiblemente vista comparativa, métricas
  segmentadas para cada administrador en su nivel, con la infraestructura
  necesaria para soportar esas consultas de forma eficiente.

### [Segmentación de Datos

y Funcionalidad]()

La
segmentación por región, zona y equipo no solo afecta a la seguridad y los
reportes, sino que también implica consideraciones en otras áreas funcionales
de la plataforma:

·
**Listados y Búsquedas:** Cualquier listado de elementos (por ejemplo, lista de clientes, lista
de proyectos, tickets de soporte, etc.) se segmentará automáticamente según la
jerarquía cuando esté activa:

·
Los administradores verán listados
de los elementos de su ámbito. Un admin de región al entrar a “Clientes” verá
únicamente los clientes asignados a equipos de su región.

·
Se implementarán **filtros
predefinidos** en las consultas de búsqueda: cuando un usuario con jerarquía
busque algo (p. ej. “Proyecto X”), el sistema añadirá internamente filtros para
limitar la búsqueda a su región/zone/equipo. Esto asegura que ni siquiera a
través de la búsqueda textual aparezcan resultados de fuera de su alcance.

·
Para el owner o en modo plano, los
listados muestran todos los datos de la organización (posiblemente con filtros
manuales opcionales pero no forzados por permisos).

·
**Creación y Asignación de Nuevos
Datos:** En modo jerárquico, al crear un nuevo registro
(nuevo cliente, nuevo caso, etc.), el sistema deberá solicitar o deducir **a
qué equipo (zona/región) pertenece** :

·
Si un administrador de zona crea
un elemento, ese elemento se marcará automáticamente con la zona (y región) de
dicho admin, e idealmente también con un equipo si corresponde. Si la creación
se hace a nivel zona, podría requerirse seleccionar el equipo destino dentro de
esa zona.

·
Si el creador es un administrador
de equipo o un miembro, cualquier contenido creado se asociará directamente a **su
equipo** por defecto.

·
El owner, al poder crear
globalmente, deberá seleccionar a qué parte de la org asignar el nuevo objeto
(ej.: crear un nuevo cliente y asignarlo a la Región Sur > Zona X >
Equipo Y). Alternativamente, podría crearlo sin asignación específica, en cuyo
caso el cliente podría quedar accesible a todos hasta que se le asigne un
equipo; sin embargo, esto podría romper el aislamiento, por lo que
probablemente forzaremos la selección de una unidad cuando la jerarquía esté
activa.

·
**Modo Plano:** la creación de nuevos datos no cambia con respecto a la actualidad; no
se piden equipos ni regiones, y los registros no quedan asociados a ninguna
subdivisión (toda la organización lo ve).

·
**Notificaciones y Flujo de
Trabajo:** Sistemas de notificaciones o flujos (ej.
aprobaciones, asignaciones de tareas) también respetarán la jerarquía:

·
Un administrador de región
recibiría alertas solo de eventos ocurridos en su región (p. ej., “Nuevo
cliente registrado en tu región”).

·
Un miembro recibiría
notificaciones únicamente pertinentes a su equipo.

·
El owner puede configurar
notificaciones globales o por región dependiendo del interés.

·
Con jerarquía desactivada, las
notificaciones siguen las reglas globales existentes.

·
**Integraciones Externas y APIs:** Si existen integraciones (por ejemplo, exportación de datos a CRM
externo, APIs de consulta de información), se introduce un contexto de
jerarquía:

·
Las llamadas API internas
verificarán token y usuario asociado, aplicando los mismos filtros por
región/equipo antes de devolver datos. Por ejemplo, una integración que extrae
la lista de oportunidades de venta usando credenciales de un admin de zona, solo
obtendrá oportunidades de esa zona.

·
Documentaremos estos cambios en la
API para que clientes sepan que, si activan la jerarquía, las respuestas de
ciertos endpoints se verán limitadas por el usuario que consulte.

·
**UI/UX Condicional:** Muchas pantallas tendrán comportamiento dual:

·
En modo jerárquico, se mostrarán **controles
y campos relacionados con la jerarquía** (como filtros por región, etiquetas
indicando el equipo asociado a cada registro, secciones de la UI organizadas
por estructura jerárquica).

·En modo plano, esos controles
estarán ocultos o inactivos para no confundir al usuario. La aplicación
detectará la configuración y ajustará la interfaz en consecuencia, brindando
una experiencia limpia en cada caso.

- Debemos
  cuidar que la transición de una UI plana a jerárquica (y viceversa) sea lo
  más _intuitiva_ posible: por ejemplo, proveer tutoriales cortos o
  destacados cuando se activa la jerarquía por primera vez, explicando las
  nuevas secciones de navegación (“Explora tus datos por región aquí”,
  etc.).
- **Performance y Cacheo:** La introducción de
  filtros extra por región/zona podría aumentar la complejidad de algunas
  consultas. Mitigaremos esto con:

·
Indexación adecuada en los campos
de región/zona/equipo para que filtrar no degrade el performance.

·
Posible caché segregada: por
ejemplo, cachear resultados de consultas de dashboard por región, de modo que
usuarios distintos dentro de la misma región puedan beneficiarse del mismo
caché (siempre y cuando los permisos sean iguales).

·
Monitoreo post-despliegue para
detectar cualquier consulta lenta introducida por la segmentación y optimizarla
de ser necesario.

## [Comportamiento con Jerarquía Desactivada (Estructura Plana)]()

Es fundamental destacar cómo opera la plataforma cuando la función
jerárquica **no** está en uso, ya que este será el estado por omisión para
muchas organizaciones y el referente de compatibilidad hacia atrás:

- **Visibilidad de Datos:** En una estructura
  plana, **no existen divisiones internas** por región, zona ni equipo.
  Todos los usuarios continúan viendo la información según las reglas
  generales de su rol, sin segmentación adicional. Un administrador interno de la
  organización puede acceder a todos los datos de la empresa (clientes,
  proyectos, etc.) porque no hay etiquetas de pertenencia que limiten su
  alcance. Un member podría ver, por ejemplo, la
  lista completa de clientes o proyectos (si así se permitía previamente) o
  solo sus elementos asignados, de acuerdo con la lógica actual, pero
  crucialmente esa lógica no incluye ninguna restricción por ubicación
  organizativa.
- **Roles sin Ámbito:** Dado que la jerarquía
  está apagada, los conceptos de región, zona y equipo **simplemente no
  aplican** . En la base de datos, los campos de región/zona/equipo de los
  registros permanecerán vacíos o con un valor neutro. En la interfaz de
  usuario:

·
No se muestran campos para asignar
región/zona/equipo al crear o editar elementos.

·En la gestión de usuarios, no
aparece la necesidad de ubicar a cada persona en una estructura; típicamente
solo se elige su rol (administrador o member) como se ha hecho hasta ahora.

- La navegación de la aplicación no presenta secciones por regiones
  ni filtros de ese tipo; por ejemplo, un menú podría simplemente listar
  “Usuarios”, “Clientes”, “Proyectos” globalmente, en lugar de subdividir
  por ubicaciones.
- **Experiencia Consistente con el Estado Actual:** Para las organizaciones en modo plano, la plataforma seguirá
  funcionando _exactamente igual_ que antes de introducir este
  requerimiento:

·
No habrá cambios en quién puede
ver o hacer qué, ya que no se introducen nuevas reglas de restricción.

·Cualquier código nuevo añadido
para la jerarquía estará inactivo (guardado tras condicionales que chequean jerarquia_activada=false).

- Esto garantiza que clientes pequeños o que no necesiten la
  característica **no se vean afectados** en absoluto en su día a día
  tras la actualización que incluya esta funcionalidad.
- **Transición a Jerarquía (Opcional):** Si en
  algún momento una organización en estructura plana decide aprovechar la
  jerarquía, podrá hacerlo habilitándola en configuración. Hasta entonces,
  puede ignorar por completo la existencia de regiones/zonas/equipos. Este
  diseño intencional asegura que la plataforma sea **accesible y simple
  para quienes no requieran complejidad** , mientras ofrece potencia extra
  a quienes sí la necesitan.
- **Mantenimiento de Simplicidad:** Incluso a
  nivel técnico, mantener la jerarquía desactivada implica menor
  complejidad: menos consultas con JOINs o filtros, menos elementos en la
  interfaz. Por lo tanto, siempre que jerarquia_activada esté en false, el
  sistema opera en su modo más simple. Esta bifurcación en el código y en la
  configuración se ha planificado cuidadosamente para **no introducir
  penalizaciones de rendimiento o usabilidad** a los usuarios que no usen
  la nueva funcionalidad.

En conclusión, el comportamiento con jerarquía desactivada es el de una
**estructura plana tradicional** , asegurando retrocompatibilidad. La nueva
funcionalidad jerárquica actúa como una capa adicional que se **superpone solo
cuando está activada** , modulando permisos y vistas; si está apagada, la
plataforma permanece con su flujo estándar, sin requerir cambios en la forma en
que los usuarios interactúan con ella.

## [Conclusión]()

La actualización propuesta del requerimiento 41 redefine el modelo
de permisos dentro de cada organización para soportar una jerarquía interna de
regiones, zonas y equipos **de forma opcional** . Aprovechando los roles
existentes (owner, administrador, member), la solución ofrece a las empresas
la flexibilidad de mantener una operación simple y plana o migrar hacia una
estructura jerárquica que limite la visibilidad de usuarios a contextos más
reducidos. Se han delineado cambios en la seguridad, en la estructura de datos,
en la interfaz de usuario y en los procesos de migración para asegurar que la
introducción de esta funcionalidad sea **segura, configurable y transparente** :

·
Las organizaciones pueden activar
la jerarquía cuando lo necesiten, sabiendo que el owner conservará control
total y que los demás roles verán solo su porción asignada.

·
La plataforma adaptará su
comportamiento (permisos, dashboards, listados, etc.) dinámicamente según esté
habilitada o no la segmentación jerárquica, proporcionando siempre la
información adecuada a cada usuario.

·
Todo esto se implementará sin
detrimento para quienes no usen la característica, preservando el desempeño y
la experiencia actuales en modo plano.

Esta propuesta actualizada sustituye completamente la versión anterior,
incorporando las correcciones de roles y las consideraciones de modularidad
solicitadas. Con ella, el requerimiento 41 queda plenamente especificado
para su implementación, garantizando un **modelo de permisos jerárquico
robusto y adaptable** a las distintas realidades de las organizaciones en la
plataforma.
