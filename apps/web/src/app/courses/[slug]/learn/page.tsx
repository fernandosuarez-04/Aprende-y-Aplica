"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { dedupedFetch } from "../../../../lib/supabase/request-deduplication";
import { createClient } from "../../../../lib/supabase/client";
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
  History,
  Edit2,
  MoreVertical,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Brain,
  Palette,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
// ⚡  OPTIMIZACIÓN: Lazy loading de componentes pesados para reducir bundle inicial
import dynamic from "next/dynamic";
import { ExpandableText } from "../../../../core/components/ExpandableText";
// import { useLiaChat } from '../../../../core/hooks'; // Removed - Deleted
import type { CourseLessonContext } from "../../../../core/types/lia.types";
import { WorkshopLearningProvider } from "../../../../components/WorkshopLearningProvider";
import { CourseRatingModal } from "../../../../features/courses/components/CourseRatingModal";
import { CourseLia } from "../../../../features/courses/components/CourseLia";
import { useLiaCourse } from "../../../../features/courses/context/LiaCourseContext";
import { useLiaCourseChat } from "../../../../core/hooks/useLiaCourseChat";

import { CourseRatingService } from "../../../../features/courses/services/course-rating.service";
import { useAuth } from "../../../../features/auth/hooks/useAuth";
import { useSwipe } from "../../../../hooks/useSwipe";
import { useTranslation } from "react-i18next";
import { ContentTranslationService } from "../../../../core/services/contentTranslation.service";
import { useLanguage } from "../../../../core/providers/I18nProvider";
// ✨ Nuevos imports para integración de modos
import { useOrganizationStyles } from "../../../../features/business-panel/hooks/useOrganizationStyles";
import { hexToRgb } from "../../../../features/business-panel/utils/styles";
// 🎯 Import para tracking de sesiones de estudio
import {
  LessonTrackingProvider,
  useLessonTrackingOptional,
} from "./LessonTrackingContext";
// 🎯 Import para el tour del curso
import { useCourseLearnTour } from "../../../../features/tours/hooks/useCourseLearnTour";
import Joyride from 'react-joyride';

// Lazy load componentes pesados (solo se cargan cuando se usan)
// VideoPlayer se define fuera para que pueda ser usado en componentes hijos
const VideoPlayer = dynamic(
  () =>
    import("../../../../core/components/VideoPlayer").then((mod) => ({
      default: mod.VideoPlayer,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center aspect-video bg-[#0F1419] dark:bg-[#0F1419] rounded-xl">
        Cargando video...
      </div>
    ),
    ssr: false,
  }
);

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
  video_provider?: "youtube" | "vimeo" | "direct" | "custom";
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

// Componente del botón de LIA para la barra de navegación móvil
function LiaMobileButton() {
  const { isOpen, toggleLia } = useLiaCourse();

  return (
    <button
      onClick={toggleLia}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
        isOpen
          ? "bg-[#00D4B3]/20 text-[#00D4B3]"
          : "text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
      }`}
    >
      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-current">
        <img
          src="/lia-avatar.png"
          alt="LIA"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-xs font-medium">LIA</span>
      {/* Indicador de activo */}
      <div className="absolute top-1 right-2 w-2 h-2 bg-[#22c55e] rounded-full border border-white dark:border-[#1E2329]" />
    </button>
  );
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isOpen: isLiaOpen, openLia, liaChat } = useLiaCourse();
  // Hook para enviar mensajes a LIA (usando instancia compartida del Sidebar)
  const sendLiaMessage = useCallback(
    async (
      message: string,
      courseContext?: any,
      workshopContext?: any,
      isSystemMessage: boolean = false
    ) => {
      if (liaChat?.sendMessage) {
        if (!isLiaOpen) openLia();
        await liaChat.sendMessage(
          message,
          courseContext,
          workshopContext,
          isSystemMessage
        );
      } else {
        console.warn("LIA Chat no inicializado");
      }
    },
    [liaChat, isLiaOpen, openLia]
  );

  const { user } = useAuth();
  const { effectiveStyles } = useOrganizationStyles();

  // Calcular colores dinámicos
  const colors = useMemo(() => {
    const DEFAULT_ACCENT = "#00D4B3";
    const DEFAULT_BG_PRIMARY = "#0F1419";
    const DEFAULT_BG_SECONDARY = "#1E2329"; // Para paneles laterales

    const dashboardStyles = effectiveStyles?.userDashboard;
    
    // Si no hay estilos, usar defaults oscuros
    if (!dashboardStyles) {
      return {
        accent: DEFAULT_ACCENT,
        primary: "#0A2540",
        bgPrimary: DEFAULT_BG_PRIMARY,
        bgSecondary: DEFAULT_BG_SECONDARY,
        text: "#FFFFFF",
        isLightMode: false
      };
    }

    const { accent_color, primary_button_color, background_value, card_background } = dashboardStyles;
    const panelStyles = effectiveStyles.panel;

    // Detectar modo claro
    const cardBgCheck = card_background || DEFAULT_BG_SECONDARY;
    const isLightMode = cardBgCheck.toLowerCase() === '#ffffff' || 
                        cardBgCheck.toLowerCase() === '#f8fafc' ||
                        cardBgCheck.toLowerCase().includes('255, 255, 255');

    // Determinar fondo principal (body)
    let bgPrimary = background_value || (isLightMode ? '#F1F5F9' : DEFAULT_BG_PRIMARY);

    // Determinar fondo secundario (paneles, tarjetas que eran blancas)
    // En modo claro, el sidebar suele ser blanco
    const sidebarBg = panelStyles?.sidebar_background || (isLightMode ? '#FFFFFF' : DEFAULT_BG_SECONDARY);
    const bgSecondary = sidebarBg && sidebarBg.startsWith("#") ? sidebarBg : (isLightMode ? '#FFFFFF' : DEFAULT_BG_SECONDARY);
    
    // Forzar corrección si modo claro pero colores oscuros detectados
    if (isLightMode) {
       if (bgPrimary.toLowerCase() === '#0f1419' || bgPrimary.toLowerCase() === '#000000') {
           bgPrimary = '#F1F5F9';
       }
    }

    return {
      accent: accent_color || DEFAULT_ACCENT,
      primary: primary_button_color || "#0A2540",
      bgPrimary,
      bgSecondary,
      text: isLightMode ? '#0F172A' : '#FFFFFF',
      isLightMode
    };
  }, [effectiveStyles]);

  // Hook de traducción con verificación de inicialización
  const { t, i18n, ready } = useTranslation("learn");
  // Detectar idioma seleccionado
  const selectedLang =
    i18n.language === "en" ? "en" : i18n.language === "pt" ? "pt" : "es";

  // Obtener steps del tour traducidos

  // Estado para evitar errores de hidratación
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplicar estilos personalizados globalmente a esta página mediante CSS injection
  // Esto sobrescribe las clases de utilidad de Tailwind (verdes/emerald) con el color de la marca
  useEffect(() => {
    const styleId = "custom-course-theme";
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const { accent, bgPrimary, bgSecondary, isLightMode, text } = colors;

    // Helper para convertir hex a rgb string
    const hexToRgbVals = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : "0 212 179";
    };
    const accentRgb = hexToRgbVals(accent);

    styleTag.innerHTML = `
      :root {
        --course-accent: ${accent};
        --course-accent-rgb: ${accentRgb};
        color-scheme: ${isLightMode ? 'light' : 'dark'};
      }
      
      /* SCROLLBARS PERSONALIZADOS */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        background: transparent !important;
      }
      ::-webkit-scrollbar-track {
        background: transparent !important;
      }
      ::-webkit-scrollbar-thumb {
        background: ${isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'} !important;
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${isLightMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'} !important;
      }
      ::-webkit-scrollbar-corner {
        background: transparent !important;
      }

      /* TEMA BASE - APLICADO SIEMPRE */
      body, .min-h-screen, html { 
        background: ${bgPrimary} !important; 
        color: ${text} !important;
      }

      /* ----------------------------------------------------------------------- */
      /* MODIFICACIONES ESPECÍFICAS PARA MODO OSCURO (RESETS AGRESIVOS) */
      /* Solo se aplican si NO estamos en modo claro */
      /* ----------------------------------------------------------------------- */
      ${!isLightMode ? `
        /* Reemplazar fondos blancos por el color secundario oscuro */
        .bg-white, .bg-gray-50, .bg-slate-50, .bg-zinc-50 { 
          background-color: ${bgSecondary} !important; 
          border-color: rgba(255,255,255,0.08) !important;
        }

        /* --- CORRECCIÓN AGRESIVA DE TEXTOS --- */
        
        /* 1. Resetear colores oscuros hardcodeados */
        .text-\\[\\#0A2540\\], .text-\\[\\#1E2329\\] { 
          color: white !important; 
        }
        
        /* 2. Resetear colores secundarios hardcodeados */
        .text-\\[\\#6C757D\\] {
          color: rgba(255,255,255,0.6) !important;
        }

        /* 3. Resetear todas las escalas de grises oscuras de Tailwind */
        [class*="text-gray-9"], [class*="text-gray-8"], [class*="text-gray-7"], [class*="text-gray-6"],
        [class*="text-slate-9"], [class*="text-slate-8"], [class*="text-slate-7"], [class*="text-slate-6"],
        [class*="text-zinc-9"], [class*="text-zinc-8"], [class*="text-zinc-7"], [class*="text-zinc-6"] {
           color: rgba(255,255,255,0.9) !important;
        }
        
        /* 4. Resetear escalas medias/claras para legibilidad */
        [class*="text-gray-5"], [class*="text-gray-4"],
        [class*="text-slate-5"], [class*="text-slate-4"],
        [class*="text-zinc-5"], [class*="text-zinc-4"] {
           color: rgba(255,255,255,0.6) !important;
        }
        
        /* 5. Asegurar headers */
        h1, h2, h3, h4, h5, h6 { color: white !important; }
        
        /* 6. Inputs y Textareas */
        textarea, input[type="text"], input[type="email"], select {
          background-color: rgba(0,0,0,0.2) !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        ::placeholder { color: rgba(255,255,255,0.4) !important; }

        /* Bordes claros a sutiles */
        .border-gray-200, .border-slate-200, .border-[#E9ECEF] { border-color: rgba(255,255,255,0.1) !important; }
        
        /* --- CORRECCIÓN DE BADGES Y BOTONES --- */
        
        /* Botones azules/oscuros genéricos: Forzar color primario de la empresa si es diferente */
        .bg-\\[\\#0A2540\\], .bg-slate-900, .bg-blue-600 {
          background-color: ${colors.primary} !important;
          color: white !important;
        }
        
        /* Badges de estado (Transformar fondos claros a transparentes oscuros) */
        
        /* Rojo (Pendiente) */
        .bg-red-100 { background-color: rgba(239, 68, 68, 0.15) !important; color: #fca5a5 !important; border: 1px solid rgba(239,68,68,0.2) !important; }
        .text-red-800, .text-red-700, .text-red-600 { color: #fca5a5 !important; }
        .bg-red-500 { background-color: rgba(239, 68, 68, 0.8) !important; color: white !important; }
        
        /* Verde (Completado/Quiz) -> Usar Accent */
        .bg-green-100, .bg-emerald-100 { background-color: rgba(${accentRgb}, 0.15) !important; color: ${accent} !important; border: 1px solid rgba(${accentRgb}, 0.2) !important; }
        .text-green-800, .text-emerald-800, .text-emerald-700 { color: ${accent} !important; }
        
        /* Azul (Reading/Info) */
        .bg-blue-100 { background-color: rgba(96, 165, 250, 0.15) !important; color: #93c5fd !important; border: 1px solid rgba(96,165,250,0.2) !important; }
        .text-blue-800, .text-blue-700 { color: #93c5fd !important; }
        
        /* Indigo/Violeta */
        .bg-indigo-100 { background-color: rgba(129, 140, 248, 0.15) !important; color: #a5b4fc !important; }
        .text-indigo-800 { color: #a5b4fc !important; }
        
        /* Botones deshabilitados o grises */
        .bg-gray-100, .bg-slate-100, .bg-gray-200, .bg-slate-200, .bg-gray-300, .bg-slate-300 { 
          background-color: rgba(255,255,255,0.1) !important; 
          color: rgba(255,255,255,0.8) !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        
        /* BOTONES DE ACCIÓN PRINCIPALES */
        /* Botón "Interactuar con Lia" y "Avanzar al Siguiente Video" (si usan clases genéricas de botón gris) */
        button.bg-white.text-gray-900, 
        button.bg-slate-200, 
        a.bg-white.text-gray-900 {
          background-color: ${accent} !important;
          color: white !important;
          border: none !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2) !important;
        }
        
        /* Botones de Modales (Cancelar/Guardar) */
        /* Cancelar (suelen ser blancos/bordes) */
        .bg-white.border-gray-300, .bg-white.border {
          background-color: transparent !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: white !important;
        }
        .bg-white.border-gray-300:hover {
          background-color: rgba(255,255,255,0.05) !important;
        }
        
        /* dropdowns flotantes */
        div.absolute.bg-white.shadow-lg, 
        div.absolute.bg-white.shadow-xl,
        div.absolute.z-50.bg-white,
        [role="menu"].bg-white,
        [role="dialog"].bg-white {
          background-color: #1E2329 !important; /* Forzar oscuro (bgSecondary default) */
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        
        /* Elementos dentro del dropdown */
        div.absolute.bg-white button, 
        [role="menu"] button {
           color: white !important;
        }
        div.absolute.bg-white button:hover,
        [role="menu"] button:hover {
           background-color: rgba(255,255,255,0.1) !important;
        }

        /* Botón de Micrófono en Chat */
        /* Forzar que CUALQUIER botón blanco pequeño sea accent o transparente */
        button.bg-white.w-11.h-11, button.bg-white.rounded-full.shadow-sm {
           background-color: rgba(255,255,255,0.1) !important;
           color: white !important;
           border: 1px solid rgba(255,255,255,0.1) !important;
        }

        /* Iconos y Contenedores de Iconos (Círculos de actividades) */
        .bg-blue-50, .bg-indigo-50, .bg-purple-50 {
          background-color: rgba(${accentRgb}, 0.1) !important;
          color: ${accent} !important;
        }
        .text-blue-500, .text-indigo-500, .text-purple-500 {
          color: ${accent} !important;
        }
        
        /* Textos específicos en modales o tarjetas */
        .text-gray-500, .text-slate-500 {
           color: rgba(255,255,255,0.6) !important;
        }

        button:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background-color: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.4) !important;
        }
        
        /* Sobrescribir verdes y colores específicos del template por defecto (#00D4B3, emerald, green) */
        .text-\\[\\#00D4B3\\], .text-emerald-500, .text-green-500, .text-green-400 { color: ${accent} !important; }
        .bg-\\[\\#00D4B3\\], .bg-emerald-500, .bg-green-500, .bg-green-400 { background-color: ${accent} !important; }
        .border-\\[\\#00D4B3\\], .border-emerald-500, .border-green-500, .border-green-400, .border-green-600 { border-color: ${accent} !important; }
        
        /* Fondos con opacidad */
        .bg-emerald-50, .bg-green-50, .bg-green-100 { background-color: rgba(${accentRgb}, 0.1) !important; }
        .bg-emerald-50\\/50, .bg-green-50\\/50 { background-color: rgba(${accentRgb}, 0.05) !important; }
        .bg-\\[\\#10B981\\]\\/10, .bg-\\[\\#00D4B3\\]\\/10 { background-color: rgba(${accentRgb}, 0.1) !important; }
        
        /* Bordes sutiles y dividers */
        .border-emerald-100, .border-green-100, .border-green-200, .border-\\[\\#10B981\\]\\/30 { border-color: rgba(${accentRgb}, 0.3) !important; }
        
        /* Iconos Específicos */
        .text-green-600, .dark .text-green-400 { color: ${accent} !important; } 
        
        /* Hovers */
        .hover\\:bg-green-100:hover { background-color: rgba(${accentRgb}, 0.15) !important; }
        
        /* Gradientes */
        .from-\\[\\#00D4B3\\], .from-green-400, .from-emerald-400 { --tw-gradient-from: ${accent} !important; }
        .to-\\[\\#00D4B3\\], .to-green-400, .to-emerald-400 { --tw-gradient-to: ${accent} !important; }
        
        /* Sombras */
        .shadow-\\[\\#00D4B3\\]\\/25 { --tw-shadow-color: rgba(${accentRgb}, 0.25) !important; }
        
        /* Inputs y Textareas en modo oscuro forzado */
        textarea, input[type="text"] {
          background-color: rgba(255,255,255,0.05) !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
      ` : `
        /* ----------------------------------------------------------------------- */
        /* REGLAS ESPECÍFICAS PARA MODO CLARO */
        /* ----------------------------------------------------------------------- */
        
        /* Asegurar que el fondo del sidebar sea correcto en modo claro */
        .bg-\\[\\#0F1419\\], .bg-gray-900, .bg-slate-900 {
           background-color: ${bgSecondary} !important; /* Sidebar debe ser blanco/gris claro */
        }
        
        /* Asegurar que los textos sean legibles sobre fondo claro */
        h1, h2, h3, h4, h5, h6 { 
          color: ${text} !important; 
        }
        
        /* Forzar color de texto principal */
        body { color: ${text} !important; }
        
        /* Sobrescribir elementos que eran blancos en oscuro pero deben ser gris claro en claro para contraste ? No, usar default */
        
        /* Ajustar botones primarios al azul de la marca */
        .bg-\\[\\#0A2540\\] {
          background-color: ${colors.primary} !important;
          color: white !important;
        }
        
        /* Asegurar que los componentes "darks" de LIA/Chat se vean bien */
        /* Si el chat LIA fue diseñado solo para oscuro, quizás necesitemos ajustes aquí */
      `}
    `;

    return () => {
      const tag = document.getElementById(styleId);
      if (tag) tag.remove();
    };
  }, [colors]);

  // Crear componentes dinámicos con loaders traducidos
  const NotesModal = useMemo(
    () =>
      dynamic(
        () =>
          import("../../../../core/components/NotesModal").then((mod) => ({
            default: mod.NotesModal,
          })),
        {
          loading: () => (
            <div className="flex items-center justify-center p-8">
              {mounted && ready ? t("loading.notes") : "Cargando notas..."}
            </div>
          ),
          ssr: false,
        }
      ),
    [t, mounted, ready]
  );

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  // ✅ Estado para metadatos del taller (módulos y lecciones completos)
  const [workshopMetadata, setWorkshopMetadata] =
    useState<CourseLessonContext | null>(null);
  // ✅ Estados para contexto extendido de LIA (transcript/summary)
  const [liaTranscript, setLiaTranscript] = useState<string | null>(null);
  const [liaSummary, setLiaSummary] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "video" | "transcript" | "summary" | "activities" | "questions"
  >("video");

  // Estado para detectar si estamos en móvil
  const [isMobile, setIsMobile] = useState(false);
  // Estado para la altura de la pantalla (para adaptar padding en diferentes dispositivos)
  const [screenHeight, setScreenHeight] = useState(0);
  // Estado para la altura del visualViewport (para manejar el teclado en móvil)
  const [visualViewportHeight, setVisualViewportHeight] = useState<
    number | null
  >(null);

  // Inicializar paneles cerrados en móviles, abiertos en desktop
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  // const [isRightPanelOpen, setIsRightPanelOpen] = useState(false); // Removed LIA

  // 🎯 Tour del curso - con acciones interactivas
  const { joyrideProps } = useCourseLearnTour({
    enabled: true,
    onOpenLia: openLia,
    onSwitchTab: (tab) => setActiveTab(tab),
    onOpenNotes: (shouldScroll = true) => {
      setIsLeftPanelOpen(true);
      setIsNotesCollapsed(false);
      // Dar tiempo para que se expanda antes de que el tour busque el elemento
      if (shouldScroll) {
        setTimeout(() => {
          const element = document.getElementById("tour-notes-section");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    },
  });

  // Estado para renderizar Joyride solo en cliente
  const [isJoyrideMounted, setIsJoyrideMounted] = useState(false);
  useEffect(() => {
    setIsJoyrideMounted(true);
  }, []);

  // const [isLiaExpanded, setIsLiaExpanded] = useState(false);
  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<
    string[]
  >([]);
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false);
  const [isMaterialCollapsed, setIsMaterialCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [lessonsActivities, setLessonsActivities] = useState<
    Record<
      string,
      Array<{
        activity_id: string;
        activity_title: string;
        activity_type: string;
        is_required: boolean;
      }>
    >
  >({});
  const [lessonsMaterials, setLessonsMaterials] = useState<
    Record<
      string,
      Array<{
        material_id: string;
        material_title: string;
        material_type: string;
        is_required?: boolean;
      }>
    >
  >({});
  const [lessonsQuizStatus, setLessonsQuizStatus] = useState<
    Record<
      string,
      {
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
      } | null
    >
  >({});
  // const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const isMobileBottomNavVisible = isMobile && !isLeftPanelOpen;
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
  // Hook de LIA sin mensaje inicial - Removed
  // const {
  //   messages: liaMessages,
  //   isLoading: isLiaLoading,
  //   sendMessage: sendLiaMessage,
  //   clearHistory: clearLiaHistory,
  //   loadConversation,
  //   currentConversationId,
  //   // ✨ Nuevas propiedades para modos
  //   currentMode,
  //   setMode,
  //   generatedPrompt,
  //   clearPrompt,
  //   // 🎨 Nuevas propiedades para NanoBanana
  //   generatedNanoBanana,
  //   clearNanoBanana,
  //   isNanoBananaMode
  // } = useLiaChat(null);

  // Estado local para el input del mensaje (Removed)
  // const [liaMessage, setLiaMessage] = useState('');
  // const [isLiaRecording, setIsLiaRecording] = useState(false);
  // Ref para hacer scroll automático al final de los mensajes de LIA
  // const liaMessagesEndRef = useRef<HTMLDivElement>(null);
  // const liaPanelRef = useRef<HTMLDivElement>(null);
  // Ref para el textarea de LIA
  // const liaTextareaRef = useRef<HTMLTextAreaElement>(null);
  // 🎙️ Ref para el reconocimiento de voz
  // const recognitionRef = useRef<any>(null);

  // 🎙️ Obtener idioma actual para reconocimiento de voz
  // const { language } = useLanguage();

  // 🎙️ Mapeo de idiomas para reconocimiento de voz
  // const speechLanguageMap: Record<string, string> = {
  //   'es': 'es-ES',
  //   'en': 'en-US',
  //   'pt': 'pt-BR'
  // };
  // ✨ Estados para guardado de prompts
  // const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  // const [showPromptPreview, setShowPromptPreview] = useState(false);
  // 🎨 Estados para NanoBanana
  // const [showNanoBananaPreview, setShowNanoBananaPreview] = useState(false);
  // Ref para rastrear si los prompts cambiaron desde fuera (no por colapso manual)
  const prevPromptsLengthRef = useRef<number>(0);
  // Ref para el botón del menú de Lia
  // const liaMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Estados para historial de conversaciones (Removed)
  // const [showHistory, setShowHistory] = useState(false);
  // const [conversations, setConversations] = useState<Array<{
  //   conversation_id: string;
  //   conversation_title: string | null;
  //   started_at: string;
  //   total_messages: number;
  //   context_type: string;
  //   course_id: string | null;
  //   lesson_id: string | null;
  //   course: {
  //     slug: string;
  //     title: string;
  //   } | null;
  // }>>([]);
  // const [loadingConversations, setLoadingConversations] = useState(false);
  // const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  // const [editingTitle, setEditingTitle] = useState<string>('');
  // const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  // const [showLiaMenu, setShowLiaMenu] = useState(false);
  // const [liaMenuPosition, setLiaMenuPosition] = useState<{ top: number; right: number } | null>(null);

  // Calcular posición del menú cuando se abre
  // useEffect(() => {
  //   if (showLiaMenu && liaMenuButtonRef.current) {
  //     const buttonRect = liaMenuButtonRef.current.getBoundingClientRect();
  //     setLiaMenuPosition({
  //       top: buttonRect.bottom + 8, // 8px de margen (mt-2)
  //       right: window.innerWidth - buttonRect.right
  //     });
  //   } else {
  //     setLiaMenuPosition(null);
  //   }
  // }, [showLiaMenu]);

  // 🎯 SISTEMA DE TRACKING AVANZADO DE COMPORTAMIENTO DEL USUARIO
  const [userBehaviorLog, setUserBehaviorLog] = useState<
    Array<{
      action: string;
      timestamp: number;
      lessonId?: string;
      lessonTitle?: string;
      hasCompletedActivities?: boolean;
      activityDetails?: string;
      metadata?: any;
    }>
  >([]);

  // Función para registrar acciones del usuario
  const trackUserAction = useCallback(
    (action: string, metadata?: any) => {
      const logEntry = {
        action,
        timestamp: Date.now(),
        lessonId: currentLesson?.lesson_id,
        lessonTitle: currentLesson?.lesson_title,
        metadata,
      };

      setUserBehaviorLog((prev) => {
        const newLog = [...prev, logEntry];
        // Mantener solo las últimas 50 acciones para no sobrecargar memoria
        return newLog.slice(-50);
      });
    },
    [currentLesson]
  );

  // Función para analizar el comportamiento y generar contexto detallado
  const analyzeUserBehavior = useCallback((): string => {
    const recentActions = userBehaviorLog.slice(-10); // Últimas 10 acciones
    const now = Date.now();
    const last5Minutes = recentActions.filter(
      (a) => now - a.timestamp < 300000
    );

    let behaviorContext = "";

    // Detectar intentos de cambiar de lección sin completar
    const lessonChangeAttempts = last5Minutes.filter(
      (a) => a.action === "attempted_lesson_change_without_completion"
    );
    if (lessonChangeAttempts.length > 0) {
      const attemptDetails =
        lessonChangeAttempts[lessonChangeAttempts.length - 1];
      behaviorContext += `El usuario ha intentado ${lessonChangeAttempts.length} veces cambiar a otra lección sin completar las actividades requeridas. `;
      behaviorContext += `Actividades pendientes: ${attemptDetails.metadata?.pendingActivities || "desconocidas"}. `;
    }

    // Detectar clics repetidos en lecciones bloqueadas
    const blockedAttempts = last5Minutes.filter(
      (a) => a.action === "attempted_locked_lesson"
    );
    if (blockedAttempts.length > 0) {
      behaviorContext += `Ha intentado ${blockedAttempts.length} veces acceder a lecciones bloqueadas. `;
    }

    // Detectar expansión/colapso frecuente de materiales
    const expandCollapseActions = last5Minutes.filter(
      (a) =>
        a.action === "expand_lesson_materials" ||
        a.action === "collapse_lesson_materials"
    );
    if (expandCollapseActions.length > 3) {
      behaviorContext += `Está explorando los materiales de forma repetitiva (${expandCollapseActions.length} veces en 5 min). `;
    }

    // Detectar cambios frecuentes de tabs
    const tabChanges = last5Minutes.filter((a) => a.action === "tab_change");
    if (tabChanges.length > 5) {
      const tabs = tabChanges.map((a) => a.metadata?.tab).filter(Boolean);
      behaviorContext += `Ha cambiado de sección ${tabChanges.length} veces (${tabs.join(" → ")}), parece estar buscando algo específico. `;
    }

    // Detectar tiempo sin interacciones (último registro)
    if (recentActions.length > 0) {
      const lastAction = recentActions[recentActions.length - 1];
      const timeSinceLastAction = (now - lastAction.timestamp) / 1000; // en segundos
      if (timeSinceLastAction > 120) {
        // más de 2 minutos
        behaviorContext += `Lleva ${Math.floor(timeSinceLastAction / 60)} minutos en la misma acción sin interactuar. `;
      }
    }

    // Detectar intentos fallidos de actividades
    const failedAttempts = last5Minutes.filter(
      (a) => a.action === "activity_failed_attempt"
    );
    if (failedAttempts.length > 0) {
      behaviorContext += `Ha fallado ${failedAttempts.length} intentos en actividades. `;
    }

    return behaviorContext.trim();
  }, [userBehaviorLog, currentLesson]);

  // Función mejorada para manejar cambio de lección con tracking
  const handleLessonChange = useCallback(
    async (lesson: Lesson) => {
      // Si es la misma lección, no hacer nada
      if (currentLesson?.lesson_id === lesson.lesson_id) {
        return;
      }

      // Si no hay lección actual, cambiar directamente
      if (!currentLesson) {
        setCurrentLesson(lesson);
        setActiveTab("video");
        window.scrollTo({ top: 0, behavior: "smooth" });
        trackUserAction("lesson_opened", {
          lessonId: lesson.lesson_id,
          lessonTitle: lesson.lesson_title,
        });
        return;
      }

      // Verificar si hay actividades requeridas sin completar en la lección actual
      const currentActivities =
        lessonsActivities[currentLesson.lesson_id] || [];
      const requiredActivities = currentActivities.filter((a) => a.is_required);
      const pendingRequired = requiredActivities.filter((a) => !a.is_completed);

      if (pendingRequired.length > 0) {
        const pendingTitles = pendingRequired
          .map((a) => a.activity_title)
          .join(", ");
        trackUserAction("attempted_lesson_change_without_completion", {
          currentLessonId: currentLesson.lesson_id,
          currentLessonTitle: currentLesson.lesson_title,
          targetLessonId: lesson.lesson_id,
          targetLessonTitle: lesson.lesson_title,
          pendingActivities: pendingTitles,
          pendingCount: pendingRequired.length,
        });

        console.warn(
          "⚠️ Usuario intenta cambiar de lección con actividades pendientes:",
          {
            current: currentLesson.lesson_title,
            target: lesson.lesson_title,
            pending: pendingTitles,
          }
        );
      } else {
        trackUserAction("lesson_change", {
          from: currentLesson.lesson_title,
          to: lesson.lesson_title,
        });
      }

      // Verificar si está avanzando o retrocediendo
      const allLessons = getAllLessonsOrdered();
      const currentIndex = allLessons.findIndex(
        (item) => item.lesson.lesson_id === currentLesson.lesson_id
      );
      const selectedIndex = allLessons.findIndex(
        (item) => item.lesson.lesson_id === lesson.lesson_id
      );

      // 🚀 OPTIMISTIC UPDATE: Cambiar INMEDIATAMENTE (antes de validar)
      if (selectedIndex > currentIndex) {
        // Guardar lección previa para poder revertir si falla
        const previousLesson = currentLesson;

        // CAMBIO INSTANTÁNEO (UI no se bloquea)
        setCurrentLesson(lesson);
        setActiveTab("video");
        window.scrollTo({ top: 0, behavior: "smooth" });
        trackUserAction("lesson_opened", {
          lessonId: lesson.lesson_id,
          lessonTitle: lesson.lesson_title,
        });

        // VALIDAR en segundo plano (async, no bloquea UI)
        // Usar AbortController para poder cancelar si el usuario cambia de lección rápidamente
        const abortController = new AbortController();

        markLessonAsCompleted(previousLesson.lesson_id, abortController.signal)
          .then((canComplete) => {
            // Si falla la validación, REVERTIR cambio
            if (!canComplete) {
              console.warn(
                "❌ Validación falló, revirtiendo a lección anterior"
              );
              setCurrentLesson(previousLesson);
              setActiveTab("video");
              window.scrollTo({ top: 0, behavior: "smooth" });

              trackUserAction("attempted_locked_lesson", {
                targetLessonId: lesson.lesson_id,
                targetLessonTitle: lesson.lesson_title,
                reason: "previous_lesson_not_completed",
              });
            }
          })
          .catch((error) => {
            // Ignorar errores de cancelación
            if (
              error?.name !== "AbortError" &&
              process.env.NODE_ENV === "development"
            ) {
              console.warn("Error en validación de lección (ignorado):", error);
            }
          });

        // Limpiar el abort controller cuando se cambie de lección
        // Esto se manejará en un useEffect que limpie cuando currentLesson cambie
        return;
      }

      // Si se está retrocediendo, cambiar directamente (sin validación)
      setCurrentLesson(lesson);
      setActiveTab("video");
      window.scrollTo({ top: 0, behavior: "smooth" });
      trackUserAction("lesson_opened", {
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title,
      });
    },
    [currentLesson, lessonsActivities, trackUserAction]
  );

  // Limpiar prompts cuando se cambia de tab
  useEffect(() => {
    if (activeTab !== "activities") {
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
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []); // Solo ejecutar al montar

  // Detectar cambios en visualViewport para manejar el teclado en móvil
  // Similar a la implementación de LIA general
  useEffect(() => {
    if (!isMobile) {
      setVisualViewportHeight(null);
      return;
    }

    // Verificar si visualViewport está disponible
    if (typeof window !== "undefined" && window.visualViewport) {
      const updateViewportHeight = () => {
        setVisualViewportHeight(window.visualViewport?.height || null);
      };

      // Establecer valor inicial
      updateViewportHeight();

      // Escuchar cambios en el visualViewport (cuando se abre/cierra el teclado)
      window.visualViewport.addEventListener("resize", updateViewportHeight);
      window.visualViewport.addEventListener("scroll", updateViewportHeight);

      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          updateViewportHeight
        );
        window.visualViewport?.removeEventListener(
          "scroll",
          updateViewportHeight
        );
      };
    } else {
      // Fallback: usar window.innerHeight si visualViewport no está disponible
      const handleResize = () => {
        setVisualViewportHeight(window.innerHeight);
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isMobile]);

  // Calcular altura máxima disponible para el panel de contenido dinámicamente
  // Ahora incluye soporte para visualViewport cuando el teclado está abierto
  const calculateLiaMaxHeight = useMemo(() => {
    if (isMobile) {
      // En móvil, usar visualViewport height si está disponible (cuando el teclado está abierto)
      if (visualViewportHeight !== null) {
        // Calcular altura disponible: visualViewport height menos el header
        // El safe-area-inset-bottom se maneja en el padding del área de entrada
        const headerHeight = 56; // Altura del header
        const bottomNavHeight = isMobileBottomNavVisible
          ? MOBILE_BOTTOM_NAV_HEIGHT_PX
          : 0;

        // Usar calc() para incluir safe-area-inset-bottom en el cálculo CSS
        return `calc(${visualViewportHeight - headerHeight - bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`;
      }
      // Si no hay visualViewport, no retornar height para que se ajuste automáticamente
      return undefined;
    }

    return "calc(100vh - 3rem)";
  }, [isMobile, isMobileBottomNavVisible, visualViewportHeight]);

  // Calcular padding dinámico para el área de entrada según altura de pantalla
  const getInputAreaPadding = (): string => {
    if (!isMobile) return "1rem";

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
      // En móvil, cerrar panel izquierdo si está abierto al iniciar
      if (isLeftPanelOpen) {
        setIsLeftPanelOpen(false);
      }
    } else {
      // En desktop, abrir panel izquierdo si está cerrado
      if (!isLeftPanelOpen) {
        setIsLeftPanelOpen(true);
      }
    }
  }, [isMobile]); // Solo cuando cambia isMobile

  // Hook para detectar gestos de swipe en móvil
  // Solo funciona cuando el panel izquierdo está cerrado para evitar conflictos
  const swipeRef = useSwipe({
    onSwipeRight: () => {
      // Swipe de izquierda a derecha → abrir panel izquierdo
      if (isMobile && !isLeftPanelOpen) {
        setIsLeftPanelOpen(true);
      }
    },
    // Eliminado soporte para swipe izquierda (panel derecho eliminado)
    onSwipeLeft: () => {},
    threshold: 50, // Mínimo 50px de desplazamiento
    velocity: 0.3, // Mínimo 0.3px/ms de velocidad
    enabled: isMobile && !isLeftPanelOpen, // Solo habilitado en móvil cuando panel izquierdo está cerrado
  });
  const [savedNotes, setSavedNotes] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      timestamp: string;
      lessonId: string;
      fullContent?: string;
      tags?: string[];
    }>
  >([]);
  const [notesStats, setNotesStats] = useState({
    totalNotes: 0,
    lessonsWithNotes: "0/0",
    lastUpdate: "-",
  });
  const [isCourseCompletedModalOpen, setIsCourseCompletedModalOpen] =
    useState(false);
  const [isCannotCompleteModalOpen, setIsCannotCompleteModalOpen] =
    useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    type: "activity" | "video" | "quiz";
    lessonId?: string; // ID de la lección que se intentó completar
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "activity",
    lessonId: undefined,
  });

  // Función para convertir HTML a texto plano con formato mejorado
  const htmlToPlainText = (
    html: string,
    addLineBreaks: boolean = true
  ): string => {
    if (!html) return "";

    // Verificar que estamos en el cliente
    if (typeof document === "undefined") {
      // Fallback simple para SSR: eliminar etiquetas HTML básicas
      return html
        .replace(/<[^>]*>/g, "") // Eliminar todas las etiquetas HTML
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
    }

    // Crear un elemento temporal para parsear el HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Convertir listas a texto legible con saltos de línea
    const lists = tempDiv.querySelectorAll("ul, ol");
    lists.forEach((list) => {
      const items = list.querySelectorAll("li");
      items.forEach((li, index) => {
        const listType = list.tagName.toLowerCase();
        const prefix = listType === "ol" ? `${index + 1}. ` : "• ";
        const text = li.textContent?.trim() || "";
        // Agregar prefijo y salto de línea si está habilitado
        if (addLineBreaks) {
          li.textContent = prefix + text + "\n";
        } else {
          li.textContent = prefix + text;
        }
      });
    });

    // Convertir <p> y <div> a saltos de línea si está habilitado
    if (addLineBreaks) {
      const paragraphs = tempDiv.querySelectorAll("p, div");
      paragraphs.forEach((p) => {
        if (p.textContent && !p.textContent.trim().endsWith("\n")) {
          p.textContent = (p.textContent || "") + "\n";
        }
      });
    }

    // Obtener el texto plano
    let text = tempDiv.textContent || tempDiv.innerText || "";

    // Limpiar espacios múltiples y saltos de línea excesivos
    if (addLineBreaks) {
      text = text.replace(/\n{3,}/g, "\n\n"); // Máximo 2 saltos de línea consecutivos
    }

    return text.trim();
  };

  // Función para generar vista previa inteligente
  const generateNotePreview = (
    html: string,
    maxLength: number = 50
  ): string => {
    if (!html) return "";

    // Verificar que estamos en el cliente
    if (typeof document === "undefined") {
      const plainText = htmlToPlainText(html, false);
      return (
        plainText.substring(0, maxLength) +
        (plainText.length > maxLength ? "..." : "")
      );
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Verificar si el primer elemento es una lista
    const firstChild = tempDiv.firstElementChild;
    if (
      firstChild &&
      (firstChild.tagName === "UL" || firstChild.tagName === "OL")
    ) {
      // Si es una lista, obtener solo el primer elemento
      const firstItem = firstChild.querySelector("li");
      if (firstItem) {
        const listType = firstChild.tagName.toLowerCase();
        const prefix = listType === "ol" ? "1. " : "• ";
        const text = firstItem.textContent?.trim() || "";
        const preview = prefix + text;
        return preview.length > maxLength
          ? preview.substring(0, maxLength) + "..."
          : preview + "...";
      }
    }

    // Si no es una lista o no tiene elementos, usar el método normal
    const plainText = htmlToPlainText(html, false);
    return (
      plainText.substring(0, maxLength) +
      (plainText.length > maxLength ? "..." : "")
    );
  };

  // Función para formatear timestamp
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60)
      return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24)
      return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  // Función para cargar notas de una lección
  const loadLessonNotes = async (lessonId: string, courseSlug: string) => {
    try {
      const response = await fetch(
        `/api/courses/${courseSlug}/lessons/${lessonId}/notes`
      );
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
            tags: note.note_tags || [],
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
          lastUpdate: stats.lastUpdate
            ? formatTimestamp(stats.lastUpdate)
            : "-",
        });
      } else if (response.status === 401) {
        // Usuario no autenticado - usar valores por defecto
        const allLessons = modules.flatMap((m: Module) => m.lessons);
        const totalLessons = allLessons.length;
        setNotesStats({
          totalNotes: 0,
          lessonsWithNotes: `0/${totalLessons}`,
          lastUpdate: "-",
        });
      } else if (response.status === 404) {
        // Endpoint no encontrado - usar valores por defecto sin mostrar error
        const allLessons = modules.flatMap((m: Module) => m.lessons);
        const totalLessons = allLessons.length;
        setNotesStats({
          totalNotes: 0,
          lessonsWithNotes: `0/${totalLessons}`,
          lastUpdate: "-",
        });
      }
    } catch (error) {
      // Silenciar errores de stats, usar valores por defecto
      const allLessons = modules.flatMap((m: Module) => m.lessons);
      const totalLessons = allLessons.length;
      setNotesStats({
        totalNotes: 0,
        lessonsWithNotes: `0/${totalLessons}`,
        lastUpdate: "-",
      });
    }
  };

  // ⚡ OPTIMIZACIÓN: Función para actualizar estadísticas de manera optimizada
  // Calcula las estadísticas localmente cuando es posible, evitando llamadas al servidor
  const updateNotesStatsOptimized = async (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => {
    if (!slug) return;

    const allLessons = modules.flatMap((m: Module) => m.lessons);
    const totalLessons = allLessons.length;

    // Para operaciones de creación/eliminación, podemos actualizar optimistamente
    if (operation === "create" || operation === "delete") {
      // Actualizar total de notas optimistamente
      setNotesStats((prev) => {
        const currentTotal = prev.totalNotes || 0;
        const newTotal =
          operation === "create"
            ? currentTotal + 1
            : Math.max(0, currentTotal - 1);

        // Para lecciones con notas, usar el valor anterior y ajustar optimistamente
        // La recarga del servidor corregirá cualquier discrepancia
        const prevLessonsWithNotes =
          parseInt(prev.lessonsWithNotes.split("/")[0]) || 0;
        let lessonsWithNotes = prevLessonsWithNotes;

        if (lessonId && operation === "create") {
          // Si creamos una nota, asumimos que la lección no tenía notas antes
          // (será corregido por la recarga del servidor si es incorrecto)
          lessonsWithNotes = Math.min(prevLessonsWithNotes + 1, totalLessons);
        } else if (lessonId && operation === "delete") {
          // Si eliminamos una nota, asumimos que era la última de la lección
          // (será corregido por la recarga del servidor si es incorrecto)
          lessonsWithNotes = Math.max(0, prevLessonsWithNotes - 1);
        }

        return {
          ...prev,
          totalNotes: newTotal,
          lessonsWithNotes: `${lessonsWithNotes}/${totalLessons}`,
          lastUpdate: "Ahora", // Actualizar timestamp inmediatamente
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
        lastUpdate: "Ahora",
      }));

      setTimeout(async () => {
        await loadNotesStats(slug);
      }, 500);
    }
  };

  // ⚡ OPTIMIZACIÓN: Función para agregar una nota al estado local inmediatamente
  const addNoteToLocalState = (noteData: any, lessonId: string) => {
    const preview = generateNotePreview(
      noteData.note_content || noteData.noteContent,
      50
    );
    const newNote = {
      id: noteData.note_id || noteData.id,
      title: noteData.note_title || noteData.title,
      content: preview,
      timestamp: "Ahora",
      lessonId: lessonId,
      fullContent: noteData.note_content || noteData.content,
      tags: noteData.note_tags || noteData.tags || [],
    };

    setSavedNotes((prev) => {
      // Si la nota ya existe (por ID), reemplazarla; si no, agregarla al inicio
      const existingIndex = prev.findIndex((n) => n.id === newNote.id);
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
    setSavedNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  // Función para construir el contexto de la lección actual
  const getLessonContext = (): CourseLessonContext | undefined => {
    if (!currentLesson || !course) return undefined;

    // Encontrar el módulo actual
    const currentModule = modules.find((m) =>
      m.lessons.some((l) => l.lesson_id === currentLesson.lesson_id)
    );

    // ✅ Si tenemos metadatos del taller, usarlos (incluye allModules)
    if (workshopMetadata) {
      return {
        ...workshopMetadata,
        moduleTitle: currentModule?.module_title,
        lessonTitle: currentLesson.lesson_title,
        lessonDescription: currentLesson.lesson_description,
        durationSeconds: currentLesson.duration_seconds,
        userRole: user?.type_rol || undefined,
      };
    }

    // Fallback: contexto básico sin metadatos completos
    return {
      contextType: "course", // Por defecto es curso, pero puede ser workshop
      courseId: course.id || course.course_id || undefined,
      courseSlug: slug || undefined,
      courseTitle: course.title || course.course_title,
      courseDescription: course.description || course.course_description,
      moduleTitle: currentModule?.module_title,
      lessonTitle: currentLesson.lesson_title,
      lessonDescription: currentLesson.lesson_description,
      durationSeconds: currentLesson.duration_seconds,
      userRole: user?.type_rol || undefined,
      // transcriptContent y summaryContent se cargan bajo demanda desde sus respectivos endpoints
    };
  };

  // ✨ Función para convertir enlaces Markdown [texto](url) en hipervínculos HTML
  const parseMarkdownLinks = useCallback((text: string) => {
    if (!text) return text;

    // Expresión regular para detectar enlaces Markdown: [texto](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // Dividir el texto en partes: enlaces y texto normal
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      // Agregar texto antes del enlace
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // Agregar el enlace
      parts.push({
        type: "link",
        text: match[1], // El texto del enlace
        url: match[2], // La URL
      });

      lastIndex = match.index + match[0].length;
    }

    // Agregar el texto restante después del último enlace
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: text }];
  }, []);

  // Función para adaptar contenido de actividad según el rol

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
      tags: note.tags || [],
    });
    setIsNotesModalOpen(true);
  };

  // ⚡ OPTIMIZADO: Función para guardar nota (nueva o editada) con actualización optimista
  const handleSaveNote = async (noteData: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    try {
      if (!currentLesson?.lesson_id || !slug) {
        alert("Debe seleccionar una lección para guardar la nota");
        return;
      }
      // Preparar payload según el formato que espera la API REST
      const notePayload = {
        note_title: noteData.title.trim(),
        note_content: noteData.content.trim(),
        note_tags: noteData.tags || [],
        source_type: "manual", // Siempre manual desde el modal
      };

      if (editingNote && editingNote.id && editingNote.id.trim() !== "") {
        // Editar nota existente
        const response = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes/${editingNote.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notePayload),
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Error desconocido" }));
          alert(
            `Error al actualizar la nota: ${errorData.error || "Error desconocido"}`
          );
          return;
        }

        // ⚡ OPTIMIZACIÓN: Actualizar estado local inmediatamente
        const updatedNote = await response.json();
        if (updatedNote && updatedNote.note_id) {
          addNoteToLocalState(updatedNote, currentLesson.lesson_id);

          // ⚡ OPTIMIZACIÓN: Actualizar estadísticas de manera optimizada
          await updateNotesStatsOptimized("update", currentLesson.lesson_id);

          // Cerrar modal solo después de que todo se haya guardado correctamente
          setIsNotesModalOpen(false);
          setEditingNote(null);
        } else {
          throw new Error(
            "La respuesta del servidor no contiene los datos esperados de la nota"
          );
        }
      } else {
        // Crear nueva nota
        const response = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notePayload),
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Error desconocido" }));
          const errorMessage =
            errorData.error || errorData.message || "Error desconocido";
          alert(`Error al guardar la nota: ${errorMessage}`);
          throw new Error(errorMessage);
        }

        // ⚡ OPTIMIZACIÓN: Actualizar estado local inmediatamente
        const newNote = await response.json();
        if (newNote && newNote.note_id) {
          addNoteToLocalState(newNote, currentLesson.lesson_id);

          // ⚡ OPTIMIZACIÓN: Actualizar estadísticas de manera optimizada
          await updateNotesStatsOptimized("create", currentLesson.lesson_id);

          // Cerrar modal solo después de que todo se haya guardado correctamente
          setIsNotesModalOpen(false);
          setEditingNote(null);
        } else {
          throw new Error(
            "La respuesta del servidor no contiene los datos esperados de la nota"
          );
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
    if (!confirm("¿Estás seguro de que quieres eliminar esta nota?")) return;

    try {
      if (!currentLesson?.lesson_id || !slug) {
        alert("No se puede eliminar la nota: lección no seleccionada");
        return;
      }

      // ⚡ OPTIMIZACIÓN: Eliminar del estado local inmediatamente (actualización optimista)
      removeNoteFromLocalState(noteId);

      // ⚡ OPTIMIZACIÓN: Actualizar estadísticas optimistamente
      await updateNotesStatsOptimized("delete", currentLesson.lesson_id);

      const response = await fetch(
        `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        // Si falla, recargar desde el servidor para revertir el cambio optimista
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);

        const errorData = await response
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        alert(
          `Error al eliminar la nota: ${errorData.error || "Error desconocido"}`
        );
      }
      // Si tiene éxito, el estado ya fue actualizado optimistamente
    } catch (error) {
      // console.error('Error al eliminar nota:', error);
      // En caso de error, recargar desde el servidor para revertir el cambio optimista
      if (currentLesson?.lesson_id && slug) {
        await loadLessonNotes(currentLesson.lesson_id, slug);
        await loadNotesStats(slug);
      }
      alert("Error al eliminar la nota. Por favor, intenta de nuevo.");
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
        const lessonId =
          currentLesson?.lesson_id || modules[0]?.lessons[0]?.lesson_id;
        // Pasar el idioma para obtener transcript y summary desde la tabla correcta
        const queryParams = new URLSearchParams();
        if (lessonId) {
          queryParams.append("lessonId", lessonId);
        }
        queryParams.append("language", selectedLang);
        const queryString = queryParams.toString();
        const fullQuery = queryString ? `?${queryString}` : "";

        const learnData = await dedupedFetch(
          `/api/courses/${slug}/learn-data${fullQuery}`
        );

        // Extraer datos del response unificado
        if (learnData.course) {
          setCourse(learnData.course);

          // ✅ Cargar metadatos del taller (módulos y lecciones completos) para LIA
          // Esto permite que LIA tenga acceso a TODOS los módulos y lecciones
          if (learnData.course.id || learnData.course.course_id) {
            const courseId = learnData.course.id || learnData.course.course_id;
            try {
              const metadataResponse = await fetch(
                `/api/workshops/${courseId}/metadata`
              );
              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json();
                if (metadataData.success && metadataData.metadata) {
                  // Construir el contexto con todos los metadatos
                  const workshopContext: CourseLessonContext = {
                    contextType: "workshop",
                    courseId: metadataData.metadata.workshopId,
                    courseSlug: slug,
                    courseTitle: metadataData.metadata.workshopTitle,
                    courseDescription:
                      metadataData.metadata.workshopDescription,
                    allModules: metadataData.metadata.modules.map((m: any) => ({
                      moduleId: m.moduleId,
                      moduleTitle: m.moduleTitle,
                      moduleDescription: m.moduleDescription,
                      moduleOrderIndex: m.moduleOrderIndex,
                      lessons: m.lessons.map((l: any) => ({
                        lessonId: l.lessonId,
                        lessonTitle: l.lessonTitle,
                        lessonDescription: l.lessonDescription,
                        lessonOrderIndex: l.lessonOrderIndex,
                        durationSeconds: l.durationSeconds,
                      })),
                    })),
                    userRole: user?.type_rol || undefined,
                  };
                  setWorkshopMetadata(workshopContext);
                }
              }
            } catch (error) {
              // Silenciar errores - no es crítico si no se pueden cargar los metadatos
              console.warn(
                "No se pudieron cargar metadatos del taller para LIA:",
                error
              );
            }
          }
        }

        if (learnData.modules) {
          // IMPORTANTE: Las traducciones ya se aplicaron en el servidor (endpoint learn-data)
          // Solo necesitamos usar los datos tal como vienen del servidor
          // El servidor ya aplicó traducciones usando ContentTranslationService
          console.log(
            "[learn/page] Módulos recibidos del servidor (ya traducidos):",
            learnData.modules.length
          );
          setModules(learnData.modules);

          // Calcular progreso
          const allLessons = learnData.modules.flatMap(
            (m: Module) => m.lessons
          );
          const completedLessons = allLessons.filter(
            (l: Lesson) => l.is_completed
          );
          const totalProgress =
            allLessons.length > 0
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
            } else {
              // Fallback: primera lección no completada o primera lección
              const nextIncomplete = allLessons.find(
                (l: Lesson) => !l.is_completed
              );
              setCurrentLesson(nextIncomplete || allLessons[0]);
            }
          } else if (allLessons.length > 0) {
            // Si no hay último video visto, cargar primera lección no completada o primera lección
            const nextIncomplete = allLessons.find(
              (l: Lesson) => !l.is_completed
            );
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
  }, [slug, i18n.language]);

  // ⚡ Cargar contexto adicional para LIA (transcript y summary) en background
  useEffect(() => {
    // Resetear estados al cambiar de lección
    setLiaTranscript(null);
    setLiaSummary(null);

    if (!currentLesson?.lesson_id || !slug) return;

    // Función para cargar datos
    const loadLiaContext = async () => {
      // Cargar transcript en background
      try {
        const tRes = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/transcript?language=${selectedLang}`
        );
        if (tRes.ok) {
          const tData = await tRes.json();
          if (tData.transcript_content)
            setLiaTranscript(tData.transcript_content);
        }
      } catch (error) {
        // Silently fail or log in dev
        if (process.env.NODE_ENV === "development")
          console.warn("Error loading transcript for LIA:", error);
      }

      // Cargar summary en background
      try {
        const sRes = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/summary?language=${selectedLang}`
        );
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.summary_content) setLiaSummary(sData.summary_content);
        }
      } catch (error) {
        // Silently fail
        if (process.env.NODE_ENV === "development")
          console.warn("Error loading summary for LIA:", error);
      }
    };

    // Pequeño delay para no competir con la carga inicial crítica
    const timer = setTimeout(loadLiaContext, 1000);
    return () => clearTimeout(timer);
  }, [currentLesson?.lesson_id, slug, selectedLang]);

  // 🚀 LAZY LOADING: Las notas se cargan SOLO cuando el usuario abre el panel de notas
  // (Eliminado useEffect que cargaba notas automáticamente al cambiar de lección)

  // ⚡ FIRE-AND-FORGET: Actualizar last_accessed_at en segundo plano (no bloquea UI)
  useEffect(() => {
    if (currentLesson && slug) {
      // Fire-and-forget: No esperar respuesta, no manejar errores
      fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => null); // Ignorar errores silenciosamente
    }
  }, [currentLesson?.lesson_id, slug]);

  // 🚀 LAZY LOADING: Cargar notas SOLO cuando el usuario expande el panel de notas
  useEffect(() => {
    if (!isNotesCollapsed && currentLesson && slug && savedNotes.length === 0) {
      // Solo cargar si el panel está expandido, hay lección actual y no hay notas cargadas
      loadLessonNotes(currentLesson.lesson_id, slug);
    }
  }, [isNotesCollapsed, currentLesson?.lesson_id, slug]);

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
      const completedLessons = allLessons.filter(
        (lesson) => lesson.is_completed
      );
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
        lessonsWithNotes: totalLessons > 0 ? `0/${totalLessons}` : "0/0",
      }));

      // Esta función ya no se usa frecuentemente, pero mantenemos la lógica por compatibilidad
      if (modulesResponse.length > 0 && modulesResponse[0].lessons.length > 0) {
        const nextIncomplete = allLessons.find(
          (lesson) => !lesson.is_completed
        );
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 🚀 FUNCIÓN OPTIMIZADA: Cargar actividades y materiales de una lección
  // Ahora usa el endpoint unificado /sidebar-data (3 requests → 1 request)
  const loadLessonActivitiesAndMaterials = async (lessonId: string) => {
    if (!slug) return;

    // Solo cargar si no están ya cargados
    if (
      lessonsActivities[lessonId] !== undefined &&
      lessonsMaterials[lessonId] !== undefined
    ) {
      return; // Ya están cargados
    }

    try {
      // ⚡ OPTIMIZACIÓN: Una sola petición en lugar de 3
      const response = await fetch(
        `/api/courses/${slug}/lessons/${lessonId}/sidebar-data`
      );

      if (response.ok) {
        const data = await response.json();

        // Procesar actividades
        setLessonsActivities((prev) => ({
          ...prev,
          [lessonId]: (data.activities || []).map((a: any) => ({
            activity_id: a.activity_id,
            activity_title: a.activity_title,
            activity_type: a.activity_type,
            is_required: a.is_required,
          })),
        }));

        // Procesar materiales
        setLessonsMaterials((prev) => ({
          ...prev,
          [lessonId]: (data.materials || []).map((m: any) => ({
            material_id: m.material_id,
            material_title: m.material_title,
            material_type: m.material_type,
            is_required: m.is_required || m.material_type === "quiz", // Los quizzes son requeridos por defecto
          })),
        }));

        // Procesar estado de quizzes
        setLessonsQuizStatus((prev) => ({
          ...prev,
          [lessonId]: data.quizStatus,
        }));
      } else {
        // Si falla, establecer como arrays vacíos para no intentar cargar de nuevo
        setLessonsActivities((prev) => ({
          ...prev,
          [lessonId]: [],
        }));
        setLessonsMaterials((prev) => ({
          ...prev,
          [lessonId]: [],
        }));
        setLessonsQuizStatus((prev) => ({
          ...prev,
          [lessonId]: null,
        }));
      }
    } catch (error) {
      // En caso de error, establecer como arrays vacíos
      setLessonsActivities((prev) => ({
        ...prev,
        [lessonId]: [],
      }));
      setLessonsMaterials((prev) => ({
        ...prev,
        [lessonId]: [],
      }));
      setLessonsQuizStatus((prev) => ({
        ...prev,
        [lessonId]: null,
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

    setExpandedLessons((prev) => {
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
    setExpandedModules((prev) => {
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
      const moduleWithCurrentLesson = modules.find((module) =>
        module.lessons.some(
          (lesson) => lesson.lesson_id === currentLesson.lesson_id
        )
      );

      if (moduleWithCurrentLesson) {
        setExpandedModules((prev) => {
          const newSet = new Set(prev);
          newSet.add(moduleWithCurrentLesson.module_id);
          return newSet;
        });
      }
    }
  }, [currentLesson, modules]);

  // 🚀 PRECARGA INTELIGENTE: Precargar actividades/materiales del módulo actual
  useEffect(() => {
    if (!currentLesson || !slug || modules.length === 0) return;

    // Encontrar el módulo de la lección actual
    const currentModule = modules.find((module) =>
      module.lessons.some(
        (lesson) => lesson.lesson_id === currentLesson.lesson_id
      )
    );

    if (!currentModule) return;

    // Precargar en segundo plano las lecciones del módulo actual (excepto la actual)
    const prefetchLessons = async () => {
      const lessonsToPreload = currentModule.lessons
        .filter((lesson) => lesson.lesson_id !== currentLesson.lesson_id)
        .filter((lesson) => {
          // Solo precargar si no está ya cargado
          return (
            lessonsActivities[lesson.lesson_id] === undefined ||
            lessonsMaterials[lesson.lesson_id] === undefined
          );
        });

      // Limitar a máximo 3 lecciones para no sobrecargar
      const limitedLessons = lessonsToPreload.slice(0, 3);

      // Precargar en paralelo pero sin esperar (fire and forget)
      limitedLessons.forEach((lesson) => {
        loadLessonActivitiesAndMaterials(lesson.lesson_id).catch(() => {
          // Ignorar errores en precarga
        });
      });
    };

    // Ejecutar precarga después de un pequeño delay para no interferir con la carga principal
    const timeoutId = setTimeout(prefetchLessons, 500);

    return () => clearTimeout(timeoutId);
  }, [currentLesson, modules, slug, lessonsActivities, lessonsMaterials]);

  // Función para encontrar todas las lecciones ordenadas en una lista plana
  const getAllLessonsOrdered = (): Array<{
    lesson: Lesson;
    module: Module;
  }> => {
    const allLessons: Array<{ lesson: Lesson; module: Module }> = [];

    // Ordenar módulos por module_order_index
    const sortedModules = [...modules].sort(
      (a, b) => a.module_order_index - b.module_order_index
    );

    sortedModules.forEach((module) => {
      // Ordenar lecciones por lesson_order_index dentro de cada módulo
      const sortedLessons = [...module.lessons].sort(
        (a, b) => a.lesson_order_index - b.lesson_order_index
      );
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

    if (currentIndex === -1 || currentIndex === allLessons.length - 1)
      return null;

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
  const checkQuizStatus = async (
    lessonId: string,
    signal?: AbortSignal
  ): Promise<{ canComplete: boolean; error?: string; details?: any }> => {
    try {
      const response = await fetch(
        `/api/courses/${params.slug}/lessons/${lessonId}/quiz/status`,
        {
          signal, // Pasar el signal para poder cancelar la petición
        }
      );

      // Si la petición fue cancelada, retornar sin error
      if (signal?.aborted) {
        return { canComplete: true };
      }

      if (!response.ok) {
        // Si hay error HTTP, permitir completar (retrocompatibilidad)
        // No loguear errores 404/401 ya que pueden ser normales
        if (response.status !== 404 && response.status !== 401) {
          console.warn(
            "Error verificando estado de quizzes:",
            response.status,
            response.statusText
          );
        }
        return { canComplete: true };
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
        error: "Hace falta realizar actividad",
        details: {
          totalRequired: data.totalRequiredQuizzes,
          passed: data.passedQuizzes,
          message: `Debes completar y aprobar todos los quizzes obligatorios (${data.passedQuizzes}/${data.totalRequiredQuizzes} completados)`,
        },
      };
    } catch (error: any) {
      // Ignorar errores de cancelación (AbortError)
      if (error?.name === "AbortError" || signal?.aborted) {
        return { canComplete: true };
      }

      // Ignorar errores de red (Failed to fetch) - pueden ocurrir si la página se está desmontando
      // o si hay problemas de conectividad temporales
      if (
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("NetworkError")
      ) {
        // No loguear en producción para evitar ruido
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Error de red verificando estado de quizzes (ignorado):",
            error.message
          );
        }
        return { canComplete: true }; // En caso de error de red, permitir completar
      }

      // Para otros errores, loguear pero permitir completar
      if (process.env.NODE_ENV === "development") {
        console.error("Error verificando estado de quizzes:", error);
      }
      return { canComplete: true }; // En caso de error, permitir completar
    }
  };

  // ⚡ OPTIMIZADO: Marcar lección como completada con validaciones en paralelo
  const markLessonAsCompleted = async (
    lessonId: string,
    signal?: AbortSignal
  ): Promise<boolean> => {
    if (!canCompleteLesson(lessonId)) {
      return false;
    }

    // ⚡ OPTIMIZACIÓN: Actualizar estado local INMEDIATAMENTE (optimistic update)
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

    if (currentLesson?.lesson_id === lessonId) {
      setCurrentLesson((prev) =>
        prev ? { ...prev, is_completed: true } : null
      );
    }

    // 🚀 PARALLELIZAR: Verificar quizzes Y guardar en BD al mismo tiempo
    try {
      const [quizStatus, saveResponse] = await Promise.all([
        checkQuizStatus(lessonId, signal),
        fetch(`/api/courses/${slug}/lessons/${lessonId}/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal, // Pasar el signal para poder cancelar
        }).catch((fetchError: any) => {
          // Si el fetch falla (red, cancelación, etc.), retornar una respuesta simulada
          // que permita continuar sin errores
          if (fetchError?.name === "AbortError" || signal?.aborted) {
            // Crear una respuesta simulada para cancelación
            return new Response(null, { status: 200, statusText: "Cancelled" });
          }
          // Para otros errores de red, crear una respuesta simulada
          // El estado local ya se actualizó, así que permitir continuar
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Error de red guardando progreso (ignorado):",
              fetchError.message
            );
          }
          return new Response(null, {
            status: 200,
            statusText: "Network Error (ignored)",
          });
        }),
      ]);

      // Si la petición fue cancelada, retornar true (el estado local ya se actualizó)
      if (signal?.aborted) {
        return true;
      }

      // Verificar si falló validación de quizzes
      if (!quizStatus.canComplete) {
        // REVERTIR estado local
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
          setCurrentLesson((prev) =>
            prev ? { ...prev, is_completed: false } : null
          );
        }

        // Mostrar modal de validación
        setValidationModal({
          isOpen: true,
          title: "Hace falta realizar actividad",
          message:
            quizStatus.details?.message ||
            quizStatus.error ||
            "Debes completar y aprobar todos los quizzes obligatorios para continuar.",
          details: quizStatus.details
            ? `Completados: ${quizStatus.details.passed} de ${quizStatus.details.totalRequired}`
            : undefined,
          type: "activity",
          lessonId: lessonId,
        });
        return false;
      }

      // Verificar si guardado en BD falló
      const response = saveResponse;

      // Si la respuesta no es OK, puede ser un error o una cancelación
      if (!response.ok) {
        // Si es un error 404/401, puede ser normal (no inscrito, etc.)
        // Si es otro error, loguear pero permitir continuar
        if (
          response.status !== 404 &&
          response.status !== 401 &&
          process.env.NODE_ENV === "development"
        ) {
          console.warn(
            "Error guardando progreso de lección:",
            response.status,
            response.statusText
          );
        }
        // Retornar true porque el estado local ya se actualizó
        return true;
      }

      // Intentar parsear la respuesta primero (puede ser éxito o error)
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // Si no es JSON válido, manejar como éxito (el estado local ya se actualizó)
        // No loguear en producción para evitar ruido
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Respuesta no es JSON válido - Status:",
            response.status
          );
        }
        // Retornar true porque el estado local se actualizó
        return true;
      }

      if (!response.ok) {
        // Si el error es que la lección anterior no está completada, revertir el estado local
        if (responseData?.code === "PREVIOUS_LESSON_NOT_COMPLETED") {
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
            const completedLessons = allLessons.filter(
              (l: Lesson) => l.is_completed
            );
            const totalProgress =
              allLessons.length > 0
                ? Math.round(
                    (completedLessons.length / allLessons.length) * 100
                  )
                : 0;

            setCourseProgress(totalProgress);
            return updatedModules;
          });

          if (currentLesson?.lesson_id === lessonId) {
            setCurrentLesson((prev) =>
              prev ? { ...prev, is_completed: false } : null
            );
          }

          // console.error('Error del servidor:', responseData?.error || responseData);
          return false;
        }

        // Si el error es que falta realizar actividad (quiz obligatorio)
        if (responseData?.code === "REQUIRED_QUIZ_NOT_PASSED") {
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
            setCurrentLesson((prev) =>
              prev ? { ...prev, is_completed: false } : null
            );
          }

          // Mostrar modal de validación según el tipo de error
          if (responseData?.code === "REQUIRED_QUIZ_NOT_PASSED") {
            setValidationModal({
              isOpen: true,
              title: "Hace falta realizar actividad",
              message:
                responseData?.details?.message ||
                responseData?.error ||
                "Debes completar y aprobar todos los quizzes obligatorios para continuar.",
              details: responseData?.details
                ? `Completados: ${responseData.details.passed} de ${responseData.details.totalRequired}`
                : undefined,
              type: "activity",
              lessonId: lessonId, // Guardar el ID de la lección que se intentó completar
            });
          } else {
            setValidationModal({
              isOpen: true,
              title: "No se puede completar",
              message:
                responseData?.details?.message ||
                responseData?.error ||
                "No se puede completar la lección en este momento.",
              type: "activity",
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
    } catch (error: any) {
      // Si el error es de cancelación, retornar true (el estado local ya se actualizó)
      if (error?.name === "AbortError" || signal?.aborted) {
        return true;
      }

      // Para errores de red, también permitir continuar
      if (
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("NetworkError")
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Error de red marcando lección como completada (ignorado):",
            error.message
          );
        }
        // El estado local ya se actualizó, así que permitir continuar
        return true;
      }

      // Para otros errores, loguear pero permitir continuar
      if (process.env.NODE_ENV === "development") {
        console.warn("Error al guardar progreso en BD (ignorado):", error);
      }
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
      setActiveTab("video");
      // Hacer scroll hacia arriba
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        setActiveTab("video");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // Si no se pudo completar, el modal ya se mostró y no cambiamos de lección
    }
  };

  const tabs = [
    { id: "video" as const, label: t("tabs.video"), icon: Play },
    {
      id: "transcript" as const,
      label: t("tabs.transcript"),
      icon: ScrollText,
    },
    { id: "summary" as const, label: t("tabs.summary"), icon: FileText },
    { id: "activities" as const, label: t("tabs.activities"), icon: Activity },
    {
      id: "questions" as const,
      label: t("tabs.questions"),
      icon: MessageCircle,
    },
  ];

  // Mostrar loading mientras i18n no esté listo o mientras se cargan los datos
  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin mx-auto mb-4" />
          <p
            className="text-[#0A2540] dark:text-white text-lg"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {mounted && ready ? t("loading.general") : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-[#0A2540] dark:text-white mb-4"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            {t("errors.courseNotFound")}
          </h1>
          <p
            className="text-[#6C757D] dark:text-white/80 mb-8"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {t("errors.courseNotFoundMessage")}
          </p>
          <button
            onClick={() => router.push("/my-courses")}
            className="px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-lg transition-colors"
          >
            {t("navigation.backToCourses")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorkshopLearningProvider
      workshopId={course?.id || course?.course_id || slug}
      activityId={currentLesson?.lesson_id || "no-lesson"}
      enabled={!!course && !!currentLesson}
      checkInterval={15000}
      assistantPosition="bottom-right"
      assistantCompact={false}
      onDifficultyDetected={(analysis) => {}}
      onHelpAccepted={async (analysis) => {
        // Abrir el panel de LIA (panel derecho)
        openLia();

        // Generar mensaje personalizado basado en los patrones detectados
        const generatePersonalizedMessage = (patterns: any[]) => {
          // Priorizar patrones por severidad
          const highSeverityPatterns = patterns.filter(
            (p) => p.severity === "high"
          );
          const mediumSeverityPatterns = patterns.filter(
            (p) => p.severity === "medium"
          );

          // Usar el patrón de mayor severidad primero
          const primaryPattern =
            highSeverityPatterns[0] || mediumSeverityPatterns[0] || patterns[0];

          if (!primaryPattern) {
            return "Necesito ayuda con esta lección";
          }

          // Mensajes específicos por tipo de patrón
          const messageMap: Record<string, string> = {
            inactivity:
              "Llevo varios minutos sin poder avanzar en esta lección",
            excessive_scroll:
              "Estoy buscando información en la lección pero no encuentro lo que necesito",
            failed_attempts:
              "He intentado completar la actividad varias veces pero no lo logro",
            frequent_deletion:
              "Estoy teniendo problemas para escribir la respuesta correcta",
            repetitive_cycles:
              "Estoy confundido y no sé cómo continuar con esta lección",
            erroneous_clicks:
              "He intentado varias opciones pero no consigo avanzar",
            back_navigation:
              "Necesito revisar contenido anterior porque no entiendo esta parte",
          };

          // Si hay múltiples patrones de alta severidad, combinarlos
          if (highSeverityPatterns.length > 1) {
            const mainIssue =
              messageMap[primaryPattern.type] ||
              "Estoy teniendo dificultades con esta lección";
            return `${mainIssue} y estoy un poco bloqueado`;
          }

          return (
            messageMap[primaryPattern.type] || "Necesito ayuda con esta lección"
          );
        };

        // Construir mensaje visible personalizado para el usuario
        const visibleUserMessage = generatePersonalizedMessage(
          analysis.patterns
        );

        // 🎯 ANÁLISIS PROFUNDO DEL COMPORTAMIENTO DEL USUARIO
        const behaviorAnalysis = analyzeUserBehavior();

        // Obtener información sobre actividades pendientes
        const currentActivities = currentLesson
          ? lessonsActivities[currentLesson.lesson_id] || []
          : [];
        const requiredActivities = currentActivities.filter(
          (a) => a.is_required
        );
        const pendingRequired = requiredActivities.filter(
          (a) => !a.is_completed
        );
        const completedActivities = currentActivities.filter(
          (a) => a.is_completed
        );

        // 🎯 ANÁLISIS INTELIGENTE: Detectar la actividad actual en la que está trabajando
        // Basado en el tab activo y el scroll/interacciones recientes
        let currentActivityFocus = null;
        if (activeTab === "activities" && pendingRequired.length > 0) {
          // Si está en la pestaña de actividades y hay pendientes, asumir que está en la primera pendiente
          currentActivityFocus = pendingRequired[0];
        } else if (pendingRequired.length > 0) {
          // Si no está en actividades pero hay pendientes, mencionar que tiene actividades sin completar
          currentActivityFocus = null;
        }

        // 🎯 Detectar patrones temporales y de progreso
        const totalLessonsInCourse = modules.reduce(
          (total, module) => total + module.lessons.length,
          0
        );
        const currentLessonIndex = getAllLessonsOrdered().findIndex(
          (item) => item.lesson.lesson_id === currentLesson?.lesson_id
        );
        const progressPercentage =
          totalLessonsInCourse > 0
            ? Math.round(
                ((currentLessonIndex + 1) / totalLessonsInCourse) * 100
              )
            : 0;

        // Construir contexto enriquecido de la lección con información de la dificultad detectada
        // ✅ Si tenemos metadatos del taller, usarlos como base (incluye allModules)
        const baseContext = workshopMetadata
          ? {
              ...workshopMetadata,
              moduleTitle: modules.find((m) =>
                m.lessons.some((l) => l.lesson_id === currentLesson.lesson_id)
              )?.module_title,
              lessonTitle: currentLesson.lesson_title,
              lessonDescription: currentLesson.lesson_description,
              durationSeconds: currentLesson.duration_seconds,
            }
          : currentLesson && course
            ? {
                contextType: "course" as const,
                courseId: course.id || course.course_id || undefined,
                courseSlug: slug || undefined,
                courseTitle: course.title || course.course_title,
                courseDescription:
                  course.description || course.course_description,
                moduleTitle: modules.find((m) =>
                  m.lessons.some((l) => l.lesson_id === currentLesson.lesson_id)
                )?.module_title,
                lessonTitle: currentLesson.lesson_title,
                lessonDescription: currentLesson.lesson_description,
                durationSeconds: currentLesson.duration_seconds,
              }
            : undefined;

        const enrichedLessonContext = baseContext
          ? {
              ...baseContext,
              userRole: user?.type_rol || undefined,
              // 🎯 INFORMACIÓN DETALLADA DE ACTIVIDADES
              activitiesContext: {
                totalActivities: currentActivities.length,
                requiredActivities: requiredActivities.length,
                completedActivities: completedActivities.length,
                pendingRequiredCount: pendingRequired.length,
                pendingRequiredTitles: pendingRequired
                  .map((a) => a.activity_title)
                  .join(", "),
                activityTypes: currentActivities.map((a) => ({
                  title: a.activity_title,
                  type: a.activity_type,
                  isRequired: a.is_required,
                  isCompleted: a.is_completed,
                })),
                // 🎯 NUEVO: Actividad actual en foco
                currentActivityFocus: currentActivityFocus
                  ? {
                      title: currentActivityFocus.activity_title,
                      type: currentActivityFocus.activity_type,
                      isRequired: currentActivityFocus.is_required,
                      description:
                        currentActivityFocus.activity_description ||
                        "Sin descripción",
                    }
                  : null,
              },
              // 🎯 ANÁLISIS DE COMPORTAMIENTO DEL USUARIO
              userBehaviorContext: behaviorAnalysis,
              // 🎯 NUEVO: Contexto de progreso del usuario
              learningProgressContext: {
                currentLessonNumber: currentLessonIndex + 1,
                totalLessons: totalLessonsInCourse,
                progressPercentage: progressPercentage,
                currentTab: activeTab, // video, transcript, summary, activities
                timeInCurrentLesson: currentLesson?.duration_seconds
                  ? `${Math.round(currentLesson.duration_seconds / 60)} minutos`
                  : "Desconocido",
              },
              // Agregar información de la dificultad detectada al contexto
              difficultyDetected: {
                patterns: analysis.patterns.map((p) => ({
                  type: p.type,
                  severity: p.severity,
                  description: (() => {
                    switch (p.type) {
                      case "inactivity":
                        return `Ha estado ${p.metadata?.inactivityDuration ? Math.floor(p.metadata.inactivityDuration / 60000) : "varios"} minutos sin avanzar`;
                      case "excessive_scroll":
                        return "Ha estado haciendo scroll repetidamente buscando información";
                      case "failed_attempts":
                        return "Ha intentado completar la actividad varias veces sin éxito";
                      case "frequent_deletion":
                        return "Ha estado escribiendo y borrando varias veces";
                      case "repetitive_cycles":
                        return "Ha estado yendo y viniendo entre diferentes secciones";
                      case "erroneous_clicks":
                        return "Ha hecho varios clicks sin resultado";
                      default:
                        return "Está teniendo dificultades para avanzar";
                    }
                  })(),
                })),
                overallScore: analysis.overallScore,
                shouldIntervene: analysis.shouldIntervene,
                // 🎯 NUEVO: Sugerencia de tipo de ayuda basada en patrones
                suggestedHelpType: (() => {
                  const primaryPattern = analysis.patterns[0];
                  if (!primaryPattern) return "general";

                  switch (primaryPattern.type) {
                    case "inactivity":
                      return activeTab === "activities"
                        ? "activity_guidance"
                        : "content_explanation";
                    case "excessive_scroll":
                      return "content_navigation";
                    case "failed_attempts":
                      return "activity_hints";
                    case "frequent_deletion":
                      return "activity_structure";
                    case "repetitive_cycles":
                      return "concept_clarification";
                    case "erroneous_clicks":
                      return "interface_guidance";
                    default:
                      return "general";
                  }
                })(),
              },
            }
          : getLessonContext();

        try {
          // Enviar mensaje con contexto enriquecido en segundo plano
          // ✅ isSystemMessage=true: El mensaje NO se mostrará en el chat como mensaje del usuario
          // pero SÍ se enviará al API para que LIA responda con ayuda contextual
          // ✅ Si es un taller, enviar como workshopContext
          if (
            workshopMetadata &&
            enrichedLessonContext?.contextType === "workshop"
          ) {
            await sendLiaMessage(
              visibleUserMessage,
              undefined,
              enrichedLessonContext as CourseLessonContext,
              true
            );
          } else {
            await sendLiaMessage(
              visibleUserMessage,
              enrichedLessonContext as CourseLessonContext,
              undefined,
              true
            );
          }
        } catch (error) {
          console.error("❌ Error enviando mensaje proactivo a LIA:", error);
        }
      }}
    >
      <div className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden">
        {/* Header superior con nueva estructura - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-3 md:px-4 py-1.5 md:py-2 shrink-0 relative z-40"
        >
          <div className="flex items-center justify-between w-full gap-2">
            {/* Sección izquierda: Botón regresar | Nombre del taller */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              {/* Botón de regreso */}
              <button
                onClick={() => router.back()}
                className="p-1.5 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors shrink-0"
                aria-label={t("header.backButton")}
                title={t("header.backButton")}
              >
                <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
              </button>

              {/* Nombre del taller */}
              <div className="min-w-0 flex-1">
                <h1
                  className="text-sm md:text-base font-bold text-[#0A2540] dark:text-white truncate"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  {course.title || course.course_title}
                </h1>
                <p
                  className="hidden md:block text-xs text-[#6C757D] dark:text-white/60"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                >
                  {t("header.workshop")}
                </p>
              </div>
            </div>

            {/* Sección central: Progreso - Solo porcentaje compacto en móviles */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Barra de progreso - Oculto en móviles */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-32 lg:w-40 h-1.5 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${courseProgress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#00D4B3] rounded-full shadow-lg"
                  />
                </div>
              </div>
              {/* Porcentaje compacto - Visible siempre */}
              <span
                className="text-xs text-[#0A2540] dark:text-white font-medium bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shrink-0"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
              >
                {courseProgress}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Contenido principal - 3 paneles - Responsive */}
        <div
          ref={swipeRef}
          className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0F1419] relative z-10"
          style={{
            marginRight: isLiaOpen && !isMobile ? "420px" : 0,
            transition: "margin-right 0.3s ease-in-out",
          }}
        >
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
                  id="tour-course-sidebar"
                  initial={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
                  animate={isMobile ? { x: 0 } : { width: 320, opacity: 1 }}
                  exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`
                  ${
                    isMobile
                      ? "fixed inset-y-0 left-0 w-full max-w-sm z-50 md:relative md:inset-auto md:w-auto md:max-w-none"
                      : "relative h-full"
                  }
                  bg-white dark:bg-[#0F1419] flex flex-col overflow-hidden border-r border-gray-200 dark:border-white/5
                  ${isMobile ? "my-0 ml-0" : "h-full"}
                `}
                >
                  {/* Header con línea separadora alineada con panel central */}
                  <div className="bg-white dark:bg-[#0F1419] border-b border-gray-200 dark:border-white/5 flex items-center justify-between p-4 shrink-0 h-[60px]">
                    <h2
                      className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <BookOpen className="w-4 h-4 text-[#00D4B3]" />
                      TEMARIO
                    </h2>
                    <button
                      onClick={() => setIsLeftPanelOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      {isMobile ? (
                        <X className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
                      )}
                    </button>
                  </div>

                  {/* Contenido con scroll */}
                  <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
                    {/* Sección de Material del Curso */}
                    <div className="mb-8">
                      {/* Header de Contenido con botón de colapsar */}
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest flex items-center gap-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <Layers className="w-3 h-3 text-[#00D4B3]" />
                          {t("leftPanel.content")}
                        </h3>
                        <button
                          onClick={() =>
                            setIsMaterialCollapsed(!isMaterialCollapsed)
                          }
                          className="p-1.5 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors"
                          title={
                            isMaterialCollapsed
                              ? t("leftPanel.expandContent")
                              : t("leftPanel.collapseContent")
                          }
                        >
                          {isMaterialCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
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
                            {[...modules]
                              .sort((a, b) => {
                                // Función para extraer número del módulo del título
                                const extractModuleNumber = (
                                  title: string
                                ): number => {
                                  const match = title.match(/Módulo\s*(\d+)/i);
                                  return match ? parseInt(match[1], 10) : 999;
                                };

                                const aNumber = extractModuleNumber(
                                  a.module_title
                                );
                                const bNumber = extractModuleNumber(
                                  b.module_title
                                );

                                // Si ambos tienen número en el título, priorizar ese número
                                if (aNumber !== 999 && bNumber !== 999) {
                                  return aNumber - bNumber;
                                }

                                // Si solo uno tiene número, priorizarlo
                                if (aNumber !== 999 && bNumber === 999)
                                  return -1;
                                if (aNumber === 999 && bNumber !== 999)
                                  return 1;

                                // Si ninguno tiene número o ambos tienen, usar module_order_index
                                const orderDiff =
                                  (a.module_order_index || 0) -
                                  (b.module_order_index || 0);
                                if (orderDiff !== 0) return orderDiff;

                                // Último recurso: ordenar por título alfabéticamente
                                return a.module_title.localeCompare(
                                  b.module_title
                                );
                              })
                              .map((module, moduleIndex) => {
                                const isModuleExpanded = expandedModules.has(
                                  module.module_id
                                );

                                // Ordenar lecciones dentro del módulo por lesson_order_index
                                const sortedLessons = [
                                  ...(module.lessons || []),
                                ].sort(
                                  (a, b) =>
                                    (a.lesson_order_index || 0) -
                                    (b.lesson_order_index || 0)
                                );

                                // Calcular estadísticas del módulo
                                const completedLessons = sortedLessons.filter(
                                  (l) => l.is_completed
                                ).length;
                                const totalLessons = sortedLessons.length;
                                const completionPercentage =
                                  totalLessons > 0
                                    ? Math.round(
                                        (completedLessons / totalLessons) * 100
                                      )
                                    : 0;

                                return (
                                  <div key={module.module_id} className="mb-6">
                                    <div className="flex items-start justify-between mb-2 mt-4 px-2 group-hover:bg-white/[0.02] rounded-lg transition-colors p-2">
                                      <div className="flex flex-col gap-1 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-[#00D4B3] uppercase tracking-widest">
                                            Módulo {moduleIndex + 1}
                                          </span>
                                          <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/10" />
                                        </div>
                                        <h3
                                          className="font-semibold text-gray-900 dark:text-white/90 text-sm leading-tight pr-4"
                                          style={{
                                            fontFamily: "Inter, sans-serif",
                                          }}
                                        >
                                          {module.module_title}
                                        </h3>
                                      </div>
                                      <button
                                        onClick={() =>
                                          toggleModuleExpand(module.module_id)
                                        }
                                        className="p-2 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-md transition-colors flex-shrink-0"
                                        title={
                                          isModuleExpanded
                                            ? t("leftPanel.collapseModule")
                                            : t("leftPanel.expandModule")
                                        }
                                      >
                                        {isModuleExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
                                        )}
                                      </button>
                                    </div>

                                    {/* Contenido del módulo - Colapsable */}
                                    <AnimatePresence>
                                      {isModuleExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          {/* Estadísticas del módulo mejoradas */}
                                          <div className="flex gap-3 mb-4">
                                            <span
                                              className="px-3 py-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] dark:text-[#10B981] text-xs rounded-full border border-[#10B981]/30 font-medium"
                                              style={{
                                                fontFamily: "Inter, sans-serif",
                                                fontWeight: 500,
                                              }}
                                            >
                                              {completedLessons}/{totalLessons}{" "}
                                              {t("leftPanel.completed")}
                                            </span>
                                            <span className="px-3 py-1 bg-[#00D4B3]/20 text-[#00D4B3] text-xs rounded-full border border-[#00D4B3]/30 font-medium">
                                              {completionPercentage}%{" "}
                                              {t(
                                                "leftPanel.completedPercentage"
                                              )}
                                            </span>
                                          </div>

                                          {/* Lista de lecciones mejorada - Estilo Minimalista */}
                                          <div className="space-y-2">
                                            {sortedLessons.length > 0 ? (
                                              sortedLessons.map(
                                                (lesson, lessonIndex) => {
                                                  const isActive =
                                                    currentLesson?.lesson_id ===
                                                    lesson.lesson_id;
                                                  const isCompleted =
                                                    lesson.is_completed;
                                                  const isExpanded =
                                                    expandedLessons.has(
                                                      lesson.lesson_id
                                                    );
                                                  const activities =
                                                    lessonsActivities[
                                                      lesson.lesson_id
                                                    ] || [];
                                                  const materials =
                                                    lessonsMaterials[
                                                      lesson.lesson_id
                                                    ] || [];
                                                  const hasContent =
                                                    activities.length > 0 ||
                                                    materials.length > 0;
                                                  const isContentLoaded =
                                                    lessonsActivities[
                                                      lesson.lesson_id
                                                    ] !== undefined &&
                                                    lessonsMaterials[
                                                      lesson.lesson_id
                                                    ] !== undefined;

                                                  return (
                                                    <div
                                                      key={lesson.lesson_id}
                                                      className="w-full"
                                                    >
                                                      <div className="flex items-start gap-2">
                                                        <motion.button
                                                          whileHover={{ x: 4 }}
                                                          onClick={() =>
                                                            handleLessonChange(
                                                              lesson
                                                            )
                                                          }
                                                          className={`flex-1 flex items-center gap-3 py-2 px-3 transition-all duration-200 group relative overflow-hidden rounded-r-lg ${
                                                            isActive
                                                              ? "bg-[#00D4B3]/10 border-l-2 border-[#00D4B3]"
                                                              : "border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                                                          }`}
                                                        >
                                                          <div
                                                            className={`flex items-center justify-center flex-shrink-0 ${
                                                              isCompleted
                                                                ? "text-[#00D4B3]"
                                                                : isActive
                                                                  ? "text-[#00D4B3]"
                                                                  : "text-gray-400 dark:text-white/20 group-hover:text-gray-600 dark:group-hover:text-white/40"
                                                            }`}
                                                          >
                                                            {isCompleted ? (
                                                              <CheckCircle2 className="w-4 h-4" />
                                                            ) : (
                                                              <div
                                                                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#00D4B3] animate-pulse" : "bg-current"}`}
                                                              />
                                                            )}
                                                          </div>

                                                          <div className="flex-1 text-left min-w-0 z-10">
                                                            <p
                                                              className={`text-sm leading-snug line-clamp-2 ${isActive ? "text-[#0A2540] dark:text-white font-medium" : "text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white/90 font-normal"}`}
                                                              style={{
                                                                fontFamily:
                                                                  "Inter, sans-serif",
                                                              }}
                                                            >
                                                              {
                                                                lesson.lesson_title
                                                              }
                                                            </p>
                                                            {isActive && (
                                                              <span className="text-[10px] text-[#00D4B3]/80 mt-1 block font-medium">
                                                                En curso •{" "}
                                                                {formatDuration(
                                                                  lesson.duration_seconds
                                                                )}
                                                              </span>
                                                            )}
                                                          </div>
                                                        </motion.button>

                                                        {/* Botón para expandir/colapsar actividades y materiales */}
                                                        <button
                                                          onClick={async (
                                                            e
                                                          ) => {
                                                            e.stopPropagation();
                                                            // Si no se han cargado las actividades y materiales, cargarlas primero
                                                            if (
                                                              !isContentLoaded
                                                            ) {
                                                              await loadLessonActivitiesAndMaterials(
                                                                lesson.lesson_id
                                                              );
                                                            }
                                                            toggleLessonExpand(
                                                              lesson.lesson_id
                                                            );
                                                          }}
                                                          className="p-2 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-md transition-colors flex-shrink-0"
                                                          title={
                                                            isExpanded
                                                              ? t(
                                                                  "activities.collapse"
                                                                )
                                                              : t(
                                                                  "activities.expandCollapse"
                                                                )
                                                          }
                                                        >
                                                          {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
                                                          ) : (
                                                            <ChevronDown className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
                                                          )}
                                                        </button>
                                                      </div>

                                                      {/* Actividades y Materiales desplegables */}
                                                      <AnimatePresence>
                                                        {/* 🚀 SKELETON LOADING - Mientras carga el contenido */}
                                                        {isExpanded &&
                                                          !isContentLoaded && (
                                                            <motion.div
                                                              initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                              }}
                                                              animate={{
                                                                height: "auto",
                                                                opacity: 1,
                                                              }}
                                                              exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                              }}
                                                              transition={{
                                                                duration: 0.2,
                                                              }}
                                                              className="overflow-hidden"
                                                            >
                                                              <div className="ml-9 mt-3 space-y-2.5 pl-4 border-l-2 border-[#00D4B3]/30 dark:border-[#00D4B3]/40">
                                                                {/* Skeleton items */}
                                                                {[1, 2].map(
                                                                  (i) => (
                                                                    <div
                                                                      key={i}
                                                                      className="bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl p-3 animate-pulse"
                                                                    >
                                                                      <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-lg flex-shrink-0"></div>
                                                                        <div className="flex-1 space-y-2">
                                                                          <div className="h-4 bg-[#E9ECEF] dark:bg-[#1E2329] rounded w-3/4"></div>
                                                                          <div className="h-3 bg-[#E9ECEF] dark:bg-[#1E2329] rounded w-1/4"></div>
                                                                        </div>
                                                                      </div>
                                                                    </div>
                                                                  )
                                                                )}
                                                              </div>
                                                            </motion.div>
                                                          )}

                                                        {/* Contenido cargado */}
                                                        {isExpanded &&
                                                          isContentLoaded &&
                                                          hasContent && (
                                                            <motion.div
                                                              initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                              }}
                                                              animate={{
                                                                height: "auto",
                                                                opacity: 1,
                                                              }}
                                                              exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                              }}
                                                              transition={{
                                                                duration: 0.2,
                                                              }}
                                                              className="overflow-hidden"
                                                            >
                                                              <div className="ml-9 mt-3 space-y-2.5 pl-4 border-l-2 border-[#00D4B3]/30 dark:border-[#00D4B3]/40">
                                                                {/* Actividades */}
                                                                {activities.length >
                                                                  0 && (
                                                                  <div className="space-y-2">
                                                                    {activities.map(
                                                                      (
                                                                        activity
                                                                      ) => {
                                                                        const isQuiz =
                                                                          activity.activity_type ===
                                                                          "quiz";
                                                                        const isRequired =
                                                                          activity.is_required;

                                                                        return (
                                                                          <div
                                                                            key={
                                                                              activity.activity_id
                                                                            }
                                                                            className="group relative hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl p-3 transition-all duration-200"
                                                                          >
                                                                            <div className="flex items-start gap-4">
                                                                              <div
                                                                                className={`w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#0F1419] border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300 dark:group-hover:border-white/20 transition-colors shadow-sm`}
                                                                              >
                                                                                {isQuiz ? (
                                                                                  <FileText className="w-5 h-5 text-[#00D4B3]" />
                                                                                ) : (
                                                                                  <Activity className="w-5 h-5 text-[#00D4B3]" />
                                                                                )}
                                                                              </div>

                                                                              {/* Contenido principal */}
                                                                              <div className="flex-1 min-w-0 pt-0.5">
                                                                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 leading-tight">
                                                                                  {
                                                                                    activity.activity_title
                                                                                  }
                                                                                </p>

                                                                                {/* Badges estilo Pill */}
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                  {/* Badge de tipo */}
                                                                                  <span className="px-3 py-0.5 text-[10px] uppercase tracking-wide rounded-full font-bold bg-gray-50 dark:bg-[#0F1419] border border-gray-200 dark:border-white/10 text-[#00D4B3]">
                                                                                    {
                                                                                      activity.activity_type
                                                                                    }
                                                                                  </span>

                                                                                  {/* Badge Requerida */}
                                                                                  {isRequired && (
                                                                                    <span className="px-3 py-0.5 text-[10px] uppercase tracking-wide rounded-full font-bold bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400">
                                                                                      {t(
                                                                                        "activities.required"
                                                                                      )}
                                                                                    </span>
                                                                                  )}
                                                                                </div>
                                                                              </div>
                                                                            </div>

                                                                            {/* Indicador de estado para quizzes (si está disponible) */}
                                                                            {isQuiz &&
                                                                              lessonsQuizStatus[
                                                                                lesson
                                                                                  .lesson_id
                                                                              ] &&
                                                                              lessonsQuizStatus[
                                                                                lesson
                                                                                  .lesson_id
                                                                              ]
                                                                                ?.quizzes &&
                                                                              (() => {
                                                                                const quizInfo =
                                                                                  lessonsQuizStatus[
                                                                                    lesson
                                                                                      .lesson_id
                                                                                  ]!.quizzes.find(
                                                                                    (
                                                                                      q: any
                                                                                    ) =>
                                                                                      q.id ===
                                                                                        activity.activity_id &&
                                                                                      q.type ===
                                                                                        "activity"
                                                                                  );
                                                                                if (
                                                                                  quizInfo
                                                                                ) {
                                                                                  return (
                                                                                    <div className="mt-2 pt-2 border-t border-[#E9ECEF]/50 dark:border-[#6C757D]/30">
                                                                                      {quizInfo.isPassed ? (
                                                                                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                                                                          <CheckCircle className="w-3.5 h-3.5" />
                                                                                          <span className="font-medium">
                                                                                            Aprobado
                                                                                            (
                                                                                            {
                                                                                              quizInfo.percentage
                                                                                            }
                                                                                            %)
                                                                                          </span>
                                                                                        </div>
                                                                                      ) : quizInfo.isCompleted ? (
                                                                                        <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                                                                                          <X className="w-3.5 h-3.5" />
                                                                                          <span className="font-medium">
                                                                                            Reprobado
                                                                                            (
                                                                                            {
                                                                                              quizInfo.percentage
                                                                                            }
                                                                                            %)
                                                                                          </span>
                                                                                        </div>
                                                                                      ) : (
                                                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                                                          <Clock className="w-3.5 h-3.5" />
                                                                                          <span>
                                                                                            Pendiente
                                                                                          </span>
                                                                                        </div>
                                                                                      )}
                                                                                    </div>
                                                                                  );
                                                                                }
                                                                                return null;
                                                                              })()}
                                                                          </div>
                                                                        );
                                                                      }
                                                                    )}
                                                                  </div>
                                                                )}

                                                                {/* Materiales */}
                                                                {materials.length >
                                                                  0 && (
                                                                  <div className="space-y-2">
                                                                    {materials.map(
                                                                      (
                                                                        material
                                                                      ) => {
                                                                        const isQuiz =
                                                                          material.material_type ===
                                                                          "quiz";
                                                                        const isReading =
                                                                          material.material_type ===
                                                                          "reading";
                                                                        const isRequired =
                                                                          material.is_required;

                                                                        return (
                                                                          <div
                                                                            key={
                                                                              material.material_id
                                                                            }
                                                                            className="group relative hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl p-3 transition-all duration-200"
                                                                          >
                                                                            <div className="flex items-start gap-4">
                                                                              {/* Icono mejorado estilo imagen referencia */}
                                                                              <div
                                                                                className={`w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#0F1419] border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300 dark:group-hover:border-white/20 transition-colors shadow-sm`}
                                                                              >
                                                                                {isQuiz ? (
                                                                                  <FileText className="w-5 h-5 text-[#00D4B3]" />
                                                                                ) : isReading ? (
                                                                                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                                                                                ) : (
                                                                                  <FileText className="w-5 h-5 text-[#00D4B3]" />
                                                                                )}
                                                                              </div>

                                                                              {/* Contenido principal */}
                                                                              <div className="flex-1 min-w-0 pt-0.5">
                                                                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 leading-tight">
                                                                                  {
                                                                                    material.material_title
                                                                                  }
                                                                                </p>

                                                                                {/* Badges estilo Pill */}
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                  {/* Badge Requerida primero si aplica */}
                                                                                  {isRequired && (
                                                                                    <span className="px-3 py-0.5 text-[10px] uppercase tracking-wide rounded-full font-bold bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400">
                                                                                      Requerida
                                                                                    </span>
                                                                                  )}

                                                                                  {/* Badge de tipo */}
                                                                                  <span
                                                                                    className={`px-3 py-0.5 text-[10px] uppercase tracking-wide rounded-full font-bold bg-gray-50 dark:bg-[#0F1419] border border-gray-200 dark:border-white/10 ${isReading ? "text-[#10B981]" : "text-[#00D4B3]"}`}
                                                                                  >
                                                                                    {
                                                                                      material.material_type
                                                                                    }
                                                                                  </span>
                                                                                </div>
                                                                              </div>
                                                                            </div>

                                                                            {/* Indicador de estado para quizzes (si está disponible) */}
                                                                            {isQuiz &&
                                                                              lessonsQuizStatus[
                                                                                lesson
                                                                                  .lesson_id
                                                                              ] &&
                                                                              lessonsQuizStatus[
                                                                                lesson
                                                                                  .lesson_id
                                                                              ]
                                                                                ?.quizzes &&
                                                                              (() => {
                                                                                const quizInfo =
                                                                                  lessonsQuizStatus[
                                                                                    lesson
                                                                                      .lesson_id
                                                                                  ]!.quizzes.find(
                                                                                    (
                                                                                      q: any
                                                                                    ) =>
                                                                                      q.id ===
                                                                                        material.material_id &&
                                                                                      q.type ===
                                                                                        "material"
                                                                                  );
                                                                                if (
                                                                                  quizInfo
                                                                                ) {
                                                                                  return (
                                                                                    <div className="mt-2 pt-2 border-t border-[#E9ECEF]/50 dark:border-[#6C757D]/30">
                                                                                      {quizInfo.isPassed ? (
                                                                                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                                                                          <CheckCircle className="w-3.5 h-3.5" />
                                                                                          <span className="font-medium">
                                                                                            Aprobado
                                                                                            (
                                                                                            {
                                                                                              quizInfo.percentage
                                                                                            }
                                                                                            %)
                                                                                          </span>
                                                                                        </div>
                                                                                      ) : quizInfo.isCompleted ? (
                                                                                        <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                                                                                          <X className="w-3.5 h-3.5" />
                                                                                          <span className="font-medium">
                                                                                            Reprobado
                                                                                            (
                                                                                            {
                                                                                              quizInfo.percentage
                                                                                            }
                                                                                            %)
                                                                                          </span>
                                                                                        </div>
                                                                                      ) : (
                                                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                                                          <Clock className="w-3.5 h-3.5" />
                                                                                          <span>
                                                                                            Pendiente
                                                                                          </span>
                                                                                        </div>
                                                                                      )}
                                                                                    </div>
                                                                                  );
                                                                                }
                                                                                return null;
                                                                              })()}
                                                                          </div>
                                                                        );
                                                                      }
                                                                    )}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </motion.div>
                                                          )}
                                                      </AnimatePresence>
                                                    </div>
                                                  );
                                                }
                                              )
                                            ) : (
                                              <div className="text-center py-4 text-gray-500 dark:text-slate-400 text-sm">
                                                Este módulo aún no tiene
                                                lecciones
                                              </div>
                                            )}
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
                    <div className="border-b border-[#E9ECEF] dark:border-[#6C757D]/30 mb-6"></div>

                    {/* Sección de Notas */}
                    <div className="space-y-4" id="tour-notes-section">
                      {/* Header de Notas con botones de colapsar y nueva nota */}
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className="font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 text-xs"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <FileText className="w-3 h-3 text-[#00D4B3]" />
                          {t("leftPanel.notesSection.myNotes")}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!isNotesCollapsed && (
                            <button
                              id="tour-notes-button"
                              onClick={openNewNoteModal}
                              className="p-1.5 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors"
                              title={t("leftPanel.notesSection.newNote")}
                            >
                              <span className="text-sm font-bold text-gray-700 dark:text-white/70">
                                +
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setIsNotesCollapsed(!isNotesCollapsed)
                            }
                            className="p-1.5 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors"
                            title={
                              isNotesCollapsed
                                ? t("leftPanel.notesSection.expandNotes")
                                : t("leftPanel.notesSection.collapseNotes")
                            }
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
                              <h3
                                className="text-[#0A2540] dark:text-white font-semibold text-sm"
                                style={{
                                  fontFamily: "Inter, sans-serif",
                                  fontWeight: 600,
                                }}
                              >
                                {t("leftPanel.notesSection.savedNotes")}
                              </h3>
                              <div className="space-y-2">
                                {savedNotes.length === 0 ? (
                                  <div className="bg-white dark:bg-[#1E2329] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30 text-center">
                                    <p
                                      className="text-sm text-[#0A2540] dark:text-white"
                                      style={{
                                        fontFamily: "Inter, sans-serif",
                                        fontWeight: 400,
                                      }}
                                    >
                                      {t("leftPanel.notesSection.noSavedNotes")}
                                    </p>
                                    <p
                                      className="text-xs text-[#6C757D] dark:text-white/60 mt-1"
                                      style={{
                                        fontFamily: "Inter, sans-serif",
                                        fontWeight: 400,
                                      }}
                                    >
                                      {t(
                                        "leftPanel.notesSection.saveFirstNote"
                                      )}
                                    </p>
                                  </div>
                                ) : (
                                  savedNotes.map((note) => (
                                    <div
                                      key={note.id}
                                      className="bg-white dark:bg-[#1E2329] rounded-xl p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:bg-[#E9ECEF]/30 dark:hover:bg-[#0A2540]/30 transition-colors group"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span
                                          className="text-sm text-[#0A2540] dark:text-[#00D4B3] font-medium"
                                          style={{
                                            fontFamily: "Inter, sans-serif",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {note.title}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="text-xs text-[#6C757D] dark:text-white/60"
                                            style={{
                                              fontFamily: "Inter, sans-serif",
                                              fontWeight: 400,
                                            }}
                                          >
                                            {note.timestamp}
                                          </span>
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditNoteModal(note);
                                              }}
                                              className="p-1 hover:bg-[#00D4B3]/20 rounded text-[#00D4B3] hover:text-[#00D4B3] transition-colors"
                                              title={t(
                                                "leftPanel.notesSection.editNote"
                                              )}
                                            >
                                              <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNote(note.id);
                                              }}
                                              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                              title={t(
                                                "leftPanel.notesSection.deleteNote"
                                              )}
                                            >
                                              <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-white/70 line-clamp-2 mb-2 whitespace-pre-line">
                                        {note.content ||
                                          generateNotePreview(
                                            note.fullContent || "",
                                            50
                                          )}
                                      </p>
                                      {note.tags && note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {note.tags.map((tag) => (
                                            <span
                                              key={tag}
                                              className="inline-block px-2 py-0.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] dark:text-[#00D4B3] text-xs rounded border border-[#00D4B3]/30"
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
                            <div className="bg-gradient-to-r from-[#10B981]/10 to-[#00D4B3]/10 border border-[#10B981]/30 rounded-xl p-4">
                              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                {t("leftPanel.notesSection.notesProgress")}
                              </h3>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 dark:text-white/70">
                                    {t("leftPanel.notesSection.notesCreated")}
                                  </span>
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    {notesStats.totalNotes}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 dark:text-white/70">
                                    {t(
                                      "leftPanel.notesSection.lessonsWithNotes"
                                    )}
                                  </span>
                                  <span
                                    className="text-[#00D4B3] dark:text-[#00D4B3] font-medium"
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {notesStats.lessonsWithNotes}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 dark:text-white/70">
                                    {t("leftPanel.notesSection.lastUpdate")}
                                  </span>
                                  <span
                                    className="text-[#6C757D] dark:text-white/60"
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {notesStats.lastUpdate}
                                  </span>
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
            <div className="hidden md:flex w-12 bg-white dark:bg-[#1E2329] backdrop-blur-sm rounded-lg flex-col shadow-xl my-2 ml-2 z-10 border border-[#E9ECEF] dark:border-[#6C757D]/30">
              <div className="bg-white dark:bg-[#1E2329] backdrop-blur-sm border-b border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-center p-3 rounded-t-lg shrink-0 h-[56px]">
                <button
                  onClick={() => {
                    setIsLeftPanelOpen(true);
                    setIsMaterialCollapsed(false);
                    setIsNotesCollapsed(false);
                    // Si LIA está abierto, ponerlo en tamaño pequeño
                  }}
                  className="p-2 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors"
                  title="Mostrar material del curso"
                >
                  <ChevronRight className="w-5 h-5 text-[#6C757D] dark:text-white" />
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
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-colors"
                  title="Ver lecciones"
                >
                  <Layers className="w-4 h-4 text-[#6C757D] dark:text-white/80" />
                </button>

                {/* Abrir notas y cerrar lecciones */}
                <button
                  onClick={() => {
                    setIsLeftPanelOpen(true);
                    setIsMaterialCollapsed(true);
                    setIsNotesCollapsed(false);
                    // Si LIA está abierto, ponerlo en tamaño pequeño
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-colors"
                  title={t("leftPanel.notesSection.viewNotes")}
                >
                  <FileText className="w-4 h-4 text-[#6C757D] dark:text-white/80" />
                </button>

                {/* Abrir notas, cerrar lecciones y abrir modal de nueva nota */}
                <button
                  onClick={() => {
                    setIsLeftPanelOpen(true);
                    setIsMaterialCollapsed(true);
                    setIsNotesCollapsed(false);
                    openNewNoteModal();
                    // Si LIA está abierto, ponerlo en tamaño pequeño
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#00D4B3] hover:bg-[#00b8a0] transition-colors shadow-lg shadow-[#00D4B3]/25"
                  title={t("leftPanel.notesSection.newNote")}
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Panel Central - Contenido del video */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1E2329] backdrop-blur-sm rounded-lg shadow-xl my-0 md:my-2 mx-0 md:mx-2 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30">
            {modules.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 flex items-center justify-center mx-auto mb-4 border border-[#0A2540]/30">
                    <BookOpen className="w-10 h-10 text-[#00D4B3]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Este curso aún no tiene contenido
                  </h3>
                  <p
                    className="text-[#6C757D] dark:text-white/60"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  >
                    Los módulos y lecciones se agregarán pronto
                  </p>
                </div>
              </div>
            ) : currentLesson ? (
              <>
                {/* Tabs mejorados - Responsive */}
                <div
                  id="tour-tabs-container"
                  className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 flex gap-1 md:gap-2 p-2 md:p-3 rounded-t-xl h-[56px] items-center overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{
                    scrollPaddingLeft: "0.5rem",
                    scrollPaddingRight: "0.5rem",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div className="flex gap-1 md:gap-2 items-center min-w-max">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      // En móvil: siempre encoger excepto el activo; En PC: encoger solo cuando LIA está expandido
                      const shouldHideText = !isActive && isMobile;

                      return (
                        <button
                          key={tab.id}
                          id={`tour-tab-${tab.id}`}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center rounded-xl transition-all duration-200 relative group shrink-0 ${
                            shouldHideText
                              ? "px-2 py-2 hover:px-3 hover:gap-2"
                              : "px-3 md:px-4 py-2 gap-1 md:gap-2 min-w-fit"
                          } ${
                            isActive
                              ? "bg-[#0A2540] text-white shadow-lg shadow-[#0A2540]/25"
                              : "text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
                          }`}
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: isActive ? 600 : 500,
                          }}
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span
                            className={`text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ${
                              shouldHideText
                                ? "max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100"
                                : ""
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
                  className="flex-1 min-h-0 overflow-y-auto md:pb-0"
                  style={{
                    paddingBottom: isMobile
                      ? mobileContentPaddingBottom
                      : undefined,
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-auto p-3 md:p-6 flex flex-col gap-4"
                    >
                      {activeTab === "video" && (
                        <VideoContent
                          lesson={currentLesson}
                          modules={modules}
                          onNavigatePrevious={navigateToPreviousLesson}
                          onNavigateNext={navigateToNextLesson}
                          getPreviousLesson={getPreviousLesson}
                          getNextLesson={getNextLesson}
                          markLessonAsCompleted={markLessonAsCompleted}
                          canCompleteLesson={canCompleteLesson}
                          onCourseCompleted={() =>
                            setIsCourseCompletedModalOpen(true)
                          }
                          onCannotComplete={() =>
                            setIsCannotCompleteModalOpen(true)
                          }
                        />
                      )}
                      {activeTab === "transcript" && (
                        <TranscriptContent
                          lesson={currentLesson}
                          slug={slug}
                          onNoteCreated={addNoteToLocalState}
                          onStatsUpdate={updateNotesStatsOptimized}
                        />
                      )}
                      {activeTab === "summary" && currentLesson && (
                        <SummaryContent lesson={currentLesson} slug={slug} />
                      )}
                      {activeTab === "activities" && (
                        <ActivitiesContent
                          lesson={currentLesson}
                          slug={slug}
                          onPromptsChange={handlePromptsChange}
                          userRole={user?.type_rol}
                          onNavigateNext={navigateToNextLesson}
                          hasNextLesson={!!getNextLesson()}
                          selectedLang={selectedLang}
                          colors={colors}
                        />
                      )}
                      {activeTab === "questions" && (
                        <QuestionsContent
                          slug={slug}
                          courseTitle={
                            course?.title || course?.course_title || "Curso"
                          }
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p
                    className="text-[#6C757D] dark:text-white/60"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  >
                    {t("loading.lesson")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho - Solo LIA - REMOVED */}
        </div>

        {/* Barra de navegación inferior flotante para móviles */}
        {isMobileBottomNavVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#1E2329]/95 backdrop-blur-lg border-t border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
              height: "calc(70px + max(env(safe-area-inset-bottom), 8px))",
            }}
          >
            <div className="flex items-center justify-around px-4 py-3">
              {/* Botón Material del Curso */}
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                }}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isLeftPanelOpen
                    ? "bg-[#0A2540]/10 dark:bg-[#0A2540]/20 text-[#0A2540] dark:text-[#00D4B3]"
                    : "text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-medium">Material</span>
              </button>

              {/* Botón Lección Anterior */}
              {getPreviousLesson() && (
                <button
                  onClick={navigateToPreviousLesson}
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-xs font-medium">Anterior</span>
                </button>
              )}

              {/* Botón Lección Siguiente */}
              {getNextLesson() && (
                <button
                  onClick={navigateToNextLesson}
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                  <span className="text-xs font-medium">Siguiente</span>
                </button>
              )}

              {/* Botón LIA - Integrado en la barra inferior móvil */}
              <LiaMobileButton />
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
                className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
              >
                {/* Icono de éxito */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  ¡Felicidades!
                </h3>

                {/* Mensaje */}
                <p className="text-gray-600 dark:text-slate-300 text-center mb-4">
                  Has completado el curso exitosamente. ¡Buen trabajo!
                </p>

                {/* Mensaje informativo sobre certificado */}
                <div className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/40 rounded-xl p-3 mb-6">
                  <p
                    className="text-[#0A2540] dark:text-white text-center text-sm"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  >
                    📜 A continuación, completa una breve encuesta para acceder
                    a tu certificado
                  </p>
                </div>

                {/* Botón de cerrar */}
                <button
                  onClick={async () => {
                    setIsCourseCompletedModalOpen(false);
                    // Verificar si el usuario ya calificó después de cerrar el modal de completado
                    if (!hasUserRated && slug) {
                      try {
                        const ratingCheck =
                          await CourseRatingService.checkUserRating(slug);
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
                        console.error("Error checking rating:", error);
                      }
                    }
                  }}
                  className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
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
                className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
              >
                {/* Icono de advertencia */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-[#F59E0B]/25">
                    <HelpCircle className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Título */}
                <h3
                  className="text-2xl font-bold text-[#0A2540] dark:text-white text-center mb-2"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  No puedes completar esta lección
                </h3>

                {/* Mensaje */}
                <p
                  className="text-[#6C757D] dark:text-white/80 text-center mb-6"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                >
                  Tienes lecciones pendientes que debes completar antes de
                  terminar el curso. Completa todas las lecciones anteriores en
                  orden.
                </p>

                {/* Botón de cerrar */}
                <button
                  onClick={() => setIsCannotCompleteModalOpen(false)}
                  className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
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
              onClick={() =>
                setValidationModal({ ...validationModal, isOpen: false })
              }
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
                className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
              >
                {/* Icono según el tipo de validación */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                      validationModal.type === "activity" ||
                      validationModal.type === "quiz"
                        ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/25"
                        : validationModal.type === "video"
                          ? "bg-gradient-to-br from-[#0A2540] to-[#00D4B3] shadow-[#0A2540]/25"
                          : "bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] shadow-[#F59E0B]/25"
                    }`}
                  >
                    {validationModal.type === "activity" ||
                    validationModal.type === "quiz" ? (
                      <AlertCircle className="w-10 h-10 text-white" />
                    ) : validationModal.type === "video" ? (
                      <Info className="w-10 h-10 text-white" />
                    ) : (
                      <XCircle className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>

                {/* Título */}
                <h3
                  className="text-2xl font-bold text-[#0A2540] dark:text-white text-center mb-2"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  {validationModal.title}
                </h3>

                {/* Mensaje */}
                <p
                  className="text-[#6C757D] dark:text-white/80 text-center mb-4"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                >
                  {validationModal.message}
                </p>

                {/* Detalles adicionales si existen */}
                {validationModal.details && (
                  <div className="mb-6 p-3 bg-[#E9ECEF]/30 dark:bg-[#0F1419] rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30">
                    <p
                      className="text-[#0A2540] dark:text-white text-sm text-center font-medium"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 500,
                      }}
                    >
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
                        setActiveTab("activities");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }
                  }}
                  className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                >
                  Entendido
                </button>
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
            router.push("/certificates");
          }}
        />

        {/* LIA In-Context Chat for Courses */}
        <CourseLia
          lessonId={currentLesson?.lesson_id}
          lessonTitle={currentLesson?.lesson_title}
          courseSlug={slug}
          transcriptContent={liaTranscript}
          summaryContent={liaSummary}
          lessonContent={currentLesson?.lesson_description}
          customColors={{
            panelBg: colors.bgSecondary,
            borderColor: "rgba(255,255,255,0.1)",
            accentColor: colors.accent,
            textPrimary: "#FFFFFF",
            textSecondary: "rgba(255,255,255,0.6)",
          }}
        />

        {/* Tour de voz contextual para la página de aprendizaje */}
        
        {/* Joyride Tour */}
        {isJoyrideMounted && <Joyride {...joyrideProps} />}
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
  onCannotComplete,
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
  const hasPreviousVideo =
    hasPreviousLesson &&
    previousLesson.video_provider &&
    previousLesson.video_provider_id;
  const hasNextVideo =
    hasNextLesson && nextLesson.video_provider && nextLesson.video_provider_id;

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
          <div className="aspect-video rounded-xl overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30 relative bg-[#0F1419] dark:bg-[#0F1419]">
            <VideoPlayer
              videoProvider={lesson.video_provider!}
              videoProviderId={lesson.video_provider_id!}
              title={lesson.lesson_title}
              className="w-full h-full"
            />

            {/* Botones de navegación - Centrados verticalmente */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
              {/* Botón anterior - lado izquierdo */}
              {hasPreviousVideo && (
                <button
                  onClick={onNavigatePrevious}
                  className="pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
                  <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
                    Anterior
                  </span>
                </button>
              )}

              {/* Botón siguiente o terminar - lado derecho */}
              {(hasNextVideo || isLastLesson) && (
                <button
                  onClick={
                    isLastLesson
                      ? async () => {
                          // Verificar si se puede completar la lección
                          if (lesson && canCompleteLesson(lesson.lesson_id)) {
                            // Marcar la última lección como completada antes de terminar
                            const success = await markLessonAsCompleted(
                              lesson.lesson_id
                            );
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
                        }
                      : onNavigateNext
                  }
                  className={`pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3 ${
                    isLastLesson ? "bg-[#10B981]/50 hover:bg-[#10B981]/70" : ""
                  }`}
                >
                  <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
                    {isLastLesson ? "Terminar" : "Siguiente"}
                  </span>
                  {isLastLesson ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 rounded-xl flex items-center justify-center border border-[#E9ECEF] dark:border-[#6C757D]/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540]/10 via-[#00D4B3]/10 to-[#00D4B3]/10 animate-pulse" />
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-[#0A2540] rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-[#0d2f4d] transition-all transform group-hover:scale-110">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-gray-700 dark:text-white/70">
                Video no disponible
              </p>
            </div>

            {/* Botones de navegación incluso si no hay video - Centrados verticalmente */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
              {/* Botón anterior - lado izquierdo */}
              {hasPreviousVideo && (
                <button
                  onClick={onNavigatePrevious}
                  className="pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
                  <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
                    Anterior
                  </span>
                </button>
              )}

              {/* Botón siguiente o terminar - lado derecho */}
              {(hasNextVideo || isLastLesson) && (
                <button
                  onClick={
                    isLastLesson
                      ? async () => {
                          // Verificar si se puede completar la lección
                          if (lesson && canCompleteLesson(lesson.lesson_id)) {
                            // Marcar la última lección como completada antes de terminar
                            const success = await markLessonAsCompleted(
                              lesson.lesson_id
                            );
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
                        }
                      : onNavigateNext
                  }
                  className={`pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3 ${
                    isLastLesson ? "bg-[#10B981]/50 hover:bg-[#10B981]/70" : ""
                  }`}
                >
                  <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
                    {isLastLesson ? "Terminar" : "Siguiente"}
                  </span>
                  {isLastLesson ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6">
        <h2
          className="text-2xl font-bold text-[#0A2540] dark:text-white mb-4"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
        >
          {lesson.lesson_title}
        </h2>
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
  onStatsUpdate,
}: {
  lesson: Lesson | null;
  slug: string;
  onNoteCreated: (noteData: any, lessonId: string) => void;
  onStatsUpdate: (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => Promise<void>;
}) {
  const { t, i18n } = useTranslation("learn");
  const selectedLang =
    i18n.language === "en" ? "en" : i18n.language === "pt" ? "pt" : "es";
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(
    null
  );
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
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lesson.lesson_id}/transcript?language=${selectedLang}`
        );
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
  }, [lesson?.lesson_id, slug, selectedLang]);

  // Verificar si existe contenido de transcripción
  const hasTranscript =
    transcriptContent && transcriptContent.trim().length > 0;

  // Calcular tiempo de lectura estimado (palabras por minuto promedio: 200)
  const estimatedReadingTime = transcriptContent
    ? Math.ceil(transcriptContent.split(/\s+/).length / 200)
    : 0;

  // Función para descargar la transcripción
  const handleDownloadTranscript = () => {
    if (!transcriptContent || !lesson) return;

    const blob = new Blob([transcriptContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcripcion-${lesson.lesson_title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
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
      alert("Error al copiar al portapapeles");
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
        note_tags: ["transcripción", "automática"],
        source_type: "manual", // Usar valor válido según la restricción de la BD
      };

      // console.log('=== DEBUG TRANSCRIPCIÓN ===');
      // console.log('Enviando payload de nota:', notePayload);
      // console.log('URL de la API:', `/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`);

      const response = await fetch(
        `/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(notePayload),
        }
      );

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
            errorData = { error: "Respuesta vacía del servidor" };
          }
        } catch (parseError) {
          // console.error('Error al parsear respuesta JSON:', parseError);
          errorData = { error: "Error al procesar respuesta del servidor" };
        }

        // console.error('Error detallado del servidor:', errorData);
        alert(
          `Error al guardar la transcripción en notas:\n\n${errorData.error || "Error desconocido"}\n\nDetalles: ${errorData.message || "Sin detalles adicionales"}\n\nCódigo de estado: ${response.status}`
        );
        return;
      }

      const newNote = await response.json();
      // console.log('Nota creada exitosamente:', newNote);
      // console.log('=== FIN DEBUG ===');

      // ⚡ OPTIMIZACIÓN: Actualizar estado local inmediatamente
      if (lesson?.lesson_id) {
        onNoteCreated(newNote, lesson.lesson_id);
        await onStatsUpdate("create", lesson.lesson_id);
      }

      // Mostrar mensaje de éxito
      alert("✅ Transcripción guardada exitosamente en notas");
    } catch (error) {
      // console.error('Error al guardar transcripción en notas:', error);
      // console.log('=== FIN DEBUG (ERROR) ===');
      alert(
        `❌ Error al guardar la transcripción en notas:\n\n${error instanceof Error ? error.message : "Error desconocido"}\n\nRevisa la consola para más detalles.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!lesson) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Transcripción del Video
          </h2>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#0A2540]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200 dark:border-white/5">
            <ScrollText className="w-8 h-8 text-gray-400 dark:text-white/20" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
            Selecciona una lección
          </h3>
          <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto">
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Transcripción del Video
          </h2>
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#00D4B3]/20 animate-ping" />
            <div className="relative w-full h-full bg-[#00D4B3]/10 rounded-full flex items-center justify-center">
              <ScrollText className="w-8 h-8 text-[#00D4B3] animate-pulse" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-white/60 font-medium">{t("loading.transcript")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#00D4B3]" />
            Transcripción Interactiva
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm">{lesson.lesson_title}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {transcriptContent?.length || 0}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">caracteres</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <Clock className="w-3.5 h-3.5 text-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {estimatedReadingTime}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">min</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {hasTranscript ? (
          <motion.div
            key="transcript-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1419]/40 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur-sm group"
          >
            {/* Decoración de gradiente superior */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00D4B3]/50 to-transparent opacity-50" />

            {/* Glow de fondo sutil solo en dark mode */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00D4B3]/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />

            {/* Contenido Renderizado */}
            <div className="relative p-8 prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8 flex items-center gap-2 not-prose"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-bold text-gray-900 dark:text-white mb-4 mt-8 pb-2 border-b border-gray-200 dark:border-white/5 not-prose"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg font-semibold text-[#00D4B3] mb-3 mt-6 not-prose"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-gray-900 dark:text-white" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="mb-4 text-gray-700 dark:text-white/80 leading-relaxed font-light tracking-wide text-base"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc pl-5 space-y-2 mb-6 marker:text-[#00D4B3]"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal pl-5 space-y-2 mb-6 marker:text-[#00D4B3] marker:font-bold text-gray-700 dark:text-white/80"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="pl-1 leading-relaxed" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-[#00D4B3] pl-4 italic text-gray-600 dark:text-white/60 my-6 bg-gray-50 dark:bg-white/5 py-2 pr-4 rounded-r-lg not-prose"
                      {...props}
                    />
                  ),
                }}
              >
                {transcriptContent || ""}
              </ReactMarkdown>
            </div>

            {/* Footer con acciones */}
            <div className="relative px-8 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-white/20 font-medium tracking-widest uppercase hidden md:block">
                Generado automáticamente
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-white/60 hover:text-[#00D4B3] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-[#00D4B3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {isCopied ? "Copiado" : "Copiar"}
                </button>

                <button
                  onClick={handleDownloadTranscript}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-white/60 hover:text-[#00D4B3] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Descargar
                </button>

                <button
                  onClick={handleSaveToNotes}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#00D4B3]/10 text-[#00D4B3] hover:bg-[#00D4B3]/20 border border-[#00D4B3]/20 hover:border-[#00D4B3]/40 transition-all disabled:opacity-50"
                >
                  <Save
                    className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`}
                  />
                  {isSaving ? "Guardando..." : "Guardar en notas"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-transcript"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#0A2540]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200 dark:border-white/5">
              <ScrollText className="w-8 h-8 text-gray-400 dark:text-white/20" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
              Transcripción no disponible
            </h3>
            <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto mb-6">
              Esta lección aún no cuenta con una transcripción disponible.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-white/40">
              <Info className="w-4 h-4" />
              <span>El contenido se actualizará pronto</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryContent({ lesson, slug }: { lesson: Lesson; slug: string }) {
  const { t, i18n } = useTranslation("learn");
  const selectedLang =
    i18n.language === "en" ? "en" : i18n.language === "pt" ? "pt" : "es";
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
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lesson.lesson_id}/summary?language=${selectedLang}`
        );
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
  }, [lesson?.lesson_id, slug, selectedLang]);

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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Resumen del Video
          </h2>
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#00D4B3]/20 animate-ping" />
            <div className="relative w-full h-full bg-[#00D4B3]/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#00D4B3] animate-pulse" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-white/60 font-medium">{t("loading.summary")}</p>
        </div>
      </div>
    );
  }

  if (!hasSummary) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Resumen del Video
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm">{lesson.lesson_title}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#0A2540]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200 dark:border-white/5">
            <FileText className="w-8 h-8 text-gray-400 dark:text-white/20" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
            Resumen no disponible
          </h3>
          <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto mb-6">
            Esta lección aún no cuenta con un resumen generado automáticamente.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-white/40">
            <Info className="w-4 h-4" />
            <span>El contenido se actualizará pronto</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header simplificado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00D4B3]" />
            Resumen Inteligente
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm">{lesson.lesson_title}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {summaryContent?.split(/\s+/).length || 0}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">palabras</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <Clock className="w-3.5 h-3.5 text-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {estimatedReadingTime}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">min</span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1419]/40 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur-sm group"
      >
        {/* Decoración de gradiente superior */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00D4B3]/50 to-transparent opacity-50" />

        {/* Glow de fondo sutil solo en dark mode */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00D4B3]/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />

        {/* Contenido */}
        <div className="relative p-8 prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8 flex items-center gap-2 not-prose"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-xl font-bold text-gray-900 dark:text-white mb-4 mt-8 pb-2 border-b border-gray-200 dark:border-white/5 not-prose"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-lg font-semibold text-[#00D4B3] mb-3 mt-6 not-prose"
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-gray-900 dark:text-white" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p
                  className="mb-4 text-gray-700 dark:text-white/80 leading-relaxed font-light tracking-wide text-base"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc pl-5 space-y-2 mb-6 marker:text-[#00D4B3]"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-5 space-y-2 mb-6 marker:text-[#00D4B3] marker:font-bold text-gray-700 dark:text-white/80"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li className="pl-1 leading-relaxed" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-[#00D4B3] pl-4 italic text-gray-600 dark:text-white/60 my-6 bg-gray-50 dark:bg-white/5 py-2 pr-4 rounded-r-lg not-prose"
                  {...props}
                />
              ),
              code: ({ node, ...props }) => (
                <code
                  className="bg-gray-100 dark:bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-teal-600 dark:text-[#00D4B3]"
                  {...props}
                />
              ),
            }}
          >
            {summaryContent || ""}
          </ReactMarkdown>
        </div>

        {/* Footer simple */}
        <div className="relative px-8 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-white/20 font-medium tracking-widest uppercase">
            Generado por IA • Revisado por Expertos
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(summaryContent || "");
              // Podríamos añadir un toast aquí
            }}
            className="p-2 text-gray-400 dark:text-white/20 hover:text-[#00D4B3] transition-colors rounded-lg hover:bg-[#00D4B3]/10"
            title="Copiar resumen"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
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
  activityId,
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
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string | number>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Función para normalizar strings y comparar opciones
  const normalizeOption = (text: string): string => {
    return text
      .trim()
      .replace(/\s+/g, " ") // Normalizar espacios múltiples
      .toLowerCase();
  };

  // Función para convertir entre "true"/"false" y "Verdadero"/"Falso"
  const normalizeTrueFalse = (value: string): string => {
    const normalized = normalizeOption(value);
    if (normalized === "true" || normalized === "verdadero") return "verdadero";
    if (normalized === "false" || normalized === "falso") return "falso";
    return normalized;
  };

  // Función para verificar si una respuesta es correcta
  const isAnswerCorrect = (
    question: any,
    selectedAnswer: string | number
  ): boolean => {
    const correctAnswer = question.correctAnswer;
    const options = question.options;

    // Si es pregunta de verdadero/falso, usar normalización especial
    if (question.questionType === "true_false") {
      // Si la respuesta seleccionada es un índice
      if (typeof selectedAnswer === "number") {
        const selectedOption = options[selectedAnswer];
        if (typeof correctAnswer === "string") {
          return (
            normalizeTrueFalse(selectedOption) ===
            normalizeTrueFalse(correctAnswer)
          );
        }
        if (typeof correctAnswer === "number") {
          return selectedAnswer === correctAnswer;
        }
      }
      // Si la respuesta seleccionada es un string
      if (typeof selectedAnswer === "string") {
        if (typeof correctAnswer === "string") {
          return (
            normalizeTrueFalse(selectedAnswer) ===
            normalizeTrueFalse(correctAnswer)
          );
        }
        if (typeof correctAnswer === "number") {
          return (
            normalizeTrueFalse(selectedAnswer) ===
            normalizeTrueFalse(options[correctAnswer])
          );
        }
      }
      return false;
    }

    // Para otros tipos de preguntas, usar la lógica original
    // Si la respuesta seleccionada es un índice
    if (typeof selectedAnswer === "number") {
      // Caso 1: correctAnswer es también un índice
      if (typeof correctAnswer === "number") {
        return selectedAnswer === correctAnswer;
      }

      // Caso 2: correctAnswer es un string (texto de la opción)
      if (typeof correctAnswer === "string") {
        const selectedOption = options[selectedAnswer];
        // Comparación flexible ignorando espacios y mayúsculas
        return (
          normalizeOption(selectedOption) === normalizeOption(correctAnswer)
        );
      }
    }

    // Si la respuesta seleccionada es un string
    if (typeof selectedAnswer === "string") {
      if (typeof correctAnswer === "string") {
        return (
          normalizeOption(selectedAnswer) === normalizeOption(correctAnswer)
        );
      }
      if (typeof correctAnswer === "number") {
        return (
          normalizeOption(selectedAnswer) ===
          normalizeOption(options[correctAnswer])
        );
      }
    }

    return false;
  };

  // Normalizar preguntas: asegurar que las de verdadero/falso tengan las opciones correctas
  const normalizedQuizData = quizData.map((question) => {
    if (question.questionType === "true_false") {
      // Si no tiene opciones o tiene opciones incorrectas, inicializar con las correctas
      if (
        !question.options ||
        question.options.length !== 2 ||
        (question.options[0] !== "Verdadero" &&
          question.options[0] !== "Falso") ||
        (question.options[1] !== "Verdadero" && question.options[1] !== "Falso")
      ) {
        return {
          ...question,
          options: ["Verdadero", "Falso"],
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
      setSubmitError(
        `Por favor responde todas las preguntas (${unansweredQuestions.length} sin responder)`
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Calcular puntuación localmente primero
      let correct = 0;
      let points = 0;
      normalizedQuizData.forEach((question) => {
        const selectedAnswer = selectedAnswers[question.id];
        if (
          selectedAnswer !== undefined &&
          isAnswerCorrect(question, selectedAnswer)
        ) {
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
          const response = await fetch(
            `/api/courses/${slug}/lessons/${lessonId}/quiz/submit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                answers: selectedAnswers,
                quizData: normalizedQuizData,
                materialId: materialId || null,
                activityId: activityId || null,
                totalPoints: totalPoints,
              }),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            console.error("Error guardando quiz:", result.error);
            setSubmitError(result.error || "Error al guardar las respuestas");
          } else {
            // Quiz guardado exitosamente o no se guardó porque no mejoró

            // Guardar mensaje del servidor para mostrarlo en los resultados
            if (result.message) {
              setServerMessage(result.message);
            }
          }
        } catch (error) {
          console.error("Error al enviar quiz:", error);
          // No mostrar error al usuario si el cálculo local fue exitoso
          // Solo loguear el error
        }
      }
    } catch (error) {
      console.error("Error procesando quiz:", error);
      setSubmitError("Error al procesar el quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = normalizedQuizData.length;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passingThreshold = 80;
  const passed = percentage >= passingThreshold;

  // Función para parsear explicaciones con formato especial (separadas por ---)
  const parseExplanation = (question: any, selectedAnswer: string | number) => {
    const explanation = question.explanation;
    if (!explanation) return null;

    // Verificar si la explicación tiene el formato con "---"
    if (explanation.includes("---")) {
      const parts = explanation.split("---").map((p: string) => p.trim());

      // Obtener el texto de la opción seleccionada
      let selectedOptionText = "";
      if (
        typeof selectedAnswer === "number" &&
        question.options[selectedAnswer]
      ) {
        selectedOptionText = question.options[selectedAnswer];
      } else if (typeof selectedAnswer === "string") {
        selectedOptionText = selectedAnswer;
      }

      // Extraer la letra de la opción seleccionada (A, B, C, D)
      const letterMatch = selectedOptionText.match(/\(([A-Z])\)/);
      const selectedLetter = letterMatch ? letterMatch[1] : null;

      if (selectedLetter) {
        // Buscar el feedback para esa letra
        for (const part of parts) {
          // Buscar feedback que empiece con (A), (B), etc.
          const feedbackMatch = part.match(
            new RegExp(
              `^\\(${selectedLetter}\\)\\s+(Feedback|Comentarios):?\\s*(.*)`,
              "s"
            )
          );
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
    <div className="space-y-5">
      {/* Instrucciones - Minimalista */}
      <div className="px-4 py-3 border-l-2 border-white/20">
        <p className="text-white/60 text-xs mb-1">
          Responde las {totalQuestions} pregunta
          {totalQuestions !== 1 ? "s" : ""} para completar este quiz.
        </p>
        <div className="flex items-center gap-4 text-[10px] text-white/40">
          {totalPoints !== undefined && <span>{totalPoints} puntos</span>}
          <span>Umbral: {passingThreshold}%</span>
          <span>
            ({Math.ceil((totalQuestions * passingThreshold) / 100)} de{" "}
            {totalQuestions} para aprobar)
          </span>
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-4">
        {normalizedQuizData.map((question, index) => {
          const selectedAnswer = selectedAnswers[question.id];
          const isCorrect =
            selectedAnswer !== undefined &&
            isAnswerCorrect(question, selectedAnswer);
          const showExplanation = showResults && selectedAnswer !== undefined;

          return (
            <div
              key={question.id}
              className={`relative rounded-lg border transition-colors ${
                showResults
                  ? isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {/* Header de pregunta */}
              <div className="px-4 py-3 border-b border-white/5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-xs font-medium text-white/50 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-white leading-relaxed flex-1">
                    {question.question}
                  </p>
                </div>
                {question.points && (
                  <span className="text-[10px] text-white/30 px-2 py-0.5 bg-white/5 rounded flex-shrink-0">
                    {question.points} pt{question.points > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Opciones */}
              <div className="p-3 space-y-1.5">
                {question.options.map((option, optIndex) => {
                  const optionLetter = String.fromCharCode(65 + optIndex);
                  const isSelected =
                    selectedAnswer === optIndex || selectedAnswer === option;

                  let isCorrectOption = false;
                  if (question.questionType === "true_false") {
                    if (typeof question.correctAnswer === "number") {
                      isCorrectOption = optIndex === question.correctAnswer;
                    } else if (typeof question.correctAnswer === "string") {
                      isCorrectOption =
                        normalizeTrueFalse(option) ===
                        normalizeTrueFalse(question.correctAnswer);
                    }
                  } else {
                    if (typeof question.correctAnswer === "number") {
                      isCorrectOption = optIndex === question.correctAnswer;
                    } else if (typeof question.correctAnswer === "string") {
                      isCorrectOption =
                        normalizeOption(option) ===
                        normalizeOption(question.correctAnswer);
                    }
                  }

                  return (
                    <label
                      key={optIndex}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all ${
                        showResults
                          ? isCorrectOption
                            ? "bg-emerald-500/10 text-emerald-400"
                            : isSelected && !isCorrectOption
                              ? "bg-red-500/10 text-red-400"
                              : "bg-transparent text-white/50"
                          : isSelected
                            ? "bg-white/10 text-white"
                            : "bg-transparent text-white/60 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          showResults
                            ? isCorrectOption
                              ? "border-emerald-400 bg-emerald-400"
                              : isSelected && !isCorrectOption
                                ? "border-red-400 bg-red-400"
                                : "border-white/20"
                            : isSelected
                              ? "border-white bg-white"
                              : "border-white/20"
                        }`}
                      >
                        {((showResults &&
                          (isCorrectOption ||
                            (isSelected && !isCorrectOption))) ||
                          (!showResults && isSelected)) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={optIndex}
                        checked={isSelected}
                        onChange={() =>
                          handleAnswerSelect(question.id, optIndex)
                        }
                        disabled={showResults}
                        className="hidden"
                      />
                      <span className="text-xs font-medium opacity-50 mr-1">
                        ({optionLetter})
                      </span>
                      <span className="text-sm flex-1">{option}</span>
                      {showResults && isCorrectOption && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {showResults && isSelected && !isCorrectOption && (
                        <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Explicación */}
              {showExplanation && question.explanation && (
                <div
                  className={`mx-3 mb-3 px-3 py-2 rounded-md text-xs ${
                    isCorrect
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  <span
                    className={`font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {isCorrect ? "✓ Correcto" : "✗ Incorrecto"}
                  </span>
                  <p className="text-white/60 mt-1 leading-relaxed">
                    {parseExplanation(question, selectedAnswer)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {submitError && (
        <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-xs">{submitError}</p>
        </div>
      )}

      {/* Botón de envío */}
      {!showResults && (
        <div className="flex justify-end pt-3 border-t border-white/5">
          <button
            onClick={handleSubmit}
            disabled={
              Object.keys(selectedAnswers).length < totalQuestions ||
              isSubmitting
            }
            className="px-4 py-2 rounded-md text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              "Enviar Respuestas"
            )}
          </button>
        </div>
      )}

      {/* Resultados */}
      {showResults && (
        <div
          className={`rounded-lg border p-5 ${
            passed
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          {/* Mensaje del servidor */}
          {serverMessage && (
            <div className="mb-4 px-3 py-2 rounded-md bg-white/5 border border-white/10">
              <p className="text-white/60 text-xs">{serverMessage}</p>
            </div>
          )}

          <div className="text-center">
            <p
              className={`text-lg font-semibold mb-1 ${passed ? "text-emerald-400" : "text-red-400"}`}
            >
              {passed ? "✓ Aprobado" : "✗ No aprobado"}
            </p>
            <p className="text-white text-sm mb-1">
              {score} de {totalQuestions} correctas
            </p>
            {totalPoints !== undefined && (
              <p className="text-white/60 text-xs mb-1">
                {pointsEarned} de {totalPoints} puntos
              </p>
            )}
            <p className="text-white/40 text-xs">
              {percentage}% | Requerido: {passingThreshold}%
            </p>
          </div>

          {/* Botón reiniciar */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                setSelectedAnswers({});
                setShowResults(false);
                setScore(0);
                setPointsEarned(0);
                setSubmitError(null);
                setServerMessage(null);
              }}
              className="px-4 py-2 rounded-md text-xs font-medium bg-white/10 hover:bg-white/15 text-white/70 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
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
    if (typeof prompts === "string") {
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
        if (prompts.trim().startsWith("[") && prompts.trim().endsWith("]")) {
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
          promptsList = prompts.split("\n").filter((p) => p.trim().length > 0);
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
    <div className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/40 rounded-lg p-4">
      <div className="space-y-2">
        {promptsList.map((prompt, index) => {
          // Limpiar el prompt (remover comillas si las tiene)
          const cleanPrompt = prompt.replace(/^["']|["']$/g, "").trim();

          return (
            <button
              key={index}
              onClick={() => {
                // Aquí puedes agregar lógica para copiar el prompt o enviarlo a LIA
                navigator.clipboard
                  .writeText(cleanPrompt)
                  .then(() => {
                    alert("Prompt copiado al portapapeles");
                  })
                  .catch(() => {
                    // Fallback: mostrar el prompt
                    // console.log('Prompt:', cleanPrompt);
                  });
              }}
              className="w-full text-left px-4 py-3 bg-white dark:bg-[#1E2329] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/40 rounded-lg transition-all hover:border-[#00D4B3] dark:hover:border-[#00D4B3]/60 hover:shadow-lg hover:shadow-[#00D4B3]/20 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00D4B3]/20 dark:bg-[#00D4B3]/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#00D4B3]/30 dark:group-hover:bg-[#00D4B3]/50 transition-colors">
                  <span
                    className="text-[#00D4B3] text-xs font-bold"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                  >
                    {index + 1}
                  </span>
                </div>
                <p
                  className="text-[#0A2540] dark:text-white text-sm leading-relaxed flex-1 group-hover:text-[#0A2540] dark:group-hover:text-white transition-colors"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                >
                  {cleanPrompt}
                </p>
                <Copy className="w-4 h-4 text-[#00D4B3] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
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
  if (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content)
  ) {
    readingContent =
      content.text ||
      content.content ||
      content.body ||
      content.description ||
      content.title ||
      "";
    if (!readingContent || readingContent === "") {
      readingContent = JSON.stringify(content, null, 2);
    }
  }

  // Si es un string, intentar parsearlo si parece JSON
  if (typeof readingContent === "string") {
    try {
      const parsed = JSON.parse(readingContent);
      if (typeof parsed === "object" && parsed !== null) {
        readingContent =
          parsed.text ||
          parsed.content ||
          parsed.body ||
          parsed.description ||
          readingContent;
      }
    } catch (e) {}
  }

  // Asegurar que es string
  if (typeof readingContent !== "string") {
    readingContent = String(readingContent);
  }

  // Dividir por saltos de línea
  const lines = readingContent.split("\n");

  // Agrupar líneas en secciones para mejor renderizado
  const renderContent = () => {
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        elements.push(
          <p
            key={`p-${elements.length}`}
            className="text-gray-700 dark:text-white/80 text-sm leading-[1.8] mb-4"
          >
            {text}
          </p>
        );
        currentParagraph = [];
      }
    };

    lines.forEach((line: string, index: number) => {
      const trimmedLine = line.trim();

      // Línea vacía - flush del párrafo actual
      if (trimmedLine === "") {
        flushParagraph();
        return;
      }

      // Detectar títulos principales (Introducción:, Cuerpo:, etc.)
      const mainSectionMatch = trimmedLine.match(
        /^(Introducción|Cuerpo|Cierre|Conclusión|Resumen):?\s*(.*)$/i
      );
      if (mainSectionMatch) {
        flushParagraph();
        elements.push(
          <div key={`main-${index}`} className="mt-8 mb-4 first:mt-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {mainSectionMatch[1]}
            </h2>
            {mainSectionMatch[2] && (
              <p className="text-gray-500 dark:text-white/60 text-sm">{mainSectionMatch[2]}</p>
            )}
            <div className="w-12 h-0.5 bg-gray-200 dark:bg-white/10 mt-3" />
          </div>
        );
        return;
      }

      // Detectar subtítulos numerados con estilo "Paso N:" o similar
      const stepMatch = trimmedLine.match(/^(Paso\s+\d+):?\s*(.*)$/i);
      if (stepMatch) {
        flushParagraph();
        elements.push(
          <div
            key={`step-${index}`}
            className="mt-6 mb-3 flex items-start gap-3"
          >
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-wider flex-shrink-0">
              {stepMatch[1]}
            </span>
            {stepMatch[2] && (
              <span className="text-gray-900 dark:text-white font-medium text-sm">
                {stepMatch[2]}
              </span>
            )}
          </div>
        );
        return;
      }

      // Detectar subtítulos numerados (1. Título, 2. Título, etc.)
      const numberedMatch = trimmedLine.match(/^(\d+)[\.\)]\s+(.+)$/);
      if (numberedMatch && trimmedLine.length < 120) {
        flushParagraph();
        const [, number, title] = numberedMatch;
        elements.push(
          <div
            key={`num-${index}`}
            className="mt-5 mb-3 flex items-baseline gap-3"
          >
            <span className="text-gray-400 dark:text-white/30 text-xs font-medium">{number}.</span>
            <h3 className="text-gray-900 dark:text-white font-medium text-sm">{title}</h3>
          </div>
        );
        return;
      }

      // Detectar referencias (Referencia:, etc.)
      const refMatch = trimmedLine.match(
        /^\(?(Referencia|Ref|Ver|Nota):?\s*(.+)\)?$/i
      );
      if (refMatch) {
        flushParagraph();
        elements.push(
          <div
            key={`ref-${index}`}
            className="mt-2 mb-3 pl-3 border-l-2 border-gray-200 dark:border-white/10"
          >
            <p className="text-gray-400 dark:text-white/40 text-xs italic">{trimmedLine}</p>
          </div>
        );
        return;
      }

      // Detectar títulos sin numeración (líneas cortas que terminan con dos puntos)
      if (
        trimmedLine.endsWith(":") &&
        trimmedLine.length < 80 &&
        trimmedLine.length > 5
      ) {
        flushParagraph();
        elements.push(
          <h4
            key={`h4-${index}`}
            className="text-gray-800 dark:text-white/90 font-medium text-sm mt-5 mb-2"
          >
            {trimmedLine}
          </h4>
        );
        return;
      }

      // Detectar listas con guiones o bullets
      const listMatch = trimmedLine.match(/^[-•●○]\s+(.+)$/);
      if (listMatch) {
        flushParagraph();
        elements.push(
          <div
            key={`list-${index}`}
            className="flex items-start gap-2 mb-2 pl-2"
          >
            <span className="text-gray-300 dark:text-white/30 mt-1.5">•</span>
            <span className="text-gray-600 dark:text-white/70 text-sm leading-relaxed">
              {listMatch[1]}
            </span>
          </div>
        );
        return;
      }

      // Agregar al párrafo actual
      currentParagraph.push(trimmedLine);
    });

    // Flush final
    flushParagraph();

    return elements;
  };

  return (
    <div className="py-2">
      {/* Contenido de lectura */}
      <article className="max-w-none">{renderContent()}</article>
    </div>
  );
}

// Componente para renderizar items de checklist
function ChecklistItem({
  content,
  checked: initialChecked,
  activityId,
  lineIndex,
}: {
  content: string;
  checked: boolean;
  activityId?: string;
  lineIndex: number;
}) {
  const storageKey = activityId
    ? `checklist-${activityId}-${lineIndex}`
    : `checklist-global-${lineIndex}`;
  const [checked, setChecked] = useState(() => {
    if (typeof window !== "undefined" && activityId) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : initialChecked;
    }
    return initialChecked;
  });

  const handleToggle = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    if (typeof window !== "undefined" && activityId) {
      localStorage.setItem(storageKey, String(newChecked));
    }
  };

  return (
    <div className="flex items-start gap-3 my-3 pl-2">
      <button
        onClick={handleToggle}
        className={`
          mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
          ${
            checked
              ? "bg-[#00D4B3] border-[#00D4B3] dark:bg-[#00D4B3] dark:border-[#00D4B3]"
              : "bg-white dark:bg-[#1E2329] border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3] dark:hover:border-[#00D4B3]"
          }
          focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 focus:ring-offset-1
        `}
        aria-checked={checked}
        role="checkbox"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <p
        className={`
          flex-1 text-base leading-relaxed cursor-pointer
          ${
            checked
              ? "text-gray-600 dark:text-slate-400 line-through"
              : "text-gray-800 dark:text-slate-200"
          }
        `}
        onClick={handleToggle}
      >
        {content}
      </p>
    </div>
  );
}

function FormattedContentRenderer({
  content,
  activityId,
}: {
  content: any;
  activityId?: string;
}) {
  let readingContent = content;

  // Si el contenido es un objeto con propiedades, intentar extraer el texto
  if (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content)
  ) {
    // Buscar propiedades comunes que contengan el texto
    readingContent =
      content.text ||
      content.content ||
      content.body ||
      content.description ||
      content.title ||
      "";

    // Si no encontramos contenido, intentar convertir todo el objeto a string
    if (!readingContent || readingContent === "") {
      readingContent = JSON.stringify(content, null, 2);
    }
  }

  // Si es un string, intentar parsearlo si parece JSON
  if (typeof readingContent === "string") {
    try {
      const parsed = JSON.parse(readingContent);
      if (typeof parsed === "object" && parsed !== null) {
        readingContent =
          parsed.text ||
          parsed.content ||
          parsed.body ||
          parsed.description ||
          readingContent;
      }
    } catch (e) {
      // No es JSON, usar directamente
    }
  }

  // Asegurar que es string
  if (typeof readingContent !== "string") {
    readingContent = String(readingContent);
  }

  // Mejorar el formato: detectar secciones, títulos, párrafos, listas, ejemplos, etc.
  const lines = readingContent
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
  const formattedContent: Array<{
    type:
      | "main-title"
      | "section-title"
      | "subsection-title"
      | "paragraph"
      | "list"
      | "example"
      | "highlight"
      | "checklist";
    content: string;
    level?: number;
    checked?: boolean;
    originalLine?: string;
  }> = [];

  lines.forEach((line: string, index: number) => {
    const trimmedLine = line.trim();

    // Detectar checklists: [] o [ ] o [x] o [X] al inicio de línea
    const checklistPattern = /^\[([\sxX])\]\s*(.+)$/;
    const checklistMatch = trimmedLine.match(checklistPattern);
    if (checklistMatch) {
      const [, checkboxContent, checklistText] = checklistMatch;
      const isChecked = checkboxContent.toLowerCase() === "x";
      formattedContent.push({
        type: "checklist",
        content: checklistText.trim(),
        checked: isChecked,
        originalLine: trimmedLine,
      });
      return;
    }

    // Detectar títulos principales (Introducción, Cuerpo, Cierre, Conclusión, etc.)
    const mainSections =
      /^(Introducción|Cuerpo|Cierre|Conclusión|Resumen|Introducción:|Cuerpo:|Cierre:|Conclusión:|Resumen:)$/i;
    if (mainSections.test(trimmedLine)) {
      formattedContent.push({
        type: "main-title",
        content: trimmedLine.replace(/[:]$/, ""),
        level: 1,
      });
      return;
    }

    // Detectar subtítulos numerados principales (1. Los Datos, 2. El Modelo, etc.)
    const numberedSubsection = /^(\d+)[\.\)]\s+([A-ZÁÉÍÓÚÑ][^.!?]*)$/;
    const numberedMatch = trimmedLine.match(numberedSubsection);
    if (numberedMatch && trimmedLine.length < 100) {
      formattedContent.push({
        type: "subsection-title",
        content: trimmedLine,
        level: 2,
      });
      return;
    }

    // Detectar títulos de sección (líneas cortas sin punto, con mayúsculas al inicio)
    if (
      trimmedLine.length > 0 &&
      trimmedLine.length < 80 &&
      trimmedLine.match(/^[A-ZÁÉÍÓÚÑ][^.!?]*$/) &&
      !trimmedLine.match(/^\d+[\.\)]/) &&
      !trimmedLine.includes(":") &&
      index < lines.length - 1 && // No es la última línea
      lines[index + 1] &&
      lines[index + 1].length > 50
    ) {
      // La siguiente línea es un párrafo largo
      formattedContent.push({
        type: "section-title",
        content: trimmedLine,
        level: 1,
      });
      return;
    }

    // Detectar ejemplos (líneas que contienen "Ejemplo:", "Ejemplos:", "Por ejemplo", etc.)
    if (
      trimmedLine.match(/^Ejemplos?[:]?/i) ||
      trimmedLine.match(/Por ejemplo/i)
    ) {
      formattedContent.push({ type: "example", content: trimmedLine });
      return;
    }

    // Detectar texto destacado (líneas cortas con comillas o entre comillas)
    if (trimmedLine.match(/^["']|["']$/) && trimmedLine.length < 100) {
      formattedContent.push({ type: "highlight", content: trimmedLine });
      return;
    }

    // Detectar listas (líneas que empiezan con - o • o números seguidos de guión)
    if (
      trimmedLine.match(/^[-•]\s/) ||
      trimmedLine.match(/^\d+[\.\)]\s+[-•]/)
    ) {
      formattedContent.push({ type: "list", content: trimmedLine });
      return;
    }

    // Párrafos normales
    formattedContent.push({ type: "paragraph", content: trimmedLine });
  });

  return (
    <div className="bg-white dark:bg-[#1E2329] rounded-lg p-8 md:p-10 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg">
      <article className="prose dark:prose-invert max-w-none">
        <div
          className="text-[#0A2540] dark:text-white leading-relaxed space-y-6"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
        >
          {formattedContent.map((item, index) => {
            // Título principal (Introducción, Cuerpo, Cierre)
            if (item.type === "main-title") {
              return (
                <div key={`item-${index}`} className="mt-10 mb-6 first:mt-0">
                  <h1
                    className="text-[#0A2540] dark:text-white font-bold text-3xl mb-2 border-b-2 border-[#00D4B3]/40 pb-3"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                  >
                    {item.content}
                  </h1>
                </div>
              );
            }

            // Título de sección
            if (item.type === "section-title") {
              return (
                <h2
                  key={`item-${index}`}
                  className="text-[#0A2540] dark:text-white font-bold text-2xl mb-4 mt-8 border-b border-[#00D4B3]/20 pb-2"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  {item.content}
                </h2>
              );
            }

            // Subtítulo numerado (1. Los Datos, 2. El Modelo)
            if (item.type === "subsection-title") {
              const numberMatch = item.content.match(/^(\d+)[\.\)]\s+(.+)$/);
              if (numberMatch) {
                const [, number, title] = numberMatch;
                return (
                  <div key={`item-${index}`} className="mt-8 mb-4">
                    <h3
                      className="text-[#00D4B3] font-semibold text-xl mb-3 flex items-center gap-3"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      <span className="w-10 h-10 rounded-full bg-[#00D4B3]/20 border-2 border-[#00D4B3]/40 flex items-center justify-center text-[#00D4B3] font-bold text-lg">
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
                  className="text-[#00D4B3] font-semibold text-xl mb-3 mt-6"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  {item.content}
                </h3>
              );
            }

            // Ejemplos
            if (item.type === "example") {
              return (
                <div
                  key={`item-${index}`}
                  className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border-l-4 border-[#00D4B3]/50 rounded-r-lg p-4 my-4"
                >
                  <p
                    className="text-[#00D4B3] dark:text-[#00D4B3] font-semibold mb-2 text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                  >
                    {item.content.match(/^Ejemplos?[:]?/i)
                      ? item.content
                      : "Ejemplo"}
                  </p>
                </div>
              );
            }

            // Texto destacado
            if (item.type === "highlight") {
              return (
                <div
                  key={`item-${index}`}
                  className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 my-4"
                >
                  <p className="text-yellow-200 italic text-lg leading-relaxed">
                    {item.content.replace(/^["']|["']$/g, "")}
                  </p>
                </div>
              );
            }

            // Checklists
            if (item.type === "checklist") {
              return (
                <ChecklistItem
                  key={`checklist-${index}`}
                  content={item.content}
                  checked={item.checked || false}
                  activityId={activityId}
                  lineIndex={index}
                />
              );
            }

            // Listas
            if (item.type === "list") {
              const cleanedContent = item.content
                .replace(/^[-•]\s*/, "")
                .replace(/^\d+[\.\)]\s*/, "");
              return (
                <div
                  key={`item-${index}`}
                  className="flex items-start gap-3 my-3 pl-2"
                >
                  <span className="text-[#00D4B3] mt-1.5 text-lg font-bold">
                    •
                  </span>
                  <p
                    className="text-[#0A2540] dark:text-white leading-relaxed flex-1 text-base"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  >
                    {cleanedContent}
                  </p>
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
                <p
                  key={`item-${index}`}
                  className="text-[#0A2540] dark:text-white leading-relaxed mb-6 text-base"
                  style={{
                    lineHeight: "1.9",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                  }}
                >
                  {parts.map((part, partIndex) => {
                    if (part.match(/^["']/)) {
                      return (
                        <span
                          key={partIndex}
                          className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 px-2 py-1 rounded text-[#00D4B3] dark:text-[#00D4B3] font-medium"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {part.replace(/^["']|["']$/g, "")}
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
                className="text-[#0A2540] dark:text-white leading-relaxed mb-6 text-base"
                style={{
                  lineHeight: "1.9",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                }}
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
  generateRoleBasedPrompts,
  onNavigateNext,
  hasNextLesson,
  selectedLang,
  colors,
}: {
  lesson: Lesson;
  slug: string;
  onPromptsChange?: (prompts: string[]) => void;
  onStartInteraction?: (content: string, title: string) => void;
  userRole?: string;
  generateRoleBasedPrompts?: (
    basePrompts: string[],
    activityContent: string,
    activityTitle: string,
    userRole?: string
  ) => Promise<string[]>;
  onNavigateNext?: () => void | Promise<void>;
  hasNextLesson?: boolean;
  selectedLang: string;
  colors: {
    accent: string;
    primary: string;
    bgPrimary: string;
    bgSecondary: string;
  };
}) {
  // Hook de traducción
  const { t } = useTranslation("learn");
  // Hook de contexto LIA para notificar actividad activa
  const { setActivity, openLia } = useLiaCourse();

  const [activities, setActivities] = useState<
    Array<{
      activity_id: string;
      activity_title: string;
      activity_description?: string;
      activity_type:
        | "reflection"
        | "exercise"
        | "quiz"
        | "discussion"
        | "ai_chat";
      activity_content: string;
      ai_prompts?: string;
      activity_order_index: number;
      is_required: boolean;
    }>
  >([]);
  const [materials, setMaterials] = useState<
    Array<{
      material_id: string;
      material_title: string;
      material_description?: string;
      material_type:
        | "pdf"
        | "link"
        | "document"
        | "quiz"
        | "exercise"
        | "reading";
      file_url?: string;
      external_url?: string;
      content_data?: any;
      material_order_index: number;
      is_downloadable: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(
    new Set()
  );
  const [collapsedMaterials, setCollapsedMaterials] = useState<Set<string>>(
    new Set()
  );
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
      setCollapsedActivities(new Set(activities.map((a) => a.activity_id)));
      setActivitiesInitialized(true);
    }
  }, [activities, activitiesInitialized]);

  // Inicializar todos los materiales como colapsados cuando se cargan por primera vez
  useEffect(() => {
    if (materials.length > 0 && !materialsInitialized) {
      setCollapsedMaterials(new Set(materials.map((m) => m.material_id)));
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

  // Feedback de la lección completa
  const [lessonFeedback, setLessonFeedback] = useState<
    "like" | "dislike" | null
  >(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    async function loadActivitiesAndMaterials() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Cargar actividades, materiales y estado de quizzes en paralelo
        const [activitiesResponse, materialsResponse, quizStatusResponse] =
          await Promise.all([
            fetch(
              `/api/courses/${slug}/lessons/${lesson.lesson_id}/activities`
            ),
            fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/materials`),
            fetch(
              `/api/courses/${slug}/lessons/${lesson.lesson_id}/quiz/status`
            ),
          ]);

        // Procesar actividades con traducción
        if (activitiesResponse.ok) {
          let activitiesData = await activitiesResponse.json();

          // Aplicar traducciones si no es español
          if (
            selectedLang !== "es" &&
            activitiesData &&
            activitiesData.length > 0
          ) {
            activitiesData = await ContentTranslationService.translateArray(
              "activity",
              activitiesData.map((a: any) => ({ ...a, id: a.activity_id })),
              ["activity_title", "activity_description", "activity_content"],
              selectedLang as any
            );
          }

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
        } else {
          setQuizStatus(null);
        }
      } catch (error) {
        // console.error('Error loading activities and materials:', error);
        setActivities([]);
        setMaterials([]);
        setQuizStatus(null);
      } finally {
        setLoading(false);
      }
    }

    loadActivitiesAndMaterials();
  }, [lesson?.lesson_id, slug, selectedLang]);

  // Cargar feedback de la lección
  useEffect(() => {
    async function loadLessonFeedback() {
      if (!lesson?.lesson_id || !slug) {
        setLessonFeedback(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lesson.lesson_id}/feedback`
        );
        if (response.ok) {
          const data = await response.json();
          setLessonFeedback(data.feedback_type ?? null);
        } else {
          setLessonFeedback(null);
        }
      } catch (error) {
        setLessonFeedback(null);
      }
    }

    loadLessonFeedback();
  }, [lesson?.lesson_id, slug]);

  const handleLessonFeedback = async (feedbackType: "like" | "dislike") => {
    if (!lesson?.lesson_id || !slug || feedbackLoading) {
      return;
    }

    setFeedbackLoading(true);
    try {
      const url = `/api/courses/${slug}/lessons/${lesson.lesson_id}/feedback`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_type: feedbackType }),
      });

      if (response.ok) {
        const data = await response.json();
        setLessonFeedback(data.feedback_type ?? null);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        console.error("Error al guardar feedback:", errorData);
        // Mostrar error al usuario de forma no intrusiva
        // Podrías agregar un toast aquí si tienes un sistema de notificaciones
      }
    } catch (error) {
      console.error("Error de red al guardar feedback:", error);
    } finally {
      setFeedbackLoading(false);
    }
  };

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
      const activityPromptsMap: Map<
        string,
        { prompts: string[]; content: string; title: string }
      > = new Map();

      // Primero, extraer todos los prompts base de las actividades
      activities.forEach((activity) => {
        if (activity.ai_prompts) {
          try {
            let promptsList: string[] = [];

            // Si es string, intentar parsearlo como JSON
            if (typeof activity.ai_prompts === "string") {
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
            promptsList.forEach((prompt) => {
              const cleanPrompt = prompt.replace(/^["']|["']$/g, "").trim();
              if (cleanPrompt) {
                cleanPrompts.push(cleanPrompt);
              }
            });

            if (cleanPrompts.length > 0) {
              // Guardar prompts base junto con información de la actividad
              activityPromptsMap.set(activity.activity_id, {
                prompts: cleanPrompts,
                content: activity.activity_content || "",
                title: activity.activity_title || "",
              });
            }
          } catch (error) {
            console.warn(
              "[LIA PROMPTS] Error parsing prompts para actividad:",
              activity.activity_title,
              error
            );
          }
        }
      });

      // Si hay rol del usuario y función de generación, adaptar prompts
      if (
        userRole &&
        generateRoleBasedPromptsRef.current &&
        activityPromptsMap.size > 0
      ) {
        try {
          // Generar prompts adaptados para cada actividad EN PARALELO
          const adaptationPromises = Array.from(
            activityPromptsMap.entries()
          ).map(async ([activityId, activityData]) => {
            if (!isMounted) return []; // Salir si el componente se desmontó

            try {
              const adaptedPrompts = await generateRoleBasedPromptsRef.current(
                activityData.prompts,
                activityData.content,
                activityData.title,
                userRole
              );

              return adaptedPrompts;
            } catch (error) {
              console.error(
                "[LIA PROMPTS] ✗ Error personalizando:",
                activityData.title,
                error
              );
              // Fallback: retornar prompts originales
              return activityData.prompts;
            }
          });

          // Esperar a que todas las personalizaciones terminen (con timeout)
          const timeoutPromise = new Promise<string[][]>((resolve) => {
            setTimeout(() => {
              console.warn(
                "[LIA PROMPTS] Timeout en personalización, usando prompts originales"
              );
              resolve(
                Array.from(activityPromptsMap.values()).map(
                  (data) => data.prompts
                )
              );
            }, 10000); // 10 segundos de timeout
          });

          const results = await Promise.race([
            Promise.all(adaptationPromises),
            timeoutPromise,
          ]);

          // Agregar todos los prompts adaptados
          results.forEach((prompts) => {
            allPrompts.push(...prompts);
          });
        } catch (error) {
          console.error(
            "[LIA PROMPTS] Error generando prompts adaptados:",
            error
          );
          // Fallback: usar prompts originales
          activityPromptsMap.forEach((activityData) => {
            allPrompts.push(...activityData.prompts);
          });
        }
      } else {
        // Sin rol o sin función de generación, usar prompts originales
        console.log(
          "[LIA PROMPTS] Usando prompts originales (sin personalización)"
        );
        activityPromptsMap.forEach((activityData) => {
          allPrompts.push(...activityData.prompts);
        });
      }

      // Notificar cambios al componente padre solo si el componente sigue montado
      if (isMounted && onPromptsChangeRef.current) {
        onPromptsChangeRef.current(allPrompts);
      } else {
        console.warn(
          "[LIA PROMPTS] Componente desmontado o sin callback, no se notifican cambios"
        );
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
          <h2
            className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            Actividades
          </h2>
          <p
            className="text-[#6C757D] dark:text-white/80 text-sm"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {lesson.lesson_title}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E2329] rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 text-center">
          <div className="w-16 h-16 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-[#00D4B3] animate-pulse" />
          </div>
          <p
            className="text-[#6C757D] dark:text-white/80"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {t("loading.activities")}
          </p>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2
            className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            Actividades
          </h2>
          <p
            className="text-[#6C757D] dark:text-white/80 text-sm"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {lesson.lesson_title}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E2329] rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 text-center">
          <div className="w-16 h-16 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-[#00D4B3]" />
          </div>
          <h3
            className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
          >
            Actividades no disponibles
          </h3>
          <p
            className="text-[#6C757D] dark:text-white/80 mb-4"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            Esta lección aún no tiene actividades disponibles. Las actividades
            se agregarán próximamente.
          </p>
          <div
            className="text-sm text-[#6C757D] dark:text-white/60"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            <p>• Las actividades se agregan manualmente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header Simple */}
      <div className="pb-4 border-b border-gray-200 dark:border-white/5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Actividades</h2>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">{lesson.lesson_title}</p>
      </div>

      {/* Sección Actividades */}
      {hasActivities && (
        <div>
          {/* Header de sección - Simple */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-white/70">
              Actividades
            </span>
            <span className="text-xs text-gray-500 dark:text-white/30">{activities.length}</span>
          </div>

          {/* Lista de Actividades */}
          <div className="space-y-2">
            {activities.map((activity) => {
              const isCollapsed = collapsedActivities.has(activity.activity_id);
              const isAiChat = activity.activity_type === "ai_chat";
              const isQuiz = activity.activity_type === "quiz";

              return (
                <div
                  key={activity.activity_id}
                  className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm dark:shadow-none"
                >
                  {/* Header de la actividad */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const isCurrentlyCollapsed = collapsedActivities.has(
                        activity.activity_id
                      );
                      if (isCurrentlyCollapsed) {
                        setCollapsedActivities((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(activity.activity_id);
                          return newSet;
                        });
                      } else {
                        setCollapsedActivities((prev) => {
                          const newSet = new Set(prev);
                          newSet.add(activity.activity_id);
                          return newSet;
                        });
                      }
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3"
                  >
                    {/* Icono simple */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isAiChat ? "bg-indigo-50 dark:bg-white/10" : "bg-gray-100 dark:bg-white/5"
                      }`}
                    >
                      {isAiChat ? (
                        <MessageCircle className="w-4 h-4 text-indigo-500 dark:text-white/60" />
                      ) : isQuiz ? (
                        <FileText className="w-4 h-4 text-gray-500 dark:text-white/60" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-500 dark:text-white/60" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.activity_title}
                        </span>
                        {activity.is_required && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400/80 bg-amber-100 dark:bg-amber-500/10 rounded">
                            Requerida
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 rounded capitalize">
                          {activity.activity_type === "ai_chat"
                            ? "Chat IA"
                            : activity.activity_type}
                        </span>
                        {/* Status de quiz */}
                        {isQuiz &&
                          activity.is_required &&
                          quizStatus?.quizzes &&
                          (() => {
                            const quizInfo = quizStatus.quizzes.find(
                              (q: any) =>
                                q.id === activity.activity_id &&
                                q.type === "activity"
                            );
                            if (quizInfo?.isPassed) {
                              return (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400/80 bg-emerald-100 dark:bg-emerald-500/10 rounded flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Completado
                                </span>
                              );
                            }
                            return null;
                          })()}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 dark:text-white/30 transition-transform ${!isCollapsed ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Contenido colapsable */}
                  {!isCollapsed && (
                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5">
                      {activity.activity_description && (
                        <p className="text-gray-500 dark:text-white/40 text-xs mt-3 mb-3 leading-relaxed">
                          {activity.activity_description}
                        </p>
                      )}

                      {/* Contenido de la actividad */}
                      <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-3">
                        {activity.activity_type === "quiz" &&
                          (() => {
                            try {
                              // Intentar parsear el contenido como JSON si es un quiz
                              let quizData = activity.activity_content;

                              // Si es string, intentar parsearlo
                              if (typeof quizData === "string") {
                                try {
                                  quizData = JSON.parse(quizData);
                                } catch (e) {
                                  // console.warn('⚠️ Quiz content is not valid JSON:', e);
                                  return (
                                    <div className="prose dark:prose-invert max-w-none">
                                      <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                                        ⚠️ Error: El contenido del quiz no es un
                                        JSON válido
                                      </p>
                                      <div
                                        className="text-[#0A2540] dark:text-white leading-relaxed whitespace-pre-wrap"
                                        style={{
                                          fontFamily: "Inter, sans-serif",
                                          fontWeight: 400,
                                        }}
                                      >
                                        {activity.activity_content}
                                      </div>
                                    </div>
                                  );
                                }
                              }

                              // Detectar si tiene estructura {questions: [...], totalPoints: N}
                              let questionsArray: any = quizData;
                              let totalPoints: number | undefined = undefined;

                              if (
                                quizData &&
                                typeof quizData === "object" &&
                                !Array.isArray(quizData)
                              ) {
                                const quizObj = quizData as {
                                  questions?: any[];
                                  totalPoints?: number;
                                };
                                if (
                                  quizObj.questions &&
                                  Array.isArray(quizObj.questions)
                                ) {
                                  questionsArray = quizObj.questions;
                                  totalPoints = quizObj.totalPoints;
                                }
                              }

                              // Verificar que es un array con preguntas
                              if (
                                Array.isArray(questionsArray) &&
                                questionsArray.length > 0
                              ) {
                                // Verificar que cada elemento tiene la estructura de pregunta
                                const hasValidStructure = questionsArray.every(
                                  (q: any) =>
                                    q &&
                                    typeof q === "object" &&
                                    (q.question || q.id)
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
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                  <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                                    ⚠️ Error: El quiz no tiene la estructura
                                    esperada
                                  </p>
                                  <details className="mb-4">
                                    <summary className="text-gray-700 dark:text-slate-300 cursor-pointer">
                                      Ver contenido crudo
                                    </summary>
                                    <pre
                                      className="text-xs text-gray-500 dark:text-white/80 mt-2 p-2 bg-gray-100 dark:bg-[#0F1419] rounded overflow-auto border border-gray-200 dark:border-[#6C757D]/30"
                                      style={{
                                        fontFamily: "Inter, sans-serif",
                                        fontWeight: 400,
                                      }}
                                    >
                                      {typeof activity.activity_content ===
                                      "string"
                                        ? activity.activity_content
                                        : JSON.stringify(
                                            activity.activity_content,
                                            null,
                                            2
                                          )}
                                    </pre>
                                  </details>
                                </div>
                              );
                            } catch (e) {
                              // console.error('❌ Error processing quiz:', e);
                              return (
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                  <p className="text-red-600 dark:text-red-400 mb-2">
                                    ❌ Error al procesar el quiz
                                  </p>
                                  <div
                                    className="text-[#0A2540] dark:text-white leading-relaxed whitespace-pre-wrap"
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {activity.activity_content}
                                  </div>
                                </div>
                              );
                            }
                          })()}

                        {/* Tarjeta AI Chat - Minimalista */}
                        {activity.activity_type === "ai_chat" ? (
                          <div className="p-4 text-center">
                            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                              <MessageCircle className="w-5 h-5 text-gray-500 dark:text-white/50" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Actividad con LIA
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-white/40 mb-4">
                              Inicia una conversación guiada para completar esta
                              actividad
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                let parsedPrompts: string[] = [];
                                if (activity.ai_prompts) {
                                  try {
                                    const raw = activity.ai_prompts;
                                    parsedPrompts =
                                      typeof raw === "string" &&
                                      raw.trim().startsWith("[")
                                        ? JSON.parse(raw)
                                        : [String(raw)];
                                  } catch (e) {
                                    parsedPrompts = [
                                      String(activity.ai_prompts),
                                    ];
                                  }
                                }
                                setActivity({
                                  id: activity.activity_id,
                                  title: activity.activity_title,
                                  type: activity.activity_type,
                                  description:
                                    activity.activity_description || "",
                                  prompts: parsedPrompts,
                                });
                                openLia();
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] text-white transition-colors"
                            >
                              <Sparkles className="w-4 h-4" />
                              Comenzar
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </button>
                          </div>
                        ) : (
                          /* Contenido Standard para no-AI activities */
                          <FormattedContentRenderer
                            content={activity.activity_content}
                            activityId={activity.activity_id}
                          />
                        )}
                      </div>

                      {activity.activity_type !== "ai_chat" &&
                        activity.ai_prompts && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                              <HelpCircle className="w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
                              <span className="text-gray-500 dark:text-white/50 text-xs font-medium">
                                Prompts y Ejercicios
                              </span>
                            </div>
                            <PromptsRenderer prompts={activity.ai_prompts} />
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Materiales - Simple */}
      {hasMaterials && (
        <div>
          {/* Header de sección */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-white/70">
              Materiales
            </span>
            <span className="text-xs text-gray-500 dark:text-white/30">{materials.length}</span>
          </div>

          {/* Lista de Materiales */}
          <div className="space-y-2">
            {materials.map((material) => {
              const isCollapsed = collapsedMaterials.has(material.material_id);
              const isQuiz = material.material_type === "quiz";
              const isReading = material.material_type === "reading";

              return (
                <div
                  key={material.material_id}
                  className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm dark:shadow-none"
                >
                  {/* Header del material */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsedMaterials((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(material.material_id)) {
                          newSet.delete(material.material_id);
                        } else {
                          newSet.add(material.material_id);
                        }
                        return newSet;
                      });
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3"
                  >
                    {/* Icono simple */}
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                      {isQuiz ? (
                        <FileText className="w-4 h-4 text-gray-500 dark:text-white/60" />
                      ) : isReading ? (
                        <BookOpen className="w-4 h-4 text-gray-500 dark:text-white/60" />
                      ) : (
                        <ScrollText className="w-4 h-4 text-gray-500 dark:text-white/60" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {material.material_title}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 rounded capitalize">
                          {material.material_type === "reading"
                            ? "Lectura"
                            : material.material_type}
                        </span>
                        {material.is_downloadable && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-white/40 bg-blue-100 dark:bg-white/5 rounded">
                            Descargable
                          </span>
                        )}
                        {/* Status de quiz */}
                        {isQuiz &&
                          quizStatus?.quizzes &&
                          (() => {
                            const quizInfo = quizStatus.quizzes.find(
                              (q: any) =>
                                q.id === material.material_id &&
                                q.type === "material"
                            );
                            if (quizInfo?.isPassed) {
                              return (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400/80 bg-emerald-100 dark:bg-emerald-500/10 rounded flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Completado
                                </span>
                              );
                            }
                            return null;
                          })()}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 dark:text-white/30 transition-transform ${!isCollapsed ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Contenido colapsable */}
                  {!isCollapsed && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-white/5">
                      {material.material_description &&
                        material.material_type !== "reading" && (
                          <p className="text-gray-500 dark:text-white/40 text-xs mt-3 mb-3 leading-relaxed">
                            {material.material_description}
                          </p>
                        )}

                      {/* Contenido del material */}
                      <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-3">
                        {/* Contenido según tipo */}
                        {(material.content_data ||
                          (material.material_type === "reading" &&
                            material.material_description)) && (
                          <div className="w-full">
                            {material.material_type === "quiz" &&
                              (() => {
                                try {
                                  let quizData = material.content_data;
                                  if (typeof quizData === "string") {
                                    try {
                                      quizData = JSON.parse(quizData);
                                    } catch (e) {
                                      return null;
                                    }
                                  }
                                  let questionsArray = quizData;
                                  let totalPoints = undefined;
                                  if (
                                    quizData &&
                                    typeof quizData === "object" &&
                                    !Array.isArray(quizData)
                                  ) {
                                    if (
                                      quizData.questions &&
                                      Array.isArray(quizData.questions)
                                    ) {
                                      questionsArray = quizData.questions;
                                      totalPoints = quizData.totalPoints;
                                    }
                                  }
                                  if (
                                    Array.isArray(questionsArray) &&
                                    questionsArray.length > 0
                                  ) {
                                    const hasValidStructure =
                                      questionsArray.every(
                                        (q: any) =>
                                          q &&
                                          typeof q === "object" &&
                                          (q.question || q.id)
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
                                } catch (e) {}
                                return null;
                              })()}
                            {material.material_type === "reading" && (
                              <ReadingContentRenderer
                                content={
                                  material.content_data ||
                                  material.material_description
                                }
                              />
                            )}
                            {material.material_type !== "quiz" &&
                              material.material_type !== "reading" &&
                              material.content_data && (
                                <FormattedContentRenderer
                                  content={material.content_data}
                                  activityId={material.material_id}
                                />
                              )}
                          </div>
                        )}

                        {/* Enlaces */}
                        {(material.external_url || material.file_url) && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
                            {material.external_url && (
                              <a
                                href={material.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Abrir enlace
                              </a>
                            )}
                            {material.file_url && (
                              <a
                                href={material.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-white/70 transition-colors"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                Ver archivo
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leyenda informativa - Simple */}
      {(hasActivities || hasMaterials) && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
          <Info className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0" />
          <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
            {t("activities.completionRequirement")}
          </p>
        </div>
      )}

      {/* Footer - Simple */}
      {lesson && (
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-white/40">¿Útil?</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleLessonFeedback("like")}
                disabled={feedbackLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  lessonFeedback === "like"
                    ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/70"
                } ${feedbackLoading ? "opacity-50" : ""}`}
              >
                <ThumbsUp
                  className={`w-3.5 h-3.5 ${lessonFeedback === "like" ? "fill-current" : ""}`}
                />
                Sí
              </button>
              <button
                onClick={() => handleLessonFeedback("dislike")}
                disabled={feedbackLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  lessonFeedback === "dislike"
                    ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/70"
                } ${feedbackLoading ? "opacity-50" : ""}`}
              >
                <ThumbsDown
                  className={`w-3.5 h-3.5 ${lessonFeedback === "dislike" ? "fill-current" : ""}`}
                />
                No
              </button>
            </div>
          </div>

          {hasNextLesson && onNavigateNext && (
            <button
              onClick={onNavigateNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] text-white transition-colors"
            >
              Siguiente Video
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionsContent({
  slug,
  courseTitle,
}: {
  slug: string;
  courseTitle: string;
}) {
  const { t } = useTranslation("learn");
  const [questions, setQuestions] = useState<
    Array<{
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
      course_id?: string;
      user: {
        id: string;
        username: string;
        display_name?: string;
        first_name?: string;
        last_name?: string;
        profile_picture_url?: string;
      };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState(""); // Query activa para búsqueda
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, string>>(
    {}
  ); // questionId -> reaction_type
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {}
  ); // questionId -> count
  const [courseId, setCourseId] = useState<string | null>(null);

  // Función para ejecutar búsqueda
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setOffset(0);
    setHasMore(true);
  };

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setOffset(0);
    setHasMore(true);
  };

  // Manejar Enter en el input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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
      if (activeSearchQuery) params.append("search", activeSearchQuery);
      // Optimización: Limitar a 20 preguntas iniciales para carga más rápida
      params.append("limit", "20");
      params.append("offset", "0");

      const url = `/api/courses/${slug}/questions?${params.toString()}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setQuestions(data || []);

        // Extraer courseId de la primera pregunta si está disponible
        if (data && data.length > 0 && data[0].course_id && !courseId) {
          setCourseId(data[0].course_id);
        }

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
            // También extraer courseId si está disponible
            if (q.course_id && !courseId) {
              setCourseId(q.course_id);
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

  // ⚡ OPTIMIZACIÓN CRÍTICA: Supabase Realtime subscriptions para actualizaciones en tiempo real
  useEffect(() => {
    if (!courseId) return; // Esperar a tener courseId

    const supabase = createClient();

    // Suscripción para nuevas preguntas y actualizaciones
    const questionsChannel = supabase
      .channel(`course-questions-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_questions",
          filter: `course_id=eq.${courseId}`,
        },
        async (payload) => {
          // Solo agregar si no está en búsqueda activa (para evitar duplicados)
          if (!activeSearchQuery) {
            // Obtener datos completos de la nueva pregunta (con usuario)
            try {
              const response = await fetch(
                `/api/courses/${slug}/questions/${payload.new.id}`
              );
              if (response.ok) {
                const newQuestion = await response.json();
                setQuestions((prev) => {
                  // Verificar que no exista ya
                  if (prev.some((q) => q.id === newQuestion.id)) {
                    return prev;
                  }
                  // Agregar al inicio (preguntas más recientes primero)
                  return [newQuestion, ...prev];
                });
              }
            } catch (error) {
              // Si falla, recargar todas las preguntas
              reloadQuestions();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "course_questions",
          filter: `course_id=eq.${courseId}`,
        },
        async (payload) => {
          // Actualizar pregunta existente
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === payload.new.id
                ? {
                    ...q,
                    ...payload.new,
                    updated_at: payload.new.updated_at || q.updated_at,
                  }
                : q
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_questions",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          // Eliminar pregunta
          setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
        }
      )
      .subscribe();

    // Suscripción para nuevas respuestas
    const responsesChannel = supabase
      .channel(`course-responses-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_responses",
        },
        async (payload) => {
          // Incrementar contador de respuestas para la pregunta
          const questionId = payload.new.question_id;
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? { ...q, response_count: (q.response_count || 0) + 1 }
                : q
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_responses",
        },
        (payload) => {
          // Decrementar contador de respuestas
          const questionId = payload.old.question_id;
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    response_count: Math.max(0, (q.response_count || 0) - 1),
                  }
                : q
            )
          );
        }
      )
      .subscribe();

    // Suscripción para reacciones
    const reactionsChannel = supabase
      .channel(`course-reactions-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_reactions",
        },
        (payload) => {
          const questionId = payload.new.question_id;
          // Incrementar contador de reacciones
          setReactionCounts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? { ...q, reaction_count: (q.reaction_count || 0) + 1 }
                : q
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_reactions",
        },
        (payload) => {
          const questionId = payload.old.question_id;
          // Decrementar contador de reacciones
          setReactionCounts((prev) => ({
            ...prev,
            [questionId]: Math.max(0, (prev[questionId] || 0) - 1),
          }));
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    reaction_count: Math.max(0, (q.reaction_count || 0) - 1),
                  }
                : q
            )
          );
        }
      )
      .subscribe();

    // Cleanup: Desuscribirse cuando el componente se desmonte o cambie courseId
    return () => {
      supabase.removeChannel(questionsChannel);
      supabase.removeChannel(responsesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [courseId, slug, activeSearchQuery, reloadQuestions]);

  // Función para cargar más preguntas
  const loadMoreQuestions = async () => {
    if (!slug || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextOffset = offset + 20;

      const params = new URLSearchParams();
      if (activeSearchQuery) params.append("search", activeSearchQuery);
      params.append("limit", "20");
      params.append("offset", nextOffset.toString());

      const url = `/api/courses/${slug}/questions?${params.toString()}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (data && data.length > 0) {
          // Agregar nuevas preguntas a las existentes
          setQuestions((prev) => [...prev, ...data]);
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

          setUserReactions((prev) => ({ ...prev, ...newReactionsMap }));
          setReactionCounts((prev) => ({ ...prev, ...newCountsMap }));
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
    return (
      user?.display_name ||
      (user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : null) ||
      user?.username ||
      "Usuario"
    );
  };

  const getUserInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "hace un momento";
    if (diffInSeconds < 3600)
      return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400)
      return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000)
      return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  const handleReaction = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const currentReaction = userReactions[questionId];
    const isCurrentlyLiked = currentReaction === "like";
    const currentCount = reactionCounts[questionId] ?? 0;

    // Actualización optimista - aplicar cambios inmediatamente
    const newCount = isCurrentlyLiked
      ? Math.max(0, currentCount - 1)
      : currentCount + 1;
    const newReactionState = isCurrentlyLiked ? null : "like";

    // Actualizar estado optimista
    setReactionCounts((prev) => ({ ...prev, [questionId]: newCount }));
    setUserReactions((prev) => {
      if (newReactionState) {
        return { ...prev, [questionId]: newReactionState };
      } else {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      }
    });

    try {
      const response = await fetch(
        `/api/courses/${slug}/questions/${questionId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reaction_type: "like",
            action: "toggle",
          }),
        }
      );

      if (!response.ok) {
        // Revertir en caso de error
        setReactionCounts((prev) => ({ ...prev, [questionId]: currentCount }));
        setUserReactions((prev) => {
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
          const userResponse = await fetch("/api/auth/me", {
            credentials: "include",
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userId =
              userData?.success && userData?.user
                ? userData.user.id
                : userData?.id || null;

            if (userId) {
              const { createClient } = await import("@supabase/supabase-js");
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              // Verificar estado actual de la reacción después de la actualización
              const { data: currentReaction } = await supabase
                .from("course_question_reactions")
                .select("reaction_type")
                .eq("user_id", userId)
                .eq("question_id", questionId)
                .eq("reaction_type", "like")
                .maybeSingle();

              // Actualizar estado de reacción según el servidor (estado real)
              setUserReactions((prev) => {
                if (currentReaction) {
                  return { ...prev, [questionId]: "like" };
                } else {
                  const updated = { ...prev };
                  delete updated[questionId];
                  return updated;
                }
              });

              // Obtener contador actualizado de la pregunta desde el servidor
              const questionResponse = await fetch(
                `/api/courses/${slug}/questions`
              );
              if (questionResponse.ok) {
                const questionsData = await questionResponse.json();
                const updatedQuestion = questionsData.find(
                  (q: any) => q.id === questionId
                );
                if (updatedQuestion) {
                  // Reemplazar el contador con el valor real del servidor (sin sumar/restar)
                  setReactionCounts((prev) => ({
                    ...prev,
                    [questionId]: updatedQuestion.reaction_count || 0,
                  }));
                  setQuestions((prev) =>
                    prev.map((q) =>
                      q.id === questionId
                        ? {
                            ...q,
                            reaction_count: updatedQuestion.reaction_count || 0,
                          }
                        : q
                    )
                  );
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
      setReactionCounts((prev) => ({ ...prev, [questionId]: currentCount }));
      setUserReactions((prev) => {
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 pb-24 md:pb-6"
      >
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* Search skeleton */}
        <div className="h-12 bg-white/5 rounded-xl animate-pulse" />

        {/* Content skeleton */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center mb-4"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.div>
          <p className="text-white/50 text-sm">{t("loading.questions")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24 md:pb-6"
    >
      {/* Header moderno */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Preguntas</h2>
            <p className="text-xs text-white/40">
              {questions.length} conversaciones
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Pregunta
        </motion.button>
      </div>

      {/* Búsqueda moderna */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Buscar en las preguntas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-11 pr-10 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Estado vacío moderno */}
      {questions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3]/50 flex items-center justify-center mb-5"
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-white text-lg font-medium mb-2">
            No hay preguntas
          </h3>
          <p className="text-white/40 text-sm text-center mb-6 max-w-sm">
            {activeSearchQuery
              ? "No se encontraron resultados para tu búsqueda"
              : "Sé el primero en iniciar una conversación"}
          </p>
          {!activeSearchQuery && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Hacer Primera Pregunta
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.005 }}
              className="group rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all duration-300 overflow-hidden shadow-sm"
            >
              {/* Header compacto */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar pequeño */}
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80 flex items-center justify-center flex-shrink-0 text-white">
                    {question.user?.profile_picture_url ? (
                      <Image
                        src={question.user.profile_picture_url}
                        alt={getUserDisplayName(question.user)}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-medium text-xs">
                        {getUserInitials(question.user)}
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {getUserDisplayName(question.user)}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(question.created_at)}
                      </span>

                      {/* Badges */}
                      {question.is_pinned && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 rounded">
                          Fijada
                        </span>
                      )}
                      {question.is_resolved && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Resuelta
                        </span>
                      )}
                    </div>

                    {/* Título y contenido */}
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuestion(
                          selectedQuestion === question.id ? null : question.id
                        );
                      }}
                    >
                      {question.title && (
                        <h4 className="text-gray-900 font-medium text-sm mb-1">
                          {question.title}
                        </h4>
                      )}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedQuestion === question.id
                          ? question.content
                          : question.content.length > 150
                            ? `${question.content.substring(0, 150)}...`
                            : question.content}
                      </p>
                      {question.content.length > 150 &&
                        selectedQuestion !== question.id && (
                          <button className="text-[#0A2540] text-xs mt-1 font-medium hover:underline">
                            Ver más
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Footer con stats y acciones */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleReaction(question.id, e)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        userReactions[question.id] === "like"
                          ? "text-red-500"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${userReactions[question.id] === "like" ? "fill-current" : ""}`}
                      />
                      <span>
                        {reactionCounts[question.id] ??
                          question.reaction_count ??
                          0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuestion(
                          selectedQuestion === question.id ? null : question.id
                        );
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0A2540] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{question.response_count}</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{question.view_count}</span>
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ x: 3 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuestion(
                        selectedQuestion === question.id ? null : question.id
                      );
                    }}
                    className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Ver conversación
                    <ChevronRight className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>

              {/* Question Detail - Se expande cuando está seleccionada */}
              <AnimatePresence>
                {selectedQuestion === question.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <QuestionDetail
                      questionId={question.id}
                      slug={slug}
                      onClose={() => setSelectedQuestion(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Botón "Cargar más" */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadMoreQuestions}
                disabled={loadingMore}
                className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Cargar más</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateQuestionForm
          slug={slug}
          onClose={() => setShowCreateForm(false)}
          onSuccess={(newQuestion) => {
            setShowCreateForm(false);
            // ⚡ OPTIMIZACIÓN: Agregar pregunta optimistamente al estado
            // El realtime la actualizará con datos completos cuando llegue
            if (newQuestion) {
              setQuestions((prev) => {
                // Verificar que no exista ya (evitar duplicados)
                if (prev.some((q) => q.id === newQuestion.id)) {
                  return prev;
                }
                // Agregar al inicio (preguntas más recientes primero)
                return [newQuestion, ...prev];
              });
            } else {
              // Si no se recibió la pregunta, recargar todas
              reloadQuestions();
            }
          }}
        />
      )}
    </motion.div>
  );
}

function QuestionDetail({
  questionId,
  slug,
  onClose,
}: {
  questionId: string;
  slug: string;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Cambiado a false para mostrar skeleton inmediatamente
  const [loadingResponses, setLoadingResponses] = useState(true); // Iniciar en true para mostrar skeleton inmediatamente
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [newResponse, setNewResponse] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyingToReply, setReplyingToReply] = useState<string | null>(null); // Para responder a comentarios anidados
  const [replyToReplyContent, setReplyToReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseReactions, setResponseReactions] = useState<
    Record<string, string>
  >({}); // responseId -> reaction_type
  const [responseReactionCounts, setResponseReactionCounts] = useState<
    Record<string, number>
  >({}); // responseId -> count
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Función para ajustar altura del textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
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
          fetch(`/api/courses/${slug}/questions/${questionId}/responses`),
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

  // ⚡ OPTIMIZACIÓN CRÍTICA: Supabase Realtime subscriptions para respuestas y reacciones
  useEffect(() => {
    if (!questionId) return;

    const supabase = createClient();

    // Función helper para agregar respuesta al estado (maneja respuestas anidadas)
    const addResponseToState = (newResponse: any, parentId?: string) => {
      setResponses((prev) => {
        // Si tiene parent_id, es una respuesta anidada
        if (parentId) {
          return prev.map((r) => {
            if (r.id === parentId) {
              return {
                ...r,
                replies: [...(r.replies || []), newResponse],
              };
            }
            // Buscar recursivamente en replies
            if (r.replies && r.replies.length > 0) {
              return {
                ...r,
                replies: r.replies.map((reply: any) => {
                  if (reply.id === parentId) {
                    return {
                      ...reply,
                      replies: [...(reply.replies || []), newResponse],
                    };
                  }
                  return reply;
                }),
              };
            }
            return r;
          });
        } else {
          // Es una respuesta de nivel superior
          // Verificar que no exista ya
          if (prev.some((r) => r.id === newResponse.id)) {
            return prev;
          }
          return [...prev, newResponse];
        }
      });
    };

    // Suscripción para nuevas respuestas
    const responsesChannel = supabase
      .channel(`question-responses-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_responses",
          filter: `question_id=eq.${questionId}`,
        },
        async (payload) => {
          // Recargar todas las respuestas para obtener la estructura completa con usuario
          // Esto es más confiable que intentar construir la respuesta manualmente
          try {
            const responsesRes = await fetch(
              `/api/courses/${slug}/questions/${questionId}/responses`
            );
            if (responsesRes.ok) {
              const responsesData = await responsesRes.json();
              setResponses(responsesData || []);

              // Actualizar contadores de reacciones
              const countsMap: Record<string, number> = {};
              const reactionsMap: Record<string, string> = {};

              const initCountsFromResponses = (responses: any[]) => {
                responses.forEach((r: any) => {
                  if (r.id) {
                    countsMap[r.id] = r.reaction_count || 0;
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
            // Silenciar error, la próxima actualización lo corregirá
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "course_question_responses",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          // Actualizar respuesta existente
          setResponses((prev) => {
            const updateResponse = (responses: any[]): any[] => {
              return responses.map((r) => {
                if (r.id === payload.new.id) {
                  return { ...r, ...payload.new };
                }
                if (r.replies && r.replies.length > 0) {
                  return { ...r, replies: updateResponse(r.replies) };
                }
                return r;
              });
            };
            return updateResponse(prev);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_responses",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          // Eliminar respuesta (maneja respuestas anidadas)
          setResponses((prev) => {
            const removeResponse = (responses: any[]): any[] => {
              return responses
                .filter((r) => r.id !== payload.old.id)
                .map((r) => {
                  if (r.replies && r.replies.length > 0) {
                    return { ...r, replies: removeResponse(r.replies) };
                  }
                  return r;
                });
            };
            return removeResponse(prev);
          });
        }
      )
      .subscribe();

    // Suscripción para reacciones de respuestas
    // Nota: Las reacciones de respuestas usan la misma tabla course_question_reactions con response_id
    const responseReactionsChannel = supabase
      .channel(`response-reactions-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_reactions",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          // Solo procesar si tiene response_id (es reacción a respuesta, no a pregunta)
          if (payload.new.response_id) {
            const responseId = payload.new.response_id;
            // Incrementar contador de reacciones
            setResponseReactionCounts((prev) => ({
              ...prev,
              [responseId]: (prev[responseId] || 0) + 1,
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_reactions",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          // Solo procesar si tiene response_id (es reacción a respuesta, no a pregunta)
          if (payload.old.response_id) {
            const responseId = payload.old.response_id;
            // Decrementar contador de reacciones
            setResponseReactionCounts((prev) => ({
              ...prev,
              [responseId]: Math.max(0, (prev[responseId] || 0) - 1),
            }));
          }
        }
      )
      .subscribe();

    // Cleanup: Desuscribirse cuando el componente se desmonte o cambie questionId
    return () => {
      supabase.removeChannel(responsesChannel);
      supabase.removeChannel(responseReactionsChannel);
    };
  }, [questionId, slug]);

  const getUserDisplayName = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.display_name || user?.username || "Usuario";
  };

  const getUserInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "hace un momento";
    if (diffInSeconds < 3600)
      return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400)
      return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000)
      return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  const handleResponseReaction = async (
    responseId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const currentReaction = responseReactions[responseId];
    const isCurrentlyLiked = currentReaction === "like";
    const currentCount = responseReactionCounts[responseId] ?? 0;

    // OPTIMIZACIÓN: Actualización optimista inmediata (sin bloquear UI)
    const newCount = isCurrentlyLiked
      ? Math.max(0, currentCount - 1)
      : currentCount + 1;
    const newReactionState = isCurrentlyLiked ? null : "like";

    setResponseReactionCounts((prev) => ({ ...prev, [responseId]: newCount }));
    setResponseReactions((prev) => {
      if (newReactionState) {
        return { ...prev, [responseId]: newReactionState };
      } else {
        const updated = { ...prev };
        delete updated[responseId];
        return updated;
      }
    });

    try {
      const response = await fetch(
        `/api/courses/${slug}/questions/${questionId}/responses/${responseId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reaction_type: "like",
            action: "toggle",
          }),
        }
      );

      if (!response.ok) {
        // Revertir en caso de error
        setResponseReactionCounts((prev) => ({
          ...prev,
          [responseId]: currentCount,
        }));
        setResponseReactions((prev) => {
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
          setResponseReactionCounts((prev) => ({
            ...prev,
            [responseId]: data.new_count,
          }));
        }

        // Sincronizar estado de reacción del usuario
        if (data.user_reaction) {
          setResponseReactions((prev) => ({
            ...prev,
            [responseId]: data.user_reaction,
          }));
        } else {
          setResponseReactions((prev) => {
            const updated = { ...prev };
            delete updated[responseId];
            return updated;
          });
        }
      }
    } catch (error) {
      // console.error('Error handling response reaction:', error);
      // Revertir en caso de error
      setResponseReactionCounts((prev) => ({
        ...prev,
        [responseId]: currentCount,
      }));
      setResponseReactions((prev) => {
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
      const response = await fetch(
        `/api/courses/${slug}/questions/${questionId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newResponse.trim() }),
        }
      );

      if (response.ok) {
        const newResponseData = await response.json();
        setResponses((prev) => [...prev, { ...newResponseData, replies: [] }]);
        setNewResponse("");
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
      const response = await fetch(
        `/api/courses/${slug}/questions/${questionId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: replyContent.trim(),
            parent_response_id: parentId,
          }),
        }
      );

      if (response.ok) {
        const newReplyData = await response.json();
        setResponses((prev) =>
          prev.map((r) =>
            r.id === parentId
              ? { ...r, replies: [...(r.replies || []), newReplyData] }
              : r
          )
        );
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch (error) {
      // console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReplyToReply = async (
    parentReplyId: string,
    parentResponseId: string
  ) => {
    if (!replyToReplyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/courses/${slug}/questions/${questionId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: replyToReplyContent.trim(),
            parent_response_id: parentReplyId,
          }),
        }
      );

      if (response.ok) {
        const newReplyData = await response.json();
        // Buscar la respuesta principal y actualizar sus replies
        setResponses((prev) =>
          prev.map((response) => {
            if (response.id === parentResponseId) {
              const updatedReplies = (response.replies || []).map(
                (reply: any) => {
                  if (reply.id === parentReplyId) {
                    // Si el reply ya tiene replies, agregarlo, sino crear el array
                    return {
                      ...reply,
                      replies: [...(reply.replies || []), newReplyData],
                    };
                  }
                  return reply;
                }
              );
              return { ...response, replies: updatedReplies };
            }
            return response;
          })
        );
        setReplyToReplyContent("");
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
      <div className="p-6 border-t border-white/5 bg-white/[0.02]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="p-6 border-t border-gray-100 bg-gray-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Formulario de nueva respuesta - Diseño ultra-minimalista */}
      <div className="mb-8 flex gap-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A2540] to-[#00D4B3]/30 flex items-center justify-center text-white text-xs font-semibold shadow-inner flex-shrink-0">
          Tú
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="w-full bg-transparent border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-0 resize-none transition-colors min-h-[40px]"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-gray-400">
              {newResponse.length}/1000
            </span>
            <motion.button
              onClick={handleSubmitResponse}
              disabled={!newResponse.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Responder
            </motion.button>
          </div>
        </div>
      </div>

      {/* Lista de respuestas */}
      <div className="space-y-6">
        {loadingResponses ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-sm">
              Aún no hay respuestas. Sé el primero en responder.
            </p>
          </div>
        ) : (
          responses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 text-white">
                  {response.user?.profile_picture_url ? (
                    <Image
                      src={response.user.profile_picture_url}
                      alt={getUserDisplayName(response.user)}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-xs font-medium">
                      {getUserInitials(response.user)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header de respuesta */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {getUserDisplayName(response.user)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(response.created_at)}
                    </span>

                    {response.is_instructor_answer && (
                      <span className="ml-1 px-1.5 py-0.5 bg-[#00D4B3]/10 text-[#00D4B3] text-[10px] font-medium rounded">
                        Instructor
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-2">
                    {response.content}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleResponseReaction(response.id, e)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        responseReactions[response.id] === "like"
                          ? "text-red-500"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${responseReactions[response.id] === "like" ? "fill-current" : ""}`}
                      />
                      <span>
                        {responseReactionCounts[response.id] ??
                          (response.reaction_count || 0)}
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === response.id ? null : response.id
                        )
                      }
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      Responder
                    </button>
                  </div>

                  {/* Formulario de respuesta anidada */}
                  <AnimatePresence>
                    {replyingTo === response.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pl-4 border-l border-gray-200"
                      >
                        <div className="flex gap-3">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="flex-1 bg-transparent border-0 border-b border-gray-200 px-0 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-0 resize-none min-h-[32px]"
                            rows={1}
                          />
                          <button
                            onClick={() => handleSubmitReply(response.id)}
                            disabled={!replyContent.trim() || isSubmitting}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Respuestas anidadas */}
                  {response.replies && response.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l border-gray-100">
                      {response.replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-3">
                          {/* Avatar pequeño */}
                          <div className="relative w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 text-white">
                            {reply.user?.profile_picture_url ? (
                              <Image
                                src={reply.user.profile_picture_url}
                                alt={getUserDisplayName(reply.user)}
                                fill
                                className="object-cover rounded"
                              />
                            ) : (
                              <span className="text-gray-500 text-[10px] font-medium">
                                {getUserInitials(reply.user)}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-gray-900">
                                {getUserDisplayName(reply.user)}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatTimeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">
                              {reply.content}
                            </p>
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

function CreateQuestionForm({
  slug,
  onClose,
  onSuccess,
}: {
  slug: string;
  onClose: () => void;
  onSuccess: (question?: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/courses/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        // ⚡ OPTIMIZACIÓN: Pasar la pregunta creada al callback para actualización optimista
        const newQuestion = await response.json();
        onSuccess(newQuestion);
        // Limpiar formulario
        setTitle("");
        setContent("");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      // console.error('Error creating question:', error);
      alert("Error al crear la pregunta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl border border-gray-200 w-full max-w-2xl p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <MessageCircle className="w-24 h-24 text-gray-900" />
        </div>

        <h3 className="text-gray-900 font-semibold text-xl mb-6 relative z-10 font-[Inter,sans-serif]">
          Nueva Pregunta
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título breve..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#00D4B3]/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
              Contenido <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe tu duda o comentario en detalle..."
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#00D4B3]/20 transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 bg-[#00D4B3] hover:bg-[#00b89a] text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#00D4B3]/20 text-sm font-semibold flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publicar Pregunta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
// End of file
