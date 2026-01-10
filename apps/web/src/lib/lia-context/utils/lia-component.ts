/**
 * LIA Component Utilities
 * 
 * Utilidades para marcar componentes con data-attributes que LIA puede detectar.
 * Esto permite a LIA entender qué componentes están activos en la página
 * cuando un usuario reporta un problema.
 */

/**
 * Atributos de data para componentes de LIA
 */
export const LIA_DATA_ATTRIBUTES = {
  COMPONENT: 'data-lia-component',
  PROPS: 'data-lia-props',
  STATE: 'data-lia-state',
  FEATURE: 'data-lia-feature',
  ACTION: 'data-lia-action',
  ERROR_BOUNDARY: 'data-lia-error-boundary'
} as const;

/**
 * Opciones para marcar un componente
 */
interface LiaComponentOptions {
  /** Nombre del componente (obligatorio) */
  name: string;
  /** Props relevantes a incluir */
  props?: Record<string, unknown>;
  /** Estado actual del componente */
  state?: string;
  /** Feature/módulo al que pertenece */
  feature?: string;
  /** Acciones disponibles en el componente */
  actions?: string[];
  /** Si es un error boundary */
  isErrorBoundary?: boolean;
}

/**
 * Genera props para marcar un elemento como componente detectable por LIA
 * 
 * @example
 * // En un componente React:
 * <div {...liaComponent({ name: 'CourseCard', props: { courseId }, state: 'loading' })}>
 *   ...
 * </div>
 * 
 * @example
 * // Con feature y acciones:
 * <Modal {...liaComponent({ 
 *   name: 'AssignCourseModal',
 *   feature: 'business-panel',
 *   state: isOpen ? 'open' : 'closed',
 *   actions: ['select-users', 'set-deadline', 'submit']
 * })}>
 *   ...
 * </Modal>
 */
export function liaComponent(options: LiaComponentOptions): Record<string, string | undefined> {
  const attrs: Record<string, string | undefined> = {
    [LIA_DATA_ATTRIBUTES.COMPONENT]: options.name
  };

  if (options.props && Object.keys(options.props).length > 0) {
    // Sanitizar props para evitar datos sensibles
    const safeProps = sanitizeProps(options.props);
    attrs[LIA_DATA_ATTRIBUTES.PROPS] = JSON.stringify(safeProps);
  }

  if (options.state) {
    attrs[LIA_DATA_ATTRIBUTES.STATE] = options.state;
  }

  if (options.feature) {
    attrs[LIA_DATA_ATTRIBUTES.FEATURE] = options.feature;
  }

  if (options.actions && options.actions.length > 0) {
    attrs[LIA_DATA_ATTRIBUTES.ACTION] = options.actions.join(',');
  }

  if (options.isErrorBoundary) {
    attrs[LIA_DATA_ATTRIBUTES.ERROR_BOUNDARY] = 'true';
  }

  return attrs;
}

/**
 * Versión simplificada para casos básicos
 * 
 * @example
 * <button {...liaMarker('SubmitButton')}>Enviar</button>
 */
export function liaMarker(name: string, state?: string): Record<string, string | undefined> {
  return {
    [LIA_DATA_ATTRIBUTES.COMPONENT]: name,
    [LIA_DATA_ATTRIBUTES.STATE]: state
  };
}

/**
 * Marca un modal/overlay
 * 
 * @example
 * <Dialog {...liaModal('ConfirmDeleteModal', isOpen)}>...</Dialog>
 */
export function liaModal(name: string, isOpen: boolean): Record<string, string> {
  return {
    [LIA_DATA_ATTRIBUTES.COMPONENT]: name,
    [LIA_DATA_ATTRIBUTES.STATE]: isOpen ? 'open' : 'closed',
    [LIA_DATA_ATTRIBUTES.FEATURE]: 'modal'
  };
}

/**
 * Marca un formulario
 * 
 * @example
 * <form {...liaForm('LoginForm', { step: 1, hasErrors })}>...</form>
 */
export function liaForm(
  name: string, 
  state?: { step?: number; hasErrors?: boolean; isSubmitting?: boolean }
): Record<string, string> {
  let stateStr = 'idle';
  if (state) {
    const parts: string[] = [];
    if (state.step !== undefined) parts.push(`step-${state.step}`);
    if (state.hasErrors) parts.push('has-errors');
    if (state.isSubmitting) parts.push('submitting');
    stateStr = parts.join(' ') || 'idle';
  }

  return {
    [LIA_DATA_ATTRIBUTES.COMPONENT]: name,
    [LIA_DATA_ATTRIBUTES.STATE]: stateStr,
    [LIA_DATA_ATTRIBUTES.FEATURE]: 'form'
  };
}

/**
 * Marca una tabla/lista de datos
 * 
 * @example
 * <table {...liaDataTable('UsersTable', { itemCount: users.length, page: 1 })}>...</table>
 */
export function liaDataTable(
  name: string,
  state?: { itemCount?: number; page?: number; isLoading?: boolean; hasFilters?: boolean }
): Record<string, string> {
  let stateStr = 'idle';
  if (state) {
    const parts: string[] = [];
    if (state.itemCount !== undefined) parts.push(`items-${state.itemCount}`);
    if (state.page !== undefined) parts.push(`page-${state.page}`);
    if (state.isLoading) parts.push('loading');
    if (state.hasFilters) parts.push('filtered');
    stateStr = parts.join(' ') || 'idle';
  }

  return {
    [LIA_DATA_ATTRIBUTES.COMPONENT]: name,
    [LIA_DATA_ATTRIBUTES.STATE]: stateStr,
    [LIA_DATA_ATTRIBUTES.FEATURE]: 'data-table'
  };
}

/**
 * Marca un error boundary
 * 
 * @example
 * <ErrorBoundary {...liaErrorBoundary('CourseViewerBoundary')}>...</ErrorBoundary>
 */
export function liaErrorBoundary(name: string): Record<string, string> {
  return {
    [LIA_DATA_ATTRIBUTES.COMPONENT]: name,
    [LIA_DATA_ATTRIBUTES.ERROR_BOUNDARY]: 'true'
  };
}

/**
 * Sanitiza props para no incluir datos sensibles
 */
function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'ssn', 'credit', 'card', 'cvv', 'pin'
  ];

  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Omitir keys sensibles
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      continue;
    }

    // Simplificar valores complejos
    if (value === null || value === undefined) {
      safe[key] = null;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      safe[key] = value;
    } else if (typeof value === 'string') {
      // Truncar strings largos
      safe[key] = value.length > 50 ? value.substring(0, 50) + '...' : value;
    } else if (Array.isArray(value)) {
      safe[key] = `[Array(${value.length})]`;
    } else if (typeof value === 'object') {
      safe[key] = `[Object]`;
    } else {
      safe[key] = typeof value;
    }
  }

  return safe;
}

/**
 * Obtiene información de un elemento marcado con LIA attributes
 */
export function parseLiaElement(element: Element): {
  name: string;
  props?: Record<string, unknown>;
  state?: string;
  feature?: string;
  actions?: string[];
  isErrorBoundary?: boolean;
} | null {
  const name = element.getAttribute(LIA_DATA_ATTRIBUTES.COMPONENT);
  if (!name) return null;

  const result: ReturnType<typeof parseLiaElement> = { name };

  const propsStr = element.getAttribute(LIA_DATA_ATTRIBUTES.PROPS);
  if (propsStr) {
    try {
      result.props = JSON.parse(propsStr);
    } catch {
      // Ignorar props malformadas
    }
  }

  const state = element.getAttribute(LIA_DATA_ATTRIBUTES.STATE);
  if (state) result.state = state;

  const feature = element.getAttribute(LIA_DATA_ATTRIBUTES.FEATURE);
  if (feature) result.feature = feature;

  const actionsStr = element.getAttribute(LIA_DATA_ATTRIBUTES.ACTION);
  if (actionsStr) result.actions = actionsStr.split(',');

  const isErrorBoundary = element.getAttribute(LIA_DATA_ATTRIBUTES.ERROR_BOUNDARY);
  if (isErrorBoundary === 'true') result.isErrorBoundary = true;

  return result;
}

/**
 * Encuentra todos los componentes marcados en el DOM actual
 */
export function findAllLiaComponents(): Array<ReturnType<typeof parseLiaElement>> {
  if (typeof document === 'undefined') return [];

  const elements = document.querySelectorAll(`[${LIA_DATA_ATTRIBUTES.COMPONENT}]`);
  const components: Array<ReturnType<typeof parseLiaElement>> = [];

  elements.forEach(el => {
    const parsed = parseLiaElement(el);
    if (parsed) {
      components.push(parsed);
    }
  });

  return components;
}

/**
 * Encuentra componentes visibles en el viewport
 */
export function findVisibleLiaComponents(): Array<ReturnType<typeof parseLiaElement>> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return [];

  const elements = document.querySelectorAll(`[${LIA_DATA_ATTRIBUTES.COMPONENT}]`);
  const visible: Array<ReturnType<typeof parseLiaElement>> = [];

  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const isVisible = (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );

    if (isVisible) {
      const parsed = parseLiaElement(el);
      if (parsed) {
        visible.push(parsed);
      }
    }
  });

  return visible;
}

