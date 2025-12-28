// TEMPORAL FIX: Comentar la sección problemática
// Líneas 275-286 comentadas temporalmente para resolver error de parsing

function getLIASystemPrompt(context?: PlatformContext): string {
let prompt = LIA_SYSTEM_PROMPT;

// TODO: Descomentar y arreglar después
/_
if (context?.pageType?.startsWith('business\_') || context?.currentPage?.includes('/business-panel')) {
prompt = prompt.replace(
/## Rutas Principales de SOFIA[\s\S]_?Talleres disponibles/g,
`## Rutas del Panel de Negocios

- [Dashboard de Negocios](/business-panel)
- [Gestión de Equipos](/business-panel/teams)
- [Catálogo de Cursos](/business-panel/courses)
- [Analytics](/business-panel/analytics)
- [Configuración](/business-panel/settings)`
  );
  }
  \*/

  if (context) {
  // ... resto del código
  }

  return prompt;
  }
