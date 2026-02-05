import { LandingPageContent, BusinessPageContent } from '@aprende-y-aplica/shared';

// Mock data - En el futuro esto vendrÃ¡ de una API
const mockLandingPageContent: LandingPageContent = {
  hero: {
    tag: "âž¤ SOFLIA",
    title: "SOFLIA: Domina la IA que transformarÃ¡ tu",
    highlightWord: "futuro",
    description: "ConviÃ©rtete en experto aplicado: fundamentos claros, herramientas que importan, y hÃ¡bitos de aprendizaje continuo para destacar en la era de la inteligencia artificial.",
    ctaText: "Iniciar SesiÃ³n",
    benefits: [
      "âœ“ Fundamentos de IA sin complicarte",
      "âœ“ Herramientas que realmente importan",
      "âœ“ Experiencia personalizada a tu perfil",
      "âœ“ HÃ¡bitos de aprendizaje continuo"
    ]
  },
  features: {
    title: "Â¿Por quÃ© elegir nuestra plataforma?",
    subtitle: "Descubre las ventajas que te harÃ¡n destacar en el mundo de la IA",
    cards: [
      {
        id: "fundamentos",
        icon: "BookOpen",
        title: "Fundamentos SÃ³lidos",
        description: "Aprende los conceptos esenciales de IA sin perderte en teorÃ­a innecesaria."
      },
      {
        id: "herramientas",
        icon: "Settings",
        title: "Herramientas PrÃ¡cticas",
        description: "Utiliza las herramientas que realmente importan en el mercado laboral."
      },
      {
        id: "personalizada",
        icon: "User",
        title: "Experiencia Personalizada",
        description: "La plataforma adapta el contenido y el ritmo de aprendizaje segÃºn tu perfil profesional y objetivos."
      },
      {
        id: "crecimiento",
        icon: "TrendingUp",
        title: "Crecimiento Continuo",
        description: "Desarrolla hÃ¡bitos de aprendizaje que te mantendrÃ¡n actualizado."
      }
    ]
  },
  statistics: [
    { value: "1000", label: "Estudiantes Activos" },
    { value: "50", label: "Cursos en la Plataforma" },
    { value: "95", label: "% de SatisfacciÃ³n" },
    { value: "24", label: "Horas de Contenido" }
  ],
  testimonials: {
    title: "Lo que dicen nuestros estudiantes",
    items: [
      {
        id: "testimonial-1",
        quote: "Esta plataforma transformÃ³ mi carrera. Los proyectos prÃ¡cticos me dieron la confianza para aplicar IA en mi trabajo.",
        author: "Ana GarcÃ­a",
        role: "Data Scientist"
      },
      {
        id: "testimonial-2",
        quote: "Excelente balance entre teorÃ­a y prÃ¡ctica. LogrÃ© implementar mis primeros modelos de ML en solo 3 meses.",
        author: "Carlos Mendoza",
        role: "Machine Learning Engineer"
      },
      {
        id: "testimonial-3",
        quote: "El enfoque aplicado y los proyectos reales hicieron que el aprendizaje fuera mucho mÃ¡s efectivo.",
        author: "MarÃ­a RodrÃ­guez",
        role: "AI Consultant"
      }
    ]
  },
  cta: {
    title: "Â¿Listo para transformar tu futuro?",
    subtitle: "Ãšnete a miles de estudiantes que ya estÃ¡n dominando la IA",
    buttonText: "Comenzar Ahora"
  }
};

// Mock data para Business Page
const mockBusinessPageContent: BusinessPageContent = {
  hero: {
    tag: "ðŸš€ SOFLIA Business",
    title: "Soluciones IA para",
    highlightWord: "tu organizaciÃ³n",
    description: "Ya seas una empresa buscando capacitar a tu equipo o un instructor profesional, tenemos la plataforma perfecta para ti.",
    ctaText: "Contactar Ventas",
    benefits: [
      "âœ“ Soluciones personalizadas para empresas",
      "âœ“ Herramientas profesionales para instructores",
      "âœ“ Analytics y reportes detallados",
      "âœ“ Soporte dedicado"
    ]
  },
  benefits: {
    title: "Todo lo que necesitas",
    subtitle: "Funcionalidades diseÃ±adas para empresas e instructores profesionales",
    cards: [
      {
        id: "admin",
        icon: "Shield",
        title: "Panel de AdministraciÃ³n",
        description: "Gestiona usuarios, asigna cursos y monitorea el progreso desde un solo lugar."
      },
      {
        id: "analytics",
        icon: "BarChart",
        title: "Analytics Avanzados",
        description: "Reportes detallados sobre desempeÃ±o, certificaciones y ROI."
      },
      {
        id: "custom",
        icon: "Settings",
        title: "PersonalizaciÃ³n",
        description: "Contenido personalizado e integraciones segÃºn tus necesidades."
      },
      {
        id: "support",
        icon: "Headphones",
        title: "Soporte 24/7",
        description: "Asistencia prioritaria y consultorÃ­a especializada."
      }
    ]
  },
  instructors: {
    title: "Instructores Expertos",
    subtitle: "Aprende de los mejores profesionales de IA en el mercado",
    items: [
      {
        id: "instructor-1",
        name: "Dr. Laura MartÃ­nez",
        role: "AI Research Lead",
        bio: "PhD en Machine Learning con 15 aÃ±os de experiencia. Ha liderado proyectos de IA para Fortune 500.",
        rating: 4.9,
        students: 15000,
        courses: 8,
        expertise: ["Machine Learning", "Deep Learning", "NLP"]
      },
      {
        id: "instructor-2",
        name: "Ing. Carlos Herrera",
        role: "Data Science Director",
        bio: "Experto en implementaciÃ³n de IA en empresas. Consultor para startups unicornio en Latam.",
        rating: 4.8,
        students: 12000,
        courses: 6,
        expertise: ["Data Science", "Computer Vision", "MLOps"]
      },
      {
        id: "instructor-3",
        name: "MSc. Ana RodrÃ­guez",
        role: "AI Strategy Advisor",
        bio: "Especialista en transformaciÃ³n digital con IA. Ha capacitado a mÃ¡s de 500 ejecutivos.",
        rating: 4.9,
        students: 8500,
        courses: 5,
        expertise: ["Business AI", "Strategy", "Ethics"]
      }
    ]
  },
  companies: {
    title: "Para Empresas",
    subtitle: "CapacitaciÃ³n IA escalable para toda tu organizaciÃ³n",
    cards: [
      {
        id: "team",
        icon: "Users",
        title: "GestiÃ³n de Equipos",
        description: "Administra usuarios, asigna cursos y establece objetivos de aprendizaje para todo tu equipo."
      },
      {
        id: "certifications",
        icon: "Award",
        title: "Certificaciones",
        description: "Emite certificados oficiales reconocidos para validar las habilidades de tu equipo."
      },
      {
        id: "roi",
        icon: "TrendingUp",
        title: "ROI Medible",
        description: "Reportes detallados que demuestran el impacto real de la capacitaciÃ³n en tus mÃ©tricas."
      },
      {
        id: "integration",
        icon: "Link",
        title: "Integraciones",
        description: "ConÃ©ctate con tu LMS existente, Slack, Microsoft Teams y mÃ¡s herramientas empresariales."
      }
    ],
    pricing: {
      title: "Planes para Empresas",
      subtitle: "Elige el plan que mejor se adapte al tamaÃ±o de tu organizaciÃ³n",
      tiers: [
        {
          id: "team",
          name: "Team",
          description: "Perfecto para equipos pequeÃ±os",
          price: "$99",
          period: "mes",
          features: [
            "Hasta 10 usuarios",
            "Acceso a todos los cursos",
            "Certificaciones incluidas",
            "Reportes bÃ¡sicos",
            "Soporte por email"
          ],
          isPopular: false,
          ctaText: "Contratar Plan"
        },
        {
          id: "business",
          name: "Business",
          description: "Ideal para empresas en crecimiento",
          price: "$399",
          period: "mes",
          features: [
            "Hasta 50 usuarios",
            "Acceso a todos los cursos",
            "Certificaciones ilimitadas",
            "Analytics avanzados",
            "Panel de administraciÃ³n",
            "Soporte prioritario",
            "Contenido personalizado"
          ],
          isPopular: true,
          ctaText: "Empezar Ahora"
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "Soluciones a medida para grandes organizaciones",
          price: "Personalizado",
          period: "",
          features: [
            "Usuarios ilimitados",
            "Acceso a todos los cursos",
            "Certificaciones ilimitadas",
            "Analytics empresariales",
            "Panel administraciÃ³n avanzado",
            "Soporte 24/7 dedicado",
            "Contenido 100% personalizado",
            "IntegraciÃ³n con LMS",
            "ConsultorÃ­a estratÃ©gica",
            "Branding corporativo"
          ],
          isPopular: false,
          ctaText: "Contactar Ventas"
        }
      ]
    },
    comparison: {
      title: "ComparaciÃ³n de CaracterÃ­sticas",
      subtitle: "Elige el plan que mejor se adapte a tus necesidades",
      categories: [
        {
          name: "AdministraciÃ³n y GestiÃ³n",
          features: [
            {
              name: "Panel de administraciÃ³n",
              description: "Gestiona usuarios y asignaciones de cursos",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "AsignaciÃ³n de cursos con mensajerÃ­a",
              description: "Personaliza mensajes al asignar cursos",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Grupos de usuarios personalizados",
              description: "Organiza tu equipo por departamentos o roles",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "AdministraciÃ³n avanzada de grupos",
              description: "Control granular por grupo",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Branding corporativo",
              description: "Personaliza la plataforma con tu logo y colores",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "AnÃ¡lisis e Informes",
          features: [
            {
              name: "Reportes bÃ¡sicos",
              description: "EstadÃ­sticas de progreso y completaciÃ³n",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Analytics avanzados",
              description: "AnÃ¡lisis profundo de aprendizaje",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "InformaciÃ³n de habilidades",
              description: "Skills insights y gaps de conocimiento",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "AnÃ¡lisis de cursos",
              description: "Performance y engagement por curso",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Dashboard personalizado",
              description: "Dashboards a medida por necesidad",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "ExportaciÃ³n de datos",
              description: "Exporta reportes en mÃºltiples formatos",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Experiencia del Usuario",
          features: [
            {
              name: "Acceso a catÃ¡logo completo",
              description: "Todos los cursos disponibles",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Certificaciones ilimitadas",
              description: "Sin lÃ­mite de certificaciones emitidas",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Certificados personalizados",
              description: "DiseÃ±o de certificados propio",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "AplicaciÃ³n mÃ³vil",
              description: "Acceso desde dispositivos mÃ³viles",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Offline learning",
              description: "Descarga cursos para ver offline",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Cursos en vivo",
              description: "Webinars y sesiones en tiempo real",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Integraciones",
          features: [
            {
              name: "Single Sign-On (SSO)",
              description: "IntegraciÃ³n con tu proveedor de identidad",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Integraciones LMS",
              description: "ConexiÃ³n con Learning Management Systems",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "API de reportes",
              description: "Accede a datos via API",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "IntegraciÃ³n con Slack",
              description: "Notificaciones y acceso desde Slack",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "IntegraciÃ³n con Microsoft Teams",
              description: "Acceso directo desde Teams",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Webhooks personalizados",
              description: "Eventos en tiempo real",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Soporte y Servicios",
          features: [
            {
              name: "Soporte por email",
              description: "Tiempo de respuesta 24-48 horas",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Soporte prioritario",
              description: "Respuesta rÃ¡pida garantizada",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Soporte 24/7 dedicado",
              description: "Equipo dedicado disponible siempre",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Customer Success Manager",
              description: "Gerente de cuenta asignado",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Onboarding personalizado",
              description: "CapacitaciÃ³n a medida para tu equipo",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "ConsultorÃ­a estratÃ©gica",
              description: "AsesorÃ­a en estrategia de aprendizaje",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        }
      ]
    },
    testimonials: [
      {
        id: "company-testimonial-1",
        quote: "Implementar Aprende y Aplica Business ha sido una de las mejores decisiones. Nuestro equipo ahora domina las herramientas de IA mÃ¡s relevantes.",
        author: "Roberto Silva",
        role: "CTO, TechSolutions Inc."
      },
      {
        id: "company-testimonial-2",
        quote: "Los reportes detallados nos permiten medir el ROI real de la capacitaciÃ³n. Hemos visto un aumento del 40% en productividad.",
        author: "Patricia LÃ³pez",
        role: "CHRO, Innovation Group"
      },
      {
        id: "company-testimonial-3",
        quote: "El soporte dedicado y la personalizaciÃ³n del contenido superaron nuestras expectativas. Altamente recomendado.",
        author: "Miguel Torres",
        role: "CEO, Digital Transform Co."
      }
    ],
    faq: {
      title: "Preguntas Frecuentes - Empresas",
      subtitle: "Todo lo que necesitas saber sobre Aprende y Aplica Business",
      items: [
        {
          question: "Â¿CÃ³mo funciona la facturaciÃ³n?",
          answer: "Ofrecemos planes mensuales y anuales. Los planes anuales incluyen un descuento del 20%. La facturaciÃ³n es automÃ¡tica y puedes cambiar o cancelar tu plan en cualquier momento desde tu panel de administraciÃ³n."
        },
        {
          question: "Â¿Puedo agregar o eliminar usuarios durante el ciclo?",
          answer: "SÃ­, puedes escalar tu equipo segÃºn tus necesidades. Los usuarios adicionales se facturan de forma prorrateada, y puedes eliminar usuarios en cualquier momento sin penalizaciones."
        },
        {
          question: "Â¿CÃ³mo funciona la integraciÃ³n con nuestro LMS actual?",
          answer: "Ofrecemos integraciones nativas con los principales LMS del mercado, incluyendo SCORM, xAPI y LTI. Nuestro equipo de Customer Success te ayudarÃ¡ a configurar la integraciÃ³n durante el onboarding."
        },
        {
          question: "Â¿QuÃ© incluye el soporte?",
          answer: "El soporte varÃ­a segÃºn tu plan. Team incluye soporte por email, Business incluye soporte prioritario con garantÃ­a de respuesta en 4 horas, y Enterprise incluye soporte 24/7 dedicado con un Customer Success Manager asignado."
        },
        {
          question: "Â¿Puedo probar la plataforma antes de comprar?",
          answer: "Â¡Absolutamente! Ofrecemos una prueba gratuita de 14 dÃ­as para todos los planes. No requiere tarjeta de crÃ©dito y tendrÃ¡s acceso completo a todas las funcionalidades del plan que elijas."
        },
        {
          question: "Â¿Los certificados son reconocidos?",
          answer: "SÃ­, nuestros certificados son oficiales y verificables digitalmente. Incluyen cÃ³digos QR para validaciÃ³n en lÃ­nea y estÃ¡n diseÃ±ados para ser compartidos en LinkedIn y otros perfiles profesionales."
        }
      ]
    }
  },
  instructorsInfo: {
    title: "Para Instructores",
    subtitle: "Monetiza tu conocimiento y crea contenido de impacto",
    cards: [
      {
        id: "monetization",
        icon: "DollarSign",
        title: "MonetizaciÃ³n",
        description: "Genera ingresos vendiendo tus cursos y recibe pagos automÃ¡ticos por cada venta."
      },
      {
        id: "analytics-instructor",
        icon: "BarChart",
        title: "Analytics Profesionales",
        description: "Analiza el desempeÃ±o de tus cursos, audiencia y tasa de conversiÃ³n en tiempo real."
      },
      {
        id: "tools",
        icon: "Wrench",
        title: "Herramientas Creadas",
        description: "Editor de video, cuestionarios interactivos, certificados personalizados y mÃ¡s."
      },
      {
        id: "support-instructor",
        icon: "GraduationCap",
        title: "Programa de Soporte",
        description: "Recursos exclusivos, mentorÃ­as y comunidad de instructores para ayudarte a crecer."
      }
    ],
    benefits: [
      "âœ“ RetenciÃ³n alta: hasta 80% de comisiones",
      "âœ“ Crea cursos ilimitados sin restricciones",
      "âœ“ PromociÃ³n automÃ¡tica a nuestra audiencia",
      "âœ“ Pagos seguros y puntuales cada mes",
      "âœ“ Herramientas de marketing incluidas"
    ],
    process: {
      title: "CÃ³mo Convertirte en Instructor",
      steps: [
        {
          id: "step-1",
          title: "Aplica",
          description: "Completa el formulario de aplicaciÃ³n y comparte tu experiencia profesional."
        },
        {
          id: "step-2",
          title: "RevisiÃ³n",
          description: "Nuestro equipo revisa tu perfil y te contacta para una entrevista."
        },
        {
          id: "step-3",
          title: "Onboarding",
          description: "Recibe capacitaciÃ³n sobre nuestras herramientas y mejores prÃ¡cticas."
        },
        {
          id: "step-4",
          title: "Publica",
          description: "Crea tu primer curso y comienza a monetizar tu conocimiento."
        }
      ]
    },
    testimonials: [
      {
        id: "instructor-testimonial-1",
        quote: "Gracias a Aprende y Aplica Business he podido monetizar mi experiencia de 15 aÃ±os en Machine Learning. La plataforma es intuitiva y el soporte excepcional.",
        author: "Dr. Laura MartÃ­nez",
        role: "Instructor desde 2022"
      },
      {
        id: "instructor-testimonial-2",
        quote: "Los analytics me ayudan a optimizar constantemente mis cursos. He visto un crecimiento del 200% en mis ingresos en solo 6 meses.",
        author: "Ing. Carlos Herrera",
        role: "Instructor desde 2023"
      },
      {
        id: "instructor-testimonial-3",
        quote: "La comunidad de instructores y los recursos disponibles son invaluables. RecomendarÃ­a esta plataforma sin dudarlo.",
        author: "MSc. Ana RodrÃ­guez",
        role: "Instructor desde 2022"
      }
    ],
    faq: {
      title: "Preguntas Frecuentes - Instructores",
      subtitle: "Todo lo que necesitas saber para monetizar tu conocimiento",
      items: [
        {
          question: "Â¿CÃ³mo funciona el sistema de comisiones?",
          answer: "Ofrecemos una de las tasas de comisiÃ³n mÃ¡s competitivas del mercado. Los instructores reciben hasta 80% de los ingresos por cada venta, dependiendo del volumen de cursos vendidos y la trayectoria en la plataforma."
        },
        {
          question: "Â¿CuÃ¡ndo y cÃ³mo recibo mis pagos?",
          answer: "Los pagos se realizan mensualmente entre los dÃ­as 1 y 5 de cada mes. Utilizamos Stripe para pagos seguros y puedes configurar tu cuenta bancaria o PayPal para recibir los fondos directamente."
        },
        {
          question: "Â¿QuÃ© herramientas me proporcionan para crear contenido?",
          answer: "Acceso completo a nuestro editor de video integrado, creador de cuestionarios interactivos, diseÃ±ador de certificados personalizados, herramientas de captura de pantalla, y mucho mÃ¡s. Todo incluido sin costos adicionales."
        },
        {
          question: "Â¿CÃ³mo me ayudan a promocionar mis cursos?",
          answer: "Nuestro equipo de marketing promociona activamente todos los cursos en nuestras redes sociales, newsletters y plataforma. TambiÃ©n ofrecemos recursos de marketing para que promociones tus cursos de forma efectiva."
        },
        {
          question: "Â¿Hay lÃ­mites en la cantidad de cursos que puedo crear?",
          answer: "No hay lÃ­mites. Puedes crear tantos cursos como desees sin restricciones. Nuestra plataforma estÃ¡ diseÃ±ada para escalar con tu crecimiento como instructor."
        },
        {
          question: "Â¿QuÃ© apoyo recibo como instructor?",
          answer: "Incluye acceso a nuestra comunidad privada de instructores, mentorÃ­as mensuales con expertos, recursos educativos avanzados, seminarios web exclusivos y soporte tÃ©cnico priorizado para todas tus necesidades."
        }
      ]
    }
  },
  cta: {
    title: "Â¿Listo para comenzar?",
    subtitle: "Ãšnete a cientos de empresas e instructores que confÃ­an en nosotros",
    buttonText: "Contactar Ventas"
  }
};

export class ContentService {
  /**
   * Obtiene el contenido de la landing page
   * En el futuro esto harÃ¡ una llamada a la API
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
      // console.error('Error fetching landing page content:', error);
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

  /**
   * Obtiene el contenido de la pÃ¡gina business
   */
  static async fetchBusinessPageContent(): Promise<BusinessPageContent> {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // TODO: Reemplazar con llamada real a la API
      return mockBusinessPageContent;
    } catch (error) {
      // console.error('Error fetching business page content:', error);
      return mockBusinessPageContent;
    }
  }

  /**
   * Obtiene el contenido de la pÃ¡gina business con manejo de estados
   */
  static async getBusinessPageContent() {
    try {
      return {
        data: await this.fetchBusinessPageContent(),
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

