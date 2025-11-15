 'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { dedupedFetch } from '../../../../lib/supabase/request-deduplication';
import {
  Play,
  BookOpen,
  MessageSquare,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ScrollText,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  Save,
  FileDown,
  Send,
  User,
  Copy,
  Check,
  Plus,
  Reply,
  Heart,
  Eye,
  CheckCircle,
  X,
  Loader2,
  Search,
  Maximize2,
  Minimize2,
  Trash2,
  Mic,
  MicOff,
  AlertCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { UserDropdown } from '../../../../core/components/UserDropdown';
// ⚡ OPTIMIZACIÓN: Lazy loading de componentes pesados para reducir bundle inicial
import dynamic from 'next/dynamic';
import { ExpandableText } from '../../../../core/components/ExpandableText';
import { useLiaChat } from '../../../../core/hooks';
import type { CourseLessonContext } from '../../../../core/types/lia.types';
import { WorkshopLearningProvider } from '../../../../components/WorkshopLearningProvider';
import { CourseRatingModal } from '../../../../features/courses/components/CourseRatingModal';
import { CourseRatingService } from '../../../../features/courses/services/course-rating.service';
import { useAuth } from '../../../../features/auth/hooks/useAuth';

// Lazy load componentes pesados (solo se cargan cuando se usan)
const NotesModal = dynamic(() => import('../../../../core/components/NotesModal').then(mod => ({ default: mod.NotesModal })), {
  loading: () => <div className="flex items-center justify-center p-8">Cargando notas...</div>,
  ssr: false // Modal no necesita SSR
});

const VideoPlayer = dynamic(() => import('../../../../core/components/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })), {
  loading: () => <div className="flex items-center justify-center aspect-video bg-gray-900 rounded-lg">Cargando video...</div>,
  ssr: false
});

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 104; // Altura real: 70px base + 34px safe-area máximo en iPhone
const CONTENT_BOTTOM_PADDING_MOBILE = 32;

interface Lesson {
  lesson_id: string;
  lesson_title: string;
  lesson_description?: string;
  lesson_order_index: number;
  duration_seconds: number;
  is_completed: boolean;
  progress_percentage: number;
  video_provider_id?: string;
  video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom';
}

interface Module {
  module_id: string;
  module_title: string;
  module_order_index: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  course_id?: string;
  title?: string;
  course_title?: string; // Para compatibilidad con datos antiguos
  description?: string;
  course_description?: string; // Para compatibilidad
  thumbnail?: string;
  course_thumbnail?: string; // Para compatibilidad
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Obtener usuario y su rol
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'transcript' | 'summary' | 'activities' | 'questions'>('video');
  
  // Estado para detectar si estamos en móvil
  const [isMobile, setIsMobile] = useState(false);
  // Estado para la altura de la pantalla (para adaptar padding en diferentes dispositivos)
  const [screenHeight, setScreenHeight] = useState(0);
  // Estado para la altura del visualViewport (para manejar el teclado en móvil)
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);
  
  // Inicializar paneles cerrados en móviles, abiertos en desktop
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  
  const [isLiaExpanded, setIsLiaExpanded] = useState(false);
  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<string[]>([]);
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false);
  const [isMaterialCollapsed, setIsMaterialCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [lessonsActivities, setLessonsActivities] = useState<Record<string, Array<{
    activity_id: string;
    activity_title: string;
    activity_type: string;
    is_required: boolean;
  }>>>({});
  const [lessonsMaterials, setLessonsMaterials] = useState<Record<string, Array<{
    material_id: string;
    material_title: string;
    material_type: string;
    is_required?: boolean;
  }>>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const isMobileBottomNavVisible = isMobile && !isLeftPanelOpen && !isRightPanelOpen;
  const mobileContentPaddingBottom = isMobileBottomNavVisible
    ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`
    : `calc(env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`;
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    id: string;
    title: string;
    content: string;
    tags: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(6);
  
  // Hook de LIA sin mensaje inicial
  const {
    messages: liaMessages,
    isLoading: isLiaLoading,
    sendMessage: sendLiaMessage,
    clearHistory: clearLiaHistory
  } = useLiaChat(null);
  
  // Estado local para el input del mensaje
  const [liaMessage, setLiaMessage] = useState('');
  const [isLiaRecording, setIsLiaRecording] = useState(false);
  // Ref para hacer scroll automático al final de los mensajes de LIA
  const liaMessagesEndRef = useRef<HTMLDivElement>(null);
  const liaPanelRef = useRef<HTMLDivElement>(null);
  // Ref para el textarea de LIA
  const liaTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Ref para rastrear si los prompts cambiaron desde fuera (no por colapso manual)
  const prevPromptsLengthRef = useRef<number>(0);

  // Limpiar prompts cuando se cambia de tab
  useEffect(() => {
    if (activeTab !== 'activities') {
      setCurrentActivityPrompts([]);
      setIsPromptsCollapsed(false);
      prevPromptsLengthRef.current = 0;
    }
  }, [activeTab]);

  // Resetear estado de colapsado cuando se establecen nuevos prompts (solo si cambió de 0 a >0)
  useEffect(() => {
    const prevLength = prevPromptsLengthRef.current;
    const currentLength = currentActivityPrompts.length;
    
    // Solo resetear si cambió de 0 a tener prompts (nuevos prompts)
    if (prevLength === 0 && currentLength > 0) {
      setIsPromptsCollapsed(false);
    }
    
    prevPromptsLengthRef.current = currentLength;
  }, [currentActivityPrompts.length]);

  // Callback memoizado para evitar loops infinitos
  const handlePromptsChange = useCallback((prompts: string[]) => {
    setCurrentActivityPrompts(prompts);
  }, []);

  // Detectar tamaño de pantalla y ajustar estado inicial de paneles
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      setScreenHeight(window.innerHeight);
    };

    // Verificar al montar
    checkMobile();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Solo ejecutar al montar

  // Detectar cambios en visualViewport para manejar el teclado en móvil
  // Similar a la implementación de LIA general
  useEffect(() => {
    if (!isMobile) {
      setVisualViewportHeight(null);
      return;
    }

    // Verificar si visualViewport está disponible
    if (typeof window !== 'undefined' && window.visualViewport) {
      const updateViewportHeight = () => {
        setVisualViewportHeight(window.visualViewport?.height || null);
      };

      // Establecer valor inicial
      updateViewportHeight();

      // Escuchar cambios en el visualViewport (cuando se abre/cierra el teclado)
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);

      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewportHeight);
        window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
      };
    } else {
      // Fallback: usar window.innerHeight si visualViewport no está disponible
      const handleResize = () => {
        setVisualViewportHeight(window.innerHeight);
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMobile]);

  const [desktopLiaHeight, setDesktopLiaHeight] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isMobile || !isRightPanelOpen) {
      setDesktopLiaHeight(undefined);
      return;
    }

    const updateDesktopHeight = () => {
      if (typeof window === 'undefined' || !liaPanelRef.current) {
        return;
      }
      const rect = liaPanelRef.current.getBoundingClientRect();
      const marginBottom = 24; // px
      const available = window.innerHeight - rect.top - marginBottom;
      const clamped = Math.max(available, 360); // asegurar altura mínima
      setDesktopLiaHeight(`${clamped}px`);
    };

    updateDesktopHeight();
    window.addEventListener('resize', updateDesktopHeight);
    window.addEventListener('scroll', updateDesktopHeight, true);

    return () => {
      window.removeEventListener('resize', updateDesktopHeight);
      window.removeEventListener('scroll', updateDesktopHeight, true);
    };
  }, [isMobile, isRightPanelOpen, activeTab, isLiaExpanded, currentLesson?.lesson_id]);

  // Calcular altura máxima disponible para el panel de LIA dinámicamente
  // Similar al sistema usado en AIChatAgent.tsx (LIA general)
  // Ahora incluye soporte para visualViewport cuando el teclado está abierto
  const calculateLiaMaxHeight = useMemo(() => {
    if (isMobile) {
      // En móvil, usar visualViewport height si está disponible (cuando el teclado está abierto)
      if (visualViewportHeight !== null) {
        // Calcular altura disponible: visualViewport height menos el header
        // El safe-area-inset-bottom se maneja en el padding del área de entrada
        const headerHeight = 56; // Altura del header de LIA
        const bottomNavHeight = isMobileBottomNavVisible ? MOBILE_BOTTOM_NAV_HEIGHT_PX : 0;
        
        // Usar calc() para incluir safe-area-inset-bottom en el cálculo CSS
        // Esto asegura que el textbox siempre esté visible cuando el teclado está abierto
        return `calc(${visualViewportHeight - headerHeight - bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`;
      }
      // Si no hay visualViewport, no retornar height para que se ajuste automáticamente
      return undefined;
    }
    
    // En desktop, usar altura calculada basada en el viewport para asegurar que se muestre el input
    if (desktopLiaHeight) {
      return desktopLiaHeight;
    }
    return 'calc(100vh - 3rem)';
  }, [isMobile, isMobileBottomNavVisible, visualViewportHeight, desktopLiaHeight]);

  // Calcular padding dinámico para el área de entrada según altura de pantalla
  const getInputAreaPadding = (): string => {
    if (!isMobile) return '1rem';
    
    // Para pantallas muy pequeñas (menos de 600px de altura), usar padding mínimo
    if (screenHeight < 600) {
      return `calc(0.75rem + max(env(safe-area-inset-bottom, 0px), 4px))`;
    }
    
    // Para pantallas pequeñas (600-800px), usar padding moderado
    if (screenHeight < 800) {
      return `calc(1rem + max(env(safe-area-inset-bottom, 0px), 8px))`;
    }
    
    // Para pantallas normales y grandes, usar padding estándar
    return `calc(1rem + max(env(safe-area-inset-bottom, 0px), 8px))`;
  };

  // Ajustar paneles cuando cambia isMobile
  useEffect(() => {
    if (isMobile) {
      // En móvil, cerrar ambos paneles si están abiertos al iniciar
      if (isLeftPanelOpen && isRightPanelOpen) {
        setIsLeftPanelOpen(false);
        setIsRightPanelOpen(false);
      }
    } else {
      // En desktop, abrir ambos paneles si están cerrados
      if (!isLeftPanelOpen && !isRightPanelOpen) {
        setIsLeftPanelOpen(true);
        setIsRightPanelOpen(true);
      }
    }
  }, [isMobile]); // Solo cuando cambia isMobile
  const [savedNotes, setSavedNotes] = useState<Array<{
    id: string;
    title: string;
    content: string;
    timestamp: string;
    lessonId: string;
    fullContent?: string;
    tags?: string[];
  }>>([]);
  const [notesStats, setNotesStats] = useState({
    totalNotes: 0,
    lessonsWithNotes: '0/0',
    lastUpdate: '-'
  });
  const [isCourseCompletedModalOpen, setIsCourseCompletedModalOpen] = useState(false);
  const [isCannotCompleteModalOpen, setIsCannotCompleteModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    type: 'activity' | 'video' | 'quiz';
    lessonId?: string; // ID de la lección que se intentó completar
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'activity',
    lessonId: undefined,
  });

  // Función para convertir HTML a texto plano con formato mejorado
  const htmlToPlainText = (html: string, addLineBreaks: boolean = true): string => {
    if (!html) return '';
    
    // Verificar que estamos en el cliente
    if (typeof document === 'undefined') {
      // Fallback simple para SSR: eliminar etiquetas HTML básicas
      return html
        .replace(/<[^>]*>/g, '') // Eliminar todas las etiquetas HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    }
    
    // Crear un elemento temporal para parsear el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convertir listas a texto legible con saltos de línea
    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      items.forEach((li, index) => {
        const listType = list.tagName.toLowerCase();
        const prefix = listType === 'ol' ? `${index + 1}. ` : '• ';
        const text = li.textContent?.trim() || '';
        // Agregar prefijo y salto de línea si está habilitado
        if (addLineBreaks) {
          li.textContent = prefix + text + '\n';
        } else {
          li.textContent = prefix + text;
        }
      });
    });
    
    // Convertir <p> y <div> a saltos de línea si está habilitado
    if (addLineBreaks) {
      const paragraphs = tempDiv.querySelectorAll('p, div');
      paragraphs.forEach(p => {
        if (p.textContent && !p.textContent.trim().endsWith('\n')) {
          p.textContent = (p.textContent || '') + '\n';
        }
      });
    }
    
    // Obtener el texto plano
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Limpiar espacios múltiples y saltos de línea excesivos
    if (addLineBreaks) {
      text = text.replace(/\n{3,}/g, '\n\n'); // Máximo 2 saltos de línea consecutivos
    }
    
    return text.trim();
  };

  // Función para generar vista previa inteligente
  const generateNotePreview = (html: string, maxLength: number = 50): string => {
    if (!html) return '';
    
    // Verificar que estamos en el cliente
    if (typeof document === 'undefined') {
      const plainText = htmlToPlainText(html, false);
      return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Verificar si el primer elemento es una lista
    const firstChild = tempDiv.firstElementChild;
    if (firstChild && (firstChild.tagName === 'UL' || firstChild.tagName === 'OL')) {
      // Si es una lista, obtener solo el primer elemento
      const firstItem = firstChild.querySelector('li');
      if (firstItem) {
        const listType = firstChild.tagName.toLowerCase();
        const prefix = listType === 'ol' ? '1. ' : '• ';
        const text = firstItem.textContent?.trim() || '';
        const preview = prefix + text;
        return preview.length > maxLength 
          ? preview.substring(0, maxLength) + '...' 
          : preview + '...';
      }
    }
    
    // Si no es una lista o no tiene elementos, usar el método normal
    const plainText = htmlToPlainText(html, false);
    return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
  };

  // Función para formatear timestamp
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Función para cargar notas de una lección
  const loadLessonNotes = async (lessonId: string, courseSlug: string) => {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/lessons/${lessonId}/notes`);
      if (response.ok) {
        const notes = await response.json();
        // Mapear notas de BD al formato del frontend
        const mappedNotes = notes.map((note: any) => {
          const preview = generateNotePreview(note.note_content, 50);
          
          return {
            id: note.note_id,
            title: note.note_title,
            content: preview,
            timestamp: formatTimestamp(note.updated_at || note.created_at),
            lessonId: note.lesson_id,
            fullContent: note.note_content, // Guardar contenido completo
            tags: note.note_tags || []
          };
        });
        setSavedNotes(mappedNotes);
      } else if (response.status === 401) {
        // Usuario no autenticado, dejar notas vacías
        setSavedNotes([]);
      }
    } catch (error) {
      // console.error('Error loading notes:', error);
      setSavedNotes([]);
    }
  };

  // Función para cargar estadísticas del curso
  const loadNotesStats = async (courseSlug: string) => {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/notes/stats`);
      if (response.ok) {
        const stats = await response.json();
        setNotesStats({
          totalNotes: stats.totalNotes,
          lessonsWithNotes: `${stats.lessonsWithNotes}/${stats.totalLessons}`,
          lastUpdate: stats.lastUpdate ? formatTimestamp(stats.lastUpdate) : '-'
        });
      } else if (response.status === 401) {
        // Usuario no autenticado - usar valores por defecto
        const allLessons = modules.flatMap((m: Module) => m.lessons);
        const totalLessons = allLessons.length;
        setNotesStats({
          totalNotes: 0,
          lessonsWithNotes: `0/${totalLessons}`,
          lastUpdate: '-'
        });
      } else if (response.status === 404) {
        // Endpoint no encontrado - usar valores por defecto sin mostrar error
        const allLessons = modules.flatMap((m: Module) => m.lessons);
        const totalLessons = allLessons.length;
        setNotesStats({
          totalNotes: 0,
          lessonsWithNotes: `0/${totalLessons}`,
          lastUpdate: '-'
        });
      }
    } catch (error) {
      // Silenciar errores de stats, usar valores por defecto
      const allLessons = modules.flatMap((m: Module) => m.lessons);
      const totalLessons = allLessons.length;
      setNotesStats({
        totalNotes: 0,
        lessonsWithNotes: `0/${totalLessons}`,
        lastUpdate: '-'
      });
    }
  };

  // ⚡ OPTIMIZACIÓN: Función para actualizar estadísticas de manera optimizada
  // Calcula las estadísticas localmente cuando es posible, evitando llamadas al servidor
  const updateNotesStatsOptimized = async (operation: 'create' | 'update' | 'delete', lessonId?: string) => {
    if (!slug) return;

    const allLessons = modules.flatMap((m: Module) => m.lessons);
    const totalLessons = allLessons.length;

    // Para operaciones de creación/eliminación, podemos actualizar optimistamente
    if (operation === 'create' || operation === 'delete') {
      // Actualizar total de notas optimistamente
      setNotesStats((prev) => {
        const currentTotal = prev.totalNotes || 0;
        const newTotal = operation === 'create' ? currentTotal + 1 : Math.max(0, currentTotal - 1);
        
        // Para lecciones con notas, usar el valor anterior y ajustar optimistamente
        // La recarga del servidor corregirá cualquier discrepancia
        const prevLessonsWithNotes = parseInt(prev.lessonsWithNotes.split('/')[0]) || 0;
        let lessonsWithNotes = prevLessonsWithNotes;
        
        if (lessonId && operation === 'create') {
          // Si creamos una nota, asumimos que la lección no tenía notas antes
          // (será corregido por la recarga del servidor si es incorrecto)
          lessonsWithNotes = Math.min(prevLessonsWithNotes + 1, totalLessons);
        } else if (lessonId && operation === 'delete') {
          // Si eliminamos una nota, asumimos que era la última de la lección
          // (será corregido por la recarga del servidor si es incorrecto)
          lessonsWithNotes = Math.max(0, prevLessonsWithNotes - 1);
        }
        
        return {
          ...prev,
          totalNotes: newTotal,
          lessonsWithNotes: `${lessonsWithNotes}/${totalLessons}`,
          lastUpdate: 'Ahora' // Actualizar timestamp inmediatamente
        };
      });

      // Recargar estadísticas completas del servidor en background (sin bloquear UI)
      // Usamos un pequeño delay para evitar múltiples llamadas si hay varias operaciones rápidas
      // y para dar tiempo a que el estado local se actualice
      setTimeout(async () => {
        await loadNotesStats(slug);
      }, 500);
    } else {
      // Para actualizaciones, solo actualizar el timestamp y recargar en background
      setNotesStats((prev) => ({
        ...prev,
        lastUpdate: 'Ahora'
      }));
      
      setTimeout(async () => {
        await loadNotesStats(slug);
      }, 500);
    }
  };

  // ⚡ OPTIMIZACIÓN: Función para agregar una nota al estado local inmediatamente
  const addNoteToLocalState = (noteData: any, lessonId: string) => {
    const preview = generateNotePreview(noteData.note_content || noteData.noteContent, 50);
    const newNote = {
      id: noteData.note_id || noteData.id,
      title: noteData.note_title || noteData.title,
      content: preview,
      timestamp: 'Ahora',
      lessonId: lessonId,
      fullContent: noteData.note_content || noteData.content,
      tags: noteData.note_tags || noteData.tags || []
    };

    setSavedNotes((prev) => {
      // Si la nota ya existe (por ID), reemplazarla; si no, agregarla al inicio
      const existingIndex = prev.findIndex(n => n.id === newNote.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newNote;
        return updated;
      } else {
        return [newNote, ...prev];
      }
    });
  };

  // ⚡ OPTIMIZACIÓN: Función para eliminar una nota del estado local inmediatamente
  const removeNoteFromLocalState = (noteId: string) => {
    setSavedNotes((prev) => prev.filter(note => note.id !== noteId));
  };


  // Función para construir el contexto de la lección actual
  const getLessonContext = (): CourseLessonContext | undefined => {
    if (!currentLesson || !course) return undefined;

    // Encontrar el módulo actual
    const currentModule = modules.find(m => 
      m.lessons.some(l => l.lesson_id === currentLesson.lesson_id)
    );

    return {
      courseTitle: course.title || course.course_title,
      courseDescription: course.description || course.course_description,
      moduleTitle: currentModule?.module_title,
      lessonTitle: currentLesson.lesson_title,
      lessonDescription: currentLesson.lesson_description,
      durationSeconds: currentLesson.duration_seconds,
      userRole: user?.type_rol || undefined
      // transcriptContent y summaryContent se cargan bajo demanda desde sus respectivos endpoints
    };
  };

  // Función para ajustar altura del textarea de LIA dinámicamente
  const adjustLiaTextareaHeight = () => {
    if (liaTextareaRef.current) {
      // Resetear altura para calcular scrollHeight correctamente
      liaTextareaRef.current.style.height = 'auto';
      liaTextareaRef.current.style.overflowY = 'hidden';
      
      const scrollHeight = liaTextareaRef.current.scrollHeight;
      
      // Altura mínima igual al botón de enviar (48px = h-12)
      const minHeight = 48; // Igual al botón (h-12)
      
      // Alturas calculadas para cada línea
      // Con padding de 12px arriba + 12px abajo = 24px
      // Fuente 14px * line-height 1.5 = 21px por línea
      const height1Line = 21 + 24; // 45px (pero usamos 48px para igualar botón)
      const height2Line = (21 * 2) + 24; // 66px
      const height3Line = (21 * 3) + 24; // 87px - altura máxima antes del scroll
      
      // Solo activar scroll si el contenido supera las 3 líneas
      if (scrollHeight > height3Line) {
        // Contenido mayor a 3 líneas: fijar altura máxima y activar scroll
        liaTextareaRef.current.style.height = `${height3Line}px`;
        liaTextareaRef.current.style.overflowY = 'auto';
      } else {
        // Contenido de 1-3 líneas: ajustar altura dinámicamente sin scroll
        const newHeight = Math.max(scrollHeight, minHeight);
        liaTextareaRef.current.style.height = `${newHeight}px`;
        liaTextareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  // Ajustar altura del textarea cuando cambia el contenido
  useEffect(() => {
    adjustLiaTextareaHeight();
  }, [liaMessage]);

  // Inicializar altura del textarea al montar el componente (igual al botón: 48px)
  useEffect(() => {
    if (liaTextareaRef.current) {
      liaTextareaRef.current.style.height = '48px';
    }
  }, []);

  // Función para enviar mensaje a LIA con contexto de la lección
  const handleSendLiaMessage = async () => {
    if (!liaMessage.trim() || isLiaLoading) return;

    const message = liaMessage.trim();
    setLiaMessage(''); // Limpiar input inmediatamente

    // Resetear altura del textarea después de enviar (igual al botón: 48px)
    if (liaTextareaRef.current) {
      liaTextareaRef.current.style.height = '48px';
      liaTextareaRef.current.style.overflowY = 'hidden';
    }

    // Construir contexto de la lección actual
    const lessonContext = getLessonContext();

    // Enviar mensaje con contexto
    await sendLiaMessage(message, lessonContext);
  };

  // Función para generar prompts sugeridos adaptados por rol (memoizada para evitar loops)
  const generateRoleBasedPrompts = useCallback(async (
    basePrompts: string[],
    activityContent: string,
    activityTitle: string,
    userRole?: string
  ): Promise<string[]> => {
    if (!userRole || basePrompts.length === 0) {
      return basePrompts; // Retornar prompts originales si no hay rol
    }

    try {
      const promptGenerationRequest = `Eres un asistente que adapta prompts educativos según el rol profesional del usuario.

ROL DEL USUARIO: ${userRole}
TÍTULO DE LA ACTIVIDAD: ${activityTitle}
CONTENIDO DE LA ACTIVIDAD: ${activityContent.substring(0, 500)}${activityContent.length > 500 ? '...' : ''}

PROMPTS BASE (como referencia):
${basePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

INSTRUCCIONES:
- Genera ${basePrompts.length} prompts nuevos adaptados específicamente para el rol "${userRole}"
- Los prompts deben ser relevantes para este rol profesional
- Mantén la misma estructura y propósito educativo que los prompts base
- Adapta ejemplos y casos de uso al contexto profesional del rol
- Retorna SOLO los prompts, uno por línea, sin numeración ni formato adicional
- Cada prompt debe ser una pregunta o instrucción clara y directa

PROMPTS ADAPTADOS:`;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: promptGenerationRequest,
          context: 'general',
          conversationHistory: [],
          isSystemMessage: true,
        }),
      });

      if (!response.ok) {
        return basePrompts; // Fallback a prompts originales
      }

      const data = await response.json();
      const generatedText = data.response || '';

      // Extraer prompts de la respuesta (cada línea es un prompt)
      const adaptedPrompts = generatedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/)) // Filtrar numeración
        .slice(0, basePrompts.length); // Limitar al número de prompts originales

      return adaptedPrompts.length > 0 ? adaptedPrompts : basePrompts;
    } catch (error) {
      console.error('Error generando prompts adaptados:', error);
      return basePrompts; // Fallback a prompts originales
    }
  }, []); // Sin dependencias ya que no usa variables del scope

  // Función para adaptar contenido de actividad según el rol
  const adaptActivityContentForRole = async (
    activityContent: string,
    activityTitle: string,
    userRole?: string
  ): Promise<string> => {
    if (!userRole) {
      return activityContent; // Retornar contenido original si no hay rol
    }

    try {
      const adaptationRequest = `Eres un asistente que adapta contenido educativo según el rol profesional del usuario.

ROL DEL USUARIO: ${userRole}
TÍTULO DE LA ACTIVIDAD: ${activityTitle}

CONTENIDO ORIGINAL DE LA ACTIVIDAD:
\`\`\`
${activityContent}
\`\`\`

INSTRUCCIONES:
- Adapta el contenido de la actividad para que sea relevante y aplicable al rol "${userRole}"
- Mantén la estructura y formato original (incluyendo separadores "---")
- Personaliza ejemplos, casos de uso y referencias al contexto profesional del rol
- Asegúrate de que los ejercicios y preguntas sean relevantes para este rol
- NO cambies la estructura general ni los separadores "---"
- Retorna SOLO el contenido adaptado, sin explicaciones adicionales

CONTENIDO ADAPTADO:`;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: adaptationRequest,
          context: 'general',
          conversationHistory: [],
          isSystemMessage: true,
        }),
      });

      if (!response.ok) {
        return activityContent; // Fallback a contenido original
      }

      const data = await response.json();
      const adaptedContent = data.response || '';

      return adaptedContent.trim() || activityContent;
    } catch (error) {
      console.error('Error adaptando contenido de actividad:', error);
      return activityContent; // Fallback a contenido original
    }
  };

  // Función para iniciar interacción con LIA desde una actividad
  const handleStartActivityInteraction = async (activityContent: string, activityTitle: string) => {
    // Abrir el panel de LIA si está cerrado
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true);
    }

    // ✅ OPTIMIZACIÓN: Usar contenido original inmediatamente, adaptar en background si es necesario
    const userRole = user?.type_rol;
    let adaptedContent = activityContent; // Usar contenido original por defecto (más rápido)
    
    // Adaptar contenido en background si hay rol del usuario (no bloquea la interacción inicial)
    if (userRole) {
      adaptActivityContentForRole(activityContent, activityTitle, userRole)
        .then((adapted) => {
          // Si la adaptación se completa y es diferente, se puede usar en mensajes futuros
          // Por ahora, usamos el contenido original para la primera interacción
          adaptedContent = adapted;
        })
        .catch((error) => {
          console.error('Error adaptando contenido (background):', error);
          // Continuar con contenido original si falla
        });
    }

    // Construir el prompt profesional para LIA con GUARDRAILS
    const roleInfo = userRole 
      ? `\n## ROL DEL USUARIO
- El usuario tiene el rol profesional: "${userRole}"
- DEBES adaptar todos los ejemplos, casos de uso y referencias al contexto profesional de este rol
- Personaliza las preguntas y ejercicios para que sean relevantes y aplicables a este rol
- Usa terminología y ejemplos que el usuario pueda relacionar con su trabajo diario
- Asegúrate de que las actividades sean prácticas y útiles para alguien con este rol profesional`
      : '';

    const systemPrompt = `# SISTEMA: Inicio de Actividad Interactiva

Vas a guiar al usuario a través de la actividad: "${activityTitle}"

## TU ROL
Eres Lia, una tutora personalizada experta y amigable. Tu objetivo es guiar al usuario paso a paso a través de esta actividad de forma conversacional, natural y motivadora.

## PERSONALIZACIÓN
- Si conoces el nombre del usuario (te será proporcionado en el contexto), DEBES usarlo en tu saludo inicial
- Comienza tu primer mensaje con "Hola [nombre del usuario]!" seguido del contenido del guión
- Si no conoces el nombre del usuario, simplemente usa "Hola!" como saludo
- Usa el nombre del usuario de manera natural y amigable a lo largo de la conversación cuando sea apropiado${roleInfo}

## ⚠️ RESTRICCIONES CRÍTICAS (GUARDRAILS)

### 🚫 DESVÍOS NO PERMITIDOS:
1. **NO te desvíes del guión**: Sigue ESTRICTAMENTE la estructura de la actividad
2. **NO ofrezcas ayuda genérica**: Si el usuario pide sugerencias, responde SOLO dentro del contexto del paso actual
3. **NO expliques conceptos no relacionados**: Mantente enfocado en completar el framework
4. **NO cambies de tema**: Si el usuario intenta cambiar de tema, redirige amablemente al paso actual

### ✅ MANEJO DE DESVÍOS:
Si el usuario:
- Se desvía del tema → Reconoce su mensaje y redirige: "Entiendo tu interés, pero primero completemos este paso del framework. [Repite la pregunta actual]"
- Pide sugerencias genéricas → Proporciona 1-2 ejemplos específicos del paso actual y pide SU respuesta
- Dice "no sé" o "ayúdame" → Ofrece 2-3 ejemplos concretos, pero insiste en que debe dar SU propia respuesta
- Da respuestas muy cortas (ej: "sí", "no", "ok") → Pide más detalles específicos necesarios para el paso actual

### 📊 SEGUIMIENTO DEL PROGRESO:
- Cuenta internamente cuántas interacciones llevan en el MISMO paso
- Si el usuario da más de 3 respuestas sin avanzar al siguiente paso del guión → Redirige firmemente: "Necesito que me des [información específica] para poder continuar con el siguiente paso"
- Después de cada respuesta útil del usuario → Avanza inmediatamente al siguiente mensaje del guión

## CONTENIDO DE LA ACTIVIDAD
A continuación te proporciono el guión completo de la actividad. Los separadores "---" indican cambios de turno (tú hablas → esperas respuesta → continúas):

\`\`\`
${adaptedContent}
\`\`\`

## INSTRUCCIONES DE EJECUCIÓN

1. **Flujo Estricto**:
   - Identifica en qué paso del guión estás (contando los separadores "---")
   - Presenta SOLO el mensaje actual del guión
   - ESPERA la respuesta del usuario
   - Valida la respuesta (¿es útil para el objetivo del paso?)
   - Si es útil → AVANZA al siguiente mensaje del guión
   - Si no es útil → Pide clarificación o ejemplos concretos, pero NO avances

2. **Formato de Mensajes**:
   - Elimina "Lia (IA):" y "[Usuario:]" del texto visible
   - Usa un tono cálido pero directo
   - Máximo 1-2 emojis por mensaje
   - Sé concisa: 3-4 oraciones máximo por mensaje (excepto el inicial)

3. **Recolección de Datos**:
   - Guarda mentalmente las respuestas del usuario para el CSV final
   - Si el framework requiere múltiples tareas → Pide UNA tarea a la vez
   - Si requiere datos para cada tarea → Pregunta por los datos de UNA tarea a la vez
   - NO te saltes pasos del guión

4. **Señales de Progreso**:
   - Cada 2-3 pasos, menciona el progreso: "¡Genial! Llevamos X de Y columnas completadas"
   - Al completar una sección importante: "✅ Columna 1 completada. Ahora vamos con la Columna 2..."

5. **Finalización**:
   - SOLO cuando hayas completado TODOS los pasos del guión
   - Genera el CSV con TODOS los datos recopilados
   - Felicita y despide

## ⚡ RECORDATORIO CONSTANTE
Antes de cada respuesta, pregúntate:
1. ¿Estoy siguiendo el guión paso a paso?
2. ¿El usuario dio la información que necesito para este paso?
3. ¿Debo avanzar al siguiente paso o pedir más detalles?
4. ¿Me estoy desviando del objetivo de la actividad?

**INICIA AHORA con el PRIMER mensaje del guión (después del primer "---"):**`;

    // Construir contexto de la lección
    const lessonContext = getLessonContext();

    // Enviar el mensaje del sistema (no será visible en el chat)
    await sendLiaMessage(systemPrompt, lessonContext, true);

    // Hacer scroll al chat
    setTimeout(() => {
      liaMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Auto-scroll al final cuando hay nuevos mensajes o cuando está cargando
  useEffect(() => {
    if (liaMessagesEndRef.current) {
      // Usar setTimeout para asegurar que el DOM se ha actualizado
      setTimeout(() => {
        liaMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [liaMessages, isLiaLoading]);

  // Función para expandir/colapsar LIA
  const handleToggleLiaExpanded = () => {
    const newExpandedState = !isLiaExpanded;
    setIsLiaExpanded(newExpandedState);
    
    // Si se está expandiendo, cerrar el panel izquierdo
    if (newExpandedState && isLeftPanelOpen) {
      setIsLeftPanelOpen(false);
    }
  };

  // Función para abrir modal de confirmación para limpiar historial
  const handleOpenClearHistoryModal = () => {
    setIsClearHistoryModalOpen(true);
  };

  // Función para limpiar el historial de LIA
  const handleConfirmClearHistory = () => {
    clearLiaHistory();
    setIsClearHistoryModalOpen(false);
  };

  // Función para abrir modal de nueva nota
  const openNewNoteModal = () => {
    setEditingNote(null);
    setIsNotesModalOpen(true);
  };

  // Función para abrir modal de editar nota
  const openEditNoteModal = (note: any) => {
    setEditingNote({
      id: note.id,
      title: note.title,
      content: note.fullContent || note.content,
      tags: note.tags || []
    });
    setIsNotesModalOpen(true);
  };

  // ⚡ OPTIMIZADO: Función para guardar nota (nueva o editada) con actualización optimista
  const handleSaveNote = async (noteData: { title: string; content: string; tags: string[] }) => {
    try {
      if (!currentLesson?.lesson_id || !slug) {
        alert('Debe seleccionar una lección para guardar la nota');
        return;
      }
      // Preparar payload según el formato que espera la API REST
      const notePayload = {
        note_title: noteData.title.trim(),
        note_content: noteData.content.trim(),
        note_tags: noteData.tags || [],
        source_type: 'manual' // Siempre manual desde el modal
      };

      if (editingNote && editingNote.id && editingNote.id.trim() !== '') {
        // Editar nota existente
        const response = await fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notePayload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          alert(`Error al actualizar la nota: ${errorData.error || 'Error desconocido'}`);
          return;
        }
        
        // ⚡ OPTIMIZACIÓN: Actualizar estado local inmediatamente
        const updatedNote = await response.json();
        if (updatedNote && updatedNote.note_id) {
          addNoteToLocalState(updatedNote, currentLesson.lesson_id);
          
          // ⚡ OPTIMIZACIÓN: Actualizar estadísticas de manera optimizada
          await updateNotesStatsOptimized('update', currentLesson.lesson_id);
          
          // Cerrar modal solo después de que todo se haya guardado correctamente
          setIsNotesModalOpen(false);
          setEditingNote(null);
        } else {
          throw new Error('La respuesta del servidor no contiene los datos esperados de la nota');
        }
      } else {
        // Crear nueva nota
        const response = await fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notePayload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          const errorMessage = errorData.error || errorData.message || 'Error desconocido';
          alert(`Error al guardar la nota: ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        // ⚡ OPTIMIZACIÓN: Actualizar estado local inmediatamente
        const newNote = await response.json();
        if (newNote && newNote.note_id) {
          addNoteToLocalState(newNote, currentLesson.lesson_id);
          
          // ⚡ OPTIMIZACIÓN: Actualizar estadísticas de manera optimizada
          await updateNotesStatsOptimized('create', currentLesson.lesson_id);
          
          // Cerrar modal solo después de que todo se haya guardado correctamente
          setIsNotesModalOpen(false);
          setEditingNote(null);
        } else {
          throw new Error('La respuesta del servidor no contiene los datos esperados de la nota');
        }
      }
    } catch (error) {
      // console.error('Error al guardar nota:', error);
      // En caso de error, recargar desde el servidor para asegurar consistencia
      if (currentLesson?.lesson_id && slug) {
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);
      }
    }
  };

  // ⚡ OPTIMIZADO: Función para eliminar nota con actualización optimista
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;
    
    try {
      if (!currentLesson?.lesson_id || !slug) {
        alert('No se puede eliminar la nota: lección no seleccionada');
        return;
      }

      // ⚡ OPTIMIZACIÓN: Eliminar del estado local inmediatamente (actualización optimista)
      removeNoteFromLocalState(noteId);
      
      // ⚡ OPTIMIZACIÓN: Actualizar estadísticas optimistamente
      await updateNotesStatsOptimized('delete', currentLesson.lesson_id);

      const response = await fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        // Si falla, recargar desde el servidor para revertir el cambio optimista
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);
        
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        alert(`Error al eliminar la nota: ${errorData.error || 'Error desconocido'}`);
      }
      // Si tiene éxito, el estado ya fue actualizado optimistamente
    } catch (error) {
      // console.error('Error al eliminar nota:', error);
      // En caso de error, recargar desde el servidor para revertir el cambio optimista
      if (currentLesson?.lesson_id && slug) {
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);
      }
      alert('Error al eliminar la nota. Por favor, intenta de nuevo.');
    }
  };

  // Función para actualizar estadísticas de notas desde el servidor
  // ⚡ DEPRECATED: Usar updateNotesStatsOptimized en su lugar
  const updateNotesStats = async () => {
    if (!slug) return;
    await loadNotesStats(slug);
  };


  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);

        // ⚡ OPTIMIZACIÓN CRÍTICA: Usar endpoint unificado para reducir de 7 requests a 1
        // Determinar lessonId para incluir datos de lección actual (opcional)
        const lessonId = currentLesson?.lesson_id || modules[0]?.lessons[0]?.lesson_id;
        const queryParams = lessonId ? `?lessonId=${lessonId}` : '';

        const learnData = await dedupedFetch(`/api/courses/${slug}/learn-data${queryParams}`);

        // Extraer datos del response unificado
        if (learnData.course) {
          setCourse(learnData.course);
        }

        if (learnData.modules) {
          setModules(learnData.modules);

          // Calcular progreso
          const allLessons = learnData.modules.flatMap((m: Module) => m.lessons);
          const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
          const totalProgress = allLessons.length > 0
            ? Math.round((completedLessons.length / allLessons.length) * 100)
            : 0;
          setCourseProgress(totalProgress);

          // ⚡ OPTIMIZACIÓN: Cargar automáticamente el último video visto
          if (learnData.lastWatchedLessonId && allLessons.length > 0) {
            const lastWatchedLesson = allLessons.find(
              (l: Lesson) => l.lesson_id === learnData.lastWatchedLessonId
            );
            if (lastWatchedLesson) {
              setCurrentLesson(lastWatchedLesson);
            } else if (allLessons.length > 0) {
              // Fallback: primera lección no completada o primera lección
              const nextIncomplete = allLessons.find((l: Lesson) => !l.is_completed);
              setCurrentLesson(nextIncomplete || allLessons[0]);
            }
          } else if (allLessons.length > 0) {
            // Si no hay último video visto, cargar primera lección no completada o primera lección
            const nextIncomplete = allLessons.find((l: Lesson) => !l.is_completed);
            setCurrentLesson(nextIncomplete || allLessons[0]);
          }
        }

        if (learnData.notesStats) {
          setNotesStats(learnData.notesStats);
        }

        // Si se incluyó lessonId y hay datos de lección, cachearlos
        if (learnData.currentLesson && lessonId) {
          // Los datos ya están cacheados en el navegador por el fetch
          // Cuando los tabs los soliciten, vendrán del cache
        }

        // ⚡ OPTIMIZACIÓN: Si hay último video visto, precargar sus datos en paralelo
        if (learnData.lastWatchedLessonId && !lessonId && learnData.modules) {
          // Precargar datos de la lección en segundo plano para acelerar cuando el usuario la vea
          dedupedFetch(
            `/api/courses/${slug}/learn-data?lessonId=${learnData.lastWatchedLessonId}`
          ).catch(() => null); // Ignorar errores, es solo precarga
        }

      } catch (error) {
        // Error manejado silenciosamente
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCourse();
    }
  }, [slug]);

  // Cargar notas cuando cambia la lección actual
  useEffect(() => {
    if (currentLesson && slug) {
      loadLessonNotes(currentLesson.lesson_id, slug);
    }
  }, [currentLesson?.lesson_id, slug]);

  // ⚡ OPTIMIZACIÓN: Actualizar last_accessed_at cuando se carga una lección
  useEffect(() => {
    if (currentLesson && slug) {
      // Actualizar last_accessed_at en segundo plano (no bloquear UI)
      fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {
        // Ignorar errores, es solo para tracking
      });
    }
  }, [currentLesson?.lesson_id, slug]);

  // ⚡ OPTIMIZACIÓN: Eliminado prefetch waterfall - datos ya vienen del endpoint unificado
  // El endpoint /learn-data ya incluye transcript, summary, activities, materials y questions


  const loadModules = async (courseSlug: string) => {
    try {
      // ⚡ OPTIMIZACIÓN: Usar dedupedFetch para evitar requests duplicados
      const data = await dedupedFetch(`/api/courses/${courseSlug}/modules`);
      const modulesResponse: Module[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.modules)
        ? data.modules
        : [];

      setModules(modulesResponse);

      const allLessons = modulesResponse.flatMap((module) => module.lessons);
      const completedLessons = allLessons.filter((lesson) => lesson.is_completed);
      const fallbackProgress =
        allLessons.length > 0
          ? Math.round((completedLessons.length / allLessons.length) * 100)
          : 0;

      const serverProgress =
        !Array.isArray(data) && data?.overall_progress_percentage !== undefined
          ? Math.round(Number(data.overall_progress_percentage))
          : null;

      if (serverProgress !== null && !Number.isNaN(serverProgress)) {
        setCourseProgress(serverProgress);
      } else {
        setCourseProgress(fallbackProgress);
      }

      const totalLessons = allLessons.length;
      setNotesStats((prev) => ({
        ...prev,
        lessonsWithNotes: totalLessons > 0 ? `0/${totalLessons}` : '0/0',
      }));

      // Esta función ya no se usa frecuentemente, pero mantenemos la lógica por compatibilidad
      if (modulesResponse.length > 0 && modulesResponse[0].lessons.length > 0) {
        const nextIncomplete = allLessons.find((lesson) => !lesson.is_completed);
        const selectedLesson = nextIncomplete || modulesResponse[0].lessons[0];
        setCurrentLesson(selectedLesson);
      }
    } catch (error) {
      // console.error('Error loading modules:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para cargar actividades y materiales de una lección
  const loadLessonActivitiesAndMaterials = async (lessonId: string) => {
    if (!slug) return;
    
    // Solo cargar si no están ya cargados
    if (lessonsActivities[lessonId] !== undefined && lessonsMaterials[lessonId] !== undefined) {
      return; // Ya están cargados
    }

    try {
      const [activitiesResponse, materialsResponse] = await Promise.all([
        fetch(`/api/courses/${slug}/lessons/${lessonId}/activities`),
        fetch(`/api/courses/${slug}/lessons/${lessonId}/materials`)
      ]);

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setLessonsActivities(prev => ({
          ...prev,
          [lessonId]: (activitiesData || []).map((a: any) => ({
            activity_id: a.activity_id,
            activity_title: a.activity_title,
            activity_type: a.activity_type,
            is_required: a.is_required
          }))
        }));
      } else {
        // Si falla, establecer como array vacío para no intentar cargar de nuevo
        setLessonsActivities(prev => ({
          ...prev,
          [lessonId]: []
        }));
      }

      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setLessonsMaterials(prev => ({
          ...prev,
          [lessonId]: (materialsData || []).map((m: any) => ({
            material_id: m.material_id,
            material_title: m.material_title,
            material_type: m.material_type,
            is_required: m.is_required || m.material_type === 'quiz' // Los quizzes son requeridos por defecto
          }))
        }));
      } else {
        // Si falla, establecer como array vacío para no intentar cargar de nuevo
        setLessonsMaterials(prev => ({
          ...prev,
          [lessonId]: []
        }));
      }
    } catch (error) {
      // En caso de error, establecer como arrays vacíos
      setLessonsActivities(prev => ({
        ...prev,
        [lessonId]: []
      }));
      setLessonsMaterials(prev => ({
        ...prev,
        [lessonId]: []
      }));
    }
  };

  // Función para toggle de expandir/colapsar lección
  const toggleLessonExpand = async (lessonId: string) => {
    const isExpanded = expandedLessons.has(lessonId);
    
    if (!isExpanded) {
      // Si se está expandiendo, cargar actividades y materiales
      await loadLessonActivitiesAndMaterials(lessonId);
    }
    
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  // Función para toggle de expandir/colapsar módulo
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Expandir automáticamente el módulo que contiene la lección actual
  useEffect(() => {
    if (currentLesson && modules.length > 0) {
      const moduleWithCurrentLesson = modules.find(module => 
        module.lessons.some(lesson => lesson.lesson_id === currentLesson.lesson_id)
      );
      
      if (moduleWithCurrentLesson) {
        setExpandedModules(prev => {
          const newSet = new Set(prev);
          newSet.add(moduleWithCurrentLesson.module_id);
          return newSet;
        });
      }
    }
  }, [currentLesson, modules]);

  // Función para encontrar todas las lecciones ordenadas en una lista plana
  const getAllLessonsOrdered = (): Array<{ lesson: Lesson; module: Module }> => {
    const allLessons: Array<{ lesson: Lesson; module: Module }> = [];
    
    // Ordenar módulos por module_order_index
    const sortedModules = [...modules].sort((a, b) => a.module_order_index - b.module_order_index);
    
    sortedModules.forEach((module) => {
      // Ordenar lecciones por lesson_order_index dentro de cada módulo
      const sortedLessons = [...module.lessons].sort((a, b) => a.lesson_order_index - b.lesson_order_index);
      sortedLessons.forEach((lesson) => {
        allLessons.push({ lesson, module });
      });
    });
    
    return allLessons;
  };

  // Función para encontrar la lección anterior
  const getPreviousLesson = (): Lesson | null => {
    if (!currentLesson || modules.length === 0) return null;
    
    const allLessons = getAllLessonsOrdered();
    const currentIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === currentLesson.lesson_id
    );
    
    if (currentIndex === -1 || currentIndex === 0) return null;
    
    return allLessons[currentIndex - 1].lesson;
  };

  // Función para encontrar la lección siguiente
  const getNextLesson = (): Lesson | null => {
    if (!currentLesson || modules.length === 0) return null;
    
    const allLessons = getAllLessonsOrdered();
    const currentIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === currentLesson.lesson_id
    );
    
    if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
    
    return allLessons[currentIndex + 1].lesson;
  };

  // Función para verificar si una lección puede ser completada
  const canCompleteLesson = (lessonId: string): boolean => {
    if (!lessonId || modules.length === 0) return false;
    
    const allLessons = getAllLessonsOrdered();
    const lessonIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === lessonId
    );
    
    // Si es la primera lección del curso, puede ser completada
    if (lessonIndex === 0) return true;
    
    // Si no es la primera, verificar que la anterior esté completada
    const previousLesson = allLessons[lessonIndex - 1].lesson;
    return previousLesson.is_completed;
  };

  // Función para verificar el estado de los quizzes obligatorios
  const checkQuizStatus = async (lessonId: string): Promise<{ canComplete: boolean; error?: string; details?: any }> => {
    try {
      const response = await fetch(`/api/courses/${params.slug}/lessons/${lessonId}/quiz/status`);
      if (!response.ok) {
        return { canComplete: true }; // Si hay error, permitir completar (retrocompatibilidad)
      }

      const data = await response.json();
      
      if (!data.hasRequiredQuizzes) {
        return { canComplete: true }; // No hay quizzes obligatorios
      }

      if (data.allQuizzesPassed) {
        return { canComplete: true };
      }

      return {
        canComplete: false,
        error: 'Hace falta realizar actividad',
        details: {
          totalRequired: data.totalRequiredQuizzes,
          passed: data.passedQuizzes,
          message: `Debes completar y aprobar todos los quizzes obligatorios (${data.passedQuizzes}/${data.totalRequiredQuizzes} completados)`,
        },
      };
    } catch (error) {
      console.error('Error verificando estado de quizzes:', error);
      return { canComplete: true }; // En caso de error, permitir completar
    }
  };

  // Función para marcar una lección como completada (local y BD)
  const markLessonAsCompleted = async (lessonId: string): Promise<boolean> => {
    if (!canCompleteLesson(lessonId)) {
      // console.log('No se puede completar la lección porque la anterior no está completada');
      return false;
    }

    // Verificar estado de quizzes obligatorios
    const quizStatus = await checkQuizStatus(lessonId);
    if (!quizStatus.canComplete) {
      // Mostrar modal de validación con el ID de la lección que se intentó completar
      setValidationModal({
        isOpen: true,
        title: 'Hace falta realizar actividad',
        message: quizStatus.details?.message || quizStatus.error || 'Debes completar y aprobar todos los quizzes obligatorios para continuar.',
        details: quizStatus.details 
          ? `Completados: ${quizStatus.details.passed} de ${quizStatus.details.totalRequired}`
          : undefined,
        type: 'activity',
        lessonId: lessonId, // Guardar el ID de la lección que se intentó completar
      });
      return false;
    }

    // NO hacer optimistic update del progreso - esperar confirmación del servidor
    // Solo actualizar el estado visual de la lección
    setModules((prevModules) => {
      return prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.lesson_id === lessonId
            ? { ...lesson, is_completed: true }
            : lesson
        ),
      }));
    });

    // Actualizar currentLesson si es la lección actual
    if (currentLesson?.lesson_id === lessonId) {
      setCurrentLesson((prev) => prev ? { ...prev, is_completed: true } : null);
    }

    // Guardar en la base de datos
    try {
      const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Intentar parsear la respuesta primero (puede ser éxito o error)
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // Si no es JSON válido, manejar como error
        // console.warn('Respuesta no es JSON válido - Status:', response.status);
        // Retornar true porque el estado local se actualizó
        return true;
      }

      if (!response.ok) {
        // Si el error es que la lección anterior no está completada, revertir el estado local
        if (responseData?.code === 'PREVIOUS_LESSON_NOT_COMPLETED') {
          // Revertir el estado local
          setModules((prevModules) => {
            const updatedModules = prevModules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.lesson_id === lessonId
                  ? { ...lesson, is_completed: false }
                  : lesson
              ),
            }));

            const allLessons = updatedModules.flatMap((m: Module) => m.lessons);
            const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
            const totalProgress = allLessons.length > 0 
              ? Math.round((completedLessons.length / allLessons.length) * 100)
              : 0;
            
            setCourseProgress(totalProgress);
            return updatedModules;
          });

          if (currentLesson?.lesson_id === lessonId) {
            setCurrentLesson((prev) => prev ? { ...prev, is_completed: false } : null);
          }

          // console.error('Error del servidor:', responseData?.error || responseData);
          return false;
        }

        // Si el error es que falta realizar actividad (quiz obligatorio)
        if (responseData?.code === 'REQUIRED_QUIZ_NOT_PASSED') {
          // Revertir el estado local (solo el estado de la lección, NO el progreso)
          setModules((prevModules) => {
            return prevModules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.lesson_id === lessonId
                  ? { ...lesson, is_completed: false }
                  : lesson
              ),
            }));
          });

          if (currentLesson?.lesson_id === lessonId) {
            setCurrentLesson((prev) => prev ? { ...prev, is_completed: false } : null);
          }

          // Mostrar modal de validación según el tipo de error
          if (responseData?.code === 'REQUIRED_QUIZ_NOT_PASSED') {
            setValidationModal({
              isOpen: true,
              title: 'Hace falta realizar actividad',
              message: responseData?.details?.message || responseData?.error || 'Debes completar y aprobar todos los quizzes obligatorios para continuar.',
              details: responseData?.details 
                ? `Completados: ${responseData.details.passed} de ${responseData.details.totalRequired}`
                : undefined,
              type: 'activity',
              lessonId: lessonId, // Guardar el ID de la lección que se intentó completar
            });
          } else {
            setValidationModal({
              isOpen: true,
              title: 'No se puede completar',
              message: responseData?.details?.message || responseData?.error || 'No se puede completar la lección en este momento.',
              type: 'activity',
              lessonId: lessonId, // Guardar el ID de la lección que se intentó completar
            });
          }
          return false;
        }

        // Para otros errores, solo loguear si hay un mensaje de error claro
        if (responseData?.error) {
          // console.warn('Advertencia al guardar progreso en BD:', responseData.error);
        } else if (response.status >= 500) {
          // Solo loguear errores del servidor (500+), no errores del cliente
          // console.warn('Error del servidor al guardar progreso - Status:', response.status);
        }
        // Retornar true porque el estado local se actualizó y los datos pueden haberse guardado
        return true;
      }

      // Si la respuesta es exitosa, procesar el resultado
      const result = responseData;
      
      // Actualizar progreso con el valor del servidor si está disponible
      if (result.progress?.overall_progress !== undefined) {
        setCourseProgress(Math.round(result.progress.overall_progress));
      }

      return true;
    } catch (error) {
      // console.error('Error al guardar progreso en BD:', error);
      // Mantener el estado local aunque falle la BD
      return true;
    }
  };

  // Función para navegar a la lección anterior
  const navigateToPreviousLesson = () => {
    const previousLesson = getPreviousLesson();
    if (previousLesson) {
      setCurrentLesson(previousLesson);
      // Cambiar al tab de video cuando navegas
      setActiveTab('video');
      // Hacer scroll hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para navegar a la lección siguiente
  const navigateToNextLesson = async () => {
    const nextLesson = getNextLesson();
    if (nextLesson && currentLesson) {
      // Guardar la lección anterior antes de cambiar
      const previousLesson = currentLesson;
      
      // Intentar marcar la lección anterior como completada ANTES de cambiar
      const canComplete = await markLessonAsCompleted(previousLesson.lesson_id);
      
      // Solo cambiar de lección si se pudo completar la anterior
      if (canComplete) {
        setCurrentLesson(nextLesson);
        setActiveTab('video');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Si no se pudo completar, el modal ya se mostró y no cambiamos de lección
    }
  };


  // Función para manejar el cambio de lección desde el panel
  const handleLessonChange = async (selectedLesson: Lesson) => {
    if (!currentLesson) {
      // Si no hay lección actual, cambiar directamente
      setCurrentLesson(selectedLesson);
      setActiveTab('video');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const allLessons = getAllLessonsOrdered();
    const currentIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === currentLesson.lesson_id
    );
    const selectedIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === selectedLesson.lesson_id
    );

    // Si se está avanzando, validar antes de cambiar
    if (selectedIndex > currentIndex) {
      const canComplete = await markLessonAsCompleted(currentLesson.lesson_id);
      
      // Solo cambiar de lección si se pudo completar la actual
      if (canComplete) {
        setCurrentLesson(selectedLesson);
        setActiveTab('video');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Si no se pudo completar, el modal ya se mostró y no cambiamos de lección
    } else {
      // Si se está retrocediendo o es la misma, cambiar directamente
      setCurrentLesson(selectedLesson);
      setActiveTab('video');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs = [
    { id: 'video' as const, label: 'Video', icon: Play },
    { id: 'transcript' as const, label: 'Transcripción', icon: ScrollText },
    { id: 'summary' as const, label: 'Resumen', icon: FileText },
    { id: 'activities' as const, label: 'Actividades', icon: Activity },
    { id: 'questions' as const, label: 'Preguntas', icon: MessageCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-lg">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Curso no encontrado</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8">El curso que buscas no existe</p>
          <button 
            onClick={() => router.push('/my-courses')} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver a Mis Cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorkshopLearningProvider
      workshopId={course?.id || course?.course_id || slug}
      activityId={currentLesson?.lesson_id || 'no-lesson'}
      enabled={!!course && !!currentLesson}
      checkInterval={30000}
      assistantPosition="bottom-right"
      assistantCompact={false}
      onDifficultyDetected={(analysis) => {
        console.log('🚨 Dificultad detectada en taller:', {
          workshop: course?.title || course?.course_title,
          lesson: currentLesson?.lesson_title,
          patterns: analysis.patterns,
          score: analysis.overallScore
        });
      }}
      onHelpAccepted={(analysis) => {
        console.log('✅ Usuario aceptó ayuda proactiva:', {
          lesson: currentLesson?.lesson_title,
          patterns: analysis.patterns
        });
        
        // Abrir el panel de LIA (panel derecho)
        setIsRightPanelOpen(true);
        
        // Construir contexto detallado de la lección actual
        const lessonContext = currentLesson 
          ? `Estoy en la lección "${currentLesson.lesson_title}"${currentLesson.lesson_description ? ` que trata sobre: ${currentLesson.lesson_description}` : ''}.`
          : 'Estoy trabajando en una lección del taller.';
        
        // Describir el patrón de dificultad detectado
        const patternDescriptions = analysis.patterns.map(p => {
          switch (p.type) {
            case 'inactivity':
              return `Llevo ${p.metadata?.inactivityDuration ? Math.floor(p.metadata.inactivityDuration / 60000) : 'varios'} minutos sin avanzar`;
            case 'excessive_scroll':
              return 'He estado haciendo scroll repetidamente buscando información';
            case 'failed_attempts':
              return 'He intentado completar la actividad varias veces sin éxito';
            case 'frequent_deletion':
              return 'He estado escribiendo y borrando varias veces';
            case 'repetitive_cycles':
              return 'He estado yendo y viniendo entre diferentes secciones';
            case 'erroneous_clicks':
              return 'He hecho varios clicks sin resultado';
            default:
              return 'Estoy teniendo dificultades para avanzar';
          }
        }).join(' y ');
        
        // Mensaje contextualizado para LIA
        const difficultyMessage = `${lessonContext} ${patternDescriptions}. ¿Podrías ayudarme a entender mejor este tema?`;
        
        sendLiaMessage(difficultyMessage);
      }}
    >
    <div className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900/30 dark:to-slate-900 overflow-hidden">
      {/* Header superior con nueva estructura - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 md:px-4 py-1.5 md:py-2 shrink-0 relative z-40"
      >
        <div className="flex items-center justify-between w-full gap-2">
          {/* Sección izquierda: Botón regresar | Nombre del taller */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* Botón de regreso */}
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
              aria-label="Volver atrás"
              title="Volver atrás"
            >
              <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
            </button>

            {/* Nombre del taller */}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">
                {course.title || course.course_title}
              </h1>
              <p className="hidden md:block text-xs text-gray-600 dark:text-slate-400">Taller de Aprende y Aplica</p>
            </div>
          </div>

          {/* Sección central: Progreso - Solo porcentaje compacto en móviles */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Barra de progreso - Oculto en móviles */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 lg:w-40 h-1.5 bg-gray-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${courseProgress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full shadow-lg"
                />
              </div>
            </div>
            {/* Porcentaje compacto - Visible siempre */}
            <span className="text-xs text-gray-900 dark:text-white/80 font-medium bg-gray-100 dark:bg-slate-700/30 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shrink-0">
              {courseProgress}%
            </span>
          </div>

          {/* Sección derecha: Usuario - Oculto en móviles */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <UserDropdown />
          </div>
        </div>
      </motion.div>

      {/* Contenido principal - 3 paneles - Responsive */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-100 dark:bg-slate-900/50 backdrop-blur-sm relative z-10">
        {/* Panel Izquierdo - Material del Curso - Drawer en móvil */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <>
              {/* Overlay oscuro en móvil */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLeftPanelOpen(false)}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                />
              )}
              
              <motion.div
                initial={isMobile ? { x: '-100%' } : { width: 0, opacity: 0 }}
                animate={isMobile ? { x: 0 } : { width: 320, opacity: 1 }}
                exit={isMobile ? { x: '-100%' } : { width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`
                  ${isMobile 
                    ? 'fixed inset-y-0 left-0 w-full max-w-sm z-50 md:relative md:inset-auto md:w-auto md:max-w-none' 
                    : 'relative'
                  }
                  bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg md:rounded-lg flex flex-col overflow-hidden shadow-xl 
                  ${isMobile ? 'my-0 ml-0 md:my-2 md:ml-2' : 'my-2 ml-2'}
                  border border-gray-200 dark:border-slate-700/50
                `}
              >
                {/* Header con línea separadora alineada con panel central */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between p-3 rounded-t-lg shrink-0 h-[56px]">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Material del Curso
                  </h2>
                  <button
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    {isMobile ? (
                      <X className="w-4 h-4 text-gray-700 dark:text-white/70" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-white/70" />
                    )}
                  </button>
                </div>

              {/* Contenido con scroll */}
              <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
                {/* Sección de Material del Curso */}
                <div className="mb-8">
                  {/* Header de Contenido con botón de colapsar */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Contenido
                    </h3>
                    <button
                      onClick={() => setIsMaterialCollapsed(!isMaterialCollapsed)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      title={isMaterialCollapsed ? "Expandir Contenido" : "Colapsar Contenido"}
                    >
                      {isMaterialCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-gray-700 dark:text-white/70" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-700 dark:text-white/70" />
                      )}
                    </button>
                  </div>

                  {/* Contenido de Material del Curso - Colapsable */}
                  <AnimatePresence>
                    {!isMaterialCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                {modules.map((module, moduleIndex) => {
                  const isModuleExpanded = expandedModules.has(module.module_id);

                  return (
                    <div key={module.module_id} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{moduleIndex + 1}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{module.module_title}</h3>
                        </div>
                        <button
                          onClick={() => toggleModuleExpand(module.module_id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-md transition-colors flex-shrink-0"
                          title={isModuleExpanded ? "Colapsar módulo" : "Expandir módulo"}
                        >
                          {isModuleExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Contenido del módulo - Colapsable */}
                      <AnimatePresence>
                        {isModuleExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {/* Estadísticas del módulo mejoradas */}
                            <div className="flex gap-3 mb-4">
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 font-medium">
                                {module.lessons.filter(l => l.is_completed).length}/{module.lessons.length} completados
                              </span>
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 font-medium">
                                {Math.round((module.lessons.filter(l => l.is_completed).length / module.lessons.length) * 100)}% completado
                              </span>
                            </div>

                            {/* Lista de lecciones mejorada - Estilo Minimalista */}
                            <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isActive = currentLesson?.lesson_id === lesson.lesson_id;
                        const isCompleted = lesson.is_completed;
                        const isExpanded = expandedLessons.has(lesson.lesson_id);
                        const activities = lessonsActivities[lesson.lesson_id] || [];
                        const materials = lessonsMaterials[lesson.lesson_id] || [];
                        const hasContent = activities.length > 0 || materials.length > 0;
                        const isContentLoaded = lessonsActivities[lesson.lesson_id] !== undefined && lessonsMaterials[lesson.lesson_id] !== undefined;

                        return (
                          <div key={lesson.lesson_id} className="w-full">
                            <div className="flex items-start gap-2">
                              <motion.button
                                whileHover={{ opacity: 0.8 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleLessonChange(lesson)}
                                className={`flex-1 flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border-l-2 border-blue-500'
                                    : 'hover:bg-gray-50/50 dark:hover:bg-slate-700/30 border-l-2 border-transparent'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                                  isCompleted 
                                    ? 'text-green-500 dark:text-green-400' 
                                    : isActive 
                                      ? 'text-blue-500 dark:text-blue-400' 
                                      : 'text-gray-400 dark:text-slate-500'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </div>
                                
                                <div className="flex-1 text-left min-w-0">
                                  <p className={`text-sm leading-relaxed line-clamp-3 ${isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-slate-300'}`}>
                                    {lesson.lesson_title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{formatDuration(lesson.duration_seconds)}</span>
                                  </div>
                                </div>
                              </motion.button>

                              {/* Botón para expandir/colapsar actividades y materiales */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // Si no se han cargado las actividades y materiales, cargarlas primero
                                  if (!isContentLoaded) {
                                    await loadLessonActivitiesAndMaterials(lesson.lesson_id);
                                  }
                                  toggleLessonExpand(lesson.lesson_id);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-md transition-colors flex-shrink-0"
                                title={isExpanded ? "Colapsar" : "Expandir actividades y materiales"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                )}
                              </button>
                            </div>

                            {/* Actividades y Materiales desplegables */}
                            <AnimatePresence>
                              {isExpanded && isContentLoaded && hasContent && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-9 mt-3 space-y-2 pl-4 border-l border-gray-200 dark:border-slate-700">
                                    {/* Actividades */}
                                    {activities.length > 0 && (
                                      <div className="space-y-1.5">
                                        {activities.map((activity) => (
                                          <div
                                            key={activity.activity_id}
                                            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group"
                                          >
                                            <Activity className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400 opacity-70 group-hover:opacity-100" />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed line-clamp-3">{activity.activity_title}</span>
                                            </div>
                                            {activity.is_required && (
                                              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 dark:text-red-400 text-xs rounded-md flex-shrink-0 font-medium whitespace-nowrap">
                                                Requerida
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Materiales */}
                                    {materials.length > 0 && (
                                      <div className="space-y-1.5">
                                        {materials.map((material) => (
                                          <div
                                            key={material.material_id}
                                            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group"
                                          >
                                            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500 dark:text-green-400 opacity-70 group-hover:opacity-100" />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed line-clamp-3">{material.material_title}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              {material.is_required && (
                                                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 dark:text-red-400 text-xs rounded-md flex-shrink-0 font-medium whitespace-nowrap">
                                                  Requerida
                                                </span>
                                              )}
                                              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 dark:text-green-400 text-xs rounded-md capitalize flex-shrink-0 font-medium whitespace-nowrap">
                                                {material.material_type}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>
          </div>

                {/* Línea separadora entre Material y Notas */}
                <div className="border-b border-gray-200 dark:border-slate-700/50 mb-6"></div>

                {/* Sección de Notas */}
                <div className="space-y-4">
                  {/* Header de Notas con botones de colapsar y nueva nota */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Mis Notas
                    </h3>
                    <div className="flex items-center gap-2">
                      {!isNotesCollapsed && (
                        <button
                          onClick={openNewNoteModal}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Nueva Nota"
                        >
                          <span className="text-sm font-bold text-gray-700 dark:text-white/70">+</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        title={isNotesCollapsed ? "Expandir Notas" : "Colapsar Notas"}
                      >
                        {isNotesCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-gray-700 dark:text-white/70" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-gray-700 dark:text-white/70" />
                        )}
                      </button>
                    </div>
        </div>

                  {/* Contenido de Notas - Colapsable */}
                  <AnimatePresence>
                    {!isNotesCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >

            {/* Notas guardadas */}
            <div className="space-y-3 mb-6">
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Notas guardadas</h3>
              <div className="space-y-2">
                {savedNotes.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-4 border border-gray-200 dark:border-slate-600/30 text-center">
                    <p className="text-sm text-gray-600 dark:text-slate-400">No hay notas guardadas aún</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Guarda tu primera nota para comenzar</p>
                  </div>
                ) : (
                  savedNotes.map((note) => (
                    <div 
                      key={note.id} 
                            className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3 border border-gray-200 dark:border-slate-600/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{note.title}</span>
                              <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-slate-400">{note.timestamp}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditNoteModal(note);
                                    }}
                                    className="p-1 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Editar nota"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(note.id);
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                    title="Eliminar nota"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-white/70 line-clamp-2 mb-2 whitespace-pre-line">
                        {note.content || generateNotePreview(note.fullContent || '', 50)}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded border border-blue-500/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                    </div>
                  </div>

            {/* Progreso de Notas */}
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Progreso de Notas
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/70">Notas creadas</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{notesStats.totalNotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/70">Lecciones con notas</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{notesStats.lessonsWithNotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/70">Última actualización</span>
                  <span className="text-gray-600 dark:text-slate-400">{notesStats.lastUpdate}</span>
                    </div>
                    </div>
                  </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Barra vertical para abrir panel izquierdo - Oculto en móviles */}
        {!isLeftPanelOpen && (
          <div className="hidden md:flex w-12 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex-col shadow-xl my-2 ml-2 z-10 border border-gray-200 dark:border-slate-700/50">
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-center p-3 rounded-t-lg shrink-0 h-[56px]">
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(false);
                  setIsNotesCollapsed(false);
                  // Si LIA está abierto, ponerlo en tamaño pequeño
                  if (isRightPanelOpen) {
                    setIsLiaExpanded(false);
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600/50 rounded-lg transition-colors"
                title="Mostrar material del curso"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-white" />
              </button>
            </div>

            {/* Botones visibles solo cuando el panel está colapsado */}
            <div className="flex-1 flex flex-col items-center gap-2 p-2">
              {/* Abrir lecciones y cerrar notas */}
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(false);
                  setIsNotesCollapsed(true);
                  // Si LIA está abierto, ponerlo en tamaño pequeño
                  if (isRightPanelOpen) {
                    setIsLiaExpanded(false);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                title="Ver lecciones"
              >
                <Layers className="w-4 h-4 text-gray-700 dark:text-white/80" />
              </button>

              {/* Abrir notas y cerrar lecciones */}
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(true);
                  setIsNotesCollapsed(false);
                  // Si LIA está abierto, ponerlo en tamaño pequeño
                  if (isRightPanelOpen) {
                    setIsLiaExpanded(false);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                title="Ver notas"
              >
                <FileText className="w-4 h-4 text-gray-700 dark:text-white/80" />
              </button>

              {/* Abrir notas, cerrar lecciones y abrir modal de nueva nota */}
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(true);
                  setIsNotesCollapsed(false);
                  openNewNoteModal();
                  // Si LIA está abierto, ponerlo en tamaño pequeño
                  if (isRightPanelOpen) {
                    setIsLiaExpanded(false);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-colors shadow-lg shadow-blue-500/25"
                title="Nueva nota"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Panel Central - Contenido del video */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-xl my-0 md:my-2 mx-0 md:mx-2 border-2 border-gray-300 dark:border-slate-700/50">
          {modules.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <BookOpen className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Este curso aún no tiene contenido</h3>
                <p className="text-gray-600 dark:text-slate-400">Los módulos y lecciones se agregarán pronto</p>
              </div>
            </div>
          ) : currentLesson ? (
            <>
              {/* Tabs mejorados - Responsive */}
              <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex gap-1 md:gap-2 p-2 md:p-3 rounded-t-lg h-[56px] items-center overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollPaddingLeft: '0.5rem', scrollPaddingRight: '0.5rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                <div className="flex gap-1 md:gap-2 items-center min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    // En móvil: siempre encoger excepto el activo; En PC: encoger solo cuando LIA está expandido
                    const shouldHideText = !isActive && (isMobile || (isLiaExpanded && !isMobile));

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center rounded-xl transition-all duration-200 relative group shrink-0 ${
                          shouldHideText
                            ? 'px-2 py-2 hover:px-3 hover:gap-2'
                            : 'px-3 md:px-4 py-2 gap-1 md:gap-2 min-w-fit'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50'
                        }`}
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span 
                          className={`text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ${
                            shouldHideText
                              ? 'max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100'
                              : ''
                          }`}
                        >
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contenido del tab activo */}
              <div
                className="flex-1 overflow-y-auto md:pb-0"
                style={{
                  paddingBottom: isMobile ? mobileContentPaddingBottom : undefined,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  className="min-h-full p-3 md:p-6 flex flex-col gap-4"
                  >
                    {activeTab === 'video' && (
                      <VideoContent 
                        lesson={currentLesson} 
                        modules={modules}
                        onNavigatePrevious={navigateToPreviousLesson}
                        onNavigateNext={navigateToNextLesson}
                        getPreviousLesson={getPreviousLesson}
                        getNextLesson={getNextLesson}
                        markLessonAsCompleted={markLessonAsCompleted}
                        canCompleteLesson={canCompleteLesson}
                        onCourseCompleted={() => setIsCourseCompletedModalOpen(true)}
                        onCannotComplete={() => setIsCannotCompleteModalOpen(true)}
                      />
                    )}
                    {activeTab === 'transcript' && (
                      <TranscriptContent 
                        lesson={currentLesson} 
                        slug={slug}
                        onNoteCreated={addNoteToLocalState}
                        onStatsUpdate={updateNotesStatsOptimized}
                      />
                    )}
                    {activeTab === 'summary' && currentLesson && <SummaryContent lesson={currentLesson} slug={slug} />}
                    {activeTab === 'activities' && (
                      <ActivitiesContent
                        lesson={currentLesson}
                        slug={slug}
                        onPromptsChange={handlePromptsChange}
                        onStartInteraction={handleStartActivityInteraction}
                        userRole={user?.type_rol}
                        generateRoleBasedPrompts={generateRoleBasedPrompts}
                      />
                    )}
                    {activeTab === 'questions' && <QuestionsContent slug={slug} courseTitle={course?.title || course?.course_title || 'Curso'} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400">Cargando lección...</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho - Solo LIA - Drawer en móvil */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <>
              {/* Overlay oscuro en móvil */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsRightPanelOpen(false)}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                />
              )}
              
              <motion.div
                ref={liaPanelRef}
                initial={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
                animate={isMobile 
                  ? { x: 0 } 
                  : { width: isLiaExpanded ? 640 : 320, opacity: 1 }
                }
                exit={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`
                  ${isMobile 
                    ? 'fixed top-0 right-0 bottom-0 w-full max-w-sm z-[60] md:relative md:inset-auto md:w-auto md:max-w-none' 
                    : 'relative'
                  }
                  bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg md:rounded-lg flex flex-col shadow-xl overflow-hidden 
                  ${isMobile ? 'my-0 mr-0 md:my-2 md:mr-2' : 'my-2 mr-2'}
                  border border-gray-200 dark:border-slate-700/50
                `}
                style={
                  isMobile
                    ? {
                        // En móvil, ajustar el bottom para respetar la navegación inferior
                        // El contenedor tiene bottom-0 en la clase, pero necesitamos sobrescribirlo
                        // cuando hay navegación inferior visible para evitar que se corte el textarea
                        bottom: isMobileBottomNavVisible
                          ? `${MOBILE_BOTTOM_NAV_HEIGHT_PX}px`
                          : 0,
                        // Usar height cuando visualViewport está disponible (teclado abierto)
                        // para asegurar que el textbox siempre esté visible
                        ...(calculateLiaMaxHeight && {
                          height: calculateLiaMaxHeight,
                          maxHeight: calculateLiaMaxHeight,
                        }),
                      }
                    : {
                        // En desktop, usar toda la altura disponible del contenedor padre
                        ...(calculateLiaMaxHeight && {
                          height: calculateLiaMaxHeight,
                          maxHeight: calculateLiaMaxHeight,
                        }),
                      }
                }
              >
                {/* Header Lia con línea separadora alineada con panel central */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between p-3 rounded-t-lg shrink-0 h-[56px]">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg shrink-0">
                      <Image
                        src="/lia-avatar.png"
                        alt="Lia"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">Lia</h3>
                      <p className="text-xs text-gray-600 dark:text-slate-400 leading-tight">Tu tutora personalizada</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleOpenClearHistoryModal}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                      title="Reiniciar conversación con Lia"
                    >
                      <Trash2 className="w-4 h-4 text-gray-700 dark:text-white/70" />
                    </button>
                    {!isMobile && (
                      <button
                        onClick={handleToggleLiaExpanded}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                        title={isLiaExpanded ? "Reducir tamaño de Lia" : "Expandir Lia"}
                      >
                        {isLiaExpanded ? (
                          <Minimize2 className="w-4 h-4 text-gray-700 dark:text-white/70" />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-gray-700 dark:text-white/70" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setIsRightPanelOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                    >
                      {isMobile ? (
                        <X className="w-4 h-4 text-gray-700 dark:text-white/70" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-700 dark:text-white/70" />
                      )}
                    </button>
                  </div>
                </div>

              {/* Chat de Lia expandido */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Área de mensajes */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{
                    paddingBottom: currentActivityPrompts.length > 0 && activeTab === 'activities' && isRightPanelOpen
                      ? (isPromptsCollapsed ? '5.5rem' : '6rem')
                      : '1rem'
                  }}
                >
                  {liaMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] min-w-0 rounded-2xl px-4 py-3 relative group ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-white/90 border border-gray-200 dark:border-slate-600/50'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-8">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(message.content);
                                    setCopiedMessageId(message.id);
                                    setTimeout(() => setCopiedMessageId(null), 2000);
                                  } catch (err) {
                                    // Fallback para navegadores que no soportan clipboard API
                                    const textArea = document.createElement('textarea');
                                    textArea.value = message.content;
                                    textArea.style.position = 'fixed';
                                    textArea.style.opacity = '0';
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(textArea);
                                    setCopiedMessageId(message.id);
                                    setTimeout(() => setCopiedMessageId(null), 2000);
                                  }
                                }}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                title="Copiar mensaje"
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  // Crear nota automáticamente con el contenido del mensaje
                                  const noteTitle = message.content.substring(0, 50).replace(/\n/g, ' ').trim() + (message.content.length > 50 ? '...' : '');
                                  setEditingNote({
                                    id: '',
                                    title: noteTitle,
                                    content: message.content,
                                    tags: ['Lia', 'Chat']
                                  });
                                  setIsNotesModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                title="Crear nota"
                              >
                                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de carga */}
                  {isLiaLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Elemento de anclaje para scroll automático */}
                  <div ref={liaMessagesEndRef} />
                </div>

                {/* Prompts Flotantes tipo NotebookLM */}
                <AnimatePresence>
                  {currentActivityPrompts.length > 0 && activeTab === 'activities' && isRightPanelOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute ${isPromptsCollapsed ? 'bottom-24' : 'bottom-20'} left-4 right-4 z-10`}
                    >
                      {isPromptsCollapsed ? (
                        // Versión colapsada - más compacta
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-xl rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-500/30 p-2"
                        >
                          <button
                            onClick={() => setIsPromptsCollapsed(false)}
                            className="w-full flex items-center justify-between hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg px-2 py-1.5 transition-colors group"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md shrink-0">
                                <HelpCircle className="w-3 h-3 text-white" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate">Prompts Sugeridos</h4>
                                <p className="text-[10px] text-gray-600 dark:text-slate-400 truncate">{currentActivityPrompts.length} {currentActivityPrompts.length === 1 ? 'disponible' : 'disponibles'}</p>
                              </div>
                            </div>
                            <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors shrink-0 ml-2" />
                          </button>
                        </motion.div>
                      ) : (
                        // Versión expandida
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200/50 dark:border-purple-500/30 max-h-[300px]"
                        >
                          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                                <HelpCircle className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Prompts Sugeridos</h4>
                                <p className="text-xs text-gray-600 dark:text-slate-400">Haz clic para enviar a Lia</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsPromptsCollapsed(true)}
                              className="p-1.5 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                              title="Minimizar prompts"
                            >
                              <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          </div>
                          <div className="space-y-2 p-4 overflow-y-auto max-h-[210px] pr-2 custom-scroll">
                            {currentActivityPrompts.map((prompt, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => {
                                  setLiaMessage(prompt);
                                  setTimeout(() => {
                                    handleSendLiaMessage();
                                    setIsPromptsCollapsed(true);
                                  }, 100);
                                }}
                                className="w-full text-left px-4 py-3 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-purple-200/50 dark:border-purple-500/30 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/30 transition-colors">
                                    <span className="text-purple-600 dark:text-purple-300 text-xs font-bold">{index + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                      {prompt}
                                    </p>
                                  </div>
                                  <Send className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Área de entrada - Similar a LIA general con mejor manejo de altura */}
                <div
                  className={`border-t border-gray-200 dark:border-slate-700/50 p-4 relative shrink-0 ${isMobile ? 'z-[70]' : ''}`}
                  style={isMobile ? {
                    // Asegurar padding suficiente para safe area y evitar que se corte
                    // El padding bottom debe incluir el safe area para dispositivos con notch
                    paddingBottom: `calc(${getInputAreaPadding()} + max(env(safe-area-inset-bottom, 0px), 8px))`,
                  } : undefined}
                >
                  <div className="flex gap-2 items-end min-w-0">
                    <textarea
                      ref={liaTextareaRef}
                      placeholder="Escribe tu pregunta a Lia..."
                      value={liaMessage}
                      onChange={(e) => {
                        setLiaMessage(e.target.value);
                        // Ajustar altura inmediatamente al cambiar el contenido
                        setTimeout(() => adjustLiaTextareaHeight(), 0);
                      }}
                      onFocus={(e) => {
                        // En móvil, asegurar que el textarea sea visible cuando se enfoca
                        // El visualViewport ya maneja el ajuste de altura, pero esto ayuda
                        // a asegurar que el scroll se haga correctamente
                        if (isMobile && window.visualViewport) {
                          // Pequeño delay para permitir que el teclado se abra
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 300);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isLiaLoading) {
                          e.preventDefault();
                          handleSendLiaMessage();
                        }
                      }}
                      disabled={isLiaLoading}
                      className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none lia-textarea-scrollbar"
                      style={{ fontSize: '14px', lineHeight: '1.5', minHeight: '48px', maxHeight: '87px', height: '48px', overflowY: 'hidden' }}
                    />
                    <button
                      onClick={() => {
                        if (liaMessage.trim()) {
                          // Si hay texto, enviar mensaje
                          handleSendLiaMessage();
                        } else {
                          // Si no hay texto, activar/desactivar grabación
                          setIsLiaRecording(!isLiaRecording);
                          // Aquí se implementaría la lógica de reconocimiento de voz
                        }
                      }}
                      disabled={isLiaLoading && !!liaMessage.trim()}
                      className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 shrink-0 ${
                        liaMessage.trim()
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-blue-500/50'
                          : isLiaRecording
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                      } ${isLiaLoading && liaMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLiaLoading && liaMessage.trim() ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : liaMessage.trim() ? (
                        <Send className="w-5 h-5" />
                      ) : isLiaRecording ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Barra vertical para abrir panel derecho - Oculto en móviles */}
        {!isRightPanelOpen && (
          <div className="hidden md:flex w-12 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex-col shadow-xl my-2 mr-2 z-10 border border-gray-200 dark:border-slate-700/50">
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-center p-3 rounded-t-lg shrink-0 h-[56px]">
            <button
              onClick={() => {
                setIsRightPanelOpen(true);
                setIsLiaExpanded(false);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Mostrar Lia"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de navegación inferior flotante para móviles */}
      {isMobileBottomNavVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 shadow-2xl"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
            height: 'calc(70px + max(env(safe-area-inset-bottom), 8px))'
          }}
        >
          <div className="flex items-center justify-around px-4 py-3">
            {/* Botón Material del Curso */}
            <button
              onClick={() => {
                setIsLeftPanelOpen(true);
                setIsRightPanelOpen(false);
              }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isLeftPanelOpen
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Material</span>
            </button>

            {/* Botón Lección Anterior */}
            {getPreviousLesson() && (
              <button
                onClick={navigateToPreviousLesson}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-xs font-medium">Anterior</span>
              </button>
            )}

            {/* Botón Lección Siguiente */}
            {getNextLesson() && (
              <button
                onClick={navigateToNextLesson}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-xs font-medium">Siguiente</span>
              </button>
            )}

            {/* Botón Lia */}
            <button
              onClick={() => {
                setIsRightPanelOpen(true);
                setIsLeftPanelOpen(false);
              }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isRightPanelOpen
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-medium">Lia</span>
            </button>
          </div>
        </motion.div>
      )}

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        initialNote={editingNote}
        isEditing={!!editingNote}
      />

      {/* Modal de Curso Completado */}
      <AnimatePresence>
        {isCourseCompletedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCourseCompletedModalOpen(false)}
          >
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6"
            >
              {/* Icono de éxito */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                ¡Felicidades!
              </h3>

              {/* Mensaje */}
              <p className="text-slate-300 text-center mb-4">
                Has completado el curso exitosamente. ¡Buen trabajo!
              </p>

              {/* Mensaje informativo sobre certificado */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
                <p className="text-blue-300 text-center text-sm">
                  📜 A continuación, completa una breve encuesta para acceder a tu certificado
                </p>
              </div>

              {/* Botón de cerrar */}
              <button
                onClick={async () => {
                  setIsCourseCompletedModalOpen(false);
                  // Verificar si el usuario ya calificó después de cerrar el modal de completado
                  if (!hasUserRated && slug) {
                    try {
                      const ratingCheck = await CourseRatingService.checkUserRating(slug);
                      if (!ratingCheck.hasRating) {
                        // Mostrar modal de rating después de un breve delay
                        setTimeout(() => {
                          setIsRatingModalOpen(true);
                        }, 500);
                      } else {
                        setHasUserRated(true);
                      }
                    } catch (error) {
                      // Si hay error, no mostrar el modal
                      console.error('Error checking rating:', error);
                    }
                  }
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Aceptar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de No Puede Completar */}
      <AnimatePresence>
        {isCannotCompleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCannotCompleteModalOpen(false)}
          >
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6"
            >
              {/* Icono de advertencia */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                  <HelpCircle className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                No puedes completar esta lección
              </h3>

              {/* Mensaje */}
              <p className="text-slate-300 text-center mb-6">
                Tienes lecciones pendientes que debes completar antes de terminar el curso. Completa todas las lecciones anteriores en orden.
              </p>

              {/* Botón de cerrar */}
              <button
                onClick={() => setIsCannotCompleteModalOpen(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Validación (Actividades/Video/Quiz) */}
      <AnimatePresence>
        {validationModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setValidationModal({ ...validationModal, isOpen: false })}
          >
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6"
            >
              {/* Icono según el tipo de validación */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                  validationModal.type === 'activity' || validationModal.type === 'quiz'
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/25'
                    : validationModal.type === 'video'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/25'
                    : 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-yellow-500/25'
                }`}>
                  {validationModal.type === 'activity' || validationModal.type === 'quiz' ? (
                    <AlertCircle className="w-10 h-10 text-white" />
                  ) : validationModal.type === 'video' ? (
                    <Info className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                {validationModal.title}
              </h3>

              {/* Mensaje */}
              <p className="text-slate-300 text-center mb-4">
                {validationModal.message}
              </p>

              {/* Detalles adicionales si existen */}
              {validationModal.details && (
                <div className="mb-6 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                  <p className="text-slate-200 text-sm text-center font-medium">
                    {validationModal.details}
                  </p>
                </div>
              )}

              {/* Botón de cerrar */}
              <button
                onClick={() => {
                  // Cerrar el modal
                  const lessonIdToShow = validationModal.lessonId;
                  setValidationModal({ ...validationModal, isOpen: false });
                  
                  // Si hay una lección guardada, cambiar a esa lección y abrir actividades
                  if (lessonIdToShow) {
                    // Buscar la lección en todos los módulos
                    const allLessons = getAllLessonsOrdered();
                    const lessonToShow = allLessons.find(
                      (item) => item.lesson.lesson_id === lessonIdToShow
                    );
                    
                    if (lessonToShow) {
                      // Cambiar a la lección correspondiente
                      setCurrentLesson(lessonToShow.lesson);
                      // Cambiar al tab de actividades
                      setActiveTab('activities');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación para Limpiar Historial de LIA */}
      <AnimatePresence>
        {isClearHistoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsClearHistoryModalOpen(false)}
          >
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-2xl max-w-md w-full p-6"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg shadow-blue-500/25">
                  <Image
                    src="/lia-avatar.png"
                    alt="Lia"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                ¿Reiniciar conversación con Lia?
              </h3>

              {/* Mensaje */}
              <p className="text-gray-600 dark:text-slate-300 text-center mb-6">
                ¿Quieres limpiar el historial de la conversación y empezar de nuevo? El chat se reiniciará y comenzarás una nueva conversación con Lia.
              </p>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsClearHistoryModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-medium rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmClearHistory}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  Reiniciar conversación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Rating */}
      <CourseRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        courseSlug={slug}
        courseTitle={course?.title || course?.course_title}
        onRatingSubmitted={() => {
          setHasUserRated(true);
          setIsRatingModalOpen(false);
          // Redirigir a la página de certificados después de completar la encuesta
          router.push('/certificates');
        }}
      />
    </div>
    </WorkshopLearningProvider>
  );
}

// Componentes de contenido
function VideoContent({ 
  lesson, 
  modules, 
  onNavigatePrevious, 
  onNavigateNext,
  getPreviousLesson,
  getNextLesson,
  markLessonAsCompleted,
  canCompleteLesson,
  onCourseCompleted,
  onCannotComplete
}: { 
  lesson: Lesson;
  modules: Module[];
  onNavigatePrevious: () => void;
  onNavigateNext: () => void | Promise<void>;
  getPreviousLesson: () => Lesson | null;
  getNextLesson: () => Lesson | null;
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>;
  canCompleteLesson: (lessonId: string) => boolean;
  onCourseCompleted: () => void;
  onCannotComplete: () => void;
}) {
  // Verificar si la lección tiene video
  const hasVideo = lesson.video_provider && lesson.video_provider_id;
  
  // Obtener lecciones anterior y siguiente
  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();
  
  // Determinar si hay lección anterior y siguiente (con o sin video)
  const hasPreviousLesson = previousLesson !== null;
  const hasNextLesson = nextLesson !== null;
  
  // Determinar si hay video anterior y siguiente
  const hasPreviousVideo = hasPreviousLesson && previousLesson.video_provider && previousLesson.video_provider_id;
  const hasNextVideo = hasNextLesson && nextLesson.video_provider && nextLesson.video_provider_id;
  
  // Determinar si es la última lección
  const isLastLesson = !hasNextLesson;
  
  // Debug logging
  // console.log('VideoContent - Lesson data:', {
  //   lesson_id: lesson.lesson_id,
  //   lesson_title: lesson.lesson_title,
  //   video_provider: lesson.video_provider,
  //   video_provider_id: lesson.video_provider_id,
  //   hasVideo,
  //   hasPreviousVideo,
  //   hasNextVideo,
  //   fullLesson: lesson
  // });
  
  return (
    <div className="space-y-6 pb-16 md:pb-6">
      <div className="relative w-full">
        {hasVideo ? (
          <div className="aspect-video rounded-xl overflow-hidden border border-carbon-600 relative bg-black">
            <VideoPlayer
              videoProvider={lesson.video_provider!}
              videoProviderId={lesson.video_provider_id!}
              title={lesson.lesson_title}
              className="w-full h-full"
            />
            
            {/* Botones de navegación - Centrados verticalmente */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4">
              {/* Botón anterior - lado izquierdo */}
              {hasPreviousVideo && (
                <button
                  onClick={onNavigatePrevious}
                  className="pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
                    Anterior
                  </span>
                </button>
              )}
              
              {/* Botón siguiente o terminar - lado derecho */}
              {(hasNextVideo || isLastLesson) && (
                <button
                  onClick={isLastLesson ? async () => {
                    // Verificar si se puede completar la lección
                    if (lesson && canCompleteLesson(lesson.lesson_id)) {
                      // Marcar la última lección como completada antes de terminar
                      const success = await markLessonAsCompleted(lesson.lesson_id);
                      if (success) {
                        // Mostrar modal de curso completado
                        onCourseCompleted();
                      } else {
                        // Mostrar modal de error si no se puede completar
                        onCannotComplete();
                      }
                    } else {
                      // Mostrar modal de error si no se puede completar
                      onCannotComplete();
                    }
                  } : onNavigateNext}
                  className={`pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3 ${
                    isLastLesson ? 'bg-green-500/50 hover:bg-green-600/70' : ''
                  }`}
                >
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
                    {isLastLesson ? 'Terminar' : 'Siguiente'}
                  </span>
                  {isLastLesson ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl flex items-center justify-center border border-carbon-600 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-600 transition-all transform group-hover:scale-110">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-gray-700 dark:text-white/70">Video no disponible</p>
            </div>
            
            {/* Botones de navegación incluso si no hay video - Centrados verticalmente */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4">
              {/* Botón anterior - lado izquierdo */}
              {hasPreviousVideo && (
                <button
                  onClick={onNavigatePrevious}
                  className="pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
                    Anterior
                  </span>
                </button>
              )}
              
              {/* Botón siguiente o terminar - lado derecho */}
              {(hasNextVideo || isLastLesson) && (
                <button
                  onClick={isLastLesson ? async () => {
                    // Verificar si se puede completar la lección
                    if (lesson && canCompleteLesson(lesson.lesson_id)) {
                      // Marcar la última lección como completada antes de terminar
                      const success = await markLessonAsCompleted(lesson.lesson_id);
                      if (success) {
                        // Mostrar modal de curso completado
                        onCourseCompleted();
                      } else {
                        // Mostrar modal de error si no se puede completar
                        onCannotComplete();
                      }
                    } else {
                      // Mostrar modal de error si no se puede completar
                      onCannotComplete();
                    }
                  } : onNavigateNext}
                  className={`pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3 ${
                    isLastLesson ? 'bg-green-500/50 hover:bg-green-600/70' : ''
                  }`}
                >
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
                    {isLastLesson ? 'Terminar' : 'Siguiente'}
                  </span>
                  {isLastLesson ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.lesson_title}</h2>
        {lesson.lesson_description && (
          <ExpandableText 
            text={lesson.lesson_description} 
            maxLines={2}
            className="mt-2"
          />
        )}
      </div>
    </div>
  );
}

function TranscriptContent({ 
  lesson, 
  slug,
  onNoteCreated,
  onStatsUpdate
}: { 
  lesson: Lesson | null; 
  slug: string;
  onNoteCreated: (noteData: any, lessonId: string) => void;
  onStatsUpdate: (operation: 'create' | 'update' | 'delete', lessonId?: string) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar transcripción bajo demanda
  useEffect(() => {
    async function loadTranscript() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/transcript`);
        if (response.ok) {
          const data = await response.json();
          setTranscriptContent(data.transcript_content || null);
        } else {
          setTranscriptContent(null);
        }
      } catch (error) {
        // console.error('Error loading transcript:', error);
        setTranscriptContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadTranscript();
  }, [lesson?.lesson_id, slug]);

  // Verificar si existe contenido de transcripción
  const hasTranscript = transcriptContent && transcriptContent.trim().length > 0;
  
  // Calcular tiempo de lectura estimado (palabras por minuto promedio: 200)
  const estimatedReadingTime = transcriptContent 
    ? Math.ceil(transcriptContent.split(/\s+/).length / 200)
    : 0;
  
  // Función para descargar la transcripción
  const handleDownloadTranscript = () => {
    if (!transcriptContent || !lesson) return;
    
    const blob = new Blob([transcriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcripcion-${lesson.lesson_title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Función para copiar al portapapeles
  const handleCopyToClipboard = async () => {
    if (!transcriptContent) return;
    
    try {
      await navigator.clipboard.writeText(transcriptContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset después de 2 segundos
    } catch (error) {
      // console.error('Error al copiar al portapapeles:', error);
      alert('Error al copiar al portapapeles');
    }
  };
  
  // Función para guardar en notas
  const handleSaveToNotes = async () => {
    if (!transcriptContent || !lesson) return;
    
    setIsSaving(true);
    
    try {
      // Preparar payload según el formato que espera la API REST
      const notePayload = {
        note_title: `Transcripción: ${lesson.lesson_title}`,
        note_content: transcriptContent,
        note_tags: ['transcripción', 'automática'],
        source_type: 'manual' // Usar valor válido según la restricción de la BD
      };

      // console.log('=== DEBUG TRANSCRIPCIÓN ===');
      // console.log('Enviando payload de nota:', notePayload);
      // console.log('URL de la API:', `/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`);

      const response = await fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(notePayload)
      });
      
      // console.log('Respuesta del servidor:', response.status, response.statusText);
      // console.log('Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          // console.log('Respuesta del servidor (texto):', responseText);
          
          if (responseText) {
            errorData = JSON.parse(responseText);
          } else {
            errorData = { error: 'Respuesta vacía del servidor' };
          }
        } catch (parseError) {
          // console.error('Error al parsear respuesta JSON:', parseError);
          errorData = { error: 'Error al procesar respuesta del servidor' };
        }
        
        // console.error('Error detallado del servidor:', errorData);
        alert(`Error al guardar la transcripción en notas:\n\n${errorData.error || 'Error desconocido'}\n\nDetalles: ${errorData.message || 'Sin detalles adicionales'}\n\nCódigo de estado: ${response.status}`);
        return;
      }
      
      const newNote = await response.json();
      // console.log('Nota creada exitosamente:', newNote);
      // console.log('=== FIN DEBUG ===');
      
      // ⚡ OPTIMIZACIÓN: Actualizar estado local inmediatamente
      if (lesson?.lesson_id) {
        onNoteCreated(newNote, lesson.lesson_id);
        await onStatsUpdate('create', lesson.lesson_id);
      }
      
      // Mostrar mensaje de éxito
      alert('✅ Transcripción guardada exitosamente en notas');
      
    } catch (error) {
      // console.error('Error al guardar transcripción en notas:', error);
      // console.log('=== FIN DEBUG (ERROR) ===');
      alert(`❌ Error al guardar la transcripción en notas:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nRevisa la consola para más detalles.`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!lesson) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Transcripción del Video</h2>
        </div>
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Selecciona una lección</h3>
          <p className="text-slate-400">
            Selecciona una lección del panel izquierdo para ver su transcripción
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transcripción del Video</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-gray-400 dark:text-gray-400 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Cargando transcripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transcripción del Video</h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
      </div>
      
      {hasTranscript ? (
        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-300 dark:border-slate-600 overflow-hidden">
          {/* Header de la transcripción */}
          <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b-2 border-gray-300 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ScrollText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="text-gray-900 dark:text-white font-semibold">Transcripción Completa</h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-slate-400">
                <span>{transcriptContent?.length || 0} caracteres</span>
                <span>•</span>
                <span>{estimatedReadingTime} min lectura</span>
              </div>
            </div>
          </div>
          
          {/* Contenido de la transcripción */}
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-gray-900 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {transcriptContent}
              </div>
            </div>
          </div>
          
          {/* Footer con acciones */}
          <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-t-2 border-gray-300 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleCopyToClipboard}
                  className="flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{isCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button 
                  onClick={handleDownloadTranscript}
                  className="flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="text-sm">Descargar</span>
                </button>
                <button 
                  onClick={handleSaveToNotes}
                  disabled={isSaving}
                  className="flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span className="text-sm">{isSaving ? 'Guardando...' : 'Guardar en notas'}</span>
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-500">
                Última actualización: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-300 dark:border-slate-600 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-gray-400 dark:text-slate-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Transcripción no disponible</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Esta lección aún no tiene transcripción disponible. La transcripción se agregará próximamente.
          </p>
          <div className="text-sm text-gray-500 dark:text-slate-500">
            <p>• Verifica que el video tenga audio</p>
            <p>• La transcripción se genera automáticamente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryContent({ lesson, slug }: { lesson: Lesson; slug: string }) {
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar resumen bajo demanda
  useEffect(() => {
    async function loadSummary() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/summary`);
        if (response.ok) {
          const data = await response.json();
          setSummaryContent(data.summary_content || null);
        } else {
          setSummaryContent(null);
        }
      } catch (error) {
        // console.error('Error loading summary:', error);
        setSummaryContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [lesson?.lesson_id, slug]);

  // Verificar si existe contenido de resumen
  const hasSummary = summaryContent && summaryContent.trim().length > 0;
  
  // Calcular tiempo de lectura estimado (palabras por minuto promedio: 200)
  const estimatedReadingTime = summaryContent 
    ? Math.ceil(summaryContent.split(/\s+/).length / 200)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resumen del Video</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-400 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Cargando resumen...</p>
        </div>
      </div>
    );
  }

  if (!hasSummary) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resumen del Video</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-300 dark:border-slate-600 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400 dark:text-slate-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Resumen no disponible</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Esta lección aún no tiene resumen disponible. El resumen se agregará próximamente.
          </p>
          <div className="text-sm text-gray-500 dark:text-slate-500">
            <p>• El resumen se genera o agrega manualmente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resumen del Video</h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
      </div>
      
      <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-300 dark:border-slate-600 overflow-hidden">
        {/* Header del resumen */}
        <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b-2 border-gray-300 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="text-gray-900 dark:text-white font-semibold">Resumen Completo</h3>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-slate-400">
              <span>{summaryContent?.split(/\s+/).length || 0} palabras</span>
              <span>•</span>
              <span>{estimatedReadingTime} min lectura</span>
            </div>
          </div>
        </div>
        
        {/* Contenido del resumen */}
        <div className="p-6">
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-gray-900 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {summaryContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para renderizar quizzes
function QuizRenderer({ 
  quizData, 
  totalPoints,
  lessonId,
  slug,
  materialId,
  activityId
}: {
  quizData: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string | number;
    explanation?: string;
    points?: number;
    questionType?: string;
  }>;
  totalPoints?: number;
  lessonId?: string;
  slug?: string;
  materialId?: string;
  activityId?: string;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Función para normalizar strings y comparar opciones
  const normalizeOption = (text: string): string => {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .toLowerCase();
  };

  // Función para convertir entre "true"/"false" y "Verdadero"/"Falso"
  const normalizeTrueFalse = (value: string): string => {
    const normalized = normalizeOption(value);
    if (normalized === 'true' || normalized === 'verdadero') return 'verdadero';
    if (normalized === 'false' || normalized === 'falso') return 'falso';
    return normalized;
  };

  // Función para verificar si una respuesta es correcta
  const isAnswerCorrect = (question: any, selectedAnswer: string | number): boolean => {
    const correctAnswer = question.correctAnswer;
    const options = question.options;

    // Si es pregunta de verdadero/falso, usar normalización especial
    if (question.questionType === 'true_false') {
      // Si la respuesta seleccionada es un índice
      if (typeof selectedAnswer === 'number') {
        const selectedOption = options[selectedAnswer];
        if (typeof correctAnswer === 'string') {
          return normalizeTrueFalse(selectedOption) === normalizeTrueFalse(correctAnswer);
        }
        if (typeof correctAnswer === 'number') {
          return selectedAnswer === correctAnswer;
        }
      }
      // Si la respuesta seleccionada es un string
      if (typeof selectedAnswer === 'string') {
        if (typeof correctAnswer === 'string') {
          return normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(correctAnswer);
        }
        if (typeof correctAnswer === 'number') {
          return normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(options[correctAnswer]);
        }
      }
      return false;
    }

    // Para otros tipos de preguntas, usar la lógica original
    // Si la respuesta seleccionada es un índice
    if (typeof selectedAnswer === 'number') {
      // Caso 1: correctAnswer es también un índice
      if (typeof correctAnswer === 'number') {
        return selectedAnswer === correctAnswer;
      }

      // Caso 2: correctAnswer es un string (texto de la opción)
      if (typeof correctAnswer === 'string') {
        const selectedOption = options[selectedAnswer];
        // Comparación flexible ignorando espacios y mayúsculas
        return normalizeOption(selectedOption) === normalizeOption(correctAnswer);
      }
    }

    // Si la respuesta seleccionada es un string
    if (typeof selectedAnswer === 'string') {
      if (typeof correctAnswer === 'string') {
        return normalizeOption(selectedAnswer) === normalizeOption(correctAnswer);
      }
      if (typeof correctAnswer === 'number') {
        return normalizeOption(selectedAnswer) === normalizeOption(options[correctAnswer]);
      }
    }

    return false;
  };

  // Normalizar preguntas: asegurar que las de verdadero/falso tengan las opciones correctas
  const normalizedQuizData = quizData.map((question) => {
    if (question.questionType === 'true_false') {
      // Si no tiene opciones o tiene opciones incorrectas, inicializar con las correctas
      if (!question.options || question.options.length !== 2 || 
          (question.options[0] !== 'Verdadero' && question.options[0] !== 'Falso') ||
          (question.options[1] !== 'Verdadero' && question.options[1] !== 'Falso')) {
        return {
          ...question,
          options: ['Verdadero', 'Falso']
        };
      }
    }
    return question;
  });

  const handleSubmit = async () => {
    // Validar que todas las preguntas tengan respuesta
    const unansweredQuestions = normalizedQuizData.filter(
      (q) => selectedAnswers[q.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      setSubmitError(`Por favor responde todas las preguntas (${unansweredQuestions.length} sin responder)`);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Calcular puntuación localmente primero
      let correct = 0;
      let points = 0;
      normalizedQuizData.forEach(question => {
        const selectedAnswer = selectedAnswers[question.id];
        if (selectedAnswer !== undefined && isAnswerCorrect(question, selectedAnswer)) {
          correct++;
          points += question.points || 1;
        }
      });
      setScore(correct);
      setPointsEarned(points);
      setShowResults(true);

      // Si tenemos lessonId y slug, guardar en la base de datos
      if (lessonId && slug) {
        try {
          const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/quiz/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              answers: selectedAnswers,
              quizData: normalizedQuizData,
              materialId: materialId || null,
              activityId: activityId || null,
              totalPoints: totalPoints,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error('Error guardando quiz:', result.error);
            setSubmitError(result.error || 'Error al guardar las respuestas');
          } else {
            // Quiz guardado exitosamente o no se guardó porque no mejoró
            console.log('Quiz procesado:', result);
            
            // Guardar mensaje del servidor para mostrarlo en los resultados
            if (result.message) {
              setServerMessage(result.message);
            }
          }
        } catch (error) {
          console.error('Error al enviar quiz:', error);
          // No mostrar error al usuario si el cálculo local fue exitoso
          // Solo loguear el error
        }
      }
    } catch (error) {
      console.error('Error procesando quiz:', error);
      setSubmitError('Error al procesar el quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = normalizedQuizData.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passingThreshold = 80;
  const passed = percentage >= passingThreshold;

  // Función para parsear explicaciones con formato especial (separadas por ---)
  const parseExplanation = (question: any, selectedAnswer: string | number) => {
    const explanation = question.explanation;
    if (!explanation) return null;

    // Verificar si la explicación tiene el formato con "---"
    if (explanation.includes('---')) {
      const parts = explanation.split('---').map((p: string) => p.trim());

      // Obtener el texto de la opción seleccionada
      let selectedOptionText = '';
      if (typeof selectedAnswer === 'number' && question.options[selectedAnswer]) {
        selectedOptionText = question.options[selectedAnswer];
      } else if (typeof selectedAnswer === 'string') {
        selectedOptionText = selectedAnswer;
      }

      // Extraer la letra de la opción seleccionada (A, B, C, D)
      const letterMatch = selectedOptionText.match(/\(([A-Z])\)/);
      const selectedLetter = letterMatch ? letterMatch[1] : null;

      if (selectedLetter) {
        // Buscar el feedback para esa letra
        for (const part of parts) {
          // Buscar feedback que empiece con (A), (B), etc.
          const feedbackMatch = part.match(new RegExp(`^\\(${selectedLetter}\\)\\s+(Feedback|Comentarios):?\\s*(.*)`, 's'));
          if (feedbackMatch) {
            return feedbackMatch[2].trim();
          }
        }
      }

      // Si no encontramos un feedback específico, mostrar toda la explicación
      return explanation;
    }

    return explanation;
  };

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 rounded-lg p-4 mb-4">
        <p className="text-gray-800 dark:text-slate-100 text-sm mb-2">
          <strong>Instrucciones:</strong> Responde las siguientes {totalQuestions} pregunta{totalQuestions !== 1 ? 's' : ''} para verificar tu comprensión.
        </p>
        {totalPoints !== undefined && (
          <p className="text-gray-800 dark:text-slate-100 text-sm mb-2">
            <strong>Puntos totales:</strong> {totalPoints}
          </p>
        )}
        <p className="text-gray-700 dark:text-slate-200 text-sm">
          Debes obtener al menos un {passingThreshold}% para aprobar ({Math.ceil(totalQuestions * passingThreshold / 100)} de {totalQuestions} correctas).
          <span className="block mt-1"><strong>Umbral de aprobación:</strong> {passingThreshold}%</span>
        </p>
      </div>

      {/* Preguntas */}
      <div className="space-y-6">
        {normalizedQuizData.map((question, index) => {
          const selectedAnswer = selectedAnswers[question.id];
          const isCorrect = selectedAnswer !== undefined && isAnswerCorrect(question, selectedAnswer);
          const showExplanation = showResults && selectedAnswer !== undefined;

          return (
            <div
              key={question.id}
              className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border-2 ${
                showResults
                  ? isCorrect
                    ? 'border-green-500/50 bg-green-50 dark:bg-green-500/20 dark:border-green-500/50'
                    : 'border-red-500/50 bg-red-50 dark:bg-red-500/20 dark:border-red-500/50'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  showResults
                    ? isCorrect
                      ? 'bg-green-500/20 dark:bg-green-500/30 text-green-600 dark:text-green-400 border border-green-500/30 dark:border-green-500/50'
                      : 'bg-red-500/20 dark:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-500/50'
                    : 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 border border-blue-500/30 dark:border-blue-500/50'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h4 className="text-gray-900 dark:text-slate-100 font-semibold leading-relaxed flex-1">
                      {question.question}
                    </h4>
                    {question.points && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 text-xs rounded-full border border-purple-300 dark:border-purple-500/50 shrink-0">
                        {question.points} {question.points === 1 ? 'punto' : 'puntos'}
                      </span>
                    )}
                  </div>
                  
                  {/* Opciones */}
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D...
                      const isSelected = selectedAnswer === optIndex || selectedAnswer === option;

                      // Determinar si esta opción es la correcta
                      let isCorrectOption = false;
                      if (question.questionType === 'true_false') {
                        // Para preguntas de verdadero/falso, usar normalización especial
                        if (typeof question.correctAnswer === 'number') {
                          isCorrectOption = optIndex === question.correctAnswer;
                        } else if (typeof question.correctAnswer === 'string') {
                          isCorrectOption = normalizeTrueFalse(option) === normalizeTrueFalse(question.correctAnswer);
                        }
                      } else {
                        // Para otros tipos de preguntas, usar normalización estándar
                        if (typeof question.correctAnswer === 'number') {
                          isCorrectOption = optIndex === question.correctAnswer;
                        } else if (typeof question.correctAnswer === 'string') {
                          isCorrectOption = normalizeOption(option) === normalizeOption(question.correctAnswer);
                        }
                      }
                      
                      return (
                        <label
                          key={optIndex}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            showResults
                              ? isCorrectOption
                                ? 'bg-green-50 dark:bg-green-500/20 border-green-300 dark:border-green-500/60'
                                : isSelected && !isCorrectOption
                                ? 'bg-red-50 dark:bg-red-500/20 border-red-300 dark:border-red-500/60'
                                : 'bg-gray-100 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/60'
                              : 'bg-gray-100 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={optIndex}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(question.id, optIndex)}
                            disabled={showResults}
                            className="mt-1 w-4 h-4 text-blue-500 border-gray-300 dark:border-gray-500 focus:ring-blue-500 focus:ring-2 dark:bg-gray-800"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-700 dark:text-slate-200 mr-2">
                              ({optionLetter})
                            </span>
                            <span className="text-gray-900 dark:text-slate-100">{option}</span>
                          </div>
                          {showResults && isCorrectOption && (
                            <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                          )}
                          {showResults && isSelected && !isCorrectOption && (
                            <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Explicación */}
                  {showExplanation && question.explanation && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/50'
                        : 'bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50'
                    }`}>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1">
                        {isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                      </p>
                      <p className="text-gray-700 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                        {parseExplanation(question, selectedAnswer)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje de error */}
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg">
          <p className="text-red-600 dark:text-red-300 text-sm">{submitError}</p>
        </div>
      )}

      {/* Botón de envío */}
      {!showResults && (
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < totalQuestions || isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Enviar Respuestas'
            )}
          </button>
        </div>
      )}

      {/* Resultados */}
      {showResults && (
        <div className={`mt-6 p-6 rounded-lg border-2 ${
          passed
            ? 'bg-green-50 dark:bg-green-500/20 border-green-200 dark:border-green-500/60'
            : 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/60'
        }`}>
          <div className="text-center">
            {/* Mensaje informativo del servidor */}
            {serverMessage && (
              <div className={`mb-4 p-3 rounded-lg border ${
                serverMessage.includes('Ya habías aprobado') || serverMessage.includes('Tu mejor puntaje')
                  ? 'bg-yellow-50 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/50'
                  : passed
                  ? 'bg-green-50 dark:bg-green-500/20 border-green-200 dark:border-green-500/50'
                  : 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/50'
              }`}>
                <p className={`text-sm ${
                  serverMessage.includes('Ya habías aprobado') || serverMessage.includes('Tu mejor puntaje')
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : passed
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {serverMessage}
                </p>
              </div>
            )}
            <h3 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passed ? '✓ ¡Aprobaste!' : '✗ No aprobaste'}
            </h3>
            <p className="text-gray-800 dark:text-slate-100 text-lg mb-1">
              Obtuviste {score} de {totalQuestions} correctas
            </p>
            {totalPoints !== undefined && (
              <p className="text-gray-800 dark:text-slate-100 text-lg mb-1">
                Puntos: {pointsEarned} de {totalPoints}
              </p>
            )}
            <p className="text-gray-700 dark:text-slate-200 text-sm">
              Porcentaje: <strong>{percentage}%</strong> | Umbral requerido: {passingThreshold}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para renderizar prompts como botones en lista
function PromptsRenderer({ prompts }: { prompts: string | any }) {
  let promptsList: string[] = [];

  try {
    // Si es string, intentar parsearlo como JSON
    if (typeof prompts === 'string') {
      try {
        const parsed = JSON.parse(prompts);
        if (Array.isArray(parsed)) {
          promptsList = parsed;
        } else {
          promptsList = [prompts];
        }
      } catch (e) {
        // Si no es JSON, puede ser un string simple o un array como string
        // Intentar detectar si parece un array
        if (prompts.trim().startsWith('[') && prompts.trim().endsWith(']')) {
          try {
            const parsed = JSON.parse(prompts);
            if (Array.isArray(parsed)) {
              promptsList = parsed;
            }
          } catch (e2) {
            promptsList = [prompts];
          }
        } else {
          // Es un string simple, dividir por líneas si tiene saltos
          promptsList = prompts.split('\n').filter(p => p.trim().length > 0);
          if (promptsList.length === 0) {
            promptsList = [prompts];
          }
        }
      }
    } else if (Array.isArray(prompts)) {
      promptsList = prompts;
    } else {
      promptsList = [String(prompts)];
    }
  } catch (e) {
    // console.warn('Error parsing prompts:', e);
    promptsList = [String(prompts)];
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
      <div className="space-y-2">
        {promptsList.map((prompt, index) => {
          // Limpiar el prompt (remover comillas si las tiene)
          const cleanPrompt = prompt.replace(/^["']|["']$/g, '').trim();
          
          return (
            <button
              key={index}
              onClick={() => {
                // Aquí puedes agregar lógica para copiar el prompt o enviarlo a LIA
                navigator.clipboard.writeText(cleanPrompt).then(() => {
                  alert('Prompt copiado al portapapeles');
                }).catch(() => {
                  // Fallback: mostrar el prompt
                  // console.log('Prompt:', cleanPrompt);
                });
              }}
              className="w-full text-left px-4 py-3 bg-white dark:bg-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/30 border border-purple-200 dark:border-purple-500/40 rounded-lg transition-all hover:border-purple-300 dark:hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-300 dark:group-hover:bg-purple-500/50 transition-colors">
                  <span className="text-purple-700 dark:text-purple-300 text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-gray-900 dark:text-slate-200 text-sm leading-relaxed flex-1 group-hover:text-purple-900 dark:group-hover:text-white transition-colors">
                  {cleanPrompt}
                </p>
                <Copy className="w-4 h-4 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Componente específico para renderizar lecturas preservando formato original
function ReadingContentRenderer({ content }: { content: any }) {
  let readingContent = content;
  
  // Si el contenido es un objeto con propiedades, intentar extraer el texto
  if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
    // Buscar propiedades comunes que contengan el texto
    readingContent = content.text || content.content || content.body || content.description || content.title || '';
    
    // Si no encontramos contenido, intentar convertir todo el objeto a string
    if (!readingContent || readingContent === '') {
      readingContent = JSON.stringify(content, null, 2);
    }
  }

  // Si es un string, intentar parsearlo si parece JSON
  if (typeof readingContent === 'string') {
    try {
      const parsed = JSON.parse(readingContent);
      if (typeof parsed === 'object' && parsed !== null) {
        readingContent = parsed.text || parsed.content || parsed.body || parsed.description || readingContent;
      }
    } catch (e) {
      // No es JSON, usar directamente
    }
  }

  // Asegurar que es string
  if (typeof readingContent !== 'string') {
    readingContent = String(readingContent);
  }

  // Preservar saltos de línea y formato original
  // Dividir por saltos de línea pero mantener líneas vacías para preservar párrafos
  const lines = readingContent.split('\n');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
          {lines.map((line: string, index: number) => {
            const trimmedLine = line.trim();
            
            // Si la línea está vacía, renderizar un espacio para separar párrafos
            if (trimmedLine === '') {
              return <div key={`line-${index}`} className="h-4" />;
            }
            
            // Detectar títulos principales (Introducción:, Cuerpo:, etc.)
            const mainSectionMatch = trimmedLine.match(/^(Introducción|Cuerpo|Cierre|Conclusión|Resumen):?\s*$/i);
            if (mainSectionMatch) {
              return (
                <h1 
                  key={`line-${index}`} 
                  className="text-gray-900 dark:text-white font-bold text-3xl mb-4 mt-8 first:mt-0 border-b-2 border-purple-500/40 dark:border-purple-400/40 pb-3"
                >
                  {mainSectionMatch[1]}
                </h1>
              );
            }
            
            // Detectar subtítulos numerados (1. Título, 2. Título, etc.)
            const numberedMatch = trimmedLine.match(/^(\d+)[\.\)]\s+(.+)$/);
            if (numberedMatch && trimmedLine.length < 150) {
              const [, number, title] = numberedMatch;
              return (
                <h2 
                  key={`line-${index}`} 
                  className="text-gray-900 dark:text-white font-semibold text-2xl mb-3 mt-6 border-b border-purple-500/20 dark:border-purple-400/30 pb-2"
                >
                  <span className="text-purple-600 dark:text-purple-400">{number}.</span> {title}
                </h2>
              );
            }
            
            // Detectar subtítulos con formato "1.1 - Título" o "1.1 - Título:"
            const subsectionMatch = trimmedLine.match(/^(\d+\.\d+)\s*[-–]\s*(.+?):?\s*$/);
            if (subsectionMatch && trimmedLine.length < 150) {
              const [, number, title] = subsectionMatch;
              return (
                <h3 
                  key={`line-${index}`} 
                  className="text-gray-900 dark:text-white font-semibold text-xl mb-3 mt-5"
                >
                  <span className="text-purple-600 dark:text-purple-400">{number}</span> - {title}
                </h3>
              );
            }
            
            // Detectar títulos sin numeración (líneas cortas que terminan con dos puntos)
            if (trimmedLine.endsWith(':') && trimmedLine.length < 100 && trimmedLine.length > 5) {
              return (
                <h3 
                  key={`line-${index}`} 
                  className="text-gray-900 dark:text-white font-semibold text-xl mb-3 mt-5"
                >
                  {trimmedLine}
                </h3>
              );
            }
            
            // Párrafos normales
            return (
              <p 
                key={`line-${index}`} 
                className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 text-base"
                style={{ lineHeight: '1.8' }}
              >
                {line}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente para renderizar contenido formateado (actividades, materiales de lectura, etc.)
function FormattedContentRenderer({ content }: { content: any }) {
  let readingContent = content;
  
  // Si el contenido es un objeto con propiedades, intentar extraer el texto
  if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
    // Buscar propiedades comunes que contengan el texto
    readingContent = content.text || content.content || content.body || content.description || content.title || '';
    
    // Si no encontramos contenido, intentar convertir todo el objeto a string
    if (!readingContent || readingContent === '') {
      readingContent = JSON.stringify(content, null, 2);
    }
  }

  // Si es un string, intentar parsearlo si parece JSON
  if (typeof readingContent === 'string') {
    try {
      const parsed = JSON.parse(readingContent);
      if (typeof parsed === 'object' && parsed !== null) {
        readingContent = parsed.text || parsed.content || parsed.body || parsed.description || readingContent;
      }
    } catch (e) {
      // No es JSON, usar directamente
    }
  }

  // Asegurar que es string
  if (typeof readingContent !== 'string') {
    readingContent = String(readingContent);
  }

  // Mejorar el formato: detectar secciones, títulos, párrafos, listas, ejemplos, etc.
  const lines = readingContent.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
  const formattedContent: Array<{ 
    type: 'main-title' | 'section-title' | 'subsection-title' | 'paragraph' | 'list' | 'example' | 'highlight';
    content: string;
    level?: number;
  }> = [];

  lines.forEach((line: string, index: number) => {
    const trimmedLine = line.trim();
    
    // Detectar títulos principales (Introducción, Cuerpo, Cierre, Conclusión, etc.)
    const mainSections = /^(Introducción|Cuerpo|Cierre|Conclusión|Resumen|Introducción:|Cuerpo:|Cierre:|Conclusión:|Resumen:)$/i;
    if (mainSections.test(trimmedLine)) {
      formattedContent.push({ type: 'main-title', content: trimmedLine.replace(/[:]$/, ''), level: 1 });
      return;
    }
    
    // Detectar subtítulos numerados principales (1. Los Datos, 2. El Modelo, etc.)
    const numberedSubsection = /^(\d+)[\.\)]\s+([A-ZÁÉÍÓÚÑ][^.!?]*)$/;
    const numberedMatch = trimmedLine.match(numberedSubsection);
    if (numberedMatch && trimmedLine.length < 100) {
      formattedContent.push({ type: 'subsection-title', content: trimmedLine, level: 2 });
      return;
    }
    
    // Detectar títulos de sección (líneas cortas sin punto, con mayúsculas al inicio)
    if (trimmedLine.length > 0 && trimmedLine.length < 80 && 
        trimmedLine.match(/^[A-ZÁÉÍÓÚÑ][^.!?]*$/) && 
        !trimmedLine.match(/^\d+[\.\)]/) &&
        !trimmedLine.includes(':') &&
        index < lines.length - 1 && // No es la última línea
        lines[index + 1] && lines[index + 1].length > 50) { // La siguiente línea es un párrafo largo
      formattedContent.push({ type: 'section-title', content: trimmedLine, level: 1 });
      return;
    }
    
    // Detectar ejemplos (líneas que contienen "Ejemplo:", "Ejemplos:", "Por ejemplo", etc.)
    if (trimmedLine.match(/^Ejemplos?[:]?/i) || trimmedLine.match(/Por ejemplo/i)) {
      formattedContent.push({ type: 'example', content: trimmedLine });
      return;
    }
    
    // Detectar texto destacado (líneas cortas con comillas o entre comillas)
    if (trimmedLine.match(/^["']|["']$/) && trimmedLine.length < 100) {
      formattedContent.push({ type: 'highlight', content: trimmedLine });
      return;
    }
    
    // Detectar listas (líneas que empiezan con - o • o números seguidos de guión)
    if (trimmedLine.match(/^[-•]\s/) || trimmedLine.match(/^\d+[\.\)]\s+[-•]/)) {
      formattedContent.push({ type: 'list', content: trimmedLine });
      return;
    }
    
    // Párrafos normales
    formattedContent.push({ type: 'paragraph', content: trimmedLine });
  });

  return (
    <div className="bg-gray-100 dark:bg-carbon-800 rounded-lg p-8 md:p-10 border border-gray-200 dark:border-carbon-600 shadow-lg">
      <article className="prose dark:prose-invert max-w-none">
        <div className="text-gray-800 dark:text-slate-200 leading-relaxed space-y-6">
          {formattedContent.map((item, index) => {
            // Título principal (Introducción, Cuerpo, Cierre)
            if (item.type === 'main-title') {
              return (
                <div key={`item-${index}`} className="mt-10 mb-6 first:mt-0">
                  <h1 className="text-gray-900 dark:text-white font-bold text-3xl mb-2 border-b-2 border-purple-500/40 pb-3">
                    {item.content}
                  </h1>
                </div>
              );
            }
            
            // Título de sección
            if (item.type === 'section-title') {
              return (
                <h2 
                  key={`item-${index}`} 
                  className="text-gray-900 dark:text-white font-bold text-2xl mb-4 mt-8 border-b border-purple-500/20 pb-2"
                >
                  {item.content}
                </h2>
              );
            }
            
            // Subtítulo numerado (1. Los Datos, 2. El Modelo)
            if (item.type === 'subsection-title') {
              const numberMatch = item.content.match(/^(\d+)[\.\)]\s+(.+)$/);
              if (numberMatch) {
                const [, number, title] = numberMatch;
                return (
                  <div key={`item-${index}`} className="mt-8 mb-4">
                    <h3 className="text-purple-300 font-semibold text-xl mb-3 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg">
                        {number}
                      </span>
                      <span>{title}</span>
                    </h3>
                  </div>
                );
              }
              return (
                <h3 
                  key={`item-${index}`} 
                  className="text-purple-300 font-semibold text-xl mb-3 mt-6"
                >
                  {item.content}
                </h3>
              );
            }
            
            // Ejemplos
            if (item.type === 'example') {
              return (
                <div key={`item-${index}`} className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 my-4">
                  <p className="text-blue-300 font-semibold mb-2 text-sm uppercase tracking-wide">
                    {item.content.match(/^Ejemplos?[:]?/i) ? item.content : 'Ejemplo'}
                  </p>
                </div>
              );
            }
            
            // Texto destacado
            if (item.type === 'highlight') {
              return (
                <div key={`item-${index}`} className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 my-4">
                  <p className="text-yellow-200 italic text-lg leading-relaxed">
                    {item.content.replace(/^["']|["']$/g, '')}
                  </p>
                </div>
              );
            }
            
            // Listas
            if (item.type === 'list') {
              const cleanedContent = item.content.replace(/^[-•]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
              return (
                <div key={`item-${index}`} className="flex items-start gap-3 my-3 pl-2">
                  <span className="text-purple-400 mt-1.5 text-lg font-bold">•</span>
                  <p className="text-gray-800 dark:text-slate-200 leading-relaxed flex-1 text-base">{cleanedContent}</p>
                </div>
              );
            }
            
            // Párrafos normales
            // Detectar si el párrafo contiene ejemplos o información destacada
            const hasExamples = item.content.match(/Ejemplos?[:]?/i);
            const hasQuotes = item.content.match(/["']/g);
            
            if (hasExamples && hasQuotes && hasQuotes.length >= 2) {
              // Párrafo con ejemplos entre comillas
              const parts = item.content.split(/(["'][^"']+["'])/g);
              return (
                <p key={`item-${index}`} className="text-gray-800 dark:text-slate-200 leading-relaxed mb-6 text-base" style={{ lineHeight: '1.9' }}>
                  {parts.map((part, partIndex) => {
                    if (part.match(/^["']/)) {
                      return (
                        <span key={partIndex} className="bg-blue-500/10 px-2 py-1 rounded text-blue-600 dark:text-blue-200 font-medium">
                          {part.replace(/^["']|["']$/g, '')}
                        </span>
                      );
                    }
                    return <span key={partIndex}>{part}</span>;
                  })}
                </p>
              );
            }
            
            return (
              <p 
                key={`item-${index}`} 
                className="text-gray-800 dark:text-slate-200 leading-relaxed mb-6 text-base"
                style={{ lineHeight: '1.9' }}
              >
                {item.content}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function ActivitiesContent({ 
  lesson, 
  slug, 
  onPromptsChange, 
  onStartInteraction,
  userRole,
  generateRoleBasedPrompts
}: {
  lesson: Lesson;
  slug: string;
  onPromptsChange?: (prompts: string[]) => void;
  onStartInteraction?: (content: string, title: string) => void;
  userRole?: string;
  generateRoleBasedPrompts?: (basePrompts: string[], activityContent: string, activityTitle: string, userRole?: string) => Promise<string[]>;
}) {
  const [activities, setActivities] = useState<Array<{
    activity_id: string;
    activity_title: string;
    activity_description?: string;
    activity_type: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat';
    activity_content: string;
    ai_prompts?: string;
    activity_order_index: number;
    is_required: boolean;
  }>>([]);
  const [materials, setMaterials] = useState<Array<{
    material_id: string;
    material_title: string;
    material_description?: string;
    material_type: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading';
    file_url?: string;
    external_url?: string;
    content_data?: any;
    material_order_index: number;
    is_downloadable: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());
  const [collapsedMaterials, setCollapsedMaterials] = useState<Set<string>>(new Set());
  const [activitiesInitialized, setActivitiesInitialized] = useState(false);
  const [materialsInitialized, setMaterialsInitialized] = useState(false);
  
  // Resetear estados de inicialización cuando cambia la lección
  useEffect(() => {
    setActivitiesInitialized(false);
    setMaterialsInitialized(false);
    setCollapsedActivities(new Set());
    setCollapsedMaterials(new Set());
  }, [lesson?.lesson_id]);
  
  // Inicializar todas las actividades como colapsadas cuando se cargan por primera vez
  useEffect(() => {
    if (activities.length > 0 && !activitiesInitialized) {
      setCollapsedActivities(new Set(activities.map(a => a.activity_id)));
      setActivitiesInitialized(true);
    }
  }, [activities, activitiesInitialized]);
  
  // Inicializar todos los materiales como colapsados cuando se cargan por primera vez
  useEffect(() => {
    if (materials.length > 0 && !materialsInitialized) {
      setCollapsedMaterials(new Set(materials.map(m => m.material_id)));
      setMaterialsInitialized(true);
    }
  }, [materials, materialsInitialized]);
  const [quizStatus, setQuizStatus] = useState<{
    hasRequiredQuizzes: boolean;
    totalRequiredQuizzes: number;
    completedQuizzes: number;
    passedQuizzes: number;
    allQuizzesPassed: boolean;
    quizzes: Array<{
      id: string;
      title: string;
      type: string;
      isCompleted: boolean;
      isPassed: boolean;
      percentage: number;
    }>;
  } | null>(null);

  useEffect(() => {
    async function loadActivitiesAndMaterials() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar actividades, materiales y estado de quizzes en paralelo
        const [activitiesResponse, materialsResponse, quizStatusResponse] = await Promise.all([
          fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/activities`),
          fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/materials`),
          fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/quiz/status`)
        ]);

        // Procesar actividades
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData || []);
        } else {
          setActivities([]);
        }

        // Procesar materiales
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setMaterials(materialsData || []);
        } else {
          setMaterials([]);
        }

        // Procesar estado de quizzes
        if (quizStatusResponse.ok) {
          const quizStatusData = await quizStatusResponse.json();
          setQuizStatus(quizStatusData);
        }
      } catch (error) {
        // console.error('Error loading activities and materials:', error);
        setActivities([]);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    }

    loadActivitiesAndMaterials();
  }, [lesson?.lesson_id, slug]);

  // Refs para almacenar las funciones y evitar loops infinitos
  const generateRoleBasedPromptsRef = useRef(generateRoleBasedPrompts);
  const onPromptsChangeRef = useRef(onPromptsChange);

  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    generateRoleBasedPromptsRef.current = generateRoleBasedPrompts;
  }, [generateRoleBasedPrompts]);

  useEffect(() => {
    onPromptsChangeRef.current = onPromptsChange;
  }, [onPromptsChange]);

  // Extraer y actualizar prompts cuando cambien las actividades
  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones si el componente se desmonta

    const processPrompts = async () => {
      const allPrompts: string[] = [];
      const activityPromptsMap: Map<string, { prompts: string[], content: string, title: string }> = new Map();

      // Primero, extraer todos los prompts base de las actividades
      activities.forEach(activity => {
        if (activity.ai_prompts) {
          try {
            let promptsList: string[] = [];

            // Si es string, intentar parsearlo como JSON
            if (typeof activity.ai_prompts === 'string') {
              try {
                const parsed = JSON.parse(activity.ai_prompts);
                if (Array.isArray(parsed)) {
                  promptsList = parsed;
                } else {
                  promptsList = [activity.ai_prompts];
                }
              } catch {
                promptsList = [activity.ai_prompts];
              }
            } else if (Array.isArray(activity.ai_prompts)) {
              promptsList = activity.ai_prompts;
            } else {
              promptsList = [String(activity.ai_prompts)];
            }

            // Limpiar prompts (remover comillas si las tiene)
            const cleanPrompts: string[] = [];
            promptsList.forEach(prompt => {
              const cleanPrompt = prompt.replace(/^["']|["']$/g, '').trim();
              if (cleanPrompt) {
                cleanPrompts.push(cleanPrompt);
              }
            });

            if (cleanPrompts.length > 0) {
              // Guardar prompts base junto con información de la actividad
              activityPromptsMap.set(activity.activity_id, {
                prompts: cleanPrompts,
                content: activity.activity_content || '',
                title: activity.activity_title || ''
              });
            }
          } catch (error) {
            // console.warn('Error parsing prompts:', error);
          }
        }
      });

      // Si hay rol del usuario y función de generación, adaptar prompts
      if (userRole && generateRoleBasedPromptsRef.current && activityPromptsMap.size > 0) {
        try {
          // Generar prompts adaptados para cada actividad
          for (const [activityId, activityData] of activityPromptsMap.entries()) {
            if (!isMounted) break; // Salir si el componente se desmontó
            const adaptedPrompts = await generateRoleBasedPromptsRef.current(
              activityData.prompts,
              activityData.content,
              activityData.title,
              userRole
            );
            allPrompts.push(...adaptedPrompts);
          }
        } catch (error) {
          console.error('Error generando prompts adaptados:', error);
          // Fallback: usar prompts originales
          activityPromptsMap.forEach(activityData => {
            allPrompts.push(...activityData.prompts);
          });
        }
      } else {
        // Sin rol o sin función de generación, usar prompts originales
        activityPromptsMap.forEach(activityData => {
          allPrompts.push(...activityData.prompts);
        });
      }

      // Notificar cambios al componente padre solo si el componente sigue montado
      if (isMounted && onPromptsChangeRef.current) {
        onPromptsChangeRef.current(allPrompts);
      }
    };

    processPrompts();

    // Cleanup: marcar como desmontado
    return () => {
      isMounted = false;
    };
  }, [activities, userRole]); // Solo dependemos de activities y userRole

  const hasActivities = activities.length > 0;
  const hasMaterials = materials.length > 0;
  const hasContent = hasActivities || hasMaterials;

  if (loading) {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Actividades</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400 dark:text-gray-400 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Actividades</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        
        <div className="bg-white dark:bg-carbon-700 rounded-xl border-2 border-gray-300 dark:border-carbon-600 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-carbon-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400 dark:text-slate-400" />
      </div>
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Actividades no disponibles</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Esta lección aún no tiene actividades disponibles. Las actividades se agregarán próximamente.
          </p>
          <div className="text-sm text-gray-500 dark:text-slate-500">
            <p>• Las actividades se agregan manualmente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Actividades</h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>

      {/* Actividades */}
      {hasActivities && (
        <div className="bg-white dark:bg-carbon-700 rounded-xl border border-gray-200 dark:border-carbon-600 overflow-hidden">
          {/* Header de actividades */}
          <div className="bg-gray-50 dark:bg-carbon-800 px-6 py-4 border-b border-gray-200 dark:border-carbon-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-gray-900 dark:text-white font-semibold">Actividades</h3>
      </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-slate-400">
                <span>{activities.length} actividad{activities.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Contenido de actividades */}
          <div className="p-6 space-y-4">
            {activities.map((activity) => {
              const isCollapsed = collapsedActivities.has(activity.activity_id);
              
              return (
              <div
                key={activity.activity_id}
                className="bg-gray-50 dark:bg-carbon-800 rounded-lg border border-gray-200 dark:border-carbon-600 overflow-hidden"
              >
                {/* Header de la actividad con botón de colapsar/expandir */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-carbon-600">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-gray-900 dark:text-white font-semibold text-lg">{activity.activity_title}</h4>
                      {activity.is_required && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                          Requerida
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 capitalize">
                        {activity.activity_type}
                      </span>
                      {/* Indicador de quiz obligatorio */}
                      {activity.activity_type === 'quiz' && activity.is_required && quizStatus && (() => {
                        const quizInfo = quizStatus.quizzes.find((q: any) => q.id === activity.activity_id && q.type === 'activity');
                        if (quizInfo) {
                          if (quizInfo.isPassed) {
                            return (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Aprobado
                              </span>
                            );
                          } else if (quizInfo.isCompleted) {
                            return (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Reprobado ({quizInfo.percentage}%)
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                Pendiente
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                    {activity.activity_description && !isCollapsed && (
                      <p className="text-gray-700 dark:text-slate-300 text-sm">{activity.activity_description}</p>
                    )}
                  </div>
                  
                  {/* Botón de colapsar/expandir */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsedActivities(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(activity.activity_id)) {
                          newSet.delete(activity.activity_id);
                        } else {
                          newSet.add(activity.activity_id);
                        }
                        return newSet;
                      });
                    }}
                    className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-carbon-600 rounded-lg transition-colors flex-shrink-0 flex items-center gap-2"
                    title={isCollapsed ? "Expandir actividad" : "Colapsar actividad"}
                  >
                    <span className="text-xs text-gray-600 dark:text-slate-400 hidden sm:inline">
                      {isCollapsed ? 'Expandir' : 'Colapsar'}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Contenido de la actividad (colapsable) */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                {/* Botón especial para actividades ai_chat */}
                {activity.activity_type === 'ai_chat' ? (
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/10 dark:to-blue-500/10 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-500/30 dark:border-purple-500/30 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/50 dark:shadow-purple-500/50">
                        <Image
                          src="/lia-avatar.png"
                          alt="Lia"
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Actividad Interactiva con Lia
                        </h3>
                        <p className="text-gray-700 dark:text-slate-300 text-sm mb-6 max-w-md mx-auto">
                          Esta es una actividad guiada por Lia, tu tutora personalizada. Haz clic para comenzar una conversación interactiva paso a paso.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (onStartInteraction) {
                            onStartInteraction(activity.activity_content, activity.activity_title);
                          }
                        }}
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 dark:hover:shadow-purple-500/50 hover:scale-105"
                      >
                        <span className="flex items-center gap-3">
                          <div className="relative w-5 h-5">
                            <Image
                              src="/lia-avatar.png"
                              alt="Lia"
                              fill
                              className="object-cover rounded-full group-hover:animate-pulse"
                              sizes="20px"
                            />
                          </div>
                          <span>Interactuar con Lia</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>

                      <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                        Lia te guiará a través de {activity.activity_title.toLowerCase()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-carbon-800/50 dark:bg-carbon-800 rounded-lg p-4 mb-3">
                  {activity.activity_type === 'quiz' && (() => {
                    try {
                      // Intentar parsear el contenido como JSON si es un quiz
                      let quizData = activity.activity_content;

                      // Si es string, intentar parsearlo
                      if (typeof quizData === 'string') {
                        try {
                          quizData = JSON.parse(quizData);
                        } catch (e) {
                          // console.warn('⚠️ Quiz content is not valid JSON:', e);
                          return (
                            <div className="prose dark:prose-invert max-w-none">
                              <p className="text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Error: El contenido del quiz no es un JSON válido</p>
                              <div className="text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {activity.activity_content}
                              </div>
                            </div>
                          );
                        }
                      }

                      // Detectar si tiene estructura {questions: [...], totalPoints: N}
                      let questionsArray: any = quizData;
                      let totalPoints: number | undefined = undefined;

                      if (quizData && typeof quizData === 'object' && !Array.isArray(quizData)) {
                        const quizObj = quizData as { questions?: any[]; totalPoints?: number };
                        if (quizObj.questions && Array.isArray(quizObj.questions)) {
                          questionsArray = quizObj.questions;
                          totalPoints = quizObj.totalPoints;
                        }
                      }

                      // Verificar que es un array con preguntas
                      if (Array.isArray(questionsArray) && questionsArray.length > 0) {
                        // Verificar que cada elemento tiene la estructura de pregunta
                        const hasValidStructure = questionsArray.every((q: any) =>
                          q && typeof q === 'object' && (q.question || q.id)
                        );

                        if (hasValidStructure) {
                          return (
                            <QuizRenderer 
                              quizData={questionsArray} 
                              totalPoints={totalPoints}
                              lessonId={lesson.lesson_id}
                              slug={slug}
                              activityId={activity.activity_id}
                            />
                          );
                        }
                      }

                      // Si llegamos aquí, mostrar como texto normal con mensaje de debug
                      return (
                        <div className="prose prose-invert dark:prose-invert max-w-none">
                          <p className="text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Error: El quiz no tiene la estructura esperada</p>
                          <details className="mb-4">
                            <summary className="text-gray-700 dark:text-slate-300 cursor-pointer">Ver contenido crudo</summary>
                            <pre className="text-xs text-gray-600 dark:text-slate-400 mt-2 p-2 bg-gray-200 dark:bg-carbon-800 rounded overflow-auto">
                              {typeof activity.activity_content === 'string'
                                ? activity.activity_content
                                : JSON.stringify(activity.activity_content, null, 2)}
                            </pre>
                          </details>
                        </div>
                      );
                    } catch (e) {
                      // console.error('❌ Error processing quiz:', e);
                      return (
                        <div className="prose prose-invert dark:prose-invert max-w-none">
                          <p className="text-red-600 dark:text-red-400 mb-2">❌ Error al procesar el quiz</p>
                          <div className="text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {activity.activity_content}
                          </div>
                        </div>
                      );
                    }
                  })()}
                  {activity.activity_type !== 'quiz' && (
                    <FormattedContentRenderer content={activity.activity_content} />
                  )}
                  </div>
                )}

                {activity.activity_type !== 'ai_chat' && activity.ai_prompts && (
                  <div className="mt-4 pt-4 border-t border-carbon-600/50">
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <h5 className="text-purple-400 font-semibold text-sm">Prompts y Ejercicios</h5>
                    </div>
                    <PromptsRenderer prompts={activity.ai_prompts} />
                  </div>
                )}
              </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Materiales */}
      {hasMaterials && (
        <div className="bg-white dark:bg-carbon-700 rounded-xl border border-gray-200 dark:border-carbon-600 overflow-hidden">
          {/* Header de materiales */}
          <div className="bg-gray-50 dark:bg-carbon-800 px-6 py-4 border-b border-gray-200 dark:border-carbon-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-green-400" />
                <h3 className="text-gray-900 dark:text-white font-semibold">Materiales</h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-slate-400">
                <span>{materials.length} material{materials.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Contenido de materiales */}
          <div className="p-6 space-y-4">
            {materials.map((material) => {
              const isCollapsed = collapsedMaterials.has(material.material_id);
              
              return (
              <div
                key={material.material_id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header del material con botón de colapsar/expandir */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-gray-900 dark:text-white font-semibold text-lg">{material.material_title}</h4>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 capitalize">
                        {material.material_type}
                      </span>
                      {material.is_downloadable && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                          Descargable
                        </span>
                      )}
                      {/* Indicador de quiz obligatorio */}
                      {material.material_type === 'quiz' && quizStatus && (() => {
                        const quizInfo = quizStatus.quizzes.find((q: any) => q.id === material.material_id && q.type === 'material');
                        if (quizInfo) {
                          if (quizInfo.isPassed) {
                            return (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Aprobado
                              </span>
                            );
                          } else if (quizInfo.isCompleted) {
                            return (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Reprobado ({quizInfo.percentage}%)
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                Pendiente
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                    {material.material_description && material.material_type !== 'reading' && !isCollapsed && (
                      <p className="text-gray-700 dark:text-slate-300 text-sm">{material.material_description}</p>
                    )}
                  </div>
                  
                  {/* Botón de colapsar/expandir */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsedMaterials(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(material.material_id)) {
                          newSet.delete(material.material_id);
                        } else {
                          newSet.add(material.material_id);
                        }
                        return newSet;
                      });
                    }}
                    className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 flex items-center gap-2"
                    title={isCollapsed ? "Expandir material" : "Colapsar material"}
                  >
                    <span className="text-xs text-gray-600 dark:text-slate-400 hidden sm:inline">
                      {isCollapsed ? 'Expandir' : 'Colapsar'}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                    )}
                  </button>
                </div>
                
                {/* Contenido del material (colapsable) */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-4">
                {(material.content_data || (material.material_type === 'reading' && material.material_description)) && (
                          <div className="w-full">
                    {material.material_type === 'quiz' && (() => {
                      try {
                        let quizData = material.content_data;

                        // Si es string, intentar parsearlo
                        if (typeof quizData === 'string') {
                          try {
                            quizData = JSON.parse(quizData);
                          } catch (e) {
                            // console.warn('Quiz content is not valid JSON:', e);
                            return null;
                          }
                        }

                        // Detectar si tiene estructura {questions: [...], totalPoints: N}
                        let questionsArray = quizData;
                        let totalPoints = undefined;

                        if (quizData && typeof quizData === 'object' && !Array.isArray(quizData)) {
                          if (quizData.questions && Array.isArray(quizData.questions)) {
                            questionsArray = quizData.questions;
                            totalPoints = quizData.totalPoints;
                          }
                        }

                        // Verificar que es un array con preguntas
                        if (Array.isArray(questionsArray) && questionsArray.length > 0) {
                          // Verificar que cada elemento tiene la estructura de pregunta
                          const hasValidStructure = questionsArray.every((q: any) =>
                            q && typeof q === 'object' && (q.question || q.id)
                          );

                          if (hasValidStructure) {
                            return (
                              <QuizRenderer 
                                quizData={questionsArray} 
                                totalPoints={totalPoints}
                                lessonId={lesson.lesson_id}
                                slug={slug}
                                materialId={material.material_id}
                              />
                            );
                          }
                        }
                      } catch (e) {
                        // console.warn('Error parsing quiz data:', e);
                      }
                      return null;
                    })()}
                    {material.material_type === 'reading' && (
                      <ReadingContentRenderer 
                        content={material.content_data || material.material_description} 
                      />
                    )}
                    {material.material_type !== 'quiz' && material.material_type !== 'reading' && material.content_data && (
                      <FormattedContentRenderer content={material.content_data} />
                    )}
                  </div>
                )}

                {/* Enlaces y acciones */}
                {(material.external_url || material.file_url) && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-carbon-600/50">
                    {material.external_url && (
                      <a
                        href={material.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors border border-blue-500/30"
                      >
                        <FileDown className="w-4 h-4" />
                        <span className="text-sm">Abrir enlace</span>
                      </a>
                    )}
                    {material.file_url && (
                      <a
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors border border-green-500/30"
                      >
                        <FileDown className="w-4 h-4" />
                        <span className="text-sm">Ver archivo</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Leyenda informativa sobre requisitos para avanzar */}
      {(hasActivities || hasMaterials) && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                Para avanzar a la siguiente lección, es necesario completar todas las actividades requeridas y aprobar los quizzes correspondientes. 
                Te recomendamos revisar cada actividad y material con atención para asegurar una comprensión completa del contenido.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsContent({ slug, courseTitle }: { slug: string; courseTitle: string }) {
  const [questions, setQuestions] = useState<Array<{
    id: string;
    title?: string;
    content: string;
    view_count: number;
    response_count: number;
    reaction_count: number;
    is_pinned: boolean;
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
    user: {
      id: string;
      username: string;
      display_name?: string;
      first_name?: string;
      last_name?: string;
      profile_picture_url?: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState(''); // Query activa para búsqueda
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({}); // questionId -> reaction_type
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({}); // questionId -> count

  // Función para ejecutar búsqueda
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setOffset(0);
    setHasMore(true);
  };

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setOffset(0);
    setHasMore(true);
  };

  // Manejar Enter en el input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Función para recargar preguntas (extraída para poder llamarla desde onSuccess)
  const reloadQuestions = React.useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
      
      // Construir URL con búsqueda y límite inicial para carga más rápida
      const params = new URLSearchParams();
      if (activeSearchQuery) params.append('search', activeSearchQuery);
      // Optimización: Limitar a 20 preguntas iniciales para carga más rápida
      params.append('limit', '20');
      params.append('offset', '0');

      const url = `/api/courses/${slug}/questions?${params.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data || []);
        
        // Verificar si hay más preguntas
        setHasMore(data && data.length === 20);
        
        // Optimización: Las reacciones del usuario ya vienen del servidor en user_reaction
        if (data && data.length > 0) {
          const reactionsMap: Record<string, string> = {};
          const countsMap: Record<string, number> = {};
          
          // Extraer reacciones del usuario y contadores desde los datos del servidor
          data.forEach((q: any) => {
            countsMap[q.id] = q.reaction_count || 0;
            if (q.user_reaction) {
              reactionsMap[q.id] = q.user_reaction;
            }
          });
          
          setUserReactions(reactionsMap);
          setReactionCounts(countsMap);
        }
      } else {
        setQuestions([]);
        setHasMore(false);
      }
    } catch (error) {
      // console.error('Error loading questions:', error);
      setQuestions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [slug, activeSearchQuery]);

  useEffect(() => {
    reloadQuestions();
  }, [reloadQuestions]);

  // Función para cargar más preguntas
  const loadMoreQuestions = async () => {
    if (!slug || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextOffset = offset + 20;
      
      const params = new URLSearchParams();
      if (activeSearchQuery) params.append('search', activeSearchQuery);
      params.append('limit', '20');
      params.append('offset', nextOffset.toString());

      const url = `/api/courses/${slug}/questions?${params.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Agregar nuevas preguntas a las existentes
          setQuestions(prev => [...prev, ...data]);
          setOffset(nextOffset);
          
          // Verificar si hay más preguntas
          setHasMore(data.length === 20);
          
          // Actualizar reacciones y contadores con las nuevas preguntas
          const newReactionsMap: Record<string, string> = {};
          const newCountsMap: Record<string, number> = {};
          
          data.forEach((q: any) => {
            newCountsMap[q.id] = q.reaction_count || 0;
            if (q.user_reaction) {
              newReactionsMap[q.id] = q.user_reaction;
            }
          });
          
          setUserReactions(prev => ({ ...prev, ...newReactionsMap }));
          setReactionCounts(prev => ({ ...prev, ...newCountsMap }));
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      // console.error('Error loading more questions:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const getUserDisplayName = (user: any) => {
    return user?.display_name || 
           (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null) ||
           user?.username || 
           'Usuario';
  };

  const getUserInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  const handleReaction = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentReaction = userReactions[questionId];
    const isCurrentlyLiked = currentReaction === 'like';
    const currentCount = reactionCounts[questionId] ?? 0;
    
    // Actualización optimista - aplicar cambios inmediatamente
    const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    const newReactionState = isCurrentlyLiked ? null : 'like';
    
    // Actualizar estado optimista
    setReactionCounts(prev => ({ ...prev, [questionId]: newCount }));
    setUserReactions(prev => {
      if (newReactionState) {
        return { ...prev, [questionId]: newReactionState };
      } else {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      }
    });
    
    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reaction_type: 'like',
          action: 'toggle'
        })
      });
      
      if (!response.ok) {
        // Revertir en caso de error
        setReactionCounts(prev => ({ ...prev, [questionId]: currentCount }));
        setUserReactions(prev => {
          if (currentReaction) {
            return { ...prev, [questionId]: currentReaction };
          } else {
            const updated = { ...prev };
            delete updated[questionId];
            return updated;
          }
        });
      } else {
        // Sincronizar estado con el servidor - verificar si realmente se agregó o eliminó
        const result = await response.json();
        
        // Recargar reacciones del usuario para esta pregunta específica
        try {
          const userResponse = await fetch('/api/auth/me', { credentials: 'include' });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userId = userData?.success && userData?.user ? userData.user.id : (userData?.id || null);
            
            if (userId) {
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );
              
              // Verificar estado actual de la reacción después de la actualización
              const { data: currentReaction } = await supabase
                .from('course_question_reactions')
                .select('reaction_type')
                .eq('user_id', userId)
                .eq('question_id', questionId)
                .eq('reaction_type', 'like')
                .maybeSingle();
              
              // Actualizar estado de reacción según el servidor (estado real)
              setUserReactions(prev => {
                if (currentReaction) {
                  return { ...prev, [questionId]: 'like' };
                } else {
                  const updated = { ...prev };
                  delete updated[questionId];
                  return updated;
                }
              });
              
              // Obtener contador actualizado de la pregunta desde el servidor
              const questionResponse = await fetch(`/api/courses/${slug}/questions`);
              if (questionResponse.ok) {
                const questionsData = await questionResponse.json();
                const updatedQuestion = questionsData.find((q: any) => q.id === questionId);
                if (updatedQuestion) {
                  // Reemplazar el contador con el valor real del servidor (sin sumar/restar)
                  setReactionCounts(prev => ({ ...prev, [questionId]: updatedQuestion.reaction_count || 0 }));
                  setQuestions(prev => prev.map(q => 
                    q.id === questionId 
                      ? { ...q, reaction_count: updatedQuestion.reaction_count || 0 }
                      : q
                  ));
                }
              }
            }
          }
        } catch (syncError) {
          // console.error('Error syncing reaction state:', syncError);
        }
      }
    } catch (error) {
      // console.error('Error handling reaction:', error);
      // Revertir en caso de error
      setReactionCounts(prev => ({ ...prev, [questionId]: currentCount }));
      setUserReactions(prev => {
        if (currentReaction) {
          return { ...prev, [questionId]: currentReaction };
        } else {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preguntas y Respuestas</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-400 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preguntas y Respuestas</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-5 h-5" />
            Hacer Pregunta
          </button>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar preguntas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-blue-500/25"
              aria-label="Buscar"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-300 dark:border-slate-600 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400 dark:text-slate-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">No hay preguntas</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            {activeSearchQuery ? 'No se encontraron preguntas con tu búsqueda' : 'Aún no hay preguntas en este curso'}
          </p>
          {!activeSearchQuery && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
            >
              <Plus className="w-5 h-5" />
              Hacer Primera Pregunta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-300 dark:border-slate-700/50 overflow-hidden hover:border-gray-400 dark:hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {/* Post Header - Estilo Facebook/Comunidad */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      {question.user?.profile_picture_url ? (
                        <Image
                          src={question.user.profile_picture_url}
                          alt={getUserDisplayName(question.user)}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {getUserInitials(question.user)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getUserDisplayName(question.user)}
                        </h3>
                        {question.is_pinned && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-full border border-yellow-500/30 dark:border-yellow-500/30">
                            Fijada
                          </span>
                        )}
                        {question.is_resolved && (
                          <span className="px-2 py-0.5 bg-green-500/20 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full border border-green-500/30 dark:border-green-500/30 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Resuelta
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        {formatTimeAgo(question.created_at)} • {courseTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuestion(selectedQuestion === question.id ? null : question.id);
                }}>
                  {question.title && (
                    <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">{question.title}</h4>
                  )}
                  <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedQuestion === question.id ? question.content : (
                      question.content.length > 200 ? `${question.content.substring(0, 200)}...` : question.content
                    )}
                  </p>
                  {question.content.length > 200 && selectedQuestion !== question.id && (
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm mt-2">
                      Ver más
                    </button>
                  )}
                </div>

                {/* Stats Bar - Estilo Facebook */}
                <div className="flex items-center justify-between py-2 px-0 text-sm text-gray-600 dark:text-slate-400 border-t-2 border-gray-300 dark:border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>{question.response_count}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{reactionCounts[question.id] ?? (question.reaction_count ?? 0)}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>{question.view_count}</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons - Estilo Facebook */}
                <div className="flex items-center justify-around py-2 border-t-2 border-gray-300 dark:border-slate-700/50 mt-2">
                  <button 
                    onClick={(e) => handleReaction(question.id, e)}
                    className={`flex items-center gap-2 transition-colors py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30 font-medium ${
                      userReactions[question.id] === 'like'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${userReactions[question.id] === 'like' ? 'fill-current' : ''}`} />
                    <span>Me gusta</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuestion(selectedQuestion === question.id ? null : question.id);
                    }}
                    className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30 font-medium"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Comentar</span>
                  </button>
                </div>
              </div>
              
              {/* Question Detail - Se expande cuando está seleccionada */}
              {selectedQuestion === question.id && (
                <QuestionDetail
                  questionId={question.id}
                  slug={slug}
                  onClose={() => setSelectedQuestion(null)}
                />
              )}
            </motion.div>
          ))}
          
          {/* Botón "Cargar más" */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={loadMoreQuestions}
                disabled={loadingMore}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Cargar más preguntas</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateQuestionForm
          slug={slug}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            // Recargar preguntas sin recargar toda la página
            reloadQuestions();
          }}
        />
      )}
    </div>
  );
}

function QuestionDetail({ questionId, slug, onClose }: { questionId: string; slug: string; onClose: () => void }) {
  const [question, setQuestion] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Cambiado a false para mostrar skeleton inmediatamente
  const [loadingResponses, setLoadingResponses] = useState(true); // Iniciar en true para mostrar skeleton inmediatamente
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyingToReply, setReplyingToReply] = useState<string | null>(null); // Para responder a comentarios anidados
  const [replyToReplyContent, setReplyToReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseReactions, setResponseReactions] = useState<Record<string, string>>({}); // responseId -> reaction_type
  const [responseReactionCounts, setResponseReactionCounts] = useState<Record<string, number>>({}); // responseId -> count
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Función para ajustar altura del textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 40; // Altura mínima en px (equivalente a ~1 línea)
      const maxHeight = 200; // Altura máxima en px (equivalente a ~8-9 líneas)
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Ajustar altura del textarea dinámicamente cuando cambia el contenido
  useEffect(() => {
    adjustTextareaHeight();
  }, [newResponse]);

  // Ajustar altura inicial cuando se monta el componente
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  // OPTIMIZACIÓN CRÍTICA: Carga paralela de pregunta + respuestas (elimina waterfall de 9-14s)
  useEffect(() => {
    let cancelled = false;

    async function loadQuestionData() {
      try {
        setLoading(true);
        setLoadingResponses(true);

        // PARALELIZAR: Cargar pregunta y respuestas al mismo tiempo
        const [questionRes, responsesRes] = await Promise.all([
          fetch(`/api/courses/${slug}/questions/${questionId}`),
          fetch(`/api/courses/${slug}/questions/${questionId}/responses`)
        ]);

        if (cancelled) return;

        // Procesar pregunta
        if (questionRes.ok) {
          const questionData = await questionRes.json();
          setQuestion(questionData);
        }

        // Procesar respuestas
        if (responsesRes.ok) {
          const responsesData = await responsesRes.json();
          setResponses(responsesData || []);

          // Inicializar contadores de reacciones desde los datos de respuesta
          // (ya vienen con reaction_count del servidor)
          const countsMap: Record<string, number> = {};
          const reactionsMap: Record<string, string> = {};

          const initCountsFromResponses = (responses: any[]) => {
            responses.forEach((r: any) => {
              if (r.id) {
                countsMap[r.id] = r.reaction_count || 0;
                // Si el usuario ya reaccionó, viene en user_reaction del servidor
                if (r.user_reaction) {
                  reactionsMap[r.id] = r.user_reaction;
                }
              }
              if (r.replies && r.replies.length > 0) {
                initCountsFromResponses(r.replies);
              }
            });
          };

          initCountsFromResponses(responsesData);
          setResponseReactionCounts(countsMap);
          setResponseReactions(reactionsMap);
        }
      } catch (error) {
        // console.error('Error loading question data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingResponses(false);
        }
      }
    }

    loadQuestionData();

    return () => {
      cancelled = true;
    };
  }, [questionId, slug]);

  const getUserDisplayName = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.display_name || user?.username || 'Usuario';
  };

  const getUserInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  const handleResponseReaction = async (responseId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const currentReaction = responseReactions[responseId];
    const isCurrentlyLiked = currentReaction === 'like';
    const currentCount = responseReactionCounts[responseId] ?? 0;

    // OPTIMIZACIÓN: Actualización optimista inmediata (sin bloquear UI)
    const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    const newReactionState = isCurrentlyLiked ? null : 'like';

    setResponseReactionCounts(prev => ({ ...prev, [responseId]: newCount }));
    setResponseReactions(prev => {
      if (newReactionState) {
        return { ...prev, [responseId]: newReactionState };
      } else {
        const updated = { ...prev };
        delete updated[responseId];
        return updated;
      }
    });

    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses/${responseId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reaction_type: 'like',
          action: 'toggle'
        })
      });

      if (!response.ok) {
        // Revertir en caso de error
        setResponseReactionCounts(prev => ({ ...prev, [responseId]: currentCount }));
        setResponseReactions(prev => {
          if (currentReaction) {
            return { ...prev, [responseId]: currentReaction };
          } else {
            const updated = { ...prev };
            delete updated[responseId];
            return updated;
          }
        });
      } else {
        // OPTIMIZACIÓN CRÍTICA: Usar datos del servidor sin queries adicionales
        const data = await response.json();

        // Sincronizar con el contador real del servidor
        if (data.new_count !== undefined) {
          setResponseReactionCounts(prev => ({ ...prev, [responseId]: data.new_count }));
        }

        // Sincronizar estado de reacción del usuario
        if (data.user_reaction) {
          setResponseReactions(prev => ({ ...prev, [responseId]: data.user_reaction }));
        } else {
          setResponseReactions(prev => {
            const updated = { ...prev };
            delete updated[responseId];
            return updated;
          });
        }
      }
    } catch (error) {
      // console.error('Error handling response reaction:', error);
      // Revertir en caso de error
      setResponseReactionCounts(prev => ({ ...prev, [responseId]: currentCount }));
      setResponseReactions(prev => {
        if (currentReaction) {
          return { ...prev, [responseId]: currentReaction };
        } else {
          const updated = { ...prev };
          delete updated[responseId];
          return updated;
        }
      });
    }
  };

  const handleSubmitResponse = async (e?: React.FormEvent) => {
    e?.stopPropagation();
    if (!newResponse.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newResponse.trim() })
      });

      if (response.ok) {
        const newResponseData = await response.json();
        setResponses(prev => [...prev, { ...newResponseData, replies: [] }]);
        setNewResponse('');
      }
    } catch (error) {
      // console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_response_id: parentId
        })
      });

      if (response.ok) {
        const newReplyData = await response.json();
        setResponses(prev => prev.map(r => 
          r.id === parentId 
            ? { ...r, replies: [...(r.replies || []), newReplyData] }
            : r
        ));
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      // console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReplyToReply = async (parentReplyId: string, parentResponseId: string) => {
    if (!replyToReplyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyToReplyContent.trim(),
          parent_response_id: parentReplyId
        })
      });

      if (response.ok) {
        const newReplyData = await response.json();
        // Buscar la respuesta principal y actualizar sus replies
        setResponses(prev => prev.map(response => {
          if (response.id === parentResponseId) {
            const updatedReplies = (response.replies || []).map((reply: any) => {
              if (reply.id === parentReplyId) {
                // Si el reply ya tiene replies, agregarlo, sino crear el array
                return {
                  ...reply,
                  replies: [...(reply.replies || []), newReplyData]
                };
              }
              return reply;
            });
            return { ...response, replies: updatedReplies };
          }
          return response;
        }));
        setReplyToReplyContent('');
        setReplyingToReply(null);
      }
    } catch (error) {
      // console.error('Error submitting reply to reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar skeleton solo si la pregunta está cargando
  if (loading) {
    return (
      <div className="p-6 border-t-2 border-gray-300 dark:border-slate-700/50 bg-white dark:bg-gradient-to-br dark:from-slate-800/40 dark:via-slate-700/20 dark:to-slate-800/40">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-700/50 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700/50 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-slate-700/50 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-slate-700/50 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-6 border-t-2 border-gray-300 dark:border-slate-700/50 bg-white dark:bg-slate-800"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Formulario de nueva respuesta - Diseño compacto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 bg-white dark:bg-slate-800/90 rounded-xl p-3 border-2 border-gray-300 dark:border-slate-700/50 backdrop-blur-sm"
      >
        <div className="flex gap-3 items-end">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-lg flex-shrink-0">
            U
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="w-full bg-white dark:bg-slate-700/50 border-2 border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none transition-all duration-200 overflow-y-auto"
              style={{ minHeight: '40px', maxHeight: '200px' }}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">
                {newResponse.length}/1000
              </span>
              <motion.button
                onClick={handleSubmitResponse}
                disabled={!newResponse.trim() || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-blue-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSubmitting ? 'Enviando...' : 'Responder'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lista de respuestas - Estilo Facebook */}
      <div className="space-y-4">
        {loadingResponses ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-gray-300 dark:border-slate-700/50">
                <div className="flex gap-4">
                  {/* Avatar skeleton */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:!bg-slate-700 flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    {/* Header skeleton */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-4 bg-gray-200 dark:!bg-slate-700 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 dark:!bg-slate-700 rounded w-20"></div>
                    </div>
                    {/* Content skeleton */}
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:!bg-slate-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:!bg-slate-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:!bg-slate-700 rounded w-3/4"></div>
                    </div>
                    {/* Action buttons skeleton */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="h-6 bg-gray-200 dark:!bg-slate-700 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 dark:!bg-slate-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-slate-400">Aún no hay respuestas. Sé el primero en responder.</p>
          </div>
        ) : (
          responses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border-2 border-gray-300 dark:border-slate-700/50 backdrop-blur-sm hover:border-gray-400 dark:hover:border-slate-600/50 transition-all duration-300"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden shadow-lg flex-shrink-0">
                  {response.user?.profile_picture_url ? (
                    <Image
                      src={response.user.profile_picture_url}
                      alt={getUserDisplayName(response.user)}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getUserInitials(response.user)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getUserDisplayName(response.user)}
                    </span>
                    {response.is_instructor_answer && (
                      <span className="px-2 py-0.5 bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded-full border border-purple-500/30 dark:border-purple-500/30">
                        Instructor
                      </span>
                    )}
                    {response.is_approved_answer && (
                      <span className="px-2 py-0.5 bg-green-500/20 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full border border-green-500/30 dark:border-green-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Respuesta Aprobada
                      </span>
                    )}
                    <span className="text-xs text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                      {formatTimeAgo(response.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-slate-300 mb-4 leading-relaxed whitespace-pre-wrap">{response.content}</p>
                  
                  {/* Botones de acción - Me gusta y Responder */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={(e) => handleResponseReaction(response.id, e)}
                      className={`flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30 ${
                        responseReactions[response.id] === 'like'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${responseReactions[response.id] === 'like' ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">
                        {responseReactionCounts[response.id] ?? (response.reaction_count || 0)}
                      </span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === response.id ? null : response.id)}
                      className="group flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg"
                    >
                      <Reply className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm font-medium">Responder</span>
                    </button>
                  </div>

                  {/* Formulario de respuesta */}
                  <AnimatePresence>
                    {replyingTo === response.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 bg-gray-100 dark:bg-slate-800/90 rounded-lg p-3 border-2 border-gray-300 dark:border-slate-700/50"
                      >
                        <div className="flex gap-2">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="flex-1 bg-white dark:bg-slate-600/50 border-2 border-gray-300 dark:border-slate-500/50 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                            rows={2}
                          />
                          <motion.button
                            onClick={() => handleSubmitReply(response.id)}
                            disabled={!replyContent.trim() || isSubmitting}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Send className="w-4 h-4" />
                          </motion.button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-4 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg transition-colors"
                            aria-label="Cancelar respuesta"
                            title="Cancelar respuesta"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Respuestas anidadas */}
                  {response.replies && response.replies.length > 0 && (
                    <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-300 dark:border-slate-600/50 pl-4">
                      {response.replies.map((reply: any) => (
                        <div key={reply.id} className="bg-gray-100 dark:bg-slate-800/90 rounded-lg p-3 border-2 border-gray-300 dark:border-slate-700/50">
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0">
                              {reply.user?.profile_picture_url ? (
                                <Image
                                  src={reply.user.profile_picture_url}
                                  alt={getUserDisplayName(reply.user)}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getUserInitials(reply.user)
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {getUserDisplayName(reply.user)}
                                </span>
                                {reply.is_instructor_answer && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded border border-purple-500/30 dark:border-purple-500/30">
                                    Instructor
                                  </span>
                                )}
                                <span className="text-gray-600 dark:text-slate-400 text-xs">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-800 dark:text-slate-200 text-sm whitespace-pre-wrap mb-2">{reply.content}</p>
                              
                              {/* Botones de acción para comentarios anidados */}
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={(e) => handleResponseReaction(reply.id, e)}
                                  className={`flex items-center gap-1.5 transition-colors ${
                                    responseReactions[reply.id] === 'like'
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
                                  }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${responseReactions[reply.id] === 'like' ? 'fill-current' : ''}`} />
                                  <span className="text-xs font-medium">
                                    {responseReactionCounts[reply.id] ?? (reply.reaction_count || 0)}
                                  </span>
                                </button>
                                <button
                                  onClick={() => setReplyingToReply(replyingToReply === reply.id ? null : reply.id)}
                                  className="group flex items-center gap-1.5 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-xs"
                                >
                                  <Reply className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                                  <span className="font-medium">Responder</span>
                                </button>
                              </div>

                              {/* Formulario para responder a comentarios anidados */}
                              <AnimatePresence>
                                {replyingToReply === reply.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 bg-gray-100 dark:bg-slate-800/90 rounded-lg p-2 border-2 border-gray-300 dark:border-slate-700/50"
                                  >
                                    <div className="flex gap-2">
                                      <textarea
                                        value={replyToReplyContent}
                                        onChange={(e) => setReplyToReplyContent(e.target.value)}
                                        placeholder="Escribe una respuesta..."
                                        className="flex-1 bg-white dark:bg-slate-500/50 border-2 border-gray-300 dark:border-slate-400/50 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none text-sm"
                                        rows={2}
                                      />
                                      <motion.button
                                        onClick={() => handleSubmitReplyToReply(reply.id, response.id)}
                                        disabled={!replyToReplyContent.trim() || isSubmitting}
                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </motion.button>
                                      <button
                                        onClick={() => {
                                          setReplyingToReply(null);
                                          setReplyToReplyContent('');
                                        }}
                                        className="px-3 py-1.5 bg-gray-300 dark:bg-slate-500 hover:bg-gray-400 dark:hover:bg-slate-400 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
                                        aria-label="Cancelar respuesta"
                                        title="Cancelar respuesta"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Respuestas anidadas a comentarios anidados (si existen) */}
                              {reply.replies && reply.replies.length > 0 && (
                                <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-300 dark:border-slate-500/50 pl-3">
                                  {reply.replies.map((nestedReply: any) => (
                                    <div key={nestedReply.id} className="bg-gray-100 dark:bg-slate-800/90 rounded-lg p-2 border-2 border-gray-300 dark:border-slate-700/50">
                                      <div className="flex gap-2">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0">
                                          {nestedReply.user?.profile_picture_url ? (
                                            <Image
                                              src={nestedReply.user.profile_picture_url}
                                              alt={getUserDisplayName(nestedReply.user)}
                                              width={20}
                                              height={20}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            getUserInitials(nestedReply.user)?.charAt(0) || 'U'
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                                              {getUserDisplayName(nestedReply.user)}
                                            </span>
                                            <span className="text-gray-600 dark:text-slate-400 text-xs">
                                              {formatTimeAgo(nestedReply.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-gray-800 dark:text-slate-200 text-xs whitespace-pre-wrap">{nestedReply.content}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function CreateQuestionForm({ slug, onClose, onSuccess }: { slug: string; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/courses/${slug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim()
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      // console.error('Error creating question:', error);
      alert('Error al crear la pregunta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div 
        className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 w-full max-w-2xl p-6 mx-4" 
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 0 0 rgba(0, 0, 0, 0)' }}
      >
        <h3 className="text-white font-semibold text-xl mb-4">Hacer una Pregunta</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de tu pregunta..."
              className="w-full px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-slate-300 text-sm mb-2">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe tu pregunta..."
              required
              rows={6}
              className="w-full px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Pregunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

