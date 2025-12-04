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
  Bug,
  Wand2,
  Sparkles,
  Download,
  Target,
  MessageSquare,
  Brain,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { ReporteProblema } from '../ReporteProblema/ReporteProblema';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/I18nProvider';
import { sessionRecorder } from '../../../lib/rrweb/session-recorder';
import { useRouter } from 'next/navigation';
import { getPlatformContext } from '../../../lib/lia/page-metadata';
import { IntentDetectionService } from '../../services/intent-detection.service';
import { PromptPreviewPanel, type PromptDraft } from './PromptPreviewPanel';
import { NanoBananaPreviewPanel } from './NanoBananaPreviewPanel';
import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../../lib/nanobana/templates';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedPrompt?: GeneratedPrompt | null;
  generatedNanoBanana?: {
    schema: NanoBananaSchema;
    jsonString: string;
    domain: NanoBananaDomain;
    outputFormat: OutputFormat;
  } | null;
}

interface GeneratedPrompt {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty_level: string;
  use_cases: string[];
  tips: string[];
}

interface AIChatAgentProps {
  assistantName?: string;
  assistantAvatar?: string;
  initialMessage?: string;
  promptPlaceholder?: string;
  context?: string; // Contexto específico para el agente (workshops, communities, news)
}

// Función para detectar automáticamente el contexto basado en la URL
function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/workshops')) return 'workshops';
  if (pathname.includes('/news')) return 'news';
  if (pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/prompt-directory')) return 'prompts';
  if (pathname.includes('/business-panel')) return 'business';
  if (pathname.includes('/profile')) return 'profile';
  return 'general';
}

// Función para obtener información contextual detallada de la página actual
function getPageContextInfo(pathname: string): string {
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

  return 'página principal de la plataforma';
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

// Función para renderizar texto con enlaces Markdown clickeables
function renderTextWithLinks(text: string): React.ReactNode {
  if (!text) return text;

  // Regex para detectar enlaces Markdown: [texto](url)
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Agregar texto antes del enlace
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(textBefore);
      }
    }

    // Agregar el enlace como elemento <a>
    const linkText = match[1];
    const linkUrl = match[2];
    
    // Verificar si es una URL relativa (empieza con /) o absoluta
    const isRelative = linkUrl.startsWith('/');
    
    parts.push(
      <a
        key={`link-${key++}`}
        href={linkUrl}
        onClick={(e) => {
          if (isRelative) {
            e.preventDefault();
            // Usar el router del componente para navegación interna
            window.dispatchEvent(new CustomEvent('lia-navigate', { detail: { url: linkUrl } }));
          }
          // Si es URL absoluta, dejar que el navegador maneje el enlace
        }}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
        {...(!isRelative && { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {linkText}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Agregar texto restante después del último enlace
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Si no hay enlaces, retornar el texto original
  return parts.length > 0 ? parts : text;
}

export function AIChatAgent({
  assistantName = 'Lia',
  assistantAvatar = '/lia-avatar.png',
  initialMessage = '¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con cualquier pregunta que tengas.',
  promptPlaceholder,
  context = 'general'
}: AIChatAgentProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { t: tCommon } = useTranslation('common');
  
  // Estados para el modo prompt (declarados temprano para poder usarlos en placeholderText)
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);
  const [selectedPromptMessageId, setSelectedPromptMessageId] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  
  // Estados para el modo NanoBanana
  const [isNanoBananaMode, setIsNanoBananaMode] = useState(false);
  const [nanoBananaSchema, setNanoBananaSchema] = useState<NanoBananaSchema | null>(null);
  const [nanoBananaJsonString, setNanoBananaJsonString] = useState<string>('');
  const [nanoBananaDomain, setNanoBananaDomain] = useState<NanoBananaDomain>('ui');
  const [nanoBananaFormat, setNanoBananaFormat] = useState<OutputFormat>('wireframe');
  const [isNanoBananaPanelOpen, setIsNanoBananaPanelOpen] = useState(false);
  const [nanoBananaMessages, setNanoBananaMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Estados del chat (declarados temprano para poder usarlos en useMemo)
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const placeholderText = isPromptMode 
    ? 'Describe qué tipo de prompt quieres crear...' 
    : (promptPlaceholder ?? tCommon('aiChat.placeholder'));
  const onlineLabel = tCommon('aiChat.online');
  const pressEnterLabel = tCommon('aiChat.pressEnter');
  const clickToSendLabel = tCommon('aiChat.clickToSend');
  const clickToDictateLabel = tCommon('aiChat.clickToDictate');
  const responseFallback = tCommon('aiChat.responseFallback');
  const errorGeneric = tCommon('aiChat.errorGeneric');
  const helpPrompt = tCommon('aiChat.helpPrompt');
  const helpFallback = tCommon('aiChat.helpFallback');
  const helpError = tCommon('aiChat.helpError');

  // Detectar automáticamente el contexto basado en la URL
  const detectedContext = detectContextFromURL(pathname);
  const activeContext = context === 'general' ? detectedContext : context;
  const pageContextInfo = getPageContextInfo(pathname);

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

  // Calcular altura del modal de prompt para ajustar posición del chat
  const promptModalHeight = useMemo(() => {
    if (!isPromptMode || !generatedPrompt || !isPromptPanelOpen) return 0;
    // Altura aproximada del modal de prompt (ajustable según necesidad)
    // En móvil: más compacto, en desktop: más espacio
    return isDesktop ? 450 : 380;
  }, [isPromptMode, generatedPrompt, isPromptPanelOpen, isDesktop]);

  // Calcular altura máxima disponible dinámicamente
  // No se reduce cuando hay prompt abierto, ya que el prompt está arriba
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

  // Estado para la altura de la ventana (para evitar problemas de SSR)
  const [windowHeight, setWindowHeight] = useState(600);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Calcular altura del chat para posicionar el prompt arriba
  const chatHeightValue = useMemo(() => {
    if (widgetHeight) {
      return parseFloat(widgetHeight.replace('px', ''));
    }
    // Calcular altura aproximada del chat
    if (isCommunitiesPage && !isDesktop) {
      return windowHeight - 88 - 24;
    }
    if (hasDashboardNavbar) {
      const navbarHeight = !isDesktop ? 78 : 72;
      return windowHeight - navbarHeight - 24;
    }
    return windowHeight - 24;
  }, [widgetHeight, windowHeight, isCommunitiesPage, isDesktop, hasDashboardNavbar]);

  // Calcular posición bottom del chat cuando hay prompt abierto
  const chatBottomPosition = useMemo(() => {
    // El chat siempre mantiene su posición base
    return bottomPosition;
  }, [bottomPosition]);

  // Calcular posición bottom del prompt (sobrepuesto encima del chat)
  const promptBottomPosition = useMemo(() => {
    if (isPromptMode && generatedPrompt && isPromptPanelOpen && isOpen) {
      // El prompt debe sobreponerse encima del chat, en la misma posición
      // Usa la misma posición bottom que el chat para cubrirlo
      return chatBottomPosition;
    }
    // Si el chat no está abierto o no hay prompt, usar la posición base
    return bottomPosition;
  }, [chatBottomPosition, isPromptMode, generatedPrompt, isPromptPanelOpen, isOpen, bottomPosition]);

  // Conversaciones separadas para cada modo
  const [normalMessages, setNormalMessages] = useState<Message[]>([]);
  const [promptMessages, setPromptMessages] = useState<Message[]>([]);
  
  // Obtener los mensajes según el modo actual
  const messages = isNanoBananaMode ? nanoBananaMessages : isPromptMode ? promptMessages : normalMessages;

  // ✅ PERSISTENCIA: Claves para localStorage
  const STORAGE_KEY_CONTEXT_MODE = 'lia-context-mode-enabled';
  const STORAGE_KEY_CONTEXT_MESSAGES = 'lia-context-mode-messages';
  const MAX_CONTEXT_MESSAGES = 7; // 🎯 Máximo de mensajes para mantener contexto

  // ✅ PERSISTENCIA: Función para guardar mensajes en localStorage
  // Solo guarda los últimos MAX_CONTEXT_MESSAGES mensajes
  const saveContextMessages = useCallback((messagesToSave: Message[]) => {
    try {
      // Tomar solo los últimos N mensajes (últimos 7)
      const recentMessages = messagesToSave.slice(-MAX_CONTEXT_MESSAGES);
      
      const serialized = JSON.stringify(recentMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })));
      localStorage.setItem(STORAGE_KEY_CONTEXT_MESSAGES, serialized);
    } catch (error) {
      console.error('Error guardando mensajes en localStorage:', error);
    }
  }, []);

  // ✅ PERSISTENCIA: Función para cargar mensajes desde localStorage
  const loadContextMessages = useCallback((): Message[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTEXT_MESSAGES);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Error cargando mensajes desde localStorage:', error);
      return [];
    }
  }, []);

  // ✅ PERSISTENCIA: Función para limpiar contexto guardado
  const clearContextMessages = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_CONTEXT_MESSAGES);
      setNormalMessages([]);
    } catch (error) {
      console.error('Error limpiando mensajes de contexto:', error);
    }
  }, []);


  // Estado para almacenar el contenido extraído del DOM
  const [pageContent, setPageContent] = useState<{
    title: string;
    metaDescription: string;
    headings: string[];
    mainText: string;
  } | null>(null);

  // Estado para almacenar los links disponibles según el rol
  const [availableLinks, setAvailableLinks] = useState<string>('');

  // Obtener links disponibles cuando se monta el componente
  useEffect(() => {
    const fetchAvailableLinks = async () => {
      try {
        const response = await fetch('/api/lia/available-links');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.linksForLIA) {
            setAvailableLinks(data.linksForLIA);
          }
        }
      } catch (error) {
        // Silenciar errores, no es crítico si no se pueden obtener los links
        console.error('Error obteniendo links disponibles:', error);
      }
    };

    fetchAvailableLinks();
  }, []);

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
  const [useContextMode, setUseContextMode] = useState(true); // � ACTIVADO POR DEFECTO para persistencia automática
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const prevPathnameRef = useRef<string>('');
  const hasOpenedRef = useRef<boolean>(false);
  const router = useRouter();

  // 💾 FUNCIÓN DE GUARDADO DE PROMPTS
  const handleSavePrompt = useCallback(async (draft: PromptDraft) => {
    if (!user) {
      alert('Debes iniciar sesión para guardar prompts');
      return;
    }

    setIsSavingPrompt(true);
    
    try {
      const response = await fetch('/api/ai-directory/prompts/save-from-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...draft,
          conversation_id: conversationId, // Vincular con la conversación
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al guardar el prompt');
      }

      const data = await response.json();
      
      // Notificar éxito
      alert(`✅ Prompt guardado exitosamente: "${draft.title}"`);
      
      // Cerrar el panel de preview
      setIsPromptPanelOpen(false);
      
      // Opcional: Navegar al prompt guardado
      if (data.redirectUrl) {
        const shouldNavigate = confirm('¿Quieres ver el prompt en el directorio?');
        if (shouldNavigate) {
          router.push(data.redirectUrl);
        }
      }
    } catch (error) {
      console.error('Error guardando prompt:', error);
      alert(`❌ Error al guardar el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSavingPrompt(false);
    }
  }, [user, conversationId, router]);

  // 🔗 NAVEGACIÓN GUIADA: Event listener para navegación desde links en mensajes
  useEffect(() => {
    const handleLiaNavigate = (event: CustomEvent) => {
      const { url } = event.detail;
      if (url) {
        // Actualizar contexto antes de navegar
        console.log('🔗 Navegando desde LIA a:', url);
        router.push(url);
      }
    };

    window.addEventListener('lia-navigate', handleLiaNavigate as EventListener);
    
    return () => {
      window.removeEventListener('lia-navigate', handleLiaNavigate as EventListener);
    };
  }, [router]);

  // ✅ PERSISTENCIA: Cargar estado de useContextMode desde localStorage al montar
  useEffect(() => {
    try {
      // Primero verificar si el modo de contexto está activado
      const savedContextMode = localStorage.getItem(STORAGE_KEY_CONTEXT_MODE);
      const contextModeEnabled = savedContextMode === 'true';
      
      // Cargar mensajes guardados
      const savedMessages = loadContextMessages();
      
      console.log('🔄 Cargando contexto:', {
        contextModeEnabled,
        savedMessagesCount: savedMessages.length,
        savedMessages: savedMessages
      });
      
      // Si hay mensajes guardados O el modo estaba activado, restaurar
      if (savedMessages.length > 0 || contextModeEnabled) {
        setUseContextMode(true);
        if (savedMessages.length > 0) {
          setNormalMessages(savedMessages);
          console.log('✅ Contexto restaurado:', savedMessages.length, 'mensajes');
        }
        localStorage.setItem(STORAGE_KEY_CONTEXT_MODE, 'true');
      }
    } catch (error) {
      console.error('Error cargando estado de contexto desde localStorage:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // ✅ PERSISTENCIA: Guardar estado de useContextMode cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTEXT_MODE, useContextMode.toString());
      // Si se desactiva el modo, limpiar mensajes guardados
      if (!useContextMode) {
        localStorage.removeItem(STORAGE_KEY_CONTEXT_MESSAGES);
        // También limpiar mensajes en memoria si no están en una conversación activa
        if (!isOpen) {
          setNormalMessages([]);
        }
      }
    } catch (error) {
      console.error('Error guardando estado de contexto en localStorage:', error);
    }
  }, [useContextMode, isOpen]);

  // ✅ PERSISTENCIA: Guardar mensajes cuando cambian y useContextMode está activo
  useEffect(() => {
    if (useContextMode && !isPromptMode && normalMessages.length > 0) {
      // Guardar inmediatamente sin debounce
      saveContextMessages(normalMessages);
      console.log('💾 Guardando contexto:', normalMessages.length, 'mensajes');
    }
  }, [normalMessages, useContextMode, isPromptMode, saveContextMessages]);

  // ✅ PERSISTENCIA: Guardar mensajes antes de cerrar la pestaña/navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        saveContextMessages(normalMessages);
        console.log('💾 Guardando antes de beforeunload:', normalMessages.length, 'mensajes');
      }
    };

    // Guardar también cuando se desmonta el componente (navegación interna)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && useContextMode && !isPromptMode && normalMessages.length > 0) {
        saveContextMessages(normalMessages);
        console.log('💾 Guardando en visibilitychange:', normalMessages.length, 'mensajes');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Guardar una última vez al desmontar el componente
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        // Usar una copia de los valores actuales para evitar problemas con el closure
        const messagesToSave = normalMessages;
        const recentMessages = messagesToSave.slice(-MAX_CONTEXT_MESSAGES);
        try {
          const serialized = JSON.stringify(recentMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })));
          localStorage.setItem(STORAGE_KEY_CONTEXT_MESSAGES, serialized);
          console.log('💾 Guardando al desmontar componente:', recentMessages.length, 'mensajes');
        } catch (error) {
          console.error('Error guardando al desmontar:', error);
        }
      }
    };
  }, [useContextMode, isPromptMode, normalMessages, saveContextMessages]);

  // Función para renderizar texto con enlaces Markdown clickeables
  const renderTextWithLinks = useCallback((text: string): React.ReactNode => {
    if (!text) return text;

    // Regex para detectar enlaces Markdown: [texto](url)
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      // Agregar texto antes del enlace
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        if (textBefore) {
          parts.push(textBefore);
        }
      }

      // Agregar el enlace como elemento <a>
      const linkText = match[1];
      const linkUrl = match[2];
      
      // Verificar si es una URL relativa (empieza con /) o absoluta
      const isRelative = linkUrl.startsWith('/');
      
      parts.push(
        <a
          key={`link-${key++}`}
          href={linkUrl}
          onClick={(e) => {
            if (isRelative) {
              e.preventDefault();
              router.push(linkUrl);
            }
          }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
          {...(!isRelative && { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {linkText}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Agregar texto restante después del último enlace
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // Si no hay enlaces, retornar el texto original
    return parts.length > 0 ? parts : text;
  }, [router]);

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

  // Función para ajustar altura del textarea
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      // Calcular altura de una línea basándose en el padding y line-height
      const computedStyle = window.getComputedStyle(inputRef.current);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 12;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 12;
      const singleLineHeight = lineHeight + paddingTop + paddingBottom;
      const maxHeight = singleLineHeight * 3; // 3 renglones
      
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  // Enfocar input cuando se abre el chat y ajustar altura inicial
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Pequeño delay para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        adjustTextareaHeight();
      }, 100);
    }
  }, [isOpen, adjustTextareaHeight]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping) return;

    // 🔍 DETECCIÓN BIDIRECCIONAL DE INTENCIONES
    let shouldActivatePromptMode = false;
    let shouldDeactivatePromptMode = false;
    let shouldActivateNanoBananaMode = false;
    let shouldDeactivateNanoBananaMode = false;
    let detectedNanoBananaDomain: NanoBananaDomain = 'ui';
    let detectedNanoBananaFormat: OutputFormat = 'wireframe';
    
    try {
      const intentResult = await IntentDetectionService.detectIntent(inputMessage);
      console.log('[LIA Agent] 🔍 Detección de intención:', {
        intent: intentResult.intent,
        confidence: `${(intentResult.confidence * 100).toFixed(1)}%`,
        currentMode: isNanoBananaMode ? 'nanobana' : isPromptMode ? 'prompts' : 'normal',
        entities: intentResult.entities
      });
      
      // CASO 0: Detectar intención de NanoBanana (prioridad alta)
      if (!isNanoBananaMode && !isPromptMode && intentResult.intent === 'nanobana' && intentResult.confidence >= 0.65) {
        console.log('[LIA Agent] 🎨 Activando Modo NanoBanana');
        shouldActivateNanoBananaMode = true;
        
        // Usar dominio y formato detectados si están disponibles
        if (intentResult.entities?.nanobananaDomain) {
          detectedNanoBananaDomain = intentResult.entities.nanobananaDomain;
        }
        if (intentResult.entities?.outputFormat) {
          detectedNanoBananaFormat = intentResult.entities.outputFormat;
        }
        
        const domainNames: Record<NanoBananaDomain, string> = {
          ui: 'UI/Interfaz',
          photo: 'Fotografía',
          diagram: 'Diagrama'
        };
        
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: `🎨 He activado el Modo NanoBanana para generación visual con JSON.\n\nDominio detectado: ${domainNames[detectedNanoBananaDomain]}\n\nDescríbeme en detalle lo que necesitas crear y generaré un JSON estructurado optimizado para NanoBanana Pro.`,
          timestamp: new Date()
        };
        
        setNanoBananaMessages(prev => [...prev, systemMessage]);
        setIsNanoBananaMode(true);
        setNanoBananaDomain(detectedNanoBananaDomain);
        setNanoBananaFormat(detectedNanoBananaFormat);
      }
      // CASO 0.5: Si estamos en modo NanoBanana, detectar intenciones para cambiar a CUALQUIER otro modo
      else if (isNanoBananaMode) {
        const messageLower = inputMessage.toLowerCase().trim();
        
        // 🎯 Detectar si quiere cambiar a MODO PROMPTS
        if (intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
          console.log('[LIA Agent] 🔄 Cambiando de NanoBanana a Modo Prompts (detección automática)');
          shouldDeactivateNanoBananaMode = true;
          shouldActivatePromptMode = true;
          setIsNanoBananaMode(false);
          setIsPromptMode(true);
          
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: "✨ He cambiado al Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?",
            timestamp: new Date()
          };
          setPromptMessages(prev => [...prev, systemMessage]);
        }
        // 🎯 Detectar navegación → Modo normal con contexto
        else if (intentResult.intent === 'navigate') {
          console.log('[LIA Agent] 🔄 Cambiando de NanoBanana a modo normal (navegación detectada)');
          shouldDeactivateNanoBananaMode = true;
          setIsNanoBananaMode(false);
          
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: "🧠 He cambiado al modo normal para ayudarte con la navegación.",
            timestamp: new Date()
          };
          setNormalMessages(prev => [...prev, systemMessage]);
        }
        // 🎯 Detectar preguntas generales o sobre cursos/plataforma → Modo normal
        else if (intentResult.intent === 'general' || intentResult.intent === 'question') {
          // Palabras clave que indican NO es una solicitud de NanoBanana
          const nonNanoBananaKeywords = [
            // Plataforma
            'comunidad', 'comunidades', 'noticias', 'noticia', 'dashboard', 'perfil',
            'configuración', 'ajustes', 'cuenta', 'talleres', 'taller', 'workshops',
            'directorio', 'prompts', 'apps', 'aplicaciones', 'plataforma', 'sitio',
            'web', 'página', 'sección', 'menú', 'navegación', 'link', 'enlace',
            'ayuda', 'soporte', 'funciona', 'qué es', 'cómo',
            // Cursos y contenido educativo
            'curso', 'cursos', 'lección', 'leccion', 'módulo', 'modulo', 'módulos', 'modulos',
            'tema', 'contenido', 'video', 'transcripción', 'transcripcion', 'resumen',
            'actividad', 'actividades', 'ejercicio', 'ejercicios', 'tarea', 'tareas',
            'cuántos', 'cuantos', 'cuántas', 'cuantas', 'aprendo', 'aprender', 'enseña',
            'material', 'materiales', 'duración', 'duracion'
          ];
          
          // Patrones de preguntas generales
          const generalQuestionPatterns = [
            /\bcuántos?\b/i, /\bcuantos?\b/i,
            /\bqué\s+(es|son|tiene|hay)\b/i, /\bque\s+(es|son|tiene|hay)\b/i,
            /\bcómo\s+(funciona|puedo|hago)\b/i, /\bcomo\s+(funciona|puedo|hago)\b/i,
            /\bdónde\s+(está|encuentro)\b/i, /\bdonde\s+(esta|encuentro)\b/i
          ];
          
          const isNonNanoBananaQuestion = nonNanoBananaKeywords.some(keyword => messageLower.includes(keyword)) ||
                                          generalQuestionPatterns.some(p => p.test(messageLower));
          
          if (isNonNanoBananaQuestion) {
            console.log('[LIA Agent] 🔄 Cambiando de NanoBanana a modo normal (pregunta detectada)');
            shouldDeactivateNanoBananaMode = true;
            setIsNanoBananaMode(false);
            
            const systemMessage: Message = {
              id: `system-${Date.now()}`,
              role: 'assistant',
              content: "🧠 He cambiado al modo normal para responder tu pregunta.",
              timestamp: new Date()
            };
            setNormalMessages(prev => [...prev, systemMessage]);
          } else {
            console.log('[LIA Agent] ✅ Manteniendo Modo NanoBanana');
          }
        }
        // 🎯 Patrones explícitos de salida
        else {
          const explicitExitPatterns = [
            /\b(ll[eé]vame|llevame|llévame)\b/i,
            /\b(ir\s+a|navegar\s+a|abrir)\b/i,
            /\b(salir|salte|terminar|cancelar)\b.*\b(nanobana|modo|json)\b/i,
            /\b(no\s+quiero|ya\s+no)\b.*\b(nanobana|json|imagen)\b/i,
            /\bdame\s+(el\s+)?(link|enlace)\b/i,
            /\bquiero\s+(ir|ver|acceder)\s+a\b/i
          ];
          
          const isExplicitExit = explicitExitPatterns.some(p => p.test(messageLower));
          
          if (isExplicitExit) {
            console.log('[LIA Agent] 🔄 Saliendo del Modo NanoBanana (salida explícita)');
            shouldDeactivateNanoBananaMode = true;
            setIsNanoBananaMode(false);
            
            const systemMessage: Message = {
              id: `system-${Date.now()}`,
              role: 'assistant',
              content: "🧠 He cambiado al modo normal para ayudarte.",
              timestamp: new Date()
            };
            setNormalMessages(prev => [...prev, systemMessage]);
          } else {
            console.log('[LIA Agent] ✅ Manteniendo Modo NanoBanana');
          }
        }
      }
      // CASO 1: Si NO estamos en modo prompts y detectamos intención de crear prompts
      else if (!isPromptMode && !isNanoBananaMode && intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
        console.log('[LIA Agent] ✅ Activando Modo Prompts');
        shouldActivatePromptMode = true;
        
        // Agregar mensaje del sistema notificando el cambio
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: "✨ He detectado que quieres crear un prompt. He activado el Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?",
          timestamp: new Date()
        };
        
        setPromptMessages(prev => [...prev, systemMessage]);
        setIsPromptMode(true);
      }
      // CASO 2: Si ESTAMOS en modo prompts, MANTENER el modo a menos que sea EXPLÍCITAMENTE una petición de navegación
      else if (isPromptMode && intentResult.intent !== 'create_prompt') {
        const messageLower = inputMessage.toLowerCase().trim();
        
        // Solo salir del modo prompts si es una petición EXPLÍCITA de navegación o quiere NanoBanana
        const explicitExitPatterns = [
          /\b(ll[eé]vame|llevame|llévame)\b/i,
          /\b(ir\s+a|navegar\s+a|abrir)\b/i,
          /\b(mu[eé]strame|muestrame|muéstrame)\b.*\b(página|pagina|sección|seccion)\b/i,
          /\bdame\s+(el\s+)?(link|enlace)\b/i,
          /\bquiero\s+(ir|ver|acceder)\s+a\b/i,
          /\b(salir|salte|terminar|cancelar)\b.*\b(prompt|modo)\b/i,
          /\b(no\s+quiero|ya\s+no)\b.*\bprompt\b/i
        ];
        
        // 🎨 Patrones mejorados para detectar intención de NanoBanana (generación visual/imágenes)
        const nanoBananaKeywords = [
          /\bnanobana(na)?\b/i,
          /\b(wireframe|mockup|ui|interfaz|diagrama)\b.*\b(json|generar|crear|diseñar)\b/i,
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(imagen|visual|wireframe|mockup|ui|interfaz|diagrama|app|pantalla)\b/i,
          /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup)\b/i,
          /\b(diseña(r|me)?|dibuja(r|me)?)\b.*\b(una?\s*)?(app|aplicación|pantalla|interfaz)\b/i,
          /\b(foto|imagen)\b.*\b(producto|marketing)\b/i
        ];
        const wantsNanoBanana = nanoBananaKeywords.some(p => p.test(messageLower));
        const isExplicitExit = explicitExitPatterns.some(p => p.test(messageLower));
        
        console.log('[LIA Agent] 📊 Análisis en Modo Prompts:', {
          message: messageLower,
          detectedIntent: intentResult.intent,
          isExplicitExit,
          wantsNanoBanana,
          action: wantsNanoBanana ? 'CAMBIAR a NanoBanana' : isExplicitExit ? 'SALIR del modo prompts' : 'MANTENER modo prompts'
        });
        
        if (wantsNanoBanana) {
          console.log('[LIA Agent] 🔄 Cambiando de Prompts a Modo NanoBanana');
          shouldDeactivatePromptMode = true;
          shouldActivateNanoBananaMode = true;
          setIsPromptMode(false);
          setIsNanoBananaMode(true);
          
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: "🎨 He cambiado al Modo NanoBanana para generación visual con JSON.\n\nDescríbeme lo que necesitas crear.",
            timestamp: new Date()
          };
          setNanoBananaMessages(prev => [...prev, systemMessage]);
        } else if (isExplicitExit) {
          console.log('[LIA Agent] 🔄 Petición explícita de salir. Desactivando Modo Prompts');
          shouldDeactivatePromptMode = true;
          
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: "🧠 He cambiado al modo normal para ayudarte.",
            timestamp: new Date()
          };
          
          setNormalMessages(prev => [...prev, systemMessage]);
          setIsPromptMode(false);
        } else {
          // MANTENER el modo prompts - cualquier otra cosa se considera parte de la conversación de prompts
          console.log('[LIA Agent] ✅ Manteniendo Modo Prompts (continuando conversación de creación de prompts)');
        }
      }
    } catch (error) {
      console.error('[LIA Agent] ❌ Error detectando intención:', error);
      // Continuar normalmente si falla la detección
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Determinar el modo efectivo para esta llamada
    const effectivePromptMode = (isPromptMode || shouldActivatePromptMode) && !shouldDeactivatePromptMode && !shouldActivateNanoBananaMode;
    const effectiveNanoBananaMode = (isNanoBananaMode || shouldActivateNanoBananaMode) && !shouldDeactivateNanoBananaMode;

    // 🎯 IMPORTANTE: Solo esperar sin responder si se ACTIVÓ un modo especial (NanoBanana/Prompts)
    // Si se DESACTIVÓ (salió) de un modo especial CON una pregunta, debe continuar y responder
    const shouldWaitForDescription = shouldActivateNanoBananaMode || shouldActivatePromptMode;
    
    if (shouldWaitForDescription) {
      console.log('[LIA Agent] ⏸️ Modo especial activado. Esperando descripción del usuario...');
      // Agregar el mensaje del usuario al historial correspondiente
      if (effectiveNanoBananaMode) {
        setNanoBananaMessages(prev => [...prev, userMessage]);
      } else if (effectivePromptMode) {
        setPromptMessages(prev => [...prev, userMessage]);
      } else {
        setNormalMessages(prev => [...prev, userMessage]);
      }
      setInputMessage('');
      // Resetear altura del textarea
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.overflowY = 'hidden';
        }
      }, 0);
      return; // NO llamar al API, esperar que el usuario describa lo que quiere
    }
    
    // Si se DESACTIVÓ un modo especial, continuar para responder la pregunta
    if (shouldDeactivateNanoBananaMode || shouldDeactivatePromptMode) {
      console.log('[LIA Agent] 🔄 Modo especial desactivado. Continuando para responder la pregunta...');
    }

    // Usar el setter correcto según el modo efectivo
    if (effectiveNanoBananaMode) {
      setNanoBananaMessages(prev => [...prev, userMessage]);
    } else if (effectivePromptMode) {
      setPromptMessages(prev => [...prev, userMessage]);
    } else {
      setNormalMessages(prev => [...prev, userMessage]);
    }
    
    setInputMessage('');
    // Resetear altura del textarea
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.overflowY = 'hidden';
      }
    }, 0);
    setIsTyping(true);
    // No limpiar el prompt anterior automáticamente, se mantendrá hasta que se genere uno nuevo

    try {
      // Si está en modo NanoBanana efectivo
      if (effectiveNanoBananaMode) {
        const response = await fetch('/api/ai-directory/generate-nanobana', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            preferredDomain: nanoBananaDomain,
            preferredFormat: nanoBananaFormat,
            conversationHistory: nanoBananaMessages.map(m => ({
              sender: m.role === 'user' ? 'user' : 'ai',
              text: m.content,
              timestamp: m.timestamp.toLocaleTimeString()
            }))
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || responseFallback,
          timestamp: new Date()
        };

        // Si hay un esquema generado, guardarlo en el mensaje y en el estado
        if (data.generatedSchema) {
          const jsonStr = data.jsonString || JSON.stringify(data.generatedSchema, null, 2);
          const domainValue = data.domain || 'ui';
          const formatValue = data.outputFormat || 'wireframe';
          
          // Guardar en el mensaje para poder reabrirlo
          assistantMessage.generatedNanoBanana = {
            schema: data.generatedSchema,
            jsonString: jsonStr,
            domain: domainValue,
            outputFormat: formatValue
          };
          
          // Guardar en el estado global
          setNanoBananaSchema(data.generatedSchema);
          setNanoBananaJsonString(jsonStr);
          setNanoBananaDomain(domainValue);
          setNanoBananaFormat(formatValue);
          setIsNanoBananaPanelOpen(true);
        }
        
        setNanoBananaMessages(prev => [...prev, assistantMessage]);
      }
      // Si está en modo prompt efectivo (activado o recién activado, y no desactivándose)
      else if (effectivePromptMode) {
        const response = await fetch('/api/ai-directory/generate-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationHistory: promptMessages.map(m => ({
              sender: m.role === 'user' ? 'user' : 'ai',
              text: m.content,
              timestamp: m.timestamp.toLocaleTimeString()
            }))
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Determinar el contenido del mensaje
        let messageContent = data.response || responseFallback;
        
        // Si hay un prompt generado, mostrar un mensaje amigable en lugar del JSON
        if (data.generatedPrompt) {
          const promptTitle = data.generatedPrompt.title || 'Tu prompt';
          messageContent = `¡Listo! He generado el prompt "${promptTitle}". Puedes verlo, copiarlo o guardarlo en tu biblioteca usando el panel que aparece arriba. ¿Necesitas algún ajuste o tienes otra idea de prompt?`;
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: messageContent,
          timestamp: new Date()
        };

        // Si hay un prompt generado, guardarlo en el mensaje y en el estado
        if (data.generatedPrompt) {
          assistantMessage.generatedPrompt = data.generatedPrompt;
          setGeneratedPrompt(data.generatedPrompt);
          setIsPromptPanelOpen(true);
          setSelectedPromptMessageId(assistantMessage.id);
        }
        
        setPromptMessages(prev => [...prev, assistantMessage]);
      } else {
        // Modo normal de chat
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            context: activeContext,
            language,
            isPromptMode: false, // ✅ Agregar parámetro isPromptMode
            conversationId: conversationId, // ✅ Pasar conversationId para continuidad
            pageContext: {
              pathname: pathname,
              description: pageContextInfo,
              detectedArea: detectedContext,
              // Agregar contenido extraído del DOM
              pageTitle: pageContent?.title || '',
              metaDescription: pageContent?.metaDescription || '',
              headings: pageContent?.headings || [],
              mainText: pageContent?.mainText || '',
              // Agregar contexto de la plataforma completa
              platformContext: getPlatformContext(),
              // Agregar links disponibles según el rol del usuario
              availableLinks: availableLinks
            },
            conversationHistory: normalMessages.map(m => ({
              role: m.role,
              content: m.content
            })),
            userName: user?.display_name || user?.username || user?.first_name,
            userInfo: user ? {
              display_name: user.display_name,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              type_rol: user.type_rol
            } : undefined
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
          content: data.response || responseFallback,
          timestamp: new Date()
        };

        setNormalMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // console.error('Error en el chat:', error);
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Error en el chat:', error);
      }
      const errorContent = errorGeneric;
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      
      // Usar el setter correcto según el modo
      if (isPromptMode) {
        setPromptMessages(prev => [...prev, errorMessage]);
      } else {
        setNormalMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, normalMessages, promptMessages, activeContext, pathname, pageContextInfo, detectedContext, user, language, responseFallback, errorGeneric, isPromptMode, pageContent, availableLinks]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    const helpMessageContent = helpPrompt;

    // NO agregar el mensaje al estado - solo enviarlo como mensaje del sistema
    setIsTyping(true);

    try {
      // Usar los mensajes normales para la ayuda (solo funciona en modo normal)
      const currentMessages = normalMessages;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: helpMessageContent,
          context: activeContext,
          language,
          pageContext: {
            pathname: pathname,
            description: pageContextInfo,
            detectedArea: detectedContext,
            pageTitle: currentPageContent?.title || '',
            metaDescription: currentPageContent?.metaDescription || '',
            headings: currentPageContent?.headings || [],
            mainText: currentPageContent?.mainText || '',
            // Agregar contexto de la plataforma completa
            platformContext: getPlatformContext(),
            // Agregar links disponibles según el rol del usuario
            availableLinks: availableLinks
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
        content: data.response || helpFallback,
        timestamp: new Date()
      };

      setNormalMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // console.error('❌ Error al solicitar ayuda:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: helpError,
        timestamp: new Date()
      };
      setNormalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [activeContext, pathname, pageContextInfo, detectedContext, pageContent, user, language, helpPrompt, helpFallback, helpError, normalMessages, availableLinks]);

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
      
      console.log('🔀 Cambio de página detectado:', {
        from: previousPathname,
        to: pathname,
        useContextMode,
        messagesCount: normalMessages.length
      });
      
      // ✅ PERSISTENCIA: Guardar mensajes antes de cambiar de página si el modo de contexto está activo
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        saveContextMessages(normalMessages);
        console.log('💾 Guardando contexto antes de cambiar de página:', normalMessages.length, 'mensajes');
      }
      
      // ✅ PERSISTENCIA: NO limpiar mensajes si el modo de contexto está activo
      // Esto permite mantener el contexto del chat entre páginas
      // Limpiar mensajes y contenido de página cuando cambia la página (solo en modo normal y sin contexto)
      // Esto evita usar contenido de la página anterior
      if (!isPromptMode && !useContextMode) {
        setNormalMessages([]);
        console.log('🧹 Limpiando mensajes (modo contexto desactivado)');
      } else if (useContextMode) {
        console.log('🔒 Manteniendo mensajes (modo contexto activado)');
      }
      setPageContent(null); // Limpiar inmediatamente para evitar usar contenido antiguo
      prevPathnameRef.current = pathname;
      
      // Actualizar el contenido de la página cuando cambia (sin enviar mensaje automático)
      if (wasOpen) {
        // Marcar que ya se abrió para evitar que el otro useEffect interfiera
        hasOpenedRef.current = true;
        
        // Actualizar el contenido de la página sin enviar mensaje automático
        const timer = setTimeout(() => {
          const currentPageContent = extractPageContent();
          setPageContent(currentPageContent);
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        // Si el chat está cerrado, resetear el flag
        hasOpenedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, useContextMode, isPromptMode]); // Agregar dependencias necesarias para detectar modo de contexto

  // Actualizar contenido de página cuando se abre la LIA (sin enviar mensaje automático)
  useEffect(() => {
    // Solo ejecutar si el chat se acaba de abrir y no se ejecutó por cambio de página
    // No ejecutar si está en modo prompt
    if (isOpen && !hasOpenedRef.current && !isPromptMode) {
      // Marcar que ya se abrió
      hasOpenedRef.current = true;
      // Actualizar contenido de página sin enviar mensaje automático
      const timer = setTimeout(() => {
        const currentPageContent = extractPageContent();
        setPageContent(currentPageContent);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isPromptMode]);

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
      // Abrir en modo normal (desactivar modo prompt si estaba activo)
      setIsPromptMode(false);
      setGeneratedPrompt(null);
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnreadMessages(false);
      // No limpiar mensajes, solo cambiar de modo para mostrar los mensajes normales
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setAreButtonsExpanded(false);
    // Resetear el flag cuando se cierra para que se ejecute la ayuda al abrir de nuevo
    hasOpenedRef.current = false;
  };

  const handleOpenPromptMode = () => {
    // Abrir LIA en modo prompt
    setIsPromptMode(true);
    setGeneratedPrompt(null);
    setAreButtonsExpanded(false);
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnreadMessages(false);
    // No agregar mensaje inicial automático en modo prompt
  };

  const handleClearConversation = () => {
    // Si el modo de contexto está activado, preguntar antes de limpiar
    if (useContextMode && normalMessages.length > 0 && !isPromptMode) {
      setShowClearConfirm(true);
      return;
    }
    
    executeClearConversation();
  };

  const executeClearConversation = () => {
    if (isPromptMode) {
      setPromptMessages([]);
    } else {
      setNormalMessages([]);
      // Si hay persistencia activada, limpiar almacenamiento
      if (useContextMode) {
        try {
          localStorage.removeItem(STORAGE_KEY_CONTEXT_MESSAGES);
        } catch {}
      }
    }
    setGeneratedPrompt(null);
    setIsPromptPanelOpen(false);
    setSelectedPromptMessageId(null);
    setShowClearConfirm(false);
  };

  const handleDownloadPrompt = () => {
    if (!generatedPrompt) return;

    const promptContent = `# ${generatedPrompt.title}

## Descripción
${generatedPrompt.description}

${'='.repeat(80)}

## PROMPT LISTO PARA USAR

Copia y pega el siguiente prompt en tu herramienta de IA preferida:

${generatedPrompt.content}

${'='.repeat(80)}

## Información Adicional

### Tags
${generatedPrompt.tags.join(', ')}

### Nivel de Dificultad
${generatedPrompt.difficulty_level}

### Casos de Uso
${generatedPrompt.use_cases.map(uc => `- ${uc}`).join('\n')}

### Consejos
${generatedPrompt.tips.map(tip => `- ${tip}`).join('\n')}

---

Generado por Lia - Asistente de IA para Creación de Prompts
Fecha: ${new Date().toLocaleString()}
`;

    const blob = new Blob([promptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedPrompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ======== THEME by MODE (Normal / Prompt / Analysis / NanoBanana) ========
  type LiaMode = 'normal' | 'prompt' | 'analysis' | 'nanobana';
  const currentMode: LiaMode = isNanoBananaMode ? 'nanobana' : useContextMode ? 'analysis' : (isPromptMode ? 'prompt' : 'normal');

  const theme = useMemo(() => {
    switch (currentMode) {
      case 'nanobana':
        return {
          header: 'from-amber-500 via-orange-500 to-amber-500',
          accent: 'amber',
          bubbleUser: 'from-amber-500 to-orange-500',
          ring: 'focus:ring-amber-500',
          borderUser: 'border-amber-500',
          chipBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          chipActive: 'bg-amber-500 text-white border-transparent'
        };
      case 'prompt':
        return {
          header: 'from-purple-600 via-pink-600 to-purple-600',
          accent: 'purple',
          bubbleUser: 'from-fuchsia-500 to-purple-500',
          ring: 'focus:ring-purple-500',
          borderUser: 'border-purple-500',
          chipBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
          chipActive: 'bg-purple-500 text-white border-transparent'
        };
      case 'analysis':
        return {
          header: 'from-cyan-600 via-teal-600 to-cyan-600',
          accent: 'teal',
          bubbleUser: 'from-teal-500 to-cyan-500',
          ring: 'focus:ring-emerald-500',
          borderUser: 'border-teal-500',
          chipBg: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
          chipActive: 'bg-teal-500 text-white border-transparent'
        };
      default:
        return {
          header: 'from-blue-600 via-indigo-600 to-blue-600',
          accent: 'blue',
          bubbleUser: 'from-blue-500 to-indigo-500',
          ring: 'focus:ring-blue-500',
          borderUser: 'border-blue-500',
          chipBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
          chipActive: 'bg-blue-500 text-white border-transparent'
        };
    }
  }, [currentMode]);

  // Menu de selección de modo (tipo hamburguesa)
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!modeMenuRef.current) return;
      if (!modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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
            {/* Botones expandidos: Modo Prompt y Reportar Problema */}
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
                // Abrir en modo normal (desactivar modo prompt si estaba activo)
                setIsPromptMode(false);
                setGeneratedPrompt(null);
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

      {/* Modal del prompt generado - Se sobrepone sobre el chat */}
      <AnimatePresence>
        {isPromptMode && generatedPrompt && isPromptPanelOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-6 z-[100000] w-96 max-w-[calc(100vw-3rem)]"
            style={{
              bottom: promptBottomPosition,
              height: calculateMaxHeight,
              maxHeight: calculateMaxHeight,
            }}
          >
            <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-carbon-700 flex flex-col bg-white dark:bg-[#0f0f0f] h-full">
              {/* Header del modal de prompt */}
              <motion.div 
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4 relative overflow-hidden flex-shrink-0"
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
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Prompt Generado</h3>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPromptPanelOpen(false);
                      setGeneratedPrompt(null);
                      setSelectedPromptMessageId(null);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
              
              {/* Contenido del prompt */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain" style={{ 
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm">Título</span>
                    </h4>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm break-words">{generatedPrompt.title}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600/30">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm">Contenido</span>
                  </h4>
                  <div className="text-gray-700 dark:text-slate-300 text-sm prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed break-words">{generatedPrompt.content}</pre>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {generatedPrompt.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <motion.button
                  onClick={handleDownloadPrompt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="fixed right-6 z-[99999] w-96 max-w-[calc(100vw-3rem)]"
            style={{
              bottom: chatBottomPosition,
              height: calculateMaxHeight,
              maxHeight: calculateMaxHeight,
            }}
          >
        <div className={`rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-carbon-700 flex flex-col bg-white dark:bg-[#0f0f0f] h-full`}>
          {/* Header con gradiente - compacto */}
          <motion.div 
            className={`bg-gradient-to-r ${theme.header} px-2 py-2 relative flex-shrink-0`}
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Avatar */}
                <div className="relative w-8 h-8">
                  <Image
                    src={assistantAvatar}
                    alt={assistantName}
                    fill
                    className="rounded-full object-cover border border-white/60"
                    sizes="32px"
                  />
                  {/* Indicador de estado en línea */}
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white/70"
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
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 leading-none min-w-0">
                    <h3 className="text-white font-semibold text-sm">{assistantName}</h3>
                    <span className={`text-[11px] px-1.5 py-[2px] rounded-full border truncate max-w-[120px] ${
                      currentMode === 'nanobana' 
                        ? 'text-amber-200 bg-amber-500/30 border-amber-400/50' 
                        : currentMode === 'prompt'
                        ? 'text-purple-200 bg-purple-500/30 border-purple-400/50'
                        : currentMode === 'analysis'
                        ? 'text-teal-200 bg-teal-500/30 border-teal-400/50'
                        : 'text-white/80 bg-white/15 border-white/25'
                    }`}>
                      {currentMode === 'nanobana' ? '🎨 NanoBanana' : currentMode === 'prompt' ? 'Prompt' : currentMode === 'analysis' ? 'Contexto' : 'Asistente'}
                    </span>
                    <motion.div
                      className="flex items-center gap-1 text-white/90"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[11px]">{onlineLabel}</span>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1" ref={modeMenuRef}>
                {/* Botón limpiar conversación */}
                <button
                  onClick={handleClearConversation}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                  aria-label="Limpiar conversación"
                  title="Limpiar conversación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {/* Botón menú de modos (hamburguesa) */}
                <button
                  onClick={() => setModeMenuOpen(!modeMenuOpen)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                  aria-label="Cambiar modo de Lia"
                  title="Cambiar modo de Lia"
                >
                  {/* Icono de hamburguesa simple */}
                  <div className="flex flex-col gap-[3px]">
                    <span className="w-4 h-[2px] bg-white rounded"></span>
                    <span className="w-4 h-[2px] bg-white rounded"></span>
                    <span className="w-4 h-[2px] bg-white rounded"></span>
                  </div>
                </button>

                {/* Menú desplegable */}
                <AnimatePresence>
                  {modeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-9 top-8 bg-white/95 dark:bg-[#0d0d0d] backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="min-w-[260px] py-2">
                        {/* NANOBANA */}
                        <button
                          className={`w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                          onClick={() => { 
                            setIsNanoBananaMode(true); 
                            setIsPromptMode(false); 
                            setUseContextMode(false); 
                            setModeMenuOpen(false);
                            if (nanoBananaMessages.length === 0) {
                              const welcomeMessage: Message = {
                                id: `welcome-nanobana-${Date.now()}`,
                                role: 'assistant',
                                content: "🎨 ¡Bienvenido al Modo NanoBanana!\n\nSoy tu asistente para crear JSON estructurado optimizado para NanoBanana Pro.\n\n**¿Qué puedo crear?**\n• 📱 UI/Wireframes (apps, dashboards, landing pages)\n• 📸 Fotografías (productos, marketing, lifestyle)\n• 📊 Diagramas (flujos, arquitecturas, procesos)\n\nDescríbeme lo que necesitas y generaré un JSON preciso y reproducible.",
                                timestamp: new Date()
                              };
                              setNanoBananaMessages([welcomeMessage]);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`text-sm font-semibold ${currentMode==='nanobana' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                  🎨 NanoBanana Pro
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                                  NEW
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Genera JSON estructurado para renderizado visual preciso.</div>
                            </div>
                          </div>
                        </button>
                        {/* PROMPT */}
                        <button
                          className={`w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                          onClick={() => { setIsPromptMode(true); setIsNanoBananaMode(false); setUseContextMode(false); setModeMenuOpen(false); if (promptMessages.length===0) handleOpenPromptMode(); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                            <div className="flex-1">
                              <div className={`text-sm font-semibold ${currentMode==='prompt' ? 'text-purple-600 dark:text-purple-400' : ''}`}>Diseñador de Prompts</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Crea y refina prompts profesionales guiados por LIA.</div>
                            </div>
                          </div>
                        </button>
                        {/* CONTEXTO PERSISTENTE */}
                        <button
                          className={`w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                          onClick={() => { setUseContextMode(true); setIsPromptMode(false); setIsNanoBananaMode(false); setModeMenuOpen(false); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`text-sm font-semibold ${currentMode==='analysis' ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                                  Contexto Persistente
                                </div>
                                {normalMessages.length > 0 && useContextMode && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-300 rounded-full font-medium">
                                    {normalMessages.length} msg
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Mantiene los últimos {MAX_CONTEXT_MESSAGES} mensajes entre páginas
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Contenedor principal del chat */}
          <div className="flex flex-col w-full h-full flex-1 min-h-0 overflow-hidden">

          {/* Mensajes */}
          {(
            <motion.div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ 
                scrollBehavior: 'smooth'
              }}
            >
              {/* 🎯 INDICADOR DE CONTEXTO PREVIO */}
              {useContextMode && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky top-0 z-10 mb-2"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                      <Brain className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">
                        Contexto activo: {messages.length} mensaje{messages.length !== 1 ? 's' : ''} {messages.length > MAX_CONTEXT_MESSAGES ? `(mostrando últimos ${MAX_CONTEXT_MESSAGES})` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Deseas limpiar el contexto y empezar una conversación nueva?')) {
                          clearContextMessages();
                        }
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      title="Limpiar contexto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Fondo informativo del modelo */}
              {messages.length === 0 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-6">
                  <div className="max-w-sm text-center opacity-80">
                    <div className="mx-auto mb-3 w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-transparent">
                      {/* Usa el logo/avatares reales si existen */}
                      <img src="/icono.png" onError={(e) => ((e.target as HTMLImageElement).src = assistantAvatar)} alt="Aprende y Aplica" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-base">
                      {currentMode === 'nanobana' ? '🎨 NanoBanana Pro' : currentMode === 'prompt' ? 'Diseñador de Prompts' : currentMode === 'analysis' ? 'Contexto Persistente' : 'Asistente'}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {currentMode === 'nanobana'
                        ? 'Genera JSON estructurado para NanoBanana Pro. Describe UI, fotografías o diagramas y obtén esquemas precisos y reproducibles.'
                        : currentMode === 'prompt'
                        ? 'Genera y refina prompts profesionales. Indica el objetivo, el tono y los requisitos; LIA te entrega un prompt listo para usar con buenas prácticas.'
                        : currentMode === 'analysis'
                        ? `Mantiene la conversación activa entre páginas. Guarda automáticamente los últimos ${MAX_CONTEXT_MESSAGES} mensajes para continuar donde lo dejaste.`
                        : 'Asistente conversacional para resolver dudas generales, explorar contenido y guiarte por la plataforma.'}
                    </p>
                  </div>
                </div>
              )}
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
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border ${theme.borderUser} relative`}>
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
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border ${theme.borderUser} relative`}>
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
                  <div className={`flex-1 rounded-2xl px-3.5 py-3 shadow-lg ${
                    message.role === 'user'
                      ? `bg-gradient-to-r ${theme.bubbleUser} text-white`
                      : 'bg-white dark:bg-carbon-800 text-gray-900 dark:text-white border border-gray-200 dark:border-carbon-600'
                  }`}>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                      {renderTextWithLinks(message.content)}
                    </p>
                    
                    {/* Botón para reabrir prompt si el mensaje tiene un prompt generado */}
                    {message.role === 'assistant' && message.generatedPrompt && isPromptMode && (
                      <motion.button
                        onClick={() => {
                          setGeneratedPrompt(message.generatedPrompt!);
                          setIsPromptPanelOpen(true);
                          setSelectedPromptMessageId(message.id);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                      >
                        <Sparkles className="w-3 h-3" />
                        Ver Prompt Generado
                      </motion.button>
                    )}
                    
                    {/* Botón para reabrir NanoBanana JSON si el mensaje tiene uno generado */}
                    {message.role === 'assistant' && message.generatedNanoBanana && (
                      <motion.button
                        onClick={() => {
                          console.log('[NanoBanana] 🎨 Reabriendo panel con datos:', {
                            schema: message.generatedNanoBanana!.schema,
                            domain: message.generatedNanoBanana!.domain,
                            format: message.generatedNanoBanana!.outputFormat
                          });
                          setNanoBananaSchema(message.generatedNanoBanana!.schema);
                          setNanoBananaJsonString(message.generatedNanoBanana!.jsonString);
                          setNanoBananaDomain(message.generatedNanoBanana!.domain);
                          setNanoBananaFormat(message.generatedNanoBanana!.outputFormat);
                          setIsNanoBananaPanelOpen(true);
                          console.log('[NanoBanana] ✅ Estados actualizados, isNanoBananaPanelOpen = true');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                      >
                        <Download className="w-3 h-3" />
                        Ver JSON NanoBanana
                      </motion.button>
                    )}
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
              className="p-2 border-t border-gray-200 dark:border-carbon-700 bg-white dark:bg-[#0f0f0f] flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    // Ajustar altura dinámicamente usando la función helper
                    setTimeout(() => adjustTextareaHeight(), 0);
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder={useContextMode ? "Escribe tu pregunta..." : (promptPlaceholder ?? placeholderText)}
                  disabled={isTyping}
                  rows={1}
                  className={`flex-1 px-3 py-2 border ${
                    useContextMode 
                      ? 'bg-white/90 dark:bg-[#0b0b0b] border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400/30' 
                      : `bg-white/90 dark:bg-[#0b0b0b] ${currentMode==='prompt' ? 'border-purple-300 ring-2 ring-purple-300/30' : currentMode==='analysis' ? 'border-emerald-300 ring-2 ring-emerald-300/30' : 'border-blue-300 ring-2 ring-blue-300/30'}`
                  } rounded-lg focus:outline-none focus:ring-2 ${theme.ring} text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-inner transition-all resize-none`}
                  style={{
                    minHeight: '38px',
                    lineHeight: '1.5'
                  }}
                />
                
                {/* 🎬 Botón para activar/desactivar modo contextual */}
                {/* Botón de cerebro eliminado - el modo Análisis se controla con los chips */}
                
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
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    inputMessage.trim()
                      ? useContextMode
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90 shadow-lg'
                        : `bg-gradient-to-r ${theme.bubbleUser} text-white hover:opacity-90 shadow-lg`
                      : isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                      : `${currentMode==='prompt' ? 'bg-purple-100 text-purple-600' : currentMode==='analysis' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} hover:opacity-90`
                  } ${isTyping && !!inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTyping && inputMessage.trim() ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : inputMessage.trim() ? (
                    <Send className="w-4 h-4" />
                  ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </motion.button>
              </div>

            </motion.div>
          )}
          </div>
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

      {/* Modal de Confirmación de Limpieza */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 dark:border-white/10"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Limpiar Contexto</h3>
                    <p className="text-white/80 text-sm">Contexto Persistente activo</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Tienes <span className="font-semibold text-teal-600 dark:text-teal-400">{normalMessages.length} mensajes</span> guardados en el contexto persistente.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                  ¿Deseas borrar toda la conversación y el contexto guardado?
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeClearConversation}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
                >
                  Borrar Todo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎨 Prompt Preview Panel */}
      <AnimatePresence>
        {isPromptMode && generatedPrompt && isPromptPanelOpen && (
          <PromptPreviewPanel
            draft={generatedPrompt as PromptDraft}
            onSave={handleSavePrompt}
            onClose={() => setIsPromptPanelOpen(false)}
            onEdit={(editedDraft) => {
              setGeneratedPrompt(editedDraft as GeneratedPrompt);
            }}
            isSaving={isSavingPrompt}
          />
        )}
      </AnimatePresence>

      {/* 🎨 NanoBanana Preview Panel - Posicionado a la derecha, ENCIMA del chat */}
      {nanoBananaSchema && isNanoBananaPanelOpen && (
        <div 
          className="fixed right-4 top-20 z-[100001]"
          style={{
            width: 'min(400px, calc(100vw - 2rem))',
            maxHeight: 'calc(100vh - 6rem)'
          }}
        >
          <NanoBananaPreviewPanel
            schema={nanoBananaSchema}
            jsonString={nanoBananaJsonString}
            domain={nanoBananaDomain}
            outputFormat={nanoBananaFormat}
            isOpen={isNanoBananaPanelOpen}
            onClose={() => {
              console.log('[LIA Agent] ❌ Cerrando panel NanoBanana');
              setIsNanoBananaPanelOpen(false);
            }}
            onCopy={() => {
              console.log('[LIA Agent] 📋 JSON NanoBanana copiado');
            }}
            onDownload={() => {
              console.log('[LIA Agent] 📥 JSON NanoBanana descargado');
            }}
            onRegenerate={() => {
              // Regenerar con el último mensaje
              const lastUserMessage = nanoBananaMessages.filter(m => m.role === 'user').pop();
              if (lastUserMessage) {
                setInputMessage(lastUserMessage.content);
              }
            }}
          />
        </div>
      )}
    </>
  );
}

