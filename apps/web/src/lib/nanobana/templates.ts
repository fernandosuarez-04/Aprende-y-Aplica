/**
 * Plantillas JSON para NanoBanana Pro
 * 
 * Estas plantillas sirven como base para la generación de esquemas JSON
 * estructurados que NanoBanana Pro puede renderizar con precisión.
 */

// Tipos base
export type NanoBananaDomain = 'ui' | 'photo' | 'diagram';
export type OutputFormat = 'wireframe' | 'mockup' | 'render' | 'diagram';
export type Emphasis = 'primary' | 'secondary' | 'background' | 'accent';
export type Position = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Interfaces base
export interface NanoBananaMeta {
  domain: NanoBananaDomain;
  style: string;
  outputFormat: OutputFormat;
  version: string;
  createdAt: string;
  title?: string;
  description?: string;
}

export interface NanoBananaEnvironment {
  lighting: string;
  background: string;
  mood: string;
  colorScheme?: 'light' | 'dark' | 'custom';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface NanoBananaScene {
  id: string;
  description: string;
  environment: NanoBananaEnvironment;
  dimensions?: {
    width: string;
    height: string;
  };
}

export interface NanoBananaEntity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
  position: Position | string;
  emphasis: Emphasis;
  children?: NanoBananaEntity[];
}

export interface AccessibilityConstraints {
  minTouchTarget?: string;
  contrastRatio?: string;
  colorBlindSafe?: boolean;
  ariaLabels?: boolean;
  focusIndicators?: boolean;
}

export interface NanoBananaConstraints {
  accessibility?: AccessibilityConstraints;
  brandGuidelines?: Record<string, unknown>;
  technicalRequirements?: Record<string, unknown>;
}

export interface NanoBananaVariation {
  id: string;
  description: string;
  changes: Record<string, unknown>;
}

export interface NanoBananaSchema {
  meta: NanoBananaMeta;
  scene: NanoBananaScene;
  entities: NanoBananaEntity[];
  constraints: NanoBananaConstraints;
  variations?: NanoBananaVariation[];
}

// ============================================================================
// PLANTILLAS PARA UI/WIREFRAMES
// ============================================================================

export const UI_MOBILE_APP_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'ui',
    style: 'modern-minimal',
    outputFormat: 'wireframe',
    version: '1.0',
    createdAt: new Date().toISOString(),
    title: 'Mobile App Template',
    description: 'Plantilla base para aplicaciones móviles'
  },
  scene: {
    id: 'scene_mobile_app',
    description: 'Aplicación móvil con navegación estándar',
    environment: {
      lighting: 'ambient',
      background: '#121212',
      mood: 'professional',
      colorScheme: 'dark',
      primaryColor: '#6366F1',
      secondaryColor: '#1E1E2E',
      accentColor: '#22D3EE'
    },
    dimensions: {
      width: '375px',
      height: '812px'
    }
  },
  entities: [
    {
      id: 'nav_status_bar',
      type: 'component',
      name: 'Status Bar',
      properties: {
        height: '44px',
        backgroundColor: 'transparent',
        elements: ['time', 'signal', 'battery']
      },
      position: 'top',
      emphasis: 'background'
    },
    {
      id: 'nav_header',
      type: 'component',
      name: 'Header',
      properties: {
        height: '56px',
        backgroundColor: '#1E1E2E',
        title: {
          text: 'App Title',
          fontSize: '18px',
          fontWeight: '600',
          color: '#FFFFFF'
        },
        actions: ['back', 'menu']
      },
      position: 'top',
      emphasis: 'primary'
    },
    {
      id: 'content_main',
      type: 'container',
      name: 'Main Content Area',
      properties: {
        flex: 1,
        padding: '16px',
        backgroundColor: '#121212',
        scrollable: true
      },
      position: 'center',
      emphasis: 'primary',
      children: []
    },
    {
      id: 'nav_bottom',
      type: 'component',
      name: 'Bottom Navigation',
      properties: {
        height: '56px',
        backgroundColor: '#1E1E2E',
        items: [
          { id: 'nav_home', icon: 'home', label: 'Inicio', active: true },
          { id: 'nav_search', icon: 'search', label: 'Buscar', active: false },
          { id: 'nav_profile', icon: 'user', label: 'Perfil', active: false }
        ]
      },
      position: 'bottom',
      emphasis: 'primary'
    }
  ],
  constraints: {
    accessibility: {
      minTouchTarget: '44px',
      contrastRatio: '4.5:1',
      colorBlindSafe: true,
      focusIndicators: true
    },
    technicalRequirements: {
      safeAreaInsets: true,
      notchSupport: true
    }
  }
};

export const UI_DASHBOARD_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'ui',
    style: 'corporate-modern',
    outputFormat: 'wireframe',
    version: '1.0',
    createdAt: new Date().toISOString(),
    title: 'Dashboard Template',
    description: 'Plantilla base para dashboards administrativos'
  },
  scene: {
    id: 'scene_dashboard',
    description: 'Dashboard con sidebar y métricas',
    environment: {
      lighting: 'ambient',
      background: '#0F172A',
      mood: 'professional',
      colorScheme: 'dark',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E293B',
      accentColor: '#10B981'
    },
    dimensions: {
      width: '1440px',
      height: '900px'
    }
  },
  entities: [
    {
      id: 'sidebar_main',
      type: 'container',
      name: 'Sidebar',
      properties: {
        width: '280px',
        backgroundColor: '#1E293B',
        padding: '24px 16px'
      },
      position: 'left',
      emphasis: 'secondary',
      children: [
        {
          id: 'sidebar_logo',
          type: 'component',
          name: 'Logo',
          properties: {
            height: '40px',
            marginBottom: '32px'
          },
          position: 'top',
          emphasis: 'primary'
        },
        {
          id: 'sidebar_nav',
          type: 'component',
          name: 'Navigation Menu',
          properties: {
            items: [
              { id: 'menu_dashboard', icon: 'grid', label: 'Dashboard', active: true },
              { id: 'menu_analytics', icon: 'chart', label: 'Analytics', active: false },
              { id: 'menu_users', icon: 'users', label: 'Usuarios', active: false },
              { id: 'menu_settings', icon: 'cog', label: 'Configuración', active: false }
            ]
          },
          position: 'top',
          emphasis: 'primary'
        }
      ]
    },
    {
      id: 'content_main',
      type: 'container',
      name: 'Main Content',
      properties: {
        flex: 1,
        padding: '32px',
        backgroundColor: '#0F172A'
      },
      position: 'center',
      emphasis: 'primary',
      children: [
        {
          id: 'header_page',
          type: 'component',
          name: 'Page Header',
          properties: {
            title: 'Dashboard',
            subtitle: 'Bienvenido de vuelta'
          },
          position: 'top',
          emphasis: 'primary'
        },
        {
          id: 'grid_metrics',
          type: 'container',
          name: 'Metrics Grid',
          properties: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            marginTop: '24px'
          },
          position: 'top',
          emphasis: 'primary',
          children: []
        }
      ]
    }
  ],
  constraints: {
    accessibility: {
      minTouchTarget: '44px',
      contrastRatio: '4.5:1',
      colorBlindSafe: true,
      ariaLabels: true
    }
  }
};

// ============================================================================
// PLANTILLAS PARA FOTOGRAFÍA/MARKETING
// ============================================================================

export const PHOTO_PRODUCT_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'photo',
    style: 'commercial-clean',
    outputFormat: 'render',
    version: '1.0',
    createdAt: new Date().toISOString(),
    title: 'Product Photography',
    description: 'Plantilla para fotografía de productos'
  },
  scene: {
    id: 'scene_product_photo',
    description: 'Fotografía de producto en estudio',
    environment: {
      lighting: 'studio-three-point',
      background: '#FFFFFF',
      mood: 'clean-professional'
    }
  },
  entities: [
    {
      id: 'product_main',
      type: 'product',
      name: 'Main Product',
      properties: {
        material: 'default',
        reflectivity: 0.3,
        shadow: {
          enabled: true,
          softness: 0.5,
          opacity: 0.3
        }
      },
      position: 'center',
      emphasis: 'primary'
    },
    {
      id: 'light_key',
      type: 'light',
      name: 'Key Light',
      properties: {
        type: 'softbox',
        intensity: 1.0,
        color: '#FFFFFF',
        angle: 45,
        distance: 'medium'
      },
      position: 'top-right',
      emphasis: 'background'
    },
    {
      id: 'light_fill',
      type: 'light',
      name: 'Fill Light',
      properties: {
        type: 'reflector',
        intensity: 0.5,
        color: '#FFFFFF',
        angle: -30
      },
      position: 'left',
      emphasis: 'background'
    },
    {
      id: 'light_rim',
      type: 'light',
      name: 'Rim Light',
      properties: {
        type: 'strip',
        intensity: 0.7,
        color: '#FFFFFF',
        angle: 135
      },
      position: 'top-left',
      emphasis: 'background'
    }
  ],
  constraints: {
    technicalRequirements: {
      aspectRatio: '1:1',
      resolution: '2000x2000',
      format: 'png',
      colorSpace: 'sRGB'
    }
  }
};

export const PHOTO_LIFESTYLE_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'photo',
    style: 'lifestyle-aspirational',
    outputFormat: 'render',
    version: '1.0',
    createdAt: new Date().toISOString(),
    title: 'Lifestyle Photography',
    description: 'Plantilla para fotografía lifestyle/marketing'
  },
  scene: {
    id: 'scene_lifestyle',
    description: 'Escena lifestyle con contexto de uso',
    environment: {
      lighting: 'natural-golden-hour',
      background: 'contextual-environment',
      mood: 'warm-inviting'
    }
  },
  entities: [
    {
      id: 'subject_main',
      type: 'subject',
      name: 'Main Subject/Product',
      properties: {
        inContext: true,
        interaction: 'being-used'
      },
      position: 'center',
      emphasis: 'primary'
    },
    {
      id: 'env_setting',
      type: 'environment',
      name: 'Setting',
      properties: {
        type: 'interior',
        style: 'modern-minimal',
        details: ['plants', 'natural-light', 'textures']
      },
      position: 'background',
      emphasis: 'secondary'
    },
    {
      id: 'props_supporting',
      type: 'props',
      name: 'Supporting Props',
      properties: {
        items: [],
        arrangement: 'natural-casual'
      },
      position: 'surrounding',
      emphasis: 'background'
    }
  ],
  constraints: {
    technicalRequirements: {
      aspectRatio: '16:9',
      resolution: 'high',
      format: 'jpeg',
      colorGrading: 'warm-tones'
    }
  }
};

// ============================================================================
// PLANTILLAS PARA DIAGRAMAS
// ============================================================================

export const DIAGRAM_FLOWCHART_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'diagram',
    style: 'technical-clean',
    outputFormat: 'diagram',
    version: '1.0',
    createdAt: new Date().toISOString(),
    title: 'Flowchart Diagram',
    description: 'Plantilla para diagramas de flujo'
  },
  scene: {
    id: 'scene_flowchart',
    description: 'Diagrama de flujo de proceso',
    environment: {
      lighting: 'flat',
      background: '#FFFFFF',
      mood: 'informative'
    }
  },
  entities: [
    {
      id: 'node_start',
      type: 'node',
      name: 'Start',
      properties: {
        shape: 'oval',
        backgroundColor: '#10B981',
        textColor: '#FFFFFF',
        text: 'Inicio',
        width: '120px',
        height: '60px'
      },
      position: 'top',
      emphasis: 'primary'
    },
    {
      id: 'node_process_1',
      type: 'node',
      name: 'Process 1',
      properties: {
        shape: 'rectangle',
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        text: 'Proceso',
        width: '160px',
        height: '80px'
      },
      position: 'center',
      emphasis: 'primary'
    },
    {
      id: 'node_decision',
      type: 'node',
      name: 'Decision',
      properties: {
        shape: 'diamond',
        backgroundColor: '#F59E0B',
        textColor: '#FFFFFF',
        text: '¿Condición?',
        width: '140px',
        height: '140px'
      },
      position: 'center',
      emphasis: 'accent'
    },
    {
      id: 'node_end',
      type: 'node',
      name: 'End',
      properties: {
        shape: 'oval',
        backgroundColor: '#EF4444',
        textColor: '#FFFFFF',
        text: 'Fin',
        width: '120px',
        height: '60px'
      },
      position: 'bottom',
      emphasis: 'primary'
    },
    {
      id: 'connector_1',
      type: 'connector',
      name: 'Arrow 1',
      properties: {
        from: 'node_start',
        to: 'node_process_1',
        style: 'arrow',
        color: '#64748B',
        strokeWidth: '2px'
      },
      position: 'center',
      emphasis: 'secondary'
    }
  ],
  constraints: {
    technicalRequirements: {
      gridAlignment: true,
      vectorFormat: true,
      flowDirection: 'top-to-bottom'
    }
  }
};

export const DIAGRAM_ARCHITECTURE_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'diagram',
    style: 'technical-detailed',
    outputFormat: 'diagram',
    version: '1.0',
    createdAt: new Date().toISOString(),
    title: 'Architecture Diagram',
    description: 'Plantilla para diagramas de arquitectura de sistemas'
  },
  scene: {
    id: 'scene_architecture',
    description: 'Diagrama de arquitectura de sistema',
    environment: {
      lighting: 'flat',
      background: '#F8FAFC',
      mood: 'technical'
    }
  },
  entities: [
    {
      id: 'layer_frontend',
      type: 'layer',
      name: 'Frontend Layer',
      properties: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
        label: 'Frontend'
      },
      position: 'top',
      emphasis: 'primary',
      children: [
        {
          id: 'comp_web_app',
          type: 'component',
          name: 'Web App',
          properties: {
            icon: 'browser',
            technology: 'React/Next.js'
          },
          position: 'left',
          emphasis: 'primary'
        },
        {
          id: 'comp_mobile_app',
          type: 'component',
          name: 'Mobile App',
          properties: {
            icon: 'smartphone',
            technology: 'React Native'
          },
          position: 'right',
          emphasis: 'primary'
        }
      ]
    },
    {
      id: 'layer_backend',
      type: 'layer',
      name: 'Backend Layer',
      properties: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
        label: 'Backend'
      },
      position: 'center',
      emphasis: 'primary',
      children: [
        {
          id: 'comp_api',
          type: 'component',
          name: 'API Server',
          properties: {
            icon: 'server',
            technology: 'Node.js/Express'
          },
          position: 'center',
          emphasis: 'primary'
        }
      ]
    },
    {
      id: 'layer_data',
      type: 'layer',
      name: 'Data Layer',
      properties: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        label: 'Data'
      },
      position: 'bottom',
      emphasis: 'primary',
      children: [
        {
          id: 'comp_database',
          type: 'component',
          name: 'Database',
          properties: {
            icon: 'database',
            technology: 'PostgreSQL'
          },
          position: 'left',
          emphasis: 'primary'
        },
        {
          id: 'comp_cache',
          type: 'component',
          name: 'Cache',
          properties: {
            icon: 'zap',
            technology: 'Redis'
          },
          position: 'right',
          emphasis: 'secondary'
        }
      ]
    }
  ],
  constraints: {
    technicalRequirements: {
      gridAlignment: true,
      vectorFormat: true,
      layerSpacing: '40px'
    }
  }
};

// ============================================================================
// MAPA DE PLANTILLAS
// ============================================================================

export const TEMPLATES_BY_DOMAIN: Record<NanoBananaDomain, NanoBananaSchema[]> = {
  ui: [UI_MOBILE_APP_TEMPLATE, UI_DASHBOARD_TEMPLATE],
  photo: [PHOTO_PRODUCT_TEMPLATE, PHOTO_LIFESTYLE_TEMPLATE],
  diagram: [DIAGRAM_FLOWCHART_TEMPLATE, DIAGRAM_ARCHITECTURE_TEMPLATE]
};

// Función helper para obtener plantilla por dominio y tipo
export function getTemplate(domain: NanoBananaDomain, index: number = 0): NanoBananaSchema {
  const templates = TEMPLATES_BY_DOMAIN[domain];
  return templates[Math.min(index, templates.length - 1)];
}

// Función para crear una copia de plantilla con nuevo ID
export function cloneTemplate(template: NanoBananaSchema): NanoBananaSchema {
  const clone = JSON.parse(JSON.stringify(template));
  clone.meta.createdAt = new Date().toISOString();
  clone.scene.id = `${clone.scene.id}_${Date.now()}`;
  return clone;
}

