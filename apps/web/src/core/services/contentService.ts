import { LandingPageContent } from '@shared/types/content';

// Mock data - En el futuro esto vendrá de una API
const mockLandingPageContent: LandingPageContent = {
  hero: {
    tag: "➤ Aprende y Aplica IA",
    title: "Domina la IA que transformará tu",
    highlightWord: "futuro",
    description: "Conviértete en experto aplicado: fundamentos claros, herramientas que importan, y hábitos de aprendizaje continuo para destacar en la era de la inteligencia artificial.",
    ctaText: "Iniciar Sesión",
    benefits: [
      "✓ Fundamentos de IA sin complicarte",
      "✓ Herramientas que realmente importan",
      "✓ Aplicación en proyectos reales",
      "✓ Hábitos de aprendizaje continuo"
    ]
  },
  features: {
    title: "¿Por qué elegir nuestra plataforma?",
    subtitle: "Descubre las ventajas que te harán destacar en el mundo de la IA",
    cards: [
      {
        id: "fundamentos",
        icon: "Cube",
        title: "Fundamentos Sólidos",
        description: "Aprende los conceptos esenciales de IA sin perderte en teoría innecesaria."
      },
      {
        id: "herramientas",
        icon: "Wrench",
        title: "Herramientas Prácticas",
        description: "Utiliza las herramientas que realmente importan en el mercado laboral."
      },
      {
        id: "proyectos",
        icon: "BarChart3",
        title: "Proyectos Reales",
        description: "Aplica tus conocimientos en proyectos del mundo real."
      },
      {
        id: "crecimiento",
        icon: "TrendingUp",
        title: "Crecimiento Continuo",
        description: "Desarrolla hábitos de aprendizaje que te mantendrán actualizado."
      }
    ]
  },
  statistics: [
    { value: "1000", label: "Estudiantes Activos" },
    { value: "50", label: "Proyectos Completados" },
    { value: "95", label: "% de Satisfacción" },
    { value: "24", label: "Horas de Contenido" }
  ],
  testimonials: {
    title: "Lo que dicen nuestros estudiantes",
    items: [
      {
        id: "testimonial-1",
        quote: "Esta plataforma transformó mi carrera. Los proyectos prácticos me dieron la confianza para aplicar IA en mi trabajo.",
        author: "Ana García",
        role: "Data Scientist"
      },
      {
        id: "testimonial-2",
        quote: "Excelente balance entre teoría y práctica. Logré implementar mis primeros modelos de ML en solo 3 meses.",
        author: "Carlos Mendoza",
        role: "Machine Learning Engineer"
      },
      {
        id: "testimonial-3",
        quote: "El enfoque aplicado y los proyectos reales hicieron que el aprendizaje fuera mucho más efectivo.",
        author: "María Rodríguez",
        role: "AI Consultant"
      }
    ]
  },
  cta: {
    title: "¿Listo para transformar tu futuro?",
    subtitle: "Únete a miles de estudiantes que ya están dominando la IA",
    buttonText: "Comenzar Ahora"
  }
};

export class ContentService {
  /**
   * Obtiene el contenido de la landing page
   * En el futuro esto hará una llamada a la API
   */
  static async fetchLandingPageContent(): Promise<LandingPageContent> {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // TODO: Reemplazar con llamada real a la API
      // const response = await fetch('/api/content/landing-page');
      // if (!response.ok) {
      //   throw new Error('Failed to fetch landing page content');
      // }
      // return await response.json();
      
      return mockLandingPageContent;
    } catch (error) {
      console.error('Error fetching landing page content:', error);
      // Retornar contenido mock como fallback
      return mockLandingPageContent;
    }
  }
  
  /**
   * Obtiene el contenido de la landing page con manejo de estados
   */
  static async getLandingPageContent() {
    try {
      return {
        data: await this.fetchLandingPageContent(),
        loading: false,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

