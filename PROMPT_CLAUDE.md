Quiero que actúes como un arquitecto de software senior especializado en:

- Plataformas tipo taller / campus de aprendizaje
- Experiences de chat tipo “asistente en todas partes”
- Sistemas de generación y gestión de prompts

Estás ejecutándote en Claude Code dentro de un proyecto YA EXISTENTE.  
Tu tarea es:

1. Analizar la estructura actual del proyecto (framework, rutas, componentes, API calls, manejo de sesión/usuario, etc.).
2. A partir de ese análisis, generar un **archivo Markdown** llamado, por ejemplo, `PLAN_LIA_PROMPTS.md` con un **plan de trabajo detallado** para lograr las siguientes 3 etapas.

---

## Contexto general del proyecto

- Existe un asistente (LIA) que está “en todas partes” del sitio.
- Hay un **prompt directory** y un **chat del taller**.
- Hay una idea de integrar un **agente de voz** (aún no muy definido).
- Queremos una **biblioteca de prompts** ligada al perfil del usuario y a su interacción en el chat.
- El sistema tiene usuarios con perfiles/roles (ej: marketing, ingeniería, etc.).

---

## OBJETIVOS FUNCIONALES

### Etapa 1 – Activación automática de creación de prompts + navegación guiada desde el chat del taller

Diseña un plan para implementar lo siguiente:

1. **Activación automática de modo “creación de prompts”**:
   - Cuando el usuario, desde el chat (especialmente el chat del taller), muestre **intención de crear un prompt**, el sistema debe:
     - Detectar la intención (NLU / intent detection básica).
     - Entrar automáticamente a un **modo de creación de prompts** dentro del MISMO chat.
   - Ese modo debe estar conectado a la sección de **prompt directory** y LIA que está “en todas partes”.

2. **Funcionalidad de guiar al usuario a otras partes del sitio desde el chat del taller**:
   - Desde el chat del taller, LIA debe poder:
     - Sugerir y activar navegación/links a otras secciones del sitio (ej: biblioteca de prompts, módulos específicos del taller, etc.).
     - Actualizar el contexto de la sesión para reflejar a qué sección fue el usuario.

3. **Integración inicial del agente de voz**:
   - Proponer una forma simple de inicio:
     - Por ejemplo, un **botón** en el mismo chat de LIA que:
       - Dispare un “recorrido guiado por voz” (o lectura guiada) **bajo demanda**.
     - El usuario decide cuándo activar el agente de voz.
   - Deja claro en el plan:
     - Dónde se ubicaría este botón en la UI.
     - Qué módulo/capa debería manejar la lógica de voz (aunque todavía sea high-level).
     - Qué dependencias o servicios externos podrían ser necesarios.

---

### Etapa 2 – Sistema conversacional de generación de prompts adaptados al perfil del usuario

Aquí quiero un **caso de uso robusto** de generación de prompts:

1. **Generador de prompts adaptado al perfil del usuario**:
   - El sistema debe usar el **perfil del usuario** (ej: marketing, ingeniería, finanzas, etc.) para:
     - Adaptar las preguntas que hace.
     - Adaptar el tipo de prompts sugeridos.

2. **Flujo conversacional guiado**:
   - Ejemplo base:
     - “Vamos a crear un prompt. ¿Te puedo ayudar? Primero, dime cuál es tu idea”.
   - A partir de la **idea inicial** del usuario:
     - El sistema hace varias preguntas de seguimiento para profundizar.
     - Con las respuestas, construye un **prompt final**, bien estructurado.

3. **Guardado automático en la biblioteca de prompts**:
   - Cuando el prompt quede terminado:
     - Se guarda automáticamente en la **biblioteca del usuario**.
   - El plan debe incluir:
     - Qué modelo de datos usar (tabla, colección, campos sugeridos).
     - Cómo relacionar ese prompt con el perfil del usuario.
     - Cómo versionar o actualizar prompts si se vuelven a editar.

4. **Interacción continua como base del diseño**:
   - Resalta en el plan que:
     - El diseño debe priorizar una experiencia conversacional continua (no formularios fríos).
     - Se mantenga el contexto de la conversación para futuras mejoras (ej: sugerir mejoras del prompt en otra sesión).

---

### Etapa 3 – Integración de “Prompt Packs” oficiales de OpenAI en español

Queremos aprovechar la sección de **Prompt Packs** de OpenAI como fuente de prompts base.

1. **Explorar y seleccionar Prompt Packs de OpenAI**:
   - Ejemplos de packs:
     - “ChatGPT for engineers”
     - “ChatGPT for marketing”
     - “ChatGPT for any role”
   - Objetivo:
     - Escoger prompts relevantes.
     - Traducirlos/adaptarlos al español.
     - Probarlos y curarlos.

2. **Construir/Enriquecer nuestra biblioteca de prompts**:
   - El plan debe explicar cómo:
     - Importar estos prompts (pipeline manual o semi-automatizado).
     - Normalizarlos (formato común, tags, rol objetivo, etc.).
     - Integrarlos con la biblioteca existente.
     - Marcar cuáles vienen de OpenAI y cuáles son propios.

3. **UX para prompts listos para usar**:
   - Diseñar un flujo tipo:
     - “Aquí tienes estos prompts listos para usar — haz clic y accede directamente a ellos”.
       - Al hacer clic:
         - Se carga el prompt en el chat o en un editor previo para ajustarlo.
     - O bien “los integramos en nuestra web/sitio”:
       - Prompts organizados por rol: ingeniería, IT, marketing, finanzas, recursos humanos, producto, etc.
   - El plan debe describir:
     - UI/UX sugerida (secciones, filtros, tags).
     - Integración con el perfil del usuario (mostrar primero los prompts de su área).

---

## LO QUE DEBE CONTENER EL ARCHIVO `PLAN_LIA_PROMPTS.md`

El archivo final que generes debe incluir, como mínimo:

1. **Resumen técnico del estado actual del proyecto**  
   - Framework y stack detectado (ej: Next.js, React, Node, etc.).
   - Dónde vive el chat de LIA.
   - Dónde está o cómo se maneja actualmente el prompt directory.
   - Cómo se maneja el contexto/estado del usuario (auth, perfil, etc.).

2. **Plan por etapas (Etapa 1, Etapa 2, Etapa 3)**  
   Para cada etapa:
   - Objetivos funcionales (en lenguaje claro).
   - Cambios técnicos necesarios:
     - Frontend (componentes, hooks, estados globales, rutas).
     - Backend / APIs (nuevos endpoints, refactors, integración con LLM, etc.).
     - Modelo de datos (tablas/colecciones nuevas o campos nuevos).
   - Dependencias externas (servicios de voz, APIs de OpenAI, etc. — aunque sea a nivel de hipótesis).
   - Consideraciones de UX y DX (experiencia de usuario y de desarrollador).
   - Riesgos y decisiones arquitectónicas clave.

3. **Roadmap y prioridades**  
   - Lista de tareas en formato checklist por etapa (Est. alta: baja/media/alta).
   - Qué cosas se pueden hacer en paralelo.
   - Qué experimentos/prototipos rápidos sugerirías antes de ir “a producción”.

4. **Mapa de archivos y componentes sugeridos**  
   - Referencias concretas a archivos existentes (ej: `src/components/ChatLia.tsx`) si los detectas.
   - Propuesta de nuevos archivos/componentes/rutas (ej: `src/modules/prompt-builder/PromptWizard.tsx`).
   - Notas tipo: “Mover lógica X de archivo Y a un hook compartido Z”.

---

## MODO DE TRABAJO

1. Analiza primero el código del proyecto para entender:
   - Cómo está implementado LIA.
   - Cómo funciona el chat del taller.
   - Cómo se almacena la información de usuario y prompts (si ya existe algo).

2. Luego genera el archivo `PLAN_LIA_PROMPTS.md` con el contenido descrito.

3. No modifiques código del proyecto en esta respuesta: solo necesito el plan en Markdown bien estructurado.

Cuando termines, muéstrame el contenido completo de `PLAN_LIA_PROMPTS.md`.
