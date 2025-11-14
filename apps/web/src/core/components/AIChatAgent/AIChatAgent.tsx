'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Send,
  Mic,
  MicOff,
  Loader2,
  User,
  ChevronUp,
  Bug
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { ReporteProblema } from '../ReporteProblema/ReporteProblema';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatAgentProps {
  assistantName?: string;
  assistantAvatar?: string;
  initialMessage?: string;
  promptPlaceholder?: string;
  context?: string; // Contexto específico para el agente (workshops, communities, news)
}

// Función para detectar automáticamente el contexto basado en la URL
// ✅ MEJORADO: Detección automática flexible que funciona con nuevas páginas sin configuración manual
function detectContextFromURL(pathname: string): string {
  const pathLower = pathname.toLowerCase();
  
  // Detección automática por palabras clave en la URL
  // Esto permite que nuevas páginas se detecten automáticamente si usan palabras clave conocidas
  if (pathLower.includes('communities') || pathLower.includes('comunidades')) return 'communities';
  if (pathLower.includes('courses') || pathLower.includes('cursos') || pathLower.includes('learn') || pathLower.includes('aprender')) return 'courses';
  if (pathLower.includes('workshops') || pathLower.includes('talleres')) return 'workshops';
  if (pathLower.includes('news') || pathLower.includes('noticias') || pathLower.includes('articles') || pathLower.includes('articulos')) return 'news';
  if (pathLower.includes('dashboard') || pathLower.includes('panel') || pathLower.includes('inicio')) return 'dashboard';
  if (pathLower.includes('prompt')) return 'prompts';
  if (pathLower.includes('apps-directory') || (pathLower.includes('apps') && pathLower.includes('directorio'))) return 'apps';
  if (pathLower.includes('business') || pathLower.includes('empresas') || pathLower.includes('negocios')) return 'business';
  if (pathLower.includes('profile') || pathLower.includes('perfil') || pathLower.includes('account') || pathLower.includes('cuenta')) return 'profile';
  if (pathLower.includes('admin') || pathLower.includes('administracion')) return 'admin';
  if (pathLower.includes('instructor') || pathLower.includes('instructores')) return 'instructor';
  if (pathLower.includes('certificates') || pathLower.includes('certificados')) return 'certificates';
  if (pathLower.includes('reels')) return 'reels';
  if (pathLower.includes('subscriptions') || pathLower.includes('suscripciones')) return 'subscriptions';
  if (pathLower.includes('cart') || pathLower.includes('carrito')) return 'cart';
  if (pathLower.includes('my-courses') || pathLower.includes('mis-cursos')) return 'courses';
  
  return 'general';
}

// Función para obtener información contextual detallada de la página actual
// ✅ MEJORADO: Usa contenido del DOM automáticamente, solo usa mapeo hardcoded como fallback
function getPageContextInfo(pathname: string, pageContent?: {
  title: string;
  metaDescription: string;
  headings: string[];
  mainText: string;
}): string {
  // PRIORIDAD 1: Si tenemos contenido extraído del DOM, usarlo para generar descripción automática
  if (pageContent) {
    let description = '';
    
    // Usar meta description si está disponible (más descriptivo)
    if (pageContent.metaDescription && pageContent.metaDescription.trim()) {
      return pageContent.metaDescription;
    }
    
    // Si no hay meta description, usar título + primer heading
    if (pageContent.title && pageContent.title.trim()) {
      description = `página "${pageContent.title}"`;
      
      // Agregar primer heading si está disponible para más contexto
      if (pageContent.headings && pageContent.headings.length > 0) {
        description += ` - ${pageContent.headings[0]}`;
      }
      
      return description;
    }
    
    // Si solo tenemos headings, usarlos
    if (pageContent.headings && pageContent.headings.length > 0) {
      return `página con contenido sobre "${pageContent.headings[0]}"`;
    }
  }
  
  // PRIORIDAD 2: Mapeo hardcoded solo como fallback para páginas conocidas
  // Esto se usa cuando el DOM aún no se ha cargado o no tiene metadatos
  const contextMap: Record<string, string> = {
    '/communities': 'página de comunidades - donde los usuarios pueden unirse y participar en grupos',
    '/courses': 'página de cursos - catálogo de cursos disponibles para aprendizaje',
    '/workshops': 'página de talleres - eventos y sesiones de formación',
    '/news': 'página de noticias - últimas actualizaciones y anuncios',
    '/dashboard': 'panel principal del usuario - vista general de su actividad',
    '/prompt-directory': 'directorio de prompts - colección de plantillas de prompts de IA',
    '/business-panel': 'panel de negocios - herramientas para empresas',
    '/profile': 'página de perfil de usuario',
  };

  // Buscar coincidencia exacta primero
  if (contextMap[pathname]) {
    return contextMap[pathname];
  }

  // Buscar coincidencia parcial
  for (const [path, description] of Object.entries(contextMap)) {
    if (pathname.includes(path)) {
      return description;
    }
  }
  
  // PRIORIDAD 3: Generar descripción automática desde la URL
  const area = detectContextFromURL(pathname);
  const areaNames: Record<string, string> = {
    communities: 'comunidades',
    courses: 'cursos',
    workshops: 'talleres',
    news: 'noticias',
    dashboard: 'panel principal',
    prompts: 'directorio de prompts',
    apps: 'directorio de apps',
    business: 'panel de negocios',
    profile: 'perfil de usuario',
    admin: 'panel de administración',
    instructor: 'panel de instructor',
    certificates: 'certificados',
    reels: 'reels',
    subscriptions: 'suscripciones',
    cart: 'carrito de compras',
  };
  
  if (areaNames[area]) {
    return `página de ${areaNames[area]}`;
  }

  return 'página de la plataforma';
}

// Función para extraer contenido dinámico real del DOM
function extractPageContent(): {
  title: string;
  metaDescription: string;
  headings: string[];
  mainText: string;
} {
  // Verificar que estamos en el navegador (no SSR)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      title: '',
      metaDescription: '',
      headings: [],
      mainText: ''
    };
  }

  // Extraer el título de la página
  const title = document.title || '';

  // Extraer meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                   document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

  // Extraer los principales encabezados (h1, h2)
  const headings: string[] = [];
  const h1Elements = document.querySelectorAll('h1');
  const h2Elements = document.querySelectorAll('h2');
  
  h1Elements.forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 0) headings.push(text);
  });
  
  h2Elements.forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 0 && headings.length < 5) headings.push(text);
  });

  // Extraer texto visible del contenido principal
  let mainText = '';
  
  // Intentar encontrar el contenido principal por selectores comunes
  const mainSelectors = [
    'main',
    '[role="main"]',
    '#main-content',
    '.main-content',
    'article',
    '.content',
    '.container'
  ];

  let mainElement: Element | null = null;
  for (const selector of mainSelectors) {
    mainElement = document.querySelector(selector);
    if (mainElement) break;
  }

  // Si encontramos el elemento principal, extraer su texto
  if (mainElement) {
    // Clonar el elemento para no afectar el DOM real
    const clone = mainElement.cloneNode(true) as Element;
    
    // Remover elementos que no queremos (scripts, estilos, navegación)
    const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', '.nav', '.navbar'];
    unwantedSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });
    
    mainText = clone.textContent?.trim() || '';
  } else {
    // Fallback: usar el body pero excluir navegación y footer
    const bodyClone = document.body.cloneNode(true) as Element;
    const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', '.nav', '.navbar'];
    unwantedSelectors.forEach(sel => {
      bodyClone.querySelectorAll(sel).forEach(el => el.remove());
    });
    mainText = bodyClone.textContent?.trim() || '';
  }

  // Limitar el texto a 800 caracteres para no sobrecargar el prompt
  if (mainText.length > 800) {
    mainText = mainText.substring(0, 800) + '...';
  }

  // Limpiar espacios múltiples y saltos de línea
  mainText = mainText.replace(/\s+/g, ' ').trim();

  return {
    title,
    metaDescription: metaDesc,
    headings: headings.slice(0, 5), // Máximo 5 encabezados
    mainText
  };
}

export function AIChatAgent({
  assistantName = 'Lia',
  assistantAvatar = '/lia-avatar.png',
  initialMessage = '¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con cualquier pregunta que tengas.',
  promptPlaceholder = 'Escribe tu pregunta...',
  context = 'general'
}: AIChatAgentProps) {
  const pathname = usePathname();

  // Detectar automáticamente el contexto basado en la URL
  const detectedContext = detectContextFromURL(pathname);
  const activeContext = context === 'general' ? detectedContext : context;

  // Detectar si estamos en página de comunidades
  const isCommunitiesPage = pathname?.includes('/communities');
  
  // Detectar si la página usa el DashboardNavbar (sticky)
  const hasDashboardNavbar = useMemo(() => {
    if (!pathname) return false;
    const dashboardPrefixes = [
      '/dashboard',
      '/my-courses',
      '/courses',
      '/prompt-directory',
      '/apps-directory',
      '/communities',
      '/news',
      '/statistics',
      '/questionnaire',
      '/cart',
      '/subscriptions',
      '/payment-methods',
      '/purchase-history',
      '/account-settings',
      '/certificates'
    ];
    return dashboardPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  // Estado para detectar si es desktop (≥ 1024px, breakpoint lg de Tailwind)
  const [isDesktop, setIsDesktop] = useState(false);

  // Detectar tamaño de pantalla con media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    // Establecer valor inicial
    setIsDesktop(mediaQuery.matches);

    // Listener para cambios en el tamaño de pantalla
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Determinar posición bottom según la página y el tamaño de pantalla
  // En /communities: arriba (5.5rem) solo en móvil, abajo (1.5rem) en desktop
  // En otras páginas: siempre abajo (1.5rem)
  const bottomPosition = isCommunitiesPage && !isDesktop
    ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(1.5rem + env(safe-area-inset-bottom, 0px))';

  const [widgetHeight, setWidgetHeight] = useState<string | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (typeof window === 'undefined') return;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      const topGap = hasDashboardNavbar
        ? (!isDesktop ? 78 : 72) + 8 // navbar + margen extra
        : 24;
      const bottomGap = isCommunitiesPage && !isDesktop ? 88 : 24;

      const computed = Math.max(viewportHeight - topGap - bottomGap, 360);
      setWidgetHeight(`${computed}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, [isCommunitiesPage, hasDashboardNavbar, isDesktop]);

  // Calcular altura máxima disponible dinámicamente
  const calculateMaxHeight = useMemo(() => {
    if (widgetHeight) {
      return widgetHeight;
    }

    if (isCommunitiesPage && !isDesktop) {
      return 'calc(100vh - 5.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)';
    }
    
    if (hasDashboardNavbar) {
      const navbarHeight = !isDesktop ? '4.875rem' : '4.5rem';
      return `calc(100vh - ${navbarHeight} - 1.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)`;
    }
    
    return 'calc(100vh - 1.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)';
  }, [isCommunitiesPage, hasDashboardNavbar, isDesktop, widgetHeight]);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  // Mensaje de bienvenida eliminado - el chat inicia vacío
  const [messages, setMessages] = useState<Message[]>([]);

  // Estado para almacenar el contenido extraído del DOM
  const [pageContent, setPageContent] = useState<{
    title: string;
    metaDescription: string;
    headings: string[];
    mainText: string;
  } | null>(null);

  // ✅ MEJORADO: pageContextInfo se recalcula automáticamente cuando pageContent está disponible
  // Esto permite que use el contenido del DOM automáticamente sin configuración manual
  const pageContextInfo = useMemo(() => {
    return getPageContextInfo(pathname, pageContent || undefined);
  }, [pathname, pageContent]);

  // Extraer contenido del DOM cuando cambie la ruta o cuando se abra el chat
  // NOTA: Cuando el chat está abierto y cambia la página, el contenido se maneja
  // en el useEffect de cambio de página para evitar condiciones de carrera
  useEffect(() => {
    // Si el chat está abierto, no actualizar aquí para evitar conflictos
    // El useEffect de cambio de página se encargará de actualizar el contenido
    if (isOpen) {
      return;
    }
    
    // Extraer contenido después de un pequeño delay para asegurar que el DOM esté completamente cargado
    const timer = setTimeout(() => {
      const content = extractPageContent();
      setPageContent(content);
    }, 500); // Delay de 500ms para asegurar que el contenido dinámico se haya renderizado

    return () => clearTimeout(timer);
  }, [pathname, isOpen]); // Re-extraer cuando cambie la ruta o se abra el chat

  // Estado para posición arrastrable
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [areButtonsExpanded, setAreButtonsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const prevPathnameRef = useRef<string>('');
  const hasOpenedRef = useRef<boolean>(false);

  // Cargar posición guardada al montar
  useEffect(() => {
    const savedPosition = localStorage.getItem('lia-chat-position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        // console.error('Error loading saved position:', e);
      }
    }
  }, []);

  // Guardar posición cuando cambia
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('lia-chat-position', JSON.stringify(position));
    }
  }, [position]);

  // Ref para detectar si se arrastró o solo se hizo clic
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  // Handlers para arrastrar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    // Solo prevenir default si no es el botón flotante
    if (isOpen) {
      e.preventDefault();
    }
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    
    // Guardar posición inicial del mouse para detectar si se arrastró
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    
    // Calcular offset basado en la posición del click dentro del elemento
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Si está en posición inicial (usando right/bottom), guardar la posición real
    if (position.x === 0 && position.y === 0) {
      // Calcular posición real desde el viewport y guardarla en ref
      initialPositionRef.current = {
        x: rect.left,
        y: rect.top
      };
    } else {
      initialPositionRef.current = null;
    }
    
    setDragOffset({
      x: offsetX,
      y: offsetY
    });
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    // Si está en posición inicial (usando right/bottom), guardar la posición real
    if (position.x === 0 && position.y === 0) {
      initialPositionRef.current = {
        x: rect.left,
        y: rect.top
      };
    } else {
      initialPositionRef.current = null;
    }
    
    setDragOffset({
      x: offsetX,
      y: offsetY
    });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      
      // Detectar si realmente se está arrastrando (movimiento > 5px)
      if (dragStartPos.current) {
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx < 5 && dy < 5) {
          // Todavía es un clic, no un arrastre
          return;
        }
        // Es un arrastre, marcar como movido
        hasMoved.current = true;
        dragStartPos.current = null;
      }
      
      // Calcular nueva posición basada en coordenadas del mouse menos el offset
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Si acabamos de empezar a arrastrar desde posición inicial (right/bottom),
      // convertir a coordenadas left/top y actualizar la posición una vez
      if (initialPositionRef.current) {
        // Calcular la posición real desde el viewport
        newX = e.clientX - dragOffset.x;
        newY = e.clientY - dragOffset.y;
        // Limpiar la ref para que no se vuelva a ejecutar
        initialPositionRef.current = null;
      }
      
      // Limitar a los bordes de la ventana
      const containerWidth = containerRef.current.offsetWidth || 384;
      const containerHeight = containerRef.current.offsetHeight || (isMinimized ? 80 : 600);
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;
      
      // Asegurar que no se salga de los límites
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      
      let newX = touch.clientX - dragOffset.x;
      let newY = touch.clientY - dragOffset.y;
      
      // Si acabamos de empezar a arrastrar desde posición inicial, convertir a left/top
      if (initialPositionRef.current) {
        newX = touch.clientX - dragOffset.x;
        newY = touch.clientY - dragOffset.y;
        initialPositionRef.current = null;
      }
      
      const containerWidth = containerRef.current.offsetWidth || 384;
      const containerHeight = containerRef.current.offsetHeight || (isMinimized ? 80 : 600);
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      // Limpiar las refs al terminar
      initialPositionRef.current = null;
      // Usar un timeout para permitir que el onClick se ejecute si no se movió
      setTimeout(() => {
        dragStartPos.current = null;
        hasMoved.current = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Enfocar input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // ✅ MEJORADO: Extraer contenido actual del DOM en cada mensaje para asegurar contexto actualizado
      const currentPageContent = pageContent || extractPageContent();
      if (currentPageContent && (!pageContent || currentPageContent.title !== pageContent.title)) {
        setPageContent(currentPageContent);
      }

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: activeContext,
          pageContext: {
            pathname: pathname,
            description: pageContextInfo,
            detectedArea: detectedContext,
            // ✅ MEJORADO: Siempre incluir contenido actual del DOM en cada mensaje
            pageTitle: currentPageContent?.title || '',
            metaDescription: currentPageContent?.metaDescription || '',
            headings: currentPageContent?.headings || [],
            mainText: currentPageContent?.mainText || ''
          },
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userName: user?.display_name || user?.username || user?.first_name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        if (process.env.NODE_ENV === 'development') {
          // console.error('Error de API:', {
          //   status: response.status,
          //   statusText: response.statusText,
          //   error: errorData
          // });
        }
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje en este momento.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // console.error('Error en el chat:', error);
      }
      const errorContent = error instanceof Error ? error.message : 'Lo siento, ocurrió un error. Por favor intenta de nuevo.';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, messages, activeContext, pathname, pageContextInfo, detectedContext, pageContent, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleRecording = useCallback(() => {
    setIsRecording(!isRecording);
    // Aquí se implementaría la lógica de reconocimiento de voz
    }, [isRecording]);

  // Función para solicitar ayuda contextual
  // Permite pasar contenido de página directamente para evitar problemas de sincronización
  const handleRequestHelp = useCallback(async (overridePageContent?: {
    title: string;
    metaDescription: string;
    headings: string[];
    mainText: string;
  } | null) => {
    // Usar el contenido pasado como parámetro, o el del estado, o extraerlo si no está disponible
    let currentPageContent = overridePageContent ?? pageContent;
    if (!currentPageContent || !currentPageContent.title) {
      currentPageContent = extractPageContent();
      setPageContent(currentPageContent);
    }

    // Mensaje de ayuda automático - NO se muestra en el chat (isSystemMessage: true)
    const helpMessageContent = '¿Qué puedo hacer aquí? Ayúdame';

    // NO agregar el mensaje al estado - solo enviarlo como mensaje del sistema
    setIsTyping(true);

    try {
      // Usar setMessages con callback para obtener el estado actual de messages
      // Esto asegura que siempre usemos el estado más reciente, incluso después de limpiar el chat
      let currentMessages: Message[] = [];
      setMessages(prev => {
        currentMessages = prev;
        return prev;
      });

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: helpMessageContent,
          context: activeContext,
          pageContext: {
            pathname: pathname,
            description: pageContextInfo,
            detectedArea: detectedContext,
            pageTitle: currentPageContent?.title || '',
            metaDescription: currentPageContent?.metaDescription || '',
            headings: currentPageContent?.headings || [],
            mainText: currentPageContent?.mainText || ''
          },
          conversationHistory: currentMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userName: user?.display_name || user?.username || user?.first_name,
          isSystemMessage: true // El mensaje del sistema no se mostrará en el chat
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // console.error('❌ Error response:', errorData);
        throw new Error('Error al obtener ayuda');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude generar una respuesta.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // console.error('❌ Error al solicitar ayuda:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu solicitud de ayuda. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [activeContext, pathname, pageContextInfo, detectedContext, pageContent, user]);

  // Limpiar el chat cuando cambia la página
  useEffect(() => {
    // Inicializar prevPathnameRef en el primer render
    if (prevPathnameRef.current === '') {
      prevPathnameRef.current = pathname;
      return;
    }
    
    if (prevPathnameRef.current !== pathname) {
      const wasOpen = isOpen;
      const previousPathname = prevPathnameRef.current;
      
      // ✅ CAMBIO: NO borrar mensajes - mantener el historial para continuidad de conversación
      // Solo actualizar el contenido de la nueva página
      // setMessages([]); // ← ELIMINADO: Mantener historial al cambiar de página
      setPageContent(null); // Limpiar para extraer contenido de la nueva página
      prevPathnameRef.current = pathname;
      
      // Si el chat está abierto, ejecutar la ayuda automáticamente en la nueva página
      if (wasOpen) {
        // Marcar que ya se abrió para evitar que el otro useEffect interfiera
        hasOpenedRef.current = true;
        
        // Función para esperar a que el contenido de la nueva página esté listo
        const waitForNewPageContent = async (): Promise<{
          title: string;
          metaDescription: string;
          headings: string[];
          mainText: string;
        }> => {
          // Esperar múltiples frames para asegurar que React haya renderizado
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          // Esperar un tiempo adicional para contenido dinámico (APIs, animaciones, etc.)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Extraer contenido y verificar que sea válido y estable
          let attempts = 0;
          const maxAttempts = 5;
          let lastContent = '';
          let stableCount = 0;
          
          while (attempts < maxAttempts) {
            const currentPageContent = extractPageContent();
            const contentHash = `${currentPageContent.title}-${currentPageContent.mainText.substring(0, 100)}`;
            
            // Verificar que el contenido sea válido
            const isValid = currentPageContent.title && 
                           currentPageContent.title === document.title && 
                           currentPageContent.mainText.length > 50;
            
            if (isValid) {
              // Si el contenido es el mismo que en el intento anterior, incrementar contador de estabilidad
              if (contentHash === lastContent) {
                stableCount++;
                // Si el contenido es estable durante 2 intentos consecutivos, considerarlo listo
                if (stableCount >= 2) {
                  return currentPageContent;
                }
              } else {
                // Si cambió, resetear el contador de estabilidad
                stableCount = 0;
              }
            }
            
            lastContent = contentHash;
            
            // Esperar un poco más antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
          }
          
          // Si después de varios intentos no hay contenido válido, devolver lo que haya
          return extractPageContent();
        };
        
        // Ejecutar la espera y luego enviar la ayuda
        const timer = setTimeout(async () => {
          try {
            const currentPageContent = await waitForNewPageContent();
            setPageContent(currentPageContent);
            
            // Pasar el contenido directamente a handleRequestHelp para evitar problemas
            // de sincronización con el estado de React
            handleRequestHelp(currentPageContent);
          } catch (error) {
            // Si hay error, intentar de todas formas con el contenido actual
            const fallbackContent = extractPageContent();
            setPageContent(fallbackContent);
            handleRequestHelp(fallbackContent);
          }
        }, 50); // Delay mínimo inicial
        
        return () => clearTimeout(timer);
      } else {
        // Si el chat está cerrado, resetear el flag para que se ejecute cuando se abra
        hasOpenedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Solo depender de pathname para evitar ejecuciones innecesarias

  // Ejecutar automáticamente la función de ayuda cuando se abre la LIA (solo si no se ejecutó por cambio de página)
  useEffect(() => {
    // Solo ejecutar si el chat se acaba de abrir y no se ejecutó la ayuda por cambio de página
    if (isOpen && !hasOpenedRef.current) {
      // Ejecutar la ayuda automáticamente cuando se abre el chat
      hasOpenedRef.current = true;
      // Pequeño delay para asegurar que el chat esté completamente abierto
      const timer = setTimeout(() => {
        handleRequestHelp();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleRequestHelp]);

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Si se está arrastrando o se movió el mouse, no ejecutar el toggle
    if (isDragging || hasMoved.current) {
      return;
    }

    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnreadMessages(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setAreButtonsExpanded(false);
    // Resetear el flag cuando se cierra para que se ejecute la ayuda al abrir de nuevo
    hasOpenedRef.current = false;
  };

  return (
    <>
      {/* Botones flotantes */}
      {!isOpen && (
        <div
          className="fixed right-6 z-40 flex flex-col gap-2 items-end bottom-6 md:bottom-6"
          style={{
            bottom: bottomPosition,
          }}
        >
          <AnimatePresence>
            {/* Botones expandidos: Reportar Problema */}
            {areButtonsExpanded && (
              <motion.div
                key="expanded-buttons"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                {/* Botón de reportar problema */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportOpen(true);
                    setAreButtonsExpanded(false);
                  }}
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg hover:shadow-red-500/50 transition-all cursor-pointer flex items-center justify-center group relative"
                  title="Reportar problema"
                >
                  <Bug className="w-6 h-6 text-white" />
                  
                  {/* Tooltip */}
                  <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Reportar problema
                    <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"></div>
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de expandir/colapsar - Solo flecha sin fondo */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setAreButtonsExpanded(!areButtonsExpanded);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="cursor-pointer flex items-center justify-center group relative p-1"
            title={areButtonsExpanded ? "Ocultar opciones" : "Mostrar opciones"}
          >
            <motion.div
              animate={{ rotate: areButtonsExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {areButtonsExpanded ? "Ocultar opciones" : "Mostrar opciones"}
              <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"></div>
            </div>
          </motion.button>

          {/* Botón principal de LIA */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setIsMinimized(false);
                setHasUnreadMessages(false);
                setAreButtonsExpanded(false);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-2xl hover:shadow-blue-500/50 transition-all cursor-pointer border-2 border-blue-400"
            >
              {/* Efecto de pulso */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                <img 
                  src={assistantAvatar}
                  alt={assistantName}
                  className="w-full h-full object-cover"
                />
              </div>

              {hasUnreadMessages && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
                />
              )}
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Widget del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-6 w-96 max-w-[calc(100vw-3rem)] z-[99999]"
            style={{
              bottom: bottomPosition,
              height: calculateMaxHeight,
              maxHeight: calculateMaxHeight,
            }}
          >
        <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-carbon-700 flex flex-col bg-white dark:bg-[#0f0f0f] h-full">
          {/* Header con gradiente */}
          <motion.div 
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 relative overflow-hidden flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Efecto shimmer en el gradiente */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative w-10 h-10">
                  <Image
                    src={assistantAvatar}
                    alt={assistantName}
                    fill
                    className="rounded-full object-cover border-2 border-white/50"
                    sizes="40px"
                  />
                  {/* Indicador de estado en línea */}
                  <motion.div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{assistantName}</h3>
                    <motion.div
                      className="flex items-center gap-1 text-white/90"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs">En línea</span>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mensajes */}
          {(
            <motion.div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ 
                scrollBehavior: 'smooth'
              }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar del mensaje */}
                  {message.role === 'user' ? (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 relative">
                      {user?.profile_picture_url ? (
                        <Image
                          src={user.profile_picture_url}
                          alt={user.display_name || user.username || 'Usuario'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 relative">
                      <Image
                        src={assistantAvatar}
                        alt={assistantName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  
                  {/* Contenido del mensaje */}
                  <div className={`flex-1 rounded-2xl px-4 py-3 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white dark:bg-carbon-800 text-gray-900 dark:text-white border border-gray-200 dark:border-carbon-600'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-semibold">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* Indicador de escritura */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 relative">
                    <Image
                      src={assistantAvatar}
                      alt={assistantName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="bg-white dark:bg-carbon-800 border border-gray-200 dark:border-carbon-600 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </motion.div>
          )}

          {/* Input */}
          {(
            <motion.div 
              className="p-4 border-t border-gray-200 dark:border-carbon-700 bg-white dark:bg-[#0f0f0f] flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={promptPlaceholder}
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-carbon-800 border border-gray-300 dark:border-carbon-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-inner"
                />
                
                {/* Botón dinámico: micrófono cuando está vacío, enviar cuando hay texto */}
                <motion.button
                  onClick={() => {
                    if (inputMessage.trim()) {
                      // Si hay texto, enviar mensaje
                      handleSendMessage();
                    } else {
                      // Si no hay texto, activar/desactivar grabación
                      toggleRecording();
                    }
                  }}
                  disabled={isTyping && !!inputMessage.trim()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    inputMessage.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/50'
                      : isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                      : 'bg-gray-200 dark:bg-carbon-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-carbon-700'
                  } ${isTyping && inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTyping && inputMessage.trim() ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : inputMessage.trim() ? (
                    <Send className="w-5 h-5" />
                  ) : isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              
              {/* Instrucciones */}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <span>Presiona Enter para enviar</span>
                <span>•</span>
                <span>{inputMessage.trim() ? 'Clic para enviar' : 'Clic para dictar'}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Reporte de Problema */}
      <ReporteProblema
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        fromLia={true}
      />
    </>
  );
}

