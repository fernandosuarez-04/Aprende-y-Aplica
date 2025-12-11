'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight, Mic, MicOff, Send, Check, BookOpen, Loader2, Calendar, ExternalLink, Search, ChevronLeft, HelpCircle, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { HolidayService } from '@/lib/holidays';

// Componentes de iconos de Google y Microsoft
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <path
      d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z"
      fill="#4285F4"
    />
    <path
      d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54756 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z"
      fill="#FBBC05"
    />
    <path
      d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <rect width="10" height="10" x="1" y="1" fill="#F25022" />
    <rect width="10" height="10" x="12" y="1" fill="#7FBA00" />
    <rect width="10" height="10" x="1" y="12" fill="#00A4EF" />
    <rect width="10" height="10" x="12" y="12" fill="#FFB900" />
  </svg>
);

interface StudyPlannerStep {
  id: number;
  title: string;
  description: string;
  speech: string;
}

const STUDY_PLANNER_STEPS: StudyPlannerStep[] = [
  {
    id: 1,
    title: '¡Bienvenido al Planificador de Estudios!',
    description: 'Soy LIA, tu asistente inteligente. Estoy aquí para ayudarte a crear un plan de estudios personalizado que se adapte a tu tiempo y ritmo de aprendizaje.',
    speech: '¡Bienvenido al Planificador de Estudios! Soy LIA, tu asistente inteligente. Estoy aquí para ayudarte a crear un plan de estudios personalizado que se adapte a tu tiempo y ritmo de aprendizaje.'
  },
  {
    id: 2,
    title: '¿Cómo funciona?',
    description: 'Puedo crear tu plan de estudios de dos formas: de manera automática usando inteligencia artificial para optimizar tu tiempo, o manualmente donde tú decides cada detalle. ¿Cuál prefieres?',
    speech: 'Puedo crear tu plan de estudios de dos formas: de manera automática usando inteligencia artificial para optimizar tu tiempo, o manualmente donde tú decides cada detalle. ¿Cuál prefieres?'
  },
  {
    id: 3,
    title: 'Planificación Inteligente',
    description: 'Si eliges la opción automática, analizaré tus cursos, tu disponibilidad de tiempo, tu rol profesional y tus preferencias para crear el plan perfecto para ti.',
    speech: 'Si eliges la opción automática, analizaré tus cursos, tu disponibilidad de tiempo, tu rol profesional y tus preferencias para crear el plan perfecto para ti.'
  },
  {
    id: 4,
    title: '¡Empecemos!',
    description: 'Estoy lista para ayudarte. Puedes hablarme por voz haciendo clic en el micrófono, o simplemente continuar para comenzar a configurar tu plan.',
    speech: 'Estoy lista para ayudarte. Puedes hablarme por voz haciendo clic en el micrófono, o simplemente continuar para comenzar a configurar tu plan.'
  }
];

/**
 * Obtiene un mensaje de error amigable basado en el tipo de error de OAuth
 */
function getCalendarErrorMessage(errorType: string, errorMsg: string): string {
  switch (errorType) {
    case 'email_mismatch':
      return '⚠️ El calendario conectado pertenece a otra cuenta.\n\nEl email con el que iniciaste sesión en Google/Microsoft no coincide con tu cuenta en la aplicación.\n\nPara solucionarlo:\n1. Cierra sesión en Google/Microsoft en tu navegador\n2. Inicia sesión con el mismo email que usas aquí\n3. Vuelve a intentar conectar tu calendario';
    
    case 'test_mode_user_not_added':
      return 'Tu email no está agregado como usuario de prueba.\n\n⚠️ IMPORTANTE: El email debe coincidir EXACTAMENTE con el que usas para iniciar sesión en Google.\n\nPara solucionarlo:\n1. Ve a Google Cloud Console (console.cloud.google.com)\n2. Ve a "APIs & Services" > "OAuth consent screen"\n3. En "Test users", haz clic en "+ ADD USERS"\n4. Agrega tu email EXACTO (el mismo que usas para Google) y guarda\n5. Espera 1-2 minutos para que se apliquen los cambios\n6. Intenta conectar de nuevo';
    
    case 'app_not_verified':
      return 'La aplicación requiere configuración en Google Cloud Console.\n\nPara solucionarlo:\n1. Ve a Google Cloud Console\n2. Ve a "APIs & Services" > "OAuth consent screen"\n3. Cambia el estado a "Testing" (modo de prueba)\n4. Agrega tu email como usuario de prueba\n5. Intenta conectar de nuevo';
    
    case 'access_denied':
      return 'No se otorgaron los permisos necesarios.\n\nAsegúrate de aceptar todos los permisos cuando Google los solicite e intenta de nuevo.';
    
    case 'redirect_uri_mismatch':
      return 'Error de configuración: URI de redirección incorrecta.\n\nVerifica que en Google Cloud Console > Credentials tengas configurada la URI correcta.';
    
    case 'invalid_client':
      return 'El Client ID no es válido.\n\nVerifica que NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID esté configurado correctamente en tu archivo .env.local';
    
    case 'code_expired':
      return 'El código de autorización expiró.\n\nEsto puede pasar si el proceso tarda mucho. Simplemente intenta conectar de nuevo.';
    
    case 'rls_error':
      return 'Error de permisos en la base de datos.\n\nNo se pudo guardar la integración. Este es un error del servidor. Por favor, contacta al administrador.';
    
    default:
      // Detectar errores conocidos por el contenido del mensaje
      if (errorMsg.includes("doesn't comply with Google's OAuth 2.0 policy") || 
          errorMsg.includes('OAuth 2.0 policy') ||
          errorMsg.includes('comply with Google')) {
        return 'Tu aplicación de Google requiere configuración.\n\nPara solucionarlo:\n1. Ve a Google Cloud Console\n2. Cambia tu app a modo de prueba (Testing)\n3. Agrega tu email como usuario de prueba\n4. Intenta conectar de nuevo';
      }
      if (errorMsg.includes('connection_failed')) {
        return 'No se pudo conectar el calendario.\n\nVerifica tu configuración de OAuth en Google Cloud Console y que tu email esté agregado como usuario de prueba.';
      }
      return errorMsg || 'Error desconocido al conectar el calendario. Por favor, intenta de nuevo.';
  }
}

export function StudyPlannerLIA() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Estado para mostrar la interfaz de conversación después del modal
  // Iniciar directamente con la conversación visible, sin mostrar el modal automáticamente
  const [showConversation, setShowConversation] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  
  // Estados para selector de cursos
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  
  // Estados para hover de botones del header
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Array<{id: string, title: string, category: string, progress: number}>>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  
  // Estados para modal de calendario
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [connectedCalendar, setConnectedCalendar] = useState<'google' | 'microsoft' | null>(null);
  
  // Estados para configuración de estudio
  const [studyApproach, setStudyApproach] = useState<'rapido' | 'normal' | 'largo' | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [hasAskedApproach, setHasAskedApproach] = useState(false);
  const [hasAskedTargetDate, setHasAskedTargetDate] = useState(false);
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Inicializar currentMonth con el día 1 del mes actual para evitar problemas
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  // Función helper para normalizar currentMonth siempre al día 1
  const setCurrentMonthNormalized = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    setCurrentMonth(normalized);
  };
  
  // Estado para guardar la distribución de lecciones para el resumen final
  type StoredLessonDistribution = {
    dateStr: string;
    dayName: string;
    startTime: string;
    endTime: string;
    lessons: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number }>;
  };
  const [savedLessonDistribution, setSavedLessonDistribution] = useState<StoredLessonDistribution[]>([]);
  const [savedTargetDate, setSavedTargetDate] = useState<string | null>(null);
  const [savedTotalLessons, setSavedTotalLessons] = useState<number>(0);
  
  // Estado para rastrear si ya se mostró el resumen final
  const [hasShownFinalSummary, setHasShownFinalSummary] = useState<boolean>(false);
  
  // Estado para guardar los datos del calendario analizado (para validar conflictos)
  const [savedCalendarData, setSavedCalendarData] = useState<Record<string, {
    busySlots: Array<{ start: Date; end: Date }>;
    events: any[];
  }> | null>(null);
  
  // Estado para guardar el userId actual (para detectar cambios de usuario)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Estado para guardar el contexto del usuario (perfil profesional)
  const [userContext, setUserContext] = useState<{
    userType: 'b2b' | 'b2c' | null;
    rol: string | null;
    area: string | null;
    nivel: string | null;
    tamanoEmpresa: string | null;
    organizationName: string | null;
    minEmpleados: number | null;
    maxEmpleados: number | null;
  } | null>(null);
  
  // Estados para conversación por voz
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const processingRef = useRef<boolean>(false);
  const pendingTranscriptRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const conversationHistoryRef = useRef(conversationHistory);
  const lastErrorTimeRef = useRef<number>(0);
  const hasAttemptedOpenRef = useRef<boolean>(false);
  const isOpeningRef = useRef<boolean>(false);

  // Función para formatear mensajes de LIA con estilos mejorados y tipografía Inter
  const formatLIAMessage = (text: string): React.ReactNode => {
    if (!text) return null;

    // Limpiar TODOS los emojis usando regex Unicode
    let cleaned = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    
    // Limpiar emojis específicos adicionales
    cleaned = cleaned
      .replace(/🎯/g, '')
      .replace(/📈/g, '')
      .replace(/📚/g, '')
      .replace(/💡/g, '')
      .replace(/🗓️/g, '')
      .replace(/⏰/g, '')
      .replace(/📋/g, '')
      .replace(/✅/g, '')
      .replace(/❌/g, '')
      .replace(/⚠️/g, '')
      .replace(/🔥/g, '')
      .replace(/✨/g, '')
      .replace(/🎉/g, '')
      .replace(/🚀/g, '')
      .replace(/💪/g, '')
      .replace(/⭐/g, '')
      .replace(/🎓/g, '')
      .replace(/📖/g, '')
      .replace(/📝/g, '')
      .replace(/🎯/g, '')
      .replace(/🏆/g, '')
      .replace(/💼/g, '')
      .replace(/🌐/g, '')
      .replace(/🔔/g, '')
      .replace(/📊/g, '')
      .replace(/🎨/g, '')
      .replace(/⚡/g, '')
      .replace(/🌟/g, '')
      .replace(/🎁/g, '')
      .replace(/🔒/g, '')
      .replace(/🔓/g, '')
      .replace(/📱/g, '')
      .replace(/💻/g, '')
      .replace(/⌨️/g, '')
      .replace(/🖥️/g, '')
      .replace(/🖱️/g, '')
      .replace(/⌨️/g, '')
      .trim();

    // Dividir en líneas
    const lines = cleaned.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];

    // Función para agregar línea separadora
    const addSeparator = () => {
      elements.push(
        <div key={`separator-${elements.length}`} className="my-6 flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-500/40 to-transparent"></div>
          <div className="mx-4 w-2 h-2 rounded-full bg-slate-500/40"></div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-500/40 to-transparent"></div>
        </div>
      );
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          elements.push(
            <p key={`p-${elements.length}`} className="mb-4 font-body text-[15px] leading-[1.75] text-slate-50 tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
              {formatInlineStyles(paraText)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-3 my-5 ml-1 pl-4 border-l-2 border-purple-500/20">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const formatInlineStyles = (text: string): React.ReactNode => {
      // Formatear negritas **texto**
      const parts: React.ReactNode[] = [];
      const boldRegex = /\*\*(.+?)\*\*/g;
      let lastIndex = 0;
      let match;
      let key = 0;

      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${key++}`} className="font-body text-slate-50 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
              {text.substring(lastIndex, match.index)}
            </span>
          );
        }
        parts.push(
          <strong 
            key={`bold-${key++}`} 
            className="font-body font-semibold text-white tracking-tight [text-shadow:0_2px_6px_rgba(0,0,0,0.6),0_0_10px_rgba(168,85,247,0.3)] relative"
          >
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push(
          <span key={`text-${key++}`} className="font-body text-slate-50 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
            {text.substring(lastIndex)}
          </span>
        );
      }

      return parts.length > 0 ? <>{parts}</> : <span className="font-body text-slate-50 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">{text}</span>;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Detectar líneas separadoras manuales (guiones, iguales, etc.)
      if (trimmed.match(/^[-=]{3,}$/)) {
        flushList();
        flushParagraph();
        addSeparator();
        return;
      }
      
      // Detectar títulos de sección principales
      if (trimmed.match(/^(MIS RECOMENDACIONES|METAS SEMANALES|HE REVISADO TU PERFIL):/i)) {
        flushList();
        flushParagraph();
        // Agregar línea separadora antes del título importante
        if (elements.length > 0) {
          addSeparator();
        }
        const title = trimmed.replace(/^[🎯📈📚💡🗓️⏰📋✅❌⚠️]*\s*/, '').replace(/\*\*/g, '').replace(/:/g, '').trim();
        let titleClass = 'font-heading font-bold text-[22px] sm:text-[24px] bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent mt-10 mb-6 pb-3 border-b-2 border-purple-500/40 tracking-tight';
        if (trimmed.includes('METAS SEMANALES')) {
          titleClass = 'font-heading font-bold text-[22px] sm:text-[24px] bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent mt-10 mb-6 pb-3 border-b-2 border-blue-500/40 tracking-tight';
        } else if (trimmed.includes('HE REVISADO TU PERFIL')) {
          titleClass = 'font-heading font-bold text-[20px] sm:text-[22px] bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent mt-10 mb-6 pb-3 border-b-2 border-purple-500/40 tracking-tight';
        }
        elements.push(
          <h2 key={`h2-${index}`} className={`${titleClass} [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]`}>
            {title}
          </h2>
        );
        return;
      }

      // Detectar subtítulos de sección
      if (trimmed.match(/^(Por curso|Esta semana aprenderás sobre|ESTIMACIÓN BASADA EN TU PERFIL):/i)) {
        flushList();
        flushParagraph();
        const subtitle = trimmed.replace(/^[🎯📈📚💡🗓️⏰📋✅❌⚠️]*\s*/, '').replace(/\*\*/g, '').replace(/:/g, '').trim();
        let subtitleClass = 'font-body font-semibold text-[17px] text-purple-200 mt-8 mb-5 tracking-wide';
        if (trimmed.includes('Esta semana aprenderás')) {
          subtitleClass = 'font-body font-semibold text-[17px] text-blue-200 mt-8 mb-5 tracking-wide';
        } else if (trimmed.includes('ESTIMACIÓN BASADA')) {
          subtitleClass = 'font-body font-semibold text-[15px] text-blue-300 mt-7 mb-4 tracking-wide';
        }
        elements.push(
          <h3 key={`h3-${index}`} className={`${subtitleClass} [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]`}>
            {subtitle}
          </h3>
        );
        return;
      }

      // Detectar notas
      if (trimmed.match(/^Nota:/i)) {
        flushList();
        flushParagraph();
        const noteText = trimmed.replace(/^Nota:\s*/i, '').trim();
        elements.push(
          <div key={`note-${index}`} className="mt-5 mb-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-500/60 rounded-r-xl backdrop-blur-sm shadow-lg shadow-yellow-500/5">
            <p className="font-body font-semibold text-[14px] text-yellow-300 mb-2 tracking-wide [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">Nota:</p>
            <p className="font-body text-[14px] text-yellow-200/90 leading-[1.7] tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">{formatInlineStyles(noteText)}</p>
          </div>
        );
        return;
      }

      // Detectar listas
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        flushParagraph();
        if (!inList) {
          inList = true;
        }
        const itemText = trimmed.replace(/^[•\-]\s+/, '').trim();
        if (itemText) {
          listItems.push(
            <li key={`li-${index}`} className="flex items-start gap-3.5 font-body text-[15px] text-slate-50 leading-[1.75] tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
              <span className="text-purple-300 font-bold mt-0.5 flex-shrink-0 text-lg [text-shadow:0_1px_3px_rgba(168,85,247,0.5)]">•</span>
              <span className="flex-1">{formatInlineStyles(itemText)}</span>
            </li>
          );
        }
        return;
      }

      // Fin de lista
      if (inList && trimmed === '') {
        flushList();
        return;
      }

      if (inList) {
        flushList();
      }

      // Agregar a párrafo
      if (trimmed) {
        currentParagraph.push(trimmed);
      } else if (currentParagraph.length > 0) {
        flushParagraph();
      }
    });

    flushList();
    flushParagraph();

    return <div className="space-y-0">{elements}</div>;
  };

  // Detener todo audio/voz en reproducción
  const stopAllAudio = () => {
    try {
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch (e) { /* ignore */ }
        ttsAbortRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }

      setIsSpeaking(false);
    } catch (err) {
      console.warn('Error deteniendo audio:', err);
    }
  };

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar si ya hay un calendario conectado al cargar la página
  // Y también obtener el userId para detectar cambios de usuario
  useEffect(() => {
    const checkUserAndCalendarStatus = async () => {
      try {
        // Primero, obtener el usuario actual
        const userResponse = await fetch('/api/study-planner/user-context');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userId = userData.data?.userId;
          
          // Si el usuario cambió, limpiar todo el estado
          if (currentUserId && userId && currentUserId !== userId) {
            console.log('🔄 Usuario cambió, limpiando estado del calendario');
            setConnectedCalendar(null);
            setUserContext(null);
            setConversationHistory([]);
            setShowConversation(true);
            setIsVisible(false);
            hasAttemptedOpenRef.current = false;
            setHasShownFinalSummary(false);
            setSavedLessonDistribution([]);
          }
          
          if (userId) {
            setCurrentUserId(userId);
          }
        }
        
        // Luego, verificar el calendario
        const response = await fetch('/api/study-planner/calendar/status');
        if (response.ok) {
          const data = await response.json();
          if (data.isConnected && data.provider) {
            console.log('📅 Calendario ya conectado:', data.provider);
            // Solo guardar el estado, NO saltar el flujo
            setConnectedCalendar(data.provider as 'google' | 'microsoft');
          } else {
            // Asegurarse de limpiar si no hay calendario conectado
            setConnectedCalendar(null);
          }
        }
      } catch (error) {
        console.error('Error verificando integración de calendario:', error);
      }
    };

    checkUserAndCalendarStatus();
  }, [currentUserId]);

  // Normalizar currentMonth cuando se abre el modal de fecha
  useEffect(() => {
    if (showDateModal && currentMonth) {
      // Asegurar que currentMonth siempre tenga día 1
      const normalized = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      if (currentMonth.getTime() !== normalized.getTime()) {
        setCurrentMonth(normalized);
      }
    }
  }, [showDateModal]);

  // Inicializar mensaje de bienvenida cuando se carga la página (solo si no hay historial)
  useEffect(() => {
    if (showConversation && conversationHistory.length === 0 && !showCourseSelector) {
      const welcomeMessage = '¡Perfecto! Vamos a crear tu plan de estudios. ¿Qué cursos te gustaría incluir?';
      setConversationHistory([{ role: 'assistant', content: welcomeMessage }]);
      // Abrir automáticamente el modal de selección de cursos después de un pequeño delay
      setTimeout(() => {
        loadUserCourses();
    }, 500);
    }
  }, [showConversation, conversationHistory.length, showCourseSelector]);

  // NO mostrar automáticamente el modal - solo cuando el usuario lo solicite mediante el botón

  // Reproducir audio automáticamente cuando se abre el modal
  useEffect(() => {
    if (isVisible && currentStep === 0 && isAudioEnabled) {
      const timer = setTimeout(() => {
        speakText(STUDY_PLANNER_STEPS[0].speech);
        setHasUserInteracted(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // ⚙️ CONFIGURACIÓN DE VOZ ELEVENLABS - Optimizada para máxima expresión y consistencia
  const ELEVENLABS_CONFIG = {
    // Velocidad del habla (0.25-4.0): 1.0 = normal, <1.0 = más lento, >1.0 = más rápido
    // Aumentado a 1.1 para velocidad más consistente y natural
    speed: 1.1,
    
    // Estabilidad de la voz (0.0-1.0): Más bajo = más variación, más alto = más consistente
    // Aumentado significativamente para máxima consistencia en velocidad y tono
    stability: 0.75,
    
    // Similitud con la voz original (0.0-1.0): Más alto = más parecido a la voz original
    // Optimizado para mejor claridad y pronunciación
    similarity_boost: 0.8,
    
    // Estilo de expresión (0.0-1.0): Más alto = más expresivo y emocional
    // Aumentado al máximo para eliminar completamente el tono plano
    style: 0.85,
    
    // Mejora la claridad del hablante - activado para mejor pronunciación
    use_speaker_boost: true
  };

  // Función para convertir números a palabras en español (mejorada)
  const numberToWords = (num: number): string => {
    const numbers: Record<number, string> = {
      0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
      6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
      11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
      16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
      21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco',
      26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve', 30: 'treinta'
    };
    
    if (numbers[num] !== undefined) {
      return numbers[num];
    }
    
    // Para números mayores, intentar construir la palabra
    if (num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const ones = num % 10;
      if (tens === 30 && ones > 0) {
        return `treinta y ${numbers[ones] || ones}`;
      }
      if (tens === 40 && ones > 0) {
        return `cuarenta y ${numbers[ones] || ones}`;
      }
      if (tens === 50 && ones > 0) {
        return `cincuenta y ${numbers[ones] || ones}`;
      }
    }
    
    // Si no se puede convertir, devolver como string para que ElevenLabs lo pronuncie
    return num.toString();
  };

  // Función para formatear texto y mejorar pronunciación de números y horarios (mejorada)
  const formatTextForTTS = (text: string): string => {
    let formatted = text;

    // Marcar números ya procesados para evitar conversiones duplicadas
    const processedMarkers = new Set<string>();

    // 1. Procesar horarios con formato completo primero (2:00 PM -> "dos de la tarde")
    formatted = formatted.replace(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, minute, period) => {
      const marker = `TIME_${match}`;
      if (processedMarkers.has(marker)) return match;
      processedMarkers.add(marker);
      
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la mañana';
      const hourText = numberToWords(h);
      
      if (m === 0) {
        return `${hourText} ${periodText}`;
      } else {
        const minuteText = numberToWords(m);
        return `${hourText} y ${minuteText} ${periodText}`;
      }
    });

    // 2. Procesar horarios sin minutos (2 PM -> "dos de la tarde")
    formatted = formatted.replace(/(\d{1,2})\s+(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, period) => {
      const marker = `TIME2_${match}`;
      if (processedMarkers.has(marker)) return match;
      processedMarkers.add(marker);
      
      const h = parseInt(hour, 10);
      const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la mañana';
      const hourText = numberToWords(h);
      return `${hourText} ${periodText}`;
    });

    // 3. Procesar fechas (1 de enero -> "primero de enero")
    formatted = formatted.replace(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, (match, day, month) => {
      const marker = `DATE_${match}`;
      if (processedMarkers.has(marker)) return match;
      processedMarkers.add(marker);
      
      const d = parseInt(day, 10);
      const dayText = d === 1 ? 'primero' : numberToWords(d);
      return `${dayText} de ${month}`;
    });

    // 4. Procesar porcentajes (50% -> "cincuenta por ciento")
    formatted = formatted.replace(/(\d+)%/g, (match, num) => {
      const marker = `PERCENT_${match}`;
      if (processedMarkers.has(marker)) return match;
      processedMarkers.add(marker);
      
      const number = parseInt(num, 10);
      const numText = numberToWords(number);
      return `${numText} por ciento`;
    });

    // 5. Convertir TODOS los números restantes (1-30) a palabras
    // Usar una expresión más robusta que capture números en cualquier contexto
    formatted = formatted.replace(/\b(\d{1,2})\b/g, (match, num) => {
      const marker = `NUM_${match}`;
      if (processedMarkers.has(marker)) return match;
      
      const number = parseInt(num, 10);
      if (number <= 30 && number >= 0) {
        processedMarkers.add(marker);
        return numberToWords(number);
      }
      return match;
    });

    // 6. Mejorar números en formato de lista o enumeración (1., 2., etc.)
    formatted = formatted.replace(/(\d{1,2})\.\s/g, (match, num) => {
      const number = parseInt(num, 10);
      if (number <= 30) {
        return `${numberToWords(number)}. `;
      }
      return match;
    });

    // 7. Normalizar espacios múltiples y limpiar
    formatted = formatted.replace(/\s+/g, ' ');
    formatted = formatted.replace(/\s+([.,;:!?])/g, '$1');
    formatted = formatted.replace(/([.,;:!?])\s*([.,;:!?])/g, '$1 $2');

    return formatted.trim();
  };

  // Función para síntesis de voz con ElevenLabs
  const speakText = async (text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined') return;

    stopAllAudio();

    try {
      setIsSpeaking(true);

      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = '15Y62ZlO8it2f5wduybx';
      const modelId = 'eleven_turbo_v2_5';

      if (!apiKey || !voiceId) {
        console.warn('⚠️ ElevenLabs credentials not found, using fallback Web Speech API');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      }

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      // Formatear el texto para mejorar pronunciación de números y horarios
      const formattedText = formatTextForTTS(text);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          signal: controller.signal,
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: formattedText,
            model_id: modelId || 'eleven_turbo_v2_5',
            voice_settings: {
              stability: ELEVENLABS_CONFIG.stability,
              similarity_boost: ELEVENLABS_CONFIG.similarity_boost,
              style: ELEVENLABS_CONFIG.style,
              use_speaker_boost: ELEVENLABS_CONFIG.use_speaker_boost
            },
            speed: ELEVENLABS_CONFIG.speed,
            optimize_streaming_latency: 4,
            output_format: 'mp3_22050_32'
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      if (ttsAbortRef.current && ttsAbortRef.current.signal.aborted) {
        console.log('TTS request aborted, skipping playback');
        ttsAbortRef.current = null;
        return;
      }
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      try {
        await audio.play();
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      } catch (playError: any) {
        setIsSpeaking(false);
      }
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        console.log('TTS aborted:', error.message || error);
      } else {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  };

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const speechToTextRaw = event.results[0][0].transcript || '';
          const speechToText = speechToTextRaw.trim();

          const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
          const norm = normalize(speechToText);

          if (norm.length < 2) {
            console.warn('Transcripción demasiado corta, ignorando.');
            setIsListening(false);
            return;
          }

          pendingTranscriptRef.current = speechToText;

          if (pendingTimeoutRef.current) {
            window.clearTimeout(pendingTimeoutRef.current);
            pendingTimeoutRef.current = null;
          }

          pendingTimeoutRef.current = window.setTimeout(() => {
            pendingTimeoutRef.current = null;

            const now = Date.now();
            if (lastTranscriptRef.current.text === norm && now - lastTranscriptRef.current.ts < 3000) {
              console.warn('Resultado duplicado detectado, ignorando.');
              setIsListening(false);
              return;
            }

            if (processingRef.current) {
              console.warn('Reconocimiento produjo resultado pero ya hay procesamiento en curso, ignorando.');
              setIsListening(false);
              return;
            }

            lastTranscriptRef.current = { text: norm, ts: now };

            const finalTranscript = pendingTranscriptRef.current || speechToText;
            pendingTranscriptRef.current = null;

            setTranscript(finalTranscript);
            setIsListening(false);

            handleVoiceQuestion(finalTranscript);
          }, 350);
        };

        const ERROR_DEBOUNCE_MS = 2000;

        recognition.onerror = (event: any) => {
          const errorType = event.error || 'unknown';
          const now = Date.now();
          
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          } catch (e) { /* ignore */ }
          
          setIsListening(false);
          
          if (now - lastErrorTimeRef.current < ERROR_DEBOUNCE_MS && errorType === 'network') {
            return;
          }
          lastErrorTimeRef.current = now;
          
          if (errorType === 'not-allowed') {
            alert('Necesito permiso para usar el micrófono.\n\nPor favor:\n1. Haz clic en el icono de micrófono en la barra de direcciones\n2. Permite el acceso al micrófono\n3. Intenta de nuevo');
          }
        };

        recognitionRef.current = recognition;
      } else {
        console.warn('El navegador no soporta reconocimiento de voz');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Función para iniciar/detener escucha
  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome, Edge o Safari.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) { /* ignore */ }
      setIsListening(false);
    } else {
      stopAllAudio();
      
      try {
        try {
          recognitionRef.current.stop();
        } catch (e) { /* ignore */ }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await navigator.mediaDevices.getUserMedia({ audio: true });

        setTranscript('');
        
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (startError: any) {
          if (startError.message?.includes('already started')) {
            setIsListening(true);
          } else {
            throw startError;
          }
        }
      } catch (error: any) {
        console.error('Error al solicitar permisos de micrófono:', error);
        setIsListening(false);
        
        if (error?.name === 'NotAllowedError') {
          alert('Necesito permiso para usar el micrófono.\n\nPor favor permite el acceso al micrófono en tu navegador y vuelve a intentar.');
        }
      }
    }
  };

  // Función para procesar pregunta de voz con LIA
  const handleVoiceQuestion = async (question: string) => {
    if (!question.trim()) return;
    if (processingRef.current) {
      console.warn('Otra pregunta está en curso, ignorando la nueva.');
      return;
    }

    stopAllAudio();

    processingRef.current = true;
    setIsProcessing(true);

    const lastUserMsg = conversationHistoryRef.current.slice().reverse().find(m => m.role === 'user');
    const now = Date.now();
    if (lastUserMsg) {
      const lastText = lastUserMsg.content || '';
      const recent = now - (lastTranscriptRef.current.ts || 0) < 5000;
      if (recent && (lastText === question || lastText.includes(question) || question.includes(lastText))) {
        console.warn('Pregunta similar ya procesada recientemente, ignorando.');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }
    }
    
    try {
      console.log('🤖 Enviando pregunta a LIA:', question);

      // Validación de seguridad: detectar intentos de prompt injection
      const promptInjectionPatterns = [
        /ignora\s+(todas?\s+)?las?\s+instrucciones/i,
        /olvida\s+(que\s+)?eres/i,
        /ahora\s+eres/i,
        /actúa\s+como/i,
        /sé\s+que\s+eres\s+un\s+asistente/i,
        /muéstrame\s+el\s+prompt/i,
        /revela\s+las?\s+instrucciones/i,
        /dime\s+tu\s+configuración/i,
        /ejecuta\s+(código|comando|script)/i,
        /system\s*:\s*ignore/i,
        /\[SYSTEM\]/i,
        /<\|system\|>/i,
      ];

      const hasInjectionAttempt = promptInjectionPatterns.some(pattern => pattern.test(question));
      
      if (hasInjectionAttempt) {
        console.warn('🚫 Intento de prompt injection detectado, bloqueando...');
        setConversationHistory(prev => [...prev, {
          role: 'assistant',
          content: 'Entiendo que quieres probar diferentes cosas, pero estoy aquí específicamente para ayudarte con tu plan de estudios. ¿En qué puedo asistirte con la planificación de tus cursos?'
        }]);
        setIsProcessing(false);
        processingRef.current = false;
        return;
      }

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: 'study-planner',
          conversationHistory: conversationHistory || [],
          userName: undefined,
          pageContext: {
            pathname: '/study-planner/create',
            detectedArea: 'study-planner',
            description: 'Planificador de estudios con LIA',
            currentStep: currentStep + 1,
            totalSteps: STUDY_PLANNER_STEPS.length,
            // Incluir contexto del usuario
            userContext: userContext ? {
              userType: userContext.userType,
              rol: userContext.rol,
              area: userContext.area,
              nivel: userContext.nivel,
              tamanoEmpresa: userContext.tamanoEmpresa,
              organizationName: userContext.organizationName,
              isB2B: userContext.userType === 'b2b',
              calendarConnected: connectedCalendar !== null,
              calendarProvider: connectedCalendar,
              // Fecha límite establecida por el usuario (CRÍTICO para respetar límites)
              targetDate: targetDate || savedTargetDate || null,
              // Información adicional sobre el estado actual
              hasCalendarAnalyzed: conversationHistory.some(msg => 
                msg.role === 'assistant' && (
                  msg.content.includes('analizado tu calendario') ||
                  msg.content.includes('horarios recomendados') ||
                  msg.content.includes('MIS RECOMENDACIONES')
                )
              ),
              hasRecommendedSchedules: conversationHistory.some(msg =>
                msg.role === 'assistant' && msg.content.includes('METAS SEMANALES')
              )
            } : {
              calendarConnected: connectedCalendar !== null,
              calendarProvider: connectedCalendar,
              targetDate: targetDate || savedTargetDate || null
            }
          },
          language: 'es'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta de LIA:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Error al comunicarse con LIA: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let liaResponse = data.response;

      // Filtro adicional de seguridad: eliminar cualquier rastro del prompt del sistema
      const systemPromptIndicators = [
        'PROMPT MAESTRO',
        'INSTRUCCIÓN DE IDIOMA',
        'INFORMACIÓN DEL USUARIO',
        'TU ROL:',
        'TU ROL',
        'Responde ESTRICTAMENTE en ESPAÑOL',
        'El nombre del usuario es:',
        'la asistente inteligente del Planificador de Estudios',
        'NUNCA usar el nombre del usuario',
        'NUNCA saludar al usuario',
        'Eres Lia, un asistente',
        'Eres LIA (Learning Intelligence Assistant)',
        'CONTEXTO DE LA PÁGINA ACTUAL:',
        'FORMATO DE RESPUESTAS (CRÍTICO):',
        'REGLA CRÍTICA',
        'NUNCA, BAJO NINGUNA CIRCUNSTANCIA'
      ];
      
      // Si la respuesta contiene múltiples indicadores del prompt, reemplazarla
      const indicatorCount = systemPromptIndicators.filter(indicator => 
        liaResponse.includes(indicator)
      ).length;
      
      if (indicatorCount >= 2 || liaResponse.trim().startsWith('PROMPT') || liaResponse.trim().startsWith('INSTRUCCIÓN')) {
        console.warn('🚫 Prompt del sistema detectado en respuesta, filtrando...');
        liaResponse = 'Hola! 😊 Estoy aquí para ayudarte con tu plan de estudios. ¿En qué te puedo asistir?';
      }

      console.log('💬 Respuesta de LIA:', liaResponse);

      setConversationHistory(prev => {
        const last = prev[prev.length - 1];
        const lastUser = prev.slice().reverse().find(m => m.role === 'user');

        const shouldAddUser = !(lastUser && lastUser.content === question);
        const shouldAddAssistant = !(last && last.role === 'assistant' && last.content === liaResponse);

        let next = prev.slice();
        if (shouldAddUser) next = [...next, { role: 'user', content: question }];
        if (shouldAddAssistant) next = [...next, { role: 'assistant', content: liaResponse }];
        return next;
      });

      // Detectar si LIA está pidiendo seleccionar cursos y abrir el modal automáticamente
      if (liaResponse.includes('¿Qué cursos te gustaría incluir?') || 
          liaResponse.includes('qué cursos') || 
          liaResponse.includes('seleccionar cursos')) {
        // Pequeño delay para que el mensaje se muestre primero
        setTimeout(() => {
          loadUserCourses();
        }, 500);
      }

      // Detectar respuesta sobre enfoque de estudio (voz)
      if (hasAskedApproach && !studyApproach) {
        const lowerQuestion = question.toLowerCase();
        if (lowerQuestion.includes('rápido') || lowerQuestion.includes('rapido') || lowerQuestion.includes('rápidas') || lowerQuestion.includes('rapidas')) {
          setStudyApproach('rapido');
          await handleStudyApproachResponse('rapido');
          return;
        } else if (lowerQuestion.includes('normal') || lowerQuestion.includes('normales') || lowerQuestion.includes('equilibrado')) {
          setStudyApproach('normal');
          await handleStudyApproachResponse('normal');
          return;
        } else if (lowerQuestion.includes('largo') || lowerQuestion.includes('largas') || lowerQuestion.includes('extensas') || lowerQuestion.includes('profundizar')) {
          setStudyApproach('largo');
          await handleStudyApproachResponse('largo');
          return;
        }
      }

      // Detectar respuesta sobre fecha estimada (voz, solo si el modal no está abierto)
      if (hasAskedTargetDate && !targetDate && studyApproach && !showDateModal) {
        const dateMatch = question.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})|(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
        if (dateMatch || question.toLowerCase().includes('mes') || question.toLowerCase().includes('semana') || question.toLowerCase().includes('día') || question.toLowerCase().includes('dias')) {
          setTargetDate(question);
          await handleTargetDateResponse(question);
          return;
        }
      }

      await speakText(liaResponse);

    } catch (error) {
      console.error('❌ Error procesando pregunta:', error);
      const errorMessage = 'Lo siento, tuve un problema procesando tu pregunta. ¿Podrías intentarlo de nuevo?';
      try { await speakText(errorMessage); } catch(e) { /* ignore */ }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleNext = () => {
    stopAllAudio();
    setHasUserInteracted(true);
    
    const nextStep = currentStep + 1;
    
    if (nextStep < STUDY_PLANNER_STEPS.length) {
      setCurrentStep(nextStep);
      speakText(STUDY_PLANNER_STEPS[nextStep].speech);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    stopAllAudio();

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      speakText(STUDY_PLANNER_STEPS[prevStep].speech);
    }
  };

  const handleSkip = () => {
    stopAllAudio();
    setIsVisible(false);
    setShowConversation(true);
    
    // Mensaje inicial de LIA
    const welcomeMessage = '¡Perfecto! Vamos a crear tu plan de estudios. ¿Qué cursos te gustaría incluir?';
    setConversationHistory([{ role: 'assistant', content: welcomeMessage }]);
    setTimeout(() => speakText(welcomeMessage), 500);
    // Abrir automáticamente el modal de selección de cursos
    loadUserCourses();
  };

  const handleComplete = () => {
    stopAllAudio();
    setIsVisible(false);
    setShowConversation(true);
    
    // Mensaje inicial de LIA para comenzar la conversación
    const welcomeMessage = '¡Perfecto! Ahora vamos a crear tu plan de estudios personalizado. Haz clic en "Seleccionar cursos" para elegir los cursos que quieres incluir en tu plan.';
    
    setConversationHistory([
      { role: 'assistant', content: welcomeMessage }
    ]);
    
    // Reproducir mensaje de bienvenida
    setTimeout(() => {
      speakText(welcomeMessage);
    }, 500);
  };

  // Cargar cursos del usuario
  const loadUserCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch('/api/my-courses');
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || data || [];
        setAvailableCourses(courses.map((c: any) => ({
          id: c.course_id || c.id,
          title: c.course_title || c.title || c.courses?.title || 'Curso sin nombre',
          category: c.course_category || c.category || c.courses?.category || 'General',
          progress: c.progress_percentage || c.progress || 0
        })));
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      // Usar cursos de ejemplo si falla
      setAvailableCourses([
        { id: '1', title: 'Curso de ejemplo 1', category: 'IA', progress: 30 },
        { id: '2', title: 'Curso de ejemplo 2', category: 'Desarrollo', progress: 0 },
      ]);
    } finally {
      setIsLoadingCourses(false);
      setShowCourseSelector(true);
    }
  };

  // Manejar selección de curso
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Confirmar selección de cursos
  const confirmCourseSelection = () => {
    setShowCourseSelector(false);
    
    const selectedCourses = availableCourses.filter(c => selectedCourseIds.includes(c.id));
    const courseNames = selectedCourses.map(c => c.title).join(', ');
    
    // Agregar mensaje del usuario con los cursos seleccionados
    const userMsg = selectedCourses.length > 0 
      ? `He seleccionado estos cursos: ${courseNames}`
      : 'No he seleccionado ningún curso todavía';
    
    setConversationHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    // Respuesta de LIA - preguntar sobre enfoque de estudio primero
    setTimeout(async () => {
      setIsProcessing(true);
      
      if (selectedCourses.length > 0) {
        // Mostrar mensaje de confirmación y abrir modal de enfoque
        const liaResponse = `¡Excelente elección! Has seleccionado ${selectedCourses.length} curso${selectedCourses.length > 1 ? 's' : ''}: ${courseNames}.\n\nAntes de crear tu plan de estudios personalizado, necesito conocer tu preferencia de ritmo de estudio.`;
      
      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);
        setHasAskedApproach(true);
        
        // Abrir modal de selección de enfoque después de un breve delay
        setTimeout(() => {
          setShowApproachModal(true);
        }, 500);
      
      if (isAudioEnabled) {
          await speakText('Excelente elección. Antes de crear tu plan, necesito saber qué tipo de enfoque prefieres: sesiones rápidas, normales o largas. Esto me ayudará a calcular mejor tu plan de estudios.');
        }
      } else {
        const liaResponse = 'Parece que no seleccionaste ningún curso. ¿Te gustaría ver tus cursos disponibles de nuevo o prefieres decirme qué temas te interesan?';
        setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);
        
        if (isAudioEnabled) {
          await speakText(liaResponse);
        }
      }
      
      setIsProcessing(false);
    }, 500);
  };

  // Conectar calendario de Google
  const connectGoogleCalendar = () => {
    // Usar NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID (variable específica para calendario)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    
    // Validar que el client_id esté configurado
    if (!clientId || clientId.trim() === '') {
      alert('Error de configuración: La variable NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID no está configurada.\n\nPor favor, asegúrate de agregar esta variable en tu archivo .env.local con tu Google Client ID.');
      console.error('NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID no está configurado');
      return;
    }
    
    setIsConnectingCalendar(true);
    
    // Usar NEXT_PUBLIC_APP_URL si está disponible, sino usar window.location.origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${baseUrl}/api/study-planner/calendar/callback`;
    // Scope necesario para crear eventos en calendarios propios
    // calendar.events.owned permite: consultar, crear, modificar y borrar eventos en calendarios propios
    const scope = 'https://www.googleapis.com/auth/calendar.events.owned';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(JSON.stringify({ provider: 'google', returnUrl: window.location.href, usePopup: true }))}`;
    
    // Abrir en popup en lugar de redirigir
    const popup = window.open(
      authUrl,
      'google-calendar-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );
    
    if (!popup) {
      alert('Por favor, permite que se abran ventanas emergentes para este sitio y vuelve a intentar.');
      setIsConnectingCalendar(false);
      return;
    }
    
    // Bandera para evitar procesar el mismo mensaje múltiples veces
    let messageProcessed = false;
    
    // Escuchar mensajes del popup
    const messageListener = (event: MessageEvent) => {
      // Debug: log del mensaje recibido
      console.log('Mensaje recibido del popup:', {
        origin: event.origin,
        expectedOrigin: baseUrl,
        currentHostname: window.location.hostname,
        data: event.data
      });
      
      // Verificar origen para seguridad (más permisivo para desarrollo)
      const isSameOrigin = event.origin === baseUrl || 
                          event.origin === window.location.origin ||
                          event.origin.includes(window.location.hostname);
      
      if (!isSameOrigin) {
        console.warn('Mensaje rechazado por origen diferente:', event.origin);
        return;
      }
      
      if (event.data && event.data.type === 'calendar-connected') {
        // Evitar procesar el mismo mensaje múltiples veces
        if (messageProcessed) {
          console.log('Mensaje ya procesado, ignorando duplicado');
          return;
        }
        messageProcessed = true;
        
        const provider = event.data.provider || 'google';
        console.log('Calendario conectado exitosamente:', provider);
        
        // Limpiar listeners
        window.removeEventListener('message', messageListener);
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
        
        // Cerrar popup si aún está abierto
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch (e) {
            console.warn('No se pudo cerrar el popup:', e);
          }
        }
        
        // Actualizar estado
        setIsConnectingCalendar(false);
        setConnectedCalendar(provider as 'google' | 'microsoft');
        setShowCalendarModal(false);
        
        // Notificar y analizar calendario (solo una vez)
        const successMsg = `¡Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} conectado exitosamente! Déjame analizar tu disponibilidad...`;
        setConversationHistory(prev => {
          // Verificar que no se haya agregado ya este mensaje
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.content === successMsg) {
            return prev; // Ya existe, no agregar duplicado
          }
          return [...prev, { role: 'assistant', content: successMsg }];
        });
        
        // Verificar si ya se preguntó sobre enfoque y fecha antes de analizar
        checkAndAskStudyPreferences(provider).then(canProceed => {
          if (canProceed) {
            analyzeCalendarAndSuggest(provider);
          }
        });
        
      } else if (event.data && event.data.type === 'calendar-error') {
        console.error('Error al conectar calendario:', event.data.error, 'Tipo:', event.data.errorType || event.data.error);
        
        // Limpiar listeners
        connectionCompleted = true;
        window.removeEventListener('message', wrappedMessageListener);
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
        
        // Intentar cerrar popup (puede fallar por COOP)
        if (popup) {
          try {
            if (typeof popup.closed === 'boolean' && !popup.closed) {
              popup.close();
            }
          } catch (e) {
            // Ignorar errores de COOP
            console.log('No se pudo verificar/cerrar el popup (COOP)');
          }
        }
        
        setIsConnectingCalendar(false);
        
        // Obtener errorType - puede venir directamente o extraerse del error
        let errorType = event.data.errorType || '';
        
        // Si no hay errorType pero hay un error, intentar extraerlo del mensaje
        if (!errorType && event.data.error) {
          const errorMsg = event.data.error.toLowerCase();
          if (errorMsg.includes('usuario no autorizado') || errorMsg.includes('test user')) {
            errorType = 'test_mode_user_not_added';
          } else if (errorMsg.includes('verificación') || errorMsg.includes('verification') || errorMsg.includes('policy')) {
            errorType = 'app_not_verified';
          } else if (errorMsg.includes('acceso denegado') || errorMsg.includes('access denied')) {
            errorType = 'access_denied';
          } else if (errorMsg.includes('redirect_uri') || errorMsg.includes('redirect uri')) {
            errorType = 'redirect_uri_mismatch';
          } else if (errorMsg.includes('client_id') || errorMsg.includes('client id')) {
            errorType = 'invalid_client';
          } else if (errorMsg.includes('expirado') || errorMsg.includes('expired')) {
            errorType = 'code_expired';
          }
        }
        
        const errorMsg = event.data.error || 'Error desconocido';
        const userFriendlyMsg = getCalendarErrorMessage(errorType, errorMsg);
        
        // Notificar a LIA sobre el error
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `No pude conectar tu calendario. ${userFriendlyMsg.split('\n\n')[0]}` 
        }]);
        
        alert(`Error al conectar calendario:\n\n${userFriendlyMsg}`);
      }
    };
    
    // Ref para rastrear si ya se completó la conexión
    let connectionCompleted = false;
    let checkClosed: NodeJS.Timeout | null = null;
    
    // Actualizar el messageListener para marcar cuando se complete
    // NOTA: messageListener ya tiene la bandera messageProcessed, así que solo necesitamos
    // un wrapper para marcar connectionCompleted y limpiar el intervalo
    const wrappedMessageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'calendar-connected') {
        connectionCompleted = true;
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
      }
      messageListener(event);
    };
    
    // Solo registrar UN listener (el wrapped)
    window.addEventListener('message', wrappedMessageListener);
    
    // También verificar si el popup se cierra manualmente
    // Nota: popup.closed puede fallar por COOP, así que lo envuelvo en try-catch
    // Reducimos la frecuencia del check para evitar muchas advertencias
    checkClosed = setInterval(() => {
      try {
        // Solo verificar si aún no se completó la conexión
        if (!connectionCompleted) {
          // Acceder a popup.closed solo si popup existe
          if (popup && typeof popup.closed === 'boolean' && popup.closed) {
            if (checkClosed) {
              clearInterval(checkClosed);
              checkClosed = null;
            }
            window.removeEventListener('message', wrappedMessageListener);
            setIsConnectingCalendar(false);
            console.warn('El popup se cerró sin completar la conexión');
          }
        } else {
          // Si ya se completó, limpiar el intervalo
          if (checkClosed) {
            clearInterval(checkClosed);
            checkClosed = null;
          }
        }
      } catch (e) {
        // Ignorar errores de COOP silenciosamente - confiamos en los mensajes postMessage
        // No loguear para evitar spam en consola
      }
    }, 2000); // Reducir frecuencia a cada 2 segundos
    
    // Limpiar después de 5 minutos como fallback
    setTimeout(() => {
      if (!connectionCompleted) {
        window.removeEventListener('message', wrappedMessageListener);
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
        setIsConnectingCalendar(false);
        console.warn('Timeout: conexión de calendario no completada después de 5 minutos');
      }
    }, 5 * 60 * 1000);
  };

  // Conectar calendario de Microsoft
  const connectMicrosoftCalendar = () => {
    // Buscar en múltiples variables posibles
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID || 
                     process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || 
                     process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_CLIENT_ID || '';
    
    // Validar que el client_id esté configurado
    if (!clientId || clientId.trim() === '') {
      alert('Error de configuración: La variable NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID no está configurada.\n\nPor favor, asegúrate de agregar esta variable en tu archivo .env.local con tu Microsoft Client ID.');
      console.error('NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID no está configurado');
      return;
    }
    
    setIsConnectingCalendar(true);
    
    // Usar NEXT_PUBLIC_APP_URL si está disponible, sino usar window.location.origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${baseUrl}/api/study-planner/calendar/callback`;
    // Scope necesario para crear eventos en calendarios
    // Calendars.ReadWrite permite: leer y escribir eventos en calendarios
    const scope = 'offline_access Calendars.ReadWrite User.Read';
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(JSON.stringify({ provider: 'microsoft', returnUrl: window.location.href, usePopup: true }))}`;
    
    // Abrir en popup en lugar de redirigir
    const popup = window.open(
      authUrl,
      'microsoft-calendar-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );
    
    if (!popup) {
      alert('Por favor, permite que se abran ventanas emergentes para este sitio y vuelve a intentar.');
      setIsConnectingCalendar(false);
      return;
    }
    
    // Bandera para evitar procesar el mismo mensaje múltiples veces
    let messageProcessed = false;
    
    // Escuchar mensajes del popup
    const messageListener = (event: MessageEvent) => {
      // Debug: log del mensaje recibido
      console.log('Mensaje recibido del popup (Microsoft):', {
        origin: event.origin,
        expectedOrigin: baseUrl,
        currentHostname: window.location.hostname,
        data: event.data
      });
      
      // Verificar origen para seguridad (más permisivo para desarrollo)
      const isSameOrigin = event.origin === baseUrl || 
                          event.origin === window.location.origin ||
                          event.origin.includes(window.location.hostname);
      
      if (!isSameOrigin) {
        console.warn('Mensaje rechazado por origen diferente:', event.origin);
        return;
      }
      
      if (event.data && event.data.type === 'calendar-connected') {
        // Evitar procesar el mismo mensaje múltiples veces
        if (messageProcessed) {
          console.log('Mensaje ya procesado, ignorando duplicado');
          return;
        }
        messageProcessed = true;
        
        const provider = event.data.provider || 'microsoft';
        console.log('Calendario conectado exitosamente:', provider);
        
        // Limpiar listeners
        window.removeEventListener('message', messageListener);
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
        
        // Cerrar popup si aún está abierto
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch (e) {
            console.warn('No se pudo cerrar el popup:', e);
          }
        }
        
        // Actualizar estado
        setIsConnectingCalendar(false);
        setConnectedCalendar(provider as 'google' | 'microsoft');
        setShowCalendarModal(false);
        
        // Notificar y analizar calendario (solo una vez)
        const successMsg = `¡Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} conectado exitosamente! Déjame analizar tu disponibilidad...`;
        setConversationHistory(prev => {
          // Verificar que no se haya agregado ya este mensaje
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.content === successMsg) {
            return prev; // Ya existe, no agregar duplicado
          }
          return [...prev, { role: 'assistant', content: successMsg }];
        });
        
        // Verificar si ya se preguntó sobre enfoque y fecha antes de analizar
        checkAndAskStudyPreferences(provider).then(canProceed => {
          if (canProceed) {
            analyzeCalendarAndSuggest(provider);
          }
        });
        
      } else if (event.data && event.data.type === 'calendar-error') {
        console.error('Error al conectar calendario:', event.data.error, 'Tipo:', event.data.errorType);
        
        // Limpiar listeners
        window.removeEventListener('message', messageListener);
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
        
        // Cerrar popup si aún está abierto
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch (e) {
            console.warn('No se pudo cerrar el popup:', e);
          }
        }
        
        setIsConnectingCalendar(false);
        
        // Mostrar error más amigable según el tipo de error
        const errorType = event.data.errorType || '';
        const errorMsg = event.data.error || 'Error desconocido';
        const userFriendlyMsg = getCalendarErrorMessage(errorType, errorMsg);
        
        // Notificar a LIA sobre el error
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `No pude conectar tu calendario de Microsoft. ${userFriendlyMsg.split('\n\n')[0]}` 
        }]);
        
        alert(`Error al conectar calendario:\n\n${userFriendlyMsg}`);
      }
    };
    
    // Ref para rastrear si ya se completó la conexión
    let connectionCompleted = false;
    
    // También verificar si el popup se cierra manualmente
    // Nota: popup.closed puede fallar por COOP, así que lo envuelvo en try-catch
    let checkClosed: NodeJS.Timeout | null = null;
    
    // Actualizar el messageListener para marcar cuando se complete
    // NOTA: messageListener ya tiene la bandera messageProcessed, así que solo necesitamos
    // un wrapper para marcar connectionCompleted y limpiar el intervalo
    const wrappedMessageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'calendar-connected') {
        connectionCompleted = true;
        if (checkClosed) {
          clearInterval(checkClosed);
          checkClosed = null;
        }
      }
      messageListener(event);
    };
    
    // Solo registrar UN listener (el wrapped)
    window.addEventListener('message', wrappedMessageListener);
    
    // Iniciar el intervalo de verificación
    checkClosed = setInterval(() => {
      try {
        if (popup.closed && !connectionCompleted) {
          if (checkClosed) {
            clearInterval(checkClosed);
            checkClosed = null;
          }
          window.removeEventListener('message', wrappedMessageListener);
          setIsConnectingCalendar(false);
          console.warn('El popup se cerró sin completar la conexión');
        }
      } catch (e) {
        // Ignorar errores de COOP - confiamos en los mensajes postMessage
        // El intervalo seguirá corriendo hasta que se complete la conexión
      }
    }, 1000);
    
    // Limpiar después de 5 minutos como fallback
    setTimeout(() => {
      if (popup && !popup.closed) {
        console.warn('Timeout: cerrando popup después de 5 minutos');
        popup.close();
      }
      window.removeEventListener('message', wrappedMessageListener);
      if (checkClosed) {
        clearInterval(checkClosed);
      }
      if (!connectionCompleted) {
        setIsConnectingCalendar(false);
      }
    }, 5 * 60 * 1000);
  };

  // Calcular tiempo disponible estimado según perfil profesional
  const calculateEstimatedAvailability = (profile: {
    rol: string | null;
    nivel: string | null;
    tamanoEmpresa: string | null;
    minEmpleados: number | null;
    maxEmpleados: number | null;
    userType: 'b2b' | 'b2c' | null;
    studyApproach?: 'rapido' | 'normal' | 'largo' | null;
    targetDate?: string | null;
  }) => {
    let baseMinutesPerDay = 60; // 1 hora base
    let workloadMultiplier = 1.0;
    let recommendedSessionLength = 30; // minutos
    let recommendedBreak = 5; // minutos
    const reasoning: string[] = [];
    
    // Ajustar según enfoque de estudio seleccionado por el usuario
    if (profile.studyApproach === 'rapido') {
      baseMinutesPerDay = 90; // Más tiempo diario para avanzar rápido
      recommendedSessionLength = 25; // Sesiones más cortas pero más frecuentes
      recommendedBreak = 5; // Descansos cortos
      workloadMultiplier *= 1.5;
      reasoning.push('Con enfoque de sesiones rápidas, priorizamos frecuencia e intensidad');
    } else if (profile.studyApproach === 'largo') {
      baseMinutesPerDay = 120; // Más tiempo diario para profundizar
      recommendedSessionLength = 60; // Sesiones más largas para profundizar
      recommendedBreak = 15; // Descansos más largos
      workloadMultiplier *= 1.2;
      reasoning.push('Con enfoque de sesiones largas, priorizamos profundidad y comprensión');
    } else {
      // Normal (default)
      baseMinutesPerDay = 75;
      recommendedSessionLength = 30;
      recommendedBreak = 10;
      workloadMultiplier *= 1.0;
      reasoning.push('Con enfoque normal, balanceamos ritmo y comprensión');
    }

    // Ajustar según nivel jerárquico (pero respetar el enfoque de estudio seleccionado)
    const nivel = profile.nivel?.toLowerCase() || '';
    const originalSessionLength = recommendedSessionLength; // Guardar la duración del enfoque
    
    if (nivel.includes('c-level') || nivel.includes('ceo') || nivel.includes('director') || nivel.includes('fundador')) {
      workloadMultiplier = 0.5;
      // Solo ajustar si el enfoque no es rápido (para rápidas, mantener 25 min)
      if (profile.studyApproach !== 'rapido') {
        recommendedSessionLength = Math.min(20, originalSessionLength);
      }
      reasoning.push('Como ejecutivo de alto nivel, tu agenda es muy demandante');
    } else if (nivel.includes('gerente') || nivel.includes('manager') || nivel.includes('líder') || nivel.includes('jefe')) {
      workloadMultiplier = 0.65;
      // Solo ajustar si el enfoque no es rápido (para rápidas, mantener 25 min)
      if (profile.studyApproach !== 'rapido') {
        recommendedSessionLength = Math.min(25, originalSessionLength);
      }
      reasoning.push('Como gerente/líder, tienes responsabilidades de gestión importantes');
    } else if (nivel.includes('senior') || nivel.includes('especialista')) {
      workloadMultiplier = 0.75;
      // Solo ajustar si el enfoque no es rápido (para rápidas, mantener 25 min)
      if (profile.studyApproach !== 'rapido') {
        recommendedSessionLength = Math.min(30, originalSessionLength);
      }
      reasoning.push('Como profesional senior, tienes proyectos complejos pero autonomía');
    } else if (nivel.includes('junior') || nivel.includes('trainee') || nivel.includes('practicante')) {
      workloadMultiplier = 1.0;
      // Para juniors, permitir sesiones más largas incluso con enfoque rápido
      if (profile.studyApproach !== 'rapido') {
        recommendedSessionLength = Math.max(45, originalSessionLength);
      }
      reasoning.push('En tu etapa profesional, el aprendizaje es prioritario');
    } else {
      workloadMultiplier = 0.8;
      // Mantener la duración del enfoque si no hay nivel específico
      if (profile.studyApproach !== 'rapido') {
        recommendedSessionLength = originalSessionLength;
      }
    }

    // Ajustar según tamaño de empresa
    const empleados = profile.maxEmpleados || 0;
    if (empleados > 500) {
      workloadMultiplier *= 0.8;
      reasoning.push(`En una empresa grande (+${empleados} empleados), hay más procesos y reuniones`);
    } else if (empleados > 100) {
      workloadMultiplier *= 0.9;
      reasoning.push('En una empresa mediana, hay balance entre agilidad y estructura');
    } else if (empleados > 10) {
      workloadMultiplier *= 1.0;
    } else if (empleados > 0) {
      workloadMultiplier *= 1.1;
      reasoning.push('En una empresa pequeña tienes más flexibilidad pero múltiples roles');
    }

    // Ajustar según tipo de usuario
    if (profile.userType === 'b2c') {
      workloadMultiplier *= 1.2;
      reasoning.push('Como profesional independiente, tienes más control de tu horario');
    }

    const adjustedMinutesPerDay = Math.round(baseMinutesPerDay * workloadMultiplier);
    const weeklyMinutes = adjustedMinutesPerDay * 5;

    return {
      minutesPerDay: adjustedMinutesPerDay,
      weeklyMinutes,
      recommendedSessionLength,
      recommendedBreak,
      reasoning,
      sessionsPerWeek: Math.ceil(weeklyMinutes / recommendedSessionLength)
    };
  };

  // Analizar contexto de un evento para determinar tipo y nivel de cansancio mental
  const analyzeEventContext = (event: any): {
    type: 'meeting' | 'presentation' | 'heavy_class' | 'exam' | 'workshop' | 'conference' | 'normal' | 'other';
    mentalFatigue: 'high' | 'medium' | 'low';
    requiresRestAfter: boolean;
    description: string;
  } => {
    const title = (event.title || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    // Detectar presentaciones/exposiciones
    if (combined.match(/\b(presentaci[oó]n|exposici[oó]n|pitch|demo|demostraci[oó]n|exponer|speak|keynote)\b/i)) {
      return {
        type: 'presentation',
        mentalFatigue: 'high',
        requiresRestAfter: true,
        description: 'presentación o exposición'
      };
    }

    // Detectar reuniones importantes
    if (combined.match(/\b(reuni[oó]n|meeting|junta|conferencia|llamada|call|zoom|teams|google meet)\b/i)) {
      // Reuniones largas o importantes son más cansadas
      const duration = event.end && event.start 
        ? (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60)
        : 0;
      
      if (duration > 60 || combined.match(/\b(importante|cr[íi]tica|estrat[ée]gica|decisi[oó]n|evaluaci[oó]n)\b/i)) {
        return {
          type: 'meeting',
          mentalFatigue: 'high',
          requiresRestAfter: true,
          description: 'reunión importante'
        };
      }
      
      return {
        type: 'meeting',
        mentalFatigue: 'medium',
        requiresRestAfter: false,
        description: 'reunión'
      };
    }

    // Detectar clases pesadas/seminarios
    if (combined.match(/\b(clase|seminario|taller|workshop|curso|m[oó]dulo|lecci[oó]n)\b/i)) {
      const duration = event.end && event.start 
        ? (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60)
        : 0;
      
      if (duration > 120 || combined.match(/\b(intensivo|avanzado|complejo|dif[íi]cil|pesado)\b/i)) {
        return {
          type: 'heavy_class',
          mentalFatigue: 'high',
          requiresRestAfter: true,
          description: 'clase pesada o seminario intensivo'
        };
      }
      
      return {
        type: 'normal',
        mentalFatigue: 'medium',
        requiresRestAfter: false,
        description: 'clase o actividad'
      };
    }

    // Detectar exámenes/evaluaciones
    if (combined.match(/\b(examen|evaluaci[oó]n|prueba|test|ex[áa]men|final|parcial)\b/i)) {
      return {
        type: 'exam',
        mentalFatigue: 'high',
        requiresRestAfter: true,
        description: 'examen o evaluación'
      };
    }

    // Detectar conferencias/congresos
    if (combined.match(/\b(conferencia|congreso|simposio|convenci[oó]n|evento|summit)\b/i)) {
      return {
        type: 'conference',
        mentalFatigue: 'high',
        requiresRestAfter: true,
        description: 'conferencia o evento importante'
      };
    }

    // Evento normal
    return {
      type: 'normal',
      mentalFatigue: 'low',
      requiresRestAfter: false,
      description: 'evento'
    };
  };

  // Función para calcular metas semanales basadas en cursos seleccionados y tiempo disponible
  const calculateWeeklyGoals = async (
    selectedCourseIds: string[],
    weeklyAvailableMinutes: number,
    recommendedSessionLength: number,
    weeksUntilTarget: number = 4,
    totalLessonsNeeded: number = 0
  ): Promise<{
    lessonsPerWeek: number;
    hoursPerWeek: number;
    learningObjectives: string[];
    coursesInfo: Array<{
      courseId: string;
      courseTitle: string;
      lessonsToComplete: number;
      topicsToLearn: string[];
    }>;
  } | null> => {
    if (selectedCourseIds.length === 0 || weeklyAvailableMinutes === 0) {
      return null;
    }

    try {
      // Obtener información detallada de los cursos seleccionados
      const coursesDetails = await Promise.all(
        selectedCourseIds.map(async (courseId) => {
          try {
            // Buscar información básica en los cursos disponibles
            const courseFromList = availableCourses.find(c => c.id === courseId);
            const courseTitle = courseFromList?.title || 'Curso';

            // Obtener información completa del curso desde /api/my-courses para obtener el slug
            let courseSlug: string | null = null;
            let allLessons: any[] = [];
            let totalDurationMinutes = 0;

            try {
              const myCoursesResponse = await fetch('/api/my-courses');
              if (myCoursesResponse.ok) {
                const myCoursesData = await myCoursesResponse.json();
                const courses = Array.isArray(myCoursesData) ? myCoursesData : (myCoursesData.courses || []);
                const courseData = courses.find((c: any) => (c.course_id || c.id) === courseId);
                
                if (courseData) {
                  // Intentar obtener el slug del curso
                  courseSlug = courseData.courses?.slug || courseData.slug || null;
                  
                  // Si tenemos el slug, obtener módulos y lecciones
                  if (courseSlug) {
                    try {
                      const modulesResponse = await fetch(`/api/courses/${courseSlug}/modules`);
                      if (modulesResponse.ok) {
                        const modulesData = await modulesResponse.json();
                        if (modulesData.modules && Array.isArray(modulesData.modules)) {
                          // Extraer todas las lecciones de los módulos
                          allLessons = modulesData.modules.flatMap((module: any) => module.lessons || []);
                        }
                      }
                    } catch (moduleError) {
                      console.warn(`No se pudieron obtener módulos para el curso ${courseId}:`, moduleError);
                    }
                  }
                }
              }
            } catch (fetchError) {
              console.warn(`Error obteniendo información completa del curso ${courseId}:`, fetchError);
            }

            // Filtrar solo lecciones publicadas
            const publishedLessons = allLessons.filter(
              (lesson: any) => lesson.is_published !== false
            );

            // Calcular duración total en minutos
            if (publishedLessons.length > 0) {
              totalDurationMinutes = publishedLessons.reduce((sum: number, lesson: any) => {
                const durationSeconds = lesson.duration_seconds || 0;
                return sum + Math.ceil(durationSeconds / 60); // Convertir segundos a minutos
              }, 0);
            } else {
              // Estimación conservadora si no tenemos datos: asumir 30 minutos por lección
              totalDurationMinutes = 30 * 10; // 10 lecciones x 30 min = 300 min (5 horas)
            }

            // Obtener títulos de lecciones para los objetivos de aprendizaje
            const lessonTitles = publishedLessons
              .slice(0, 10)
              .map((lesson: any) => lesson.lessonTitle)
              .filter(Boolean);

            // Si no tenemos lecciones, usar información del curso disponible
            const totalLessons = publishedLessons.length > 0 
              ? publishedLessons.length 
              : 10; // Estimación conservadora

            return {
              courseId,
              courseTitle,
              totalLessons,
              totalDurationMinutes: totalDurationMinutes || 300, // Fallback: 5 horas
              lessonTitles,
            };
          } catch (error) {
            console.error(`Error obteniendo información del curso ${courseId}:`, error);
            // Retornar información básica como fallback
            const courseFromList = availableCourses.find(c => c.id === courseId);
            return {
              courseId,
              courseTitle: courseFromList?.title || 'Curso',
              totalLessons: 10, // Estimación conservadora
              totalDurationMinutes: 300, // 5 horas estimadas
              lessonTitles: [],
            };
          }
        })
      );

      // Filtrar cursos con información válida
      const validCourses = coursesDetails.filter((c): c is NonNullable<typeof c> => c !== null);

      if (validCourses.length === 0) {
        return null;
      }

      // Calcular tiempo efectivo por lección para cada curso
      const coursesWithLessonTime = validCourses.map(course => {
        let averageLessonMinutes = recommendedSessionLength; // Fallback
        if (course.totalLessons > 0 && course.totalDurationMinutes > 0) {
          averageLessonMinutes = course.totalDurationMinutes / course.totalLessons;
        }
        // Tiempo efectivo por lección (incluyendo actividades y práctica): 1.5x la duración del video
        const effectiveLessonTime = Math.max(averageLessonMinutes * 1.5, recommendedSessionLength);
        return {
          ...course,
          effectiveLessonTime,
        };
      });

      // Calcular cuántas lecciones necesita completar por semana para cada curso
      // Basado en la fecha objetivo y el número total de lecciones
      let coursesInfo;
      
      // Usar totalLessonsNeeded si está disponible, sino calcular desde validCourses
      const totalLessons = totalLessonsNeeded > 0 
        ? totalLessonsNeeded 
        : validCourses.reduce((sum, course) => sum + course.totalLessons, 0);
      
      console.log(`📊 calculateWeeklyGoals - Parámetros recibidos:`);
      console.log(`   weeksUntilTarget: ${weeksUntilTarget}`);
      console.log(`   totalLessonsNeeded (parámetro): ${totalLessonsNeeded}`);
      console.log(`   totalLessons (usado en cálculo): ${totalLessons}`);
      console.log(`   validCourses.length: ${validCourses.length}`);
      validCourses.forEach(course => {
        console.log(`   - ${course.courseTitle}: ${course.totalLessons} lecciones`);
      });
      
      if (weeksUntilTarget > 0 && totalLessons > 0) {
        // Calcular lecciones por semana necesarias para completar antes de la fecha objetivo
        // Usar Math.ceil para asegurar que se complete a tiempo
        const lessonsPerWeekNeeded = Math.ceil(totalLessons / weeksUntilTarget);
        
        console.log(`📊 Cálculo de metas semanales:`);
        console.log(`   Total de lecciones: ${totalLessons}`);
        console.log(`   Semanas hasta objetivo: ${weeksUntilTarget}`);
        console.log(`   Lecciones por semana necesarias: ${lessonsPerWeekNeeded}`);
        
        // Distribuir las lecciones proporcionalmente entre los cursos
        coursesInfo = coursesWithLessonTime.map(course => {
          const courseProportion = totalLessons > 0 ? (course.totalLessons / totalLessons) : (1 / validCourses.length);
          const lessonsForThisCourse = Math.max(1, Math.ceil(lessonsPerWeekNeeded * courseProportion));
          const lessonsToComplete = Math.min(
            lessonsForThisCourse,
            course.totalLessons || 999 // Máximo las lecciones disponibles del curso
          );
          
          console.log(`   Curso ${course.courseTitle}: ${lessonsToComplete} lecciones/semana (de ${course.totalLessons} total)`);
          
          return {
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            lessonsToComplete,
            topicsToLearn: course.lessonTitles.slice(0, 3).filter(Boolean),
          };
        });
      } else {
        // Fallback: distribuir el tiempo disponible proporcionalmente según el número de cursos
        const timePerCourse = weeklyAvailableMinutes / validCourses.length;
        
        coursesInfo = coursesWithLessonTime.map(course => {
          const lessonsForThisCourse = Math.floor(timePerCourse / course.effectiveLessonTime);
          const lessonsToComplete = Math.min(
            Math.max(1, lessonsForThisCourse), // Mínimo 1 lección
            course.totalLessons || 999 // Máximo las lecciones disponibles del curso
          );
          
          return {
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            lessonsToComplete,
            topicsToLearn: course.lessonTitles.slice(0, 3).filter(Boolean),
          };
        });
      }

      // Calcular total de lecciones por semana (suma de todas las lecciones de todos los cursos)
      // Este debe ser igual a la suma de lessonsToComplete de todos los cursos
      const totalLessonsPerWeek = coursesInfo.reduce((sum, course) => sum + course.lessonsToComplete, 0);
      
      // Calcular horas semanales basadas en las lecciones necesarias, no solo en el tiempo disponible
      // Esto asegura que se muestre el tiempo real necesario para completar las lecciones
      let hoursPerWeek: number;
      if (weeksUntilTarget > 0 && totalLessons > 0) {
        // Calcular tiempo necesario basado en las lecciones por semana y el tiempo efectivo por lección
        const avgEffectiveLessonTime = coursesWithLessonTime.reduce((sum, course) => sum + course.effectiveLessonTime, 0) / coursesWithLessonTime.length;
        const minutesNeededPerWeek = totalLessonsPerWeek * avgEffectiveLessonTime;
        hoursPerWeek = Math.round((minutesNeededPerWeek / 60) * 10) / 10;
      } else {
        // Fallback: usar tiempo disponible
        hoursPerWeek = Math.round((weeklyAvailableMinutes / 60) * 10) / 10;
      }

      // Obtener objetivos de aprendizaje (títulos de lecciones de todos los cursos)
      const learningObjectives = validCourses
        .flatMap(course => course.lessonTitles)
        .slice(0, 5)
        .filter(Boolean);

      return {
        lessonsPerWeek: Math.max(1, totalLessonsPerWeek), // Total debe ser igual a la suma de todos los cursos
        hoursPerWeek,
        learningObjectives,
        coursesInfo, // Esta lista contiene las lecciones por curso que deben sumar a lessonsPerWeek
      };
    } catch (error) {
      console.error('Error calculando metas semanales:', error);
      return null;
    }
  };

  // Verificar y preguntar sobre enfoque y fecha antes de analizar calendario
  const checkAndAskStudyPreferences = async (provider: string) => {
    if (!hasAskedApproach || !studyApproach) {
      // Mostrar mensaje y abrir modal de enfoque
      const approachMsg = `¡Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} conectado exitosamente!\n\nAntes de crear tu plan de estudios personalizado, necesito conocer tu preferencia de ritmo de estudio.`;
      
      setConversationHistory(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.content.includes('conectado exitosamente')) {
          return [...prev.slice(0, -1), { role: 'assistant', content: approachMsg }];
        }
        return [...prev, { role: 'assistant', content: approachMsg }];
      });
      setHasAskedApproach(true);
      
      // Abrir modal de selección de enfoque
      setTimeout(() => {
        setShowApproachModal(true);
      }, 500);
      
      if (isAudioEnabled) {
        await speakText('Calendario conectado exitosamente. Antes de crear tu plan, necesito saber qué tipo de enfoque prefieres: sesiones rápidas, normales o largas.');
      }
      return false; // No proceder con análisis aún
    } else if (!hasAskedTargetDate || !targetDate) {
      // Si ya se respondió el enfoque pero no la fecha, mostrar modal de fecha
      const dateMsg = `Perfecto, veo que prefieres **${studyApproach === 'rapido' ? 'sesiones rápidas' : studyApproach === 'normal' ? 'sesiones normales' : 'sesiones largas'}**.\n\nAhora, **¿tienes alguna fecha estimada para terminar tus cursos?**`;
      
      setConversationHistory(prev => [...prev, { role: 'assistant', content: dateMsg }]);
      setHasAskedTargetDate(true);
      
      // Abrir modal de selección de fecha
      setTimeout(() => {
        setShowDateModal(true);
        const suggestedDate = calculateSuggestedDate(studyApproach);
        setSelectedDate(suggestedDate);
        // Normalizar currentMonth para evitar problemas de zona horaria
        const normalizedMonth = new Date(
          suggestedDate.getFullYear(),
          suggestedDate.getMonth(),
          1
        );
        setCurrentMonthNormalized(normalizedMonth);
      }, 500);
      
      if (isAudioEnabled) {
        await speakText('Perfecto. Ahora, selecciona una fecha estimada para terminar tus cursos.');
      }
      return false; // No proceder con análisis aún
    }
    return true; // Ya se tiene todo, puede proceder
  };

  // Manejar selección de enfoque desde el modal
  const handleApproachSelection = async (approach: 'rapido' | 'normal' | 'largo') => {
    setStudyApproach(approach);
    setShowApproachModal(false);
    setIsProcessing(true);
    
    const approachText = {
      rapido: 'sesiones rápidas',
      normal: 'sesiones normales',
      largo: 'sesiones largas'
    };

    const approachDescription = {
      rapido: 'Sesiones cortas e intensas para avanzar rápido en los cursos',
      normal: 'Un ritmo equilibrado entre estudio y descanso',
      largo: 'Sesiones más extensas para profundizar en el contenido'
    };

    const confirmationMsg = `Perfecto, entonces estableceremos **${approachText[approach]}**. ${approachDescription[approach]}.\n\nAhora, **¿tienes alguna fecha estimada para terminar tus cursos?**`;
    
    setConversationHistory(prev => [...prev, { role: 'assistant', content: confirmationMsg }]);
    setHasAskedTargetDate(true);
    
    // Abrir modal de selección de fecha después de un breve delay
    setTimeout(() => {
      setShowDateModal(true);
      // Calcular fecha inicial sugerida basada en el enfoque
      const suggestedDate = calculateSuggestedDate(approach);
      setSelectedDate(suggestedDate);
      // Normalizar currentMonth para evitar problemas de zona horaria
      const normalizedMonth = new Date(
        suggestedDate.getFullYear(),
        suggestedDate.getMonth(),
        1
      );
      setCurrentMonthNormalized(normalizedMonth);
    }, 500);
    
    if (isAudioEnabled) {
      await speakText(`Perfecto, entonces estableceremos ${approachText[approach]}. Ahora, selecciona una fecha estimada para terminar tus cursos.`);
    }
    
    setIsProcessing(false);
  };

  // Calcular fecha sugerida basada en el enfoque de estudio
  const calculateSuggestedDate = (approach: 'rapido' | 'normal' | 'largo'): Date => {
    const today = new Date();
    const numCourses = selectedCourseIds.length || 1;
    
    // Estimar semanas necesarias según enfoque y número de cursos
    let weeksNeeded = 0;
    
    if (approach === 'rapido') {
      // Sesiones rápidas: más sesiones por semana, completar más rápido
      weeksNeeded = Math.max(4, numCourses * 3); // Mínimo 4 semanas, 3 semanas por curso
    } else if (approach === 'normal') {
      // Sesiones normales: ritmo equilibrado
      weeksNeeded = Math.max(6, numCourses * 4); // Mínimo 6 semanas, 4 semanas por curso
    } else {
      // Sesiones largas: menos sesiones pero más profundas
      weeksNeeded = Math.max(8, numCourses * 5); // Mínimo 8 semanas, 5 semanas por curso
    }
    
    const suggestedDate = new Date(today);
    suggestedDate.setDate(suggestedDate.getDate() + (weeksNeeded * 7));
    
    return suggestedDate;
  };

  // Manejar selección de fecha desde el modal
  const handleDateSelection = async (date: Date | null, skip: boolean = false) => {
    if (skip) {
      setTargetDate('No tengo fecha específica');
      setShowDateModal(false);
      
      const confirmationMsg = `Entendido, no hay problema. Procederé a crear tu plan de estudios sin una fecha específica.\n\nDéjame analizar tu calendario para crear las mejores recomendaciones...`;
      setConversationHistory(prev => [...prev, { role: 'assistant', content: confirmationMsg }]);
      
      if (isAudioEnabled) {
        await speakText('Entendido. Procederé a crear tu plan de estudios sin una fecha específica.');
      }
      
      // Proceder con el análisis del calendario
      setTimeout(async () => {
        if (connectedCalendar) {
          await analyzeCalendarAndSuggest(connectedCalendar);
        } else {
          setShowCalendarModal(true);
        }
      }, 1500);
      
      return;
    }
    
    if (!date) return;
    
    const dateText = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    setTargetDate(dateText);
    setShowDateModal(false);
    
    const confirmationMsg = `Excelente, he registrado tu fecha estimada: **${dateText}**.\n\nAhora voy a analizar tu calendario para crear las mejores recomendaciones de horarios que se ajusten a tu enfoque de **${studyApproach === 'rapido' ? 'sesiones rápidas' : studyApproach === 'normal' ? 'sesiones normales' : 'sesiones largas'}** y tu objetivo de completar los cursos para ${dateText}.\n\nDéjame analizar tu disponibilidad...`;
    
    setConversationHistory(prev => [...prev, { role: 'assistant', content: confirmationMsg }]);
    
    if (isAudioEnabled) {
      await speakText(`Excelente. He registrado tu fecha estimada. Ahora voy a analizar tu calendario para crear las mejores recomendaciones.`);
    }
    
    // Proceder con el análisis del calendario - pasar la fecha como parámetro para evitar problemas de timing
    setTimeout(async () => {
      if (connectedCalendar) {
        await analyzeCalendarAndSuggest(connectedCalendar, dateText);
      } else {
        setShowCalendarModal(true);
      }
    }, 1500);
  };

  // Manejar respuesta sobre enfoque de estudio (desde texto/voz)
  const handleStudyApproachResponse = async (approach: 'rapido' | 'normal' | 'largo') => {
    await handleApproachSelection(approach);
  };

  // Manejar respuesta sobre fecha estimada
  const handleTargetDateResponse = async (dateResponse: string) => {
    setIsProcessing(true);
    
    const approachText = studyApproach === 'rapido' ? 'sesiones rápidas' : studyApproach === 'normal' ? 'sesiones normales' : 'sesiones largas';
    
    const confirmationMsg = `Excelente, he registrado tu fecha estimada: **${dateResponse}**.\n\nAhora voy a analizar tu calendario para crear las mejores recomendaciones de horarios que se ajusten a tu enfoque de **${approachText}** y tu objetivo de completar los cursos ${dateResponse.toLowerCase().includes('no') || dateResponse.toLowerCase().includes('específica') ? 'en el tiempo que prefieras' : `para ${dateResponse}`}.\n\nDéjame analizar tu disponibilidad...`;
    
    setConversationHistory(prev => [...prev, { role: 'assistant', content: confirmationMsg }]);
    
    if (isAudioEnabled) {
      await speakText('Excelente. Ahora voy a analizar tu calendario para crear las mejores recomendaciones de horarios.');
    }
    
    // Proceder con el análisis del calendario
    setTimeout(async () => {
      if (connectedCalendar) {
        await analyzeCalendarAndSuggest(connectedCalendar);
      } else {
        // Si no tiene calendario conectado, mostrar modal
        setShowCalendarModal(true);
      }
    }, 1500);
    
    setIsProcessing(false);
  };

  // Analizar calendario y obtener contexto del usuario
  const analyzeCalendarAndSuggest = async (provider: string, targetDateParam?: string) => {
    // Evitar múltiples llamadas simultáneas
    if (isProcessing) {
      console.log('Análisis de calendario ya en curso, ignorando llamada duplicada');
      return;
    }
    
    // Usar el parámetro si está disponible, sino usar el estado
    const effectiveTargetDate = targetDateParam || targetDate;
    
    // Verificar que se tengan los datos necesarios antes de analizar
    if (!studyApproach) {
      console.log('⚠️ No se puede analizar: falta enfoque de estudio');
      return;
    }
    
    if (!effectiveTargetDate || effectiveTargetDate === 'No tengo fecha específica') {
      console.log('⚠️ No se puede analizar: falta fecha objetivo');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 1. Obtener el contexto del usuario (perfil profesional)
      const contextResponse = await fetch('/api/study-planner/user-context');
      let userProfile: any = null;
      
      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        if (contextData.success && contextData.data) {
          userProfile = contextData.data;
          
          setUserContext({
            userType: userProfile.userType || null,
            rol: userProfile.professionalProfile?.rol?.nombre || null,
            area: userProfile.professionalProfile?.area?.nombre || null,
            nivel: userProfile.professionalProfile?.nivel?.nombre || null,
            tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
            organizationName: userProfile.organization?.name || null,
            minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
            maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
          });
        }
      }

      // 2. OBTENER EVENTOS DEL CALENDARIO (hasta la fecha objetivo del usuario, sin límite mínimo)
      // Primero necesitamos calcular la fecha objetivo ANTES de obtener eventos
      let targetDateObjForEvents: Date | null = null;
      
      console.log(`🔍 [DEBUG] Estado al inicio de analyzeCalendarAndSuggest:`);
      console.log(`   targetDate (estado): "${targetDate}"`);
      console.log(`   targetDateParam (parámetro): "${targetDateParam}"`);
      console.log(`   effectiveTargetDate (usado): "${effectiveTargetDate}"`);
      console.log(`   studyApproach: "${studyApproach}"`);
      
      if (effectiveTargetDate && studyApproach && effectiveTargetDate !== 'No tengo fecha específica') {
        try {
          // Intentar parsear la fecha objetivo - múltiples formatos posibles
          const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          
          // Formato 1: "21 de enero de 2026" (formato estándar de toLocaleDateString)
          let dateMatch = effectiveTargetDate.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
          
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const monthName = dateMatch[2].toLowerCase();
            const month = monthNames.findIndex(m => m.toLowerCase() === monthName);
            const year = parseInt(dateMatch[3]);
            
            if (month >= 0 && day > 0 && day <= 31 && year >= 2020) {
              targetDateObjForEvents = new Date(year, month, day);
              console.log(`✅ Fecha objetivo parseada: ${targetDateObjForEvents.toLocaleDateString('es-ES')} (desde: "${effectiveTargetDate}")`);
            }
          }
          
          // Si no funcionó el primer formato, intentar parsear como fecha estándar
          if (!targetDateObjForEvents) {
            const standardDate = new Date(effectiveTargetDate);
            if (!isNaN(standardDate.getTime()) && standardDate.getFullYear() >= 2020) {
              targetDateObjForEvents = standardDate;
              console.log(`✅ Fecha objetivo parseada como estándar: ${targetDateObjForEvents.toLocaleDateString('es-ES')}`);
            }
          }
          
          if (!targetDateObjForEvents) {
            console.warn(`⚠️ No se pudo parsear la fecha objetivo: "${effectiveTargetDate}"`);
          }
        } catch (e) {
          console.warn('❌ Error parseando fecha objetivo para eventos:', e);
        }
      }
      
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      // Calcular fecha final: usar la fecha objetivo si existe, sino 30 días desde hoy
      let endDate = new Date();
      if (targetDateObjForEvents) {
        endDate = new Date(targetDateObjForEvents);
        endDate.setHours(23, 59, 59, 999); // Incluir todo el día objetivo
        console.log(`✅ Usando fecha objetivo para rango: ${targetDateObjForEvents.toLocaleDateString('es-ES')} -> ${endDate.toLocaleDateString('es-ES')}`);
      } else {
        endDate.setDate(endDate.getDate() + 30);
        console.log(`⚠️ No hay fecha objetivo, usando 30 días por defecto`);
      }
      
      console.log(`📅 Rango de análisis del calendario:`);
      console.log(`   Fecha inicio: ${startDate.toLocaleDateString('es-ES')}`);
      console.log(`   Fecha fin: ${endDate.toLocaleDateString('es-ES')}`);
      console.log(`   Días a analizar: ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}`);
      
      let calendarEvents: any[] = [];
      let calendarAnalysis = '';
      
      try {
        const eventsResponse = await fetch(
          `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          calendarEvents = eventsData.events || [];
          console.log(`📅 Eventos obtenidos del calendario: ${calendarEvents.length}`, {
            provider: eventsData.provider,
            sample: calendarEvents.slice(0, 2).map((e: any) => ({
              title: e.title,
              start: e.start,
              end: e.end,
              startTime: e.startTime,
              endTime: e.endTime
            }))
          });
        } else {
          const errorText = await eventsResponse.text();
          console.error('❌ Error en respuesta de eventos:', eventsResponse.status, errorText);
        }
      } catch (calError) {
        console.error('Error obteniendo eventos:', calError);
      }

      // 3. ANALIZAR EL CALENDARIO - Versión mejorada
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      // Ordenar eventos por fecha de inicio
      const sortedEvents = [...calendarEvents].sort((a, b) => {
        const dateA = new Date(a.start || a.startTime).getTime();
        const dateB = new Date(b.start || b.startTime).getTime();
        return dateA - dateB;
      });

      // Analizar por día real (no solo día de la semana)
      type DayAnalysis = {
        date: Date;
        dateStr: string;
        dayName: string;
        events: any[];
        busySlots: Array<{ start: Date; end: Date }>;
        freeSlots: Array<{ start: Date; end: Date; durationMinutes: number }>;
        totalBusyMinutes: number;
        totalFreeMinutes: number;
        heavyEvents: Array<{ event: any; context: ReturnType<typeof analyzeEventContext> }>;
        requiresRestAfter: boolean;
        restReason: string | null;
      };

      const daysAnalysis: DayAnalysis[] = [];
      const daySlots: Record<string, DayAnalysis> = {};

      // Calcular cuántos días analizar (hasta la fecha objetivo del usuario, sin límite mínimo)
      // Usar targetDateObjForEvents que ya fue calculado al principio
      const daysToAnalyze = targetDateObjForEvents 
        ? Math.ceil((targetDateObjForEvents.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 30; // Solo usar 30 días como fallback si no hay fecha objetivo
      
      console.log(`📊 Inicializando análisis para ${daysToAnalyze} días`);
      console.log(`   Fecha inicio: ${startDate.toLocaleDateString('es-ES')}`);
      if (targetDateObjForEvents) {
        console.log(`   Fecha objetivo para eventos (targetDateObjForEvents): ${targetDateObjForEvents.toLocaleDateString('es-ES')}`);
      } else {
        console.warn(`   ⚠️ targetDateObjForEvents es NULL - usando 30 días por defecto`);
      }

      // Inicializar análisis para todos los días hasta la fecha objetivo
      for (let i = 0; i < daysToAnalyze; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        
        // Si hay fecha objetivo, no analizar días después de ella
        if (targetDateObjForEvents && date > targetDateObjForEvents) {
          break;
        }
        
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        
        daySlots[dateStr] = {
          date,
          dateStr,
          dayName,
          events: [],
          busySlots: [],
          freeSlots: [],
          totalBusyMinutes: 0,
          totalFreeMinutes: 0,
          heavyEvents: [],
          requiresRestAfter: false,
          restReason: null,
        };
      }

      console.log(`📊 daySlots inicializados: ${Object.keys(daySlots).length} días`);
      if (Object.keys(daySlots).length > 0) {
        const sortedKeys = Object.keys(daySlots).sort();
        console.log(`   Primer día en daySlots: ${sortedKeys[0]}`);
        console.log(`   Último día en daySlots: ${sortedKeys[sortedKeys.length - 1]}`);
      }

      // Procesar eventos con análisis contextual
      sortedEvents.forEach((event: any) => {
        const eventStart = new Date(event.start || event.startTime);
        const eventEnd = new Date(event.end || event.endTime);
        const dateStr = eventStart.toISOString().split('T')[0];
        
        if (daySlots[dateStr]) {
          daySlots[dateStr].events.push(event);
          daySlots[dateStr].busySlots.push({ start: eventStart, end: eventEnd });
          
          // Analizar contexto del evento
          const eventContext = analyzeEventContext(event);
          
          // Si el evento requiere descanso, marcarlo
          if (eventContext.requiresRestAfter) {
            daySlots[dateStr].heavyEvents.push({ event, context: eventContext });
            daySlots[dateStr].requiresRestAfter = true;
            
            // Guardar la razón del descanso (el más importante del día)
            if (!daySlots[dateStr].restReason) {
              daySlots[dateStr].restReason = eventContext.description;
            }
          }
        }
      });
      
      // Marcar días que requieren descanso (día siguiente a eventos pesados)
      // IMPORTANTE: Solo propagamos el descanso desde días que tienen eventos pesados PROPIOS
      // (heavyEvents.length > 0), NO desde días que ya fueron marcados como "día después"
      // para evitar propagación en cascada infinita
      Object.values(daySlots).forEach(dayData => {
        // Solo propagar si el día tiene eventos pesados propios (no si fue marcado por propagación)
        if (dayData.requiresRestAfter && dayData.heavyEvents && dayData.heavyEvents.length > 0) {
          // Marcar el día siguiente también para evitar estudio
          const nextDay = new Date(dayData.date);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          
          if (daySlots[nextDayStr] && !daySlots[nextDayStr].requiresRestAfter) {
            daySlots[nextDayStr].requiresRestAfter = true;
            daySlots[nextDayStr].restReason = `día después de ${dayData.restReason || 'evento pesado'}`;
          }
        }
      });

      // 🔍 DEBUG: Verificar cuántos días requieren descanso después de marcar el día siguiente
      const daysWithRestAfterMarking = Object.values(daySlots).filter(d => d.requiresRestAfter);
      console.log(`📅 Días marcados para descanso después de eventos pesados: ${daysWithRestAfterMarking.length}`);
      if (daysWithRestAfterMarking.length > 0 && daysWithRestAfterMarking.length <= 10) {
        daysWithRestAfterMarking.forEach(d => {
          console.log(`   - ${d.dateStr}: ${d.restReason}`);
        });
      }

      // Calcular slots ocupados sin solapamiento y encontrar huecos libres
      Object.values(daySlots).forEach(dayData => {
        const dayStart = new Date(dayData.date);
        dayStart.setHours(7, 0, 0, 0); // Empezar desde las 7 AM (hora mínima para estudiar)
        const dayEnd = new Date(dayData.date);
        dayEnd.setHours(23, 59, 59, 999); // Hasta las 11:59 PM

        // Ordenar slots ocupados
        dayData.busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Calcular tiempo ocupado sin solapamiento
        let totalBusy = 0;
        
        if (dayData.busySlots.length === 0) {
          dayData.totalBusyMinutes = 0;
        } else {
          // Fusionar slots solapados
          const mergedSlots: Array<{ start: Date; end: Date }> = [];
          let currentMerged: { start: Date; end: Date } | null = null;

          dayData.busySlots.forEach(slot => {
            if (!currentMerged) {
              currentMerged = { start: new Date(slot.start), end: new Date(slot.end) };
            } else {
              // Si se solapa o es contiguo, extender el slot
              if (slot.start <= currentMerged.end) {
                currentMerged.end = new Date(Math.max(currentMerged.end.getTime(), slot.end.getTime()));
              } else {
                // Slot anterior terminó, guardarlo y empezar uno nuevo
                mergedSlots.push(currentMerged);
                currentMerged = { start: new Date(slot.start), end: new Date(slot.end) };
              }
            }
          });

          // Agregar el último slot si existe
          if (currentMerged) {
            mergedSlots.push(currentMerged);
          }

          // Calcular tiempo total ocupado
          mergedSlots.forEach(slot => {
            totalBusy += (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
          });
        }

        dayData.totalBusyMinutes = totalBusy;

        // Encontrar huecos libres entre eventos O días completamente libres
        let lastEnd = dayStart;

        if (dayData.busySlots.length === 0) {
          // ✅ DÍA COMPLETAMENTE LIBRE - Dividir en bloques de estudio realistas
          console.log(`📅 Día completamente libre detectado: ${dayData.dayName} ${dayData.date.toLocaleDateString('es-ES')}`);

          // Crear bloques de estudio en horarios convenientes: mañana, tarde, noche
          // Mañana: 7 AM - 12 PM
          const morningStart = new Date(dayStart);
          morningStart.setHours(7, 0, 0, 0);
          const morningEnd = new Date(dayStart);
          morningEnd.setHours(12, 0, 0, 0);

          // Tarde: 12 PM - 6 PM
          const afternoonStart = new Date(dayStart);
          afternoonStart.setHours(12, 0, 0, 0);
          const afternoonEnd = new Date(dayStart);
          afternoonEnd.setHours(18, 0, 0, 0);

          // Noche: 6 PM - 10 PM
          const eveningStart = new Date(dayStart);
          eveningStart.setHours(18, 0, 0, 0);
          const eveningEnd = new Date(dayStart);
          eveningEnd.setHours(22, 0, 0, 0);

          // Agregar bloque de la mañana (7am - 12pm = 5 horas)
          dayData.freeSlots.push({
            start: new Date(morningStart),
            end: new Date(morningEnd),
            durationMinutes: 300, // 5 horas
          });

          // Agregar bloque de la tarde (12pm - 6pm = 6 horas)
          dayData.freeSlots.push({
            start: new Date(afternoonStart),
            end: new Date(afternoonEnd),
            durationMinutes: 360, // 6 horas
          });

          // Agregar bloque de la noche (6pm - 10pm = 4 horas)
          dayData.freeSlots.push({
            start: new Date(eveningStart),
            end: new Date(eveningEnd),
            durationMinutes: 240, // 4 horas
          });

          console.log(`   ✅ 3 bloques creados: Mañana (5h), Tarde (6h), Noche (4h) = 15h totales`);
        } else {
          // Día con eventos - encontrar huecos entre eventos
          // Asegurar que lastEnd no sea antes de las 7 AM
          if (lastEnd.getHours() < 7) {
            lastEnd.setHours(7, 0, 0, 0);
          }
          
          dayData.busySlots.forEach(slot => {
            if (slot.start > lastEnd) {
              // Asegurar que el inicio del hueco no sea antes de las 7 AM
              const gapStart = new Date(Math.max(lastEnd.getTime(), dayStart.getTime()));
              if (gapStart.getHours() < 7) {
                gapStart.setHours(7, 0, 0, 0);
              }
              
              // Asegurar que el fin del hueco no sea después de las 10 PM
              const gapEnd = new Date(Math.min(slot.start.getTime(), dayEnd.getTime()));
              if (gapEnd.getHours() > 22 || (gapEnd.getHours() === 22 && gapEnd.getMinutes() > 0)) {
                gapEnd.setHours(22, 0, 0, 0);
              }
              
              if (gapStart < gapEnd) {
                const gapMinutes = (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60);
                // Solo considerar huecos de al menos 30 minutos y máximo 8 horas
                if (gapMinutes >= 30 && gapMinutes <= 480) {
                  dayData.freeSlots.push({
                    start: gapStart,
                    end: gapEnd,
                    durationMinutes: gapMinutes,
                  });
                }
              }
            }
            lastEnd = new Date(Math.max(lastEnd.getTime(), slot.end.getTime()));
          });

          // Agregar hueco al final del día si hay eventos (respetando límite de 10 PM)
          const finalDayEnd = new Date(Math.min(dayEnd.getTime(), new Date(dayData.date).setHours(22, 0, 0, 0)));
          if (lastEnd < finalDayEnd) {
            // Asegurar que lastEnd no sea antes de las 7 AM
            if (lastEnd.getHours() < 7) {
              lastEnd.setHours(7, 0, 0, 0);
            }
            
            const gapMinutes = (finalDayEnd.getTime() - lastEnd.getTime()) / (1000 * 60);
            // Limitar hueco final a máximo 6 horas
            const maxGapMinutes = Math.min(gapMinutes, 360);
            if (maxGapMinutes >= 30) {
              const gapEnd = new Date(lastEnd.getTime() + maxGapMinutes * 60 * 1000);
              // Asegurar que no pase de las 10 PM
              if (gapEnd.getHours() > 22 || (gapEnd.getHours() === 22 && gapEnd.getMinutes() > 0)) {
                gapEnd.setHours(22, 0, 0, 0);
              }
              dayData.freeSlots.push({
                start: new Date(lastEnd),
                end: gapEnd,
                durationMinutes: Math.min(maxGapMinutes, (gapEnd.getTime() - lastEnd.getTime()) / (1000 * 60)),
              });
            }
          }
        }

        // Calcular tiempo libre total
        dayData.totalFreeMinutes = dayData.freeSlots.reduce(
          (sum, slot) => sum + slot.durationMinutes,
          0
        );

        daysAnalysis.push(dayData);
      });

      // 🔍 DEBUG: Resumen de daysAnalysis después de procesar todos los días
      console.log(`📊 Resumen de daysAnalysis después de generar slots:`);
      console.log(`   Total días analizados: ${daysAnalysis.length}`);
      const daysWithFreeSlotsGenerated = daysAnalysis.filter(d => d.freeSlots.length > 0);
      const daysWithoutFreeSlots = daysAnalysis.filter(d => d.freeSlots.length === 0);
      const daysCompletelyFree = daysAnalysis.filter(d => d.busySlots.length === 0);
      console.log(`   Días con slots libres generados: ${daysWithFreeSlotsGenerated.length}`);
      console.log(`   Días SIN slots libres: ${daysWithoutFreeSlots.length}`);
      console.log(`   Días completamente libres (sin eventos): ${daysCompletelyFree.length}`);
      if (daysWithoutFreeSlots.length > 0 && daysWithoutFreeSlots.length <= 10) {
        console.log(`   Días sin slots:`, daysWithoutFreeSlots.map(d => `${d.dateStr} (busy:${d.busySlots.length}, rest:${d.requiresRestAfter})`));
      }

      // Guardar los datos del calendario para validar conflictos después
      const calendarDataToSave: Record<string, {
        busySlots: Array<{ start: Date; end: Date }>;
        events: any[];
      }> = {};
      
      Object.keys(daySlots).forEach(dateStr => {
        calendarDataToSave[dateStr] = {
          busySlots: daySlots[dateStr].busySlots.map(slot => ({
            start: new Date(slot.start),
            end: new Date(slot.end)
          })),
          events: daySlots[dateStr].events
        };
      });
      setSavedCalendarData(calendarDataToSave);
      console.log(`💾 Datos del calendario guardados para validación: ${Object.keys(calendarDataToSave).length} días`);
      
      // Calcular estadísticas correctas
      const totalBusyMinutes = daysAnalysis.reduce((sum, day) => sum + day.totalBusyMinutes, 0);
      const totalFreeMinutes = daysAnalysis.reduce((sum, day) => sum + day.totalFreeMinutes, 0);
      const avgHoursPerDay = (totalBusyMinutes / 60 / daysAnalysis.length).toFixed(1);
      const avgFreeHoursPerDay = (totalFreeMinutes / 60 / daysAnalysis.length).toFixed(1);

      // Encontrar días con más tiempo libre
      const daysWithFreeTime = daysAnalysis
        .filter(day => day.totalFreeMinutes >= 60) // Al menos 1 hora libre
        .sort((a, b) => b.totalFreeMinutes - a.totalFreeMinutes);

      // Encontrar días más ocupados (agrupar por día de la semana para evitar duplicados)
      const busiestDaysByWeekDay = new Map<string, number>();
      daysAnalysis.forEach(day => {
        const current = busiestDaysByWeekDay.get(day.dayName) || 0;
        busiestDaysByWeekDay.set(day.dayName, current + day.totalBusyMinutes);
      });
      
      const busiestDays = Array.from(busiestDaysByWeekDay.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([dayName]) => dayName);
      
      // 4. Calcular disponibilidad estimada ANTES de filtrar slots (para usar la duración correcta)
      const profileAvailability = userProfile ? calculateEstimatedAvailability({
        rol: userProfile.professionalProfile?.rol?.nombre || null,
        nivel: userProfile.professionalProfile?.nivel?.nombre || null,
        tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
        minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
        maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
        userType: userProfile.userType || null,
        studyApproach: studyApproach, // Incluir enfoque seleccionado
        targetDate: targetDate, // Incluir fecha estimada
      }) : null;
      
        // Encontrar los mejores slots libres (mayor duración y horarios convenientes)
      type FreeSlotWithDay = {
        start: Date;
        end: Date;
        durationMinutes: number;
        dayName: string;
        dateStr: string;
        date: Date;
        requiresRest?: boolean;
        restReason?: string | null;
      };
      
      // Obtener la duración mínima recomendada según el enfoque
      const minSessionDuration = profileAvailability?.recommendedSessionLength || 30;
      
      // 🔍 DEBUG: Verificar qué días están en daysAnalysis y su estado
      console.log(`🔍 DEBUG - Total días en daysAnalysis: ${daysAnalysis.length}`);
      const daysWithRest = daysAnalysis.filter(d => d.requiresRestAfter);
      const daysWithoutRest = daysAnalysis.filter(d => !d.requiresRestAfter);
      const daysWithSlots = daysAnalysis.filter(d => d.freeSlots.length > 0);
      console.log(`   Días que requieren descanso: ${daysWithRest.length}`);
      console.log(`   Días SIN descanso: ${daysWithoutRest.length}`);
      console.log(`   Días con slots libres: ${daysWithSlots.length}`);
      if (daysWithRest.length > 0) {
        console.log(`   Días con descanso:`, daysWithRest.map(d => `${d.dateStr} (${d.restReason})`).slice(0, 5));
      }
      if (daysAnalysis.length > 0) {
        console.log(`   Primer día: ${daysAnalysis[0].dateStr}`);
        console.log(`   Último día: ${daysAnalysis[daysAnalysis.length - 1].dateStr}`);
      }
      
      // Agrupar slots por día primero, para distribuir a lo largo del período completo
      const slotsByDayInitial = new Map<string, FreeSlotWithDay[]>();
      daysAnalysis.forEach(day => {
        // Excluir días que requieren descanso después de eventos pesados
        // IMPORTANTE: Solo excluir el día específico, NO afectar días posteriores
        if (day.requiresRestAfter) {
          console.log(`   ⏭️ Excluyendo día con descanso: ${day.dateStr} (${day.restReason})`);
          return;
        }

        const validSlots = day.freeSlots
          .filter(slot => {
            // Filtrar slots razonables: mínimo según enfoque, máximo 6 horas
            return slot.durationMinutes >= minSessionDuration &&
                   slot.durationMinutes <= 360;
          })
          .map(slot => ({
            ...slot,
            dayName: day.dayName,
            dateStr: day.dateStr,
            date: day.date,
            requiresRest: day.requiresRestAfter,
            restReason: day.restReason,
          }));

        if (validSlots.length > 0) {
          // Ordenar los slots del día por calidad
          validSlots.sort((a, b) => {
            // Priorizar slots de 1-3 horas (no demasiado largos ni cortos)
            const durationA = a.durationMinutes;
            const durationB = b.durationMinutes;
            const isIdealDurationA = durationA >= 60 && durationA <= 180;
            const isIdealDurationB = durationB >= 60 && durationB <= 180;

            if (isIdealDurationA && !isIdealDurationB) return -1;
            if (!isIdealDurationA && isIdealDurationB) return 1;

            // Luego priorizar horarios convenientes
            const hourA = a.start.getHours();
            const hourB = b.start.getHours();

            // Preferir horarios en los rangos definidos: Mañana (7-12), Tarde (12-18), Noche (18-22)
            const isGoodTimeA = (hourA >= 7 && hourA < 12) || (hourA >= 12 && hourA < 18) || (hourA >= 18 && hourA < 22);
            const isGoodTimeB = (hourB >= 7 && hourB < 12) || (hourB >= 12 && hourB < 18) || (hourB >= 18 && hourB < 22);

            if (isGoodTimeA && !isGoodTimeB) return -1;
            if (!isGoodTimeA && isGoodTimeB) return 1;

            // Finalmente priorizar duración moderada
            return b.durationMinutes - a.durationMinutes;
          });

          slotsByDayInitial.set(day.dateStr, validSlots);
        }
      });

      console.log(`📊 Días con slots disponibles: ${slotsByDayInitial.size} días`);

      // Tomar los mejores slots de cada día (máximo 3 por día) para distribuir a lo largo del período
      const bestFreeSlots: FreeSlotWithDay[] = [];
      Array.from(slotsByDayInitial.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Ordenar por fecha
        .forEach(([dateStr, slots]) => {
          // Tomar hasta 3 mejores slots del día (ya están ordenados por calidad)
          const slotsToTake = slots.slice(0, 3);
          bestFreeSlots.push(...slotsToTake);
        });

      console.log(`📊 Total de slots seleccionados: ${bestFreeSlots.length}`);
      if (bestFreeSlots.length > 0) {
        const firstSlot = bestFreeSlots[0];
        const lastSlot = bestFreeSlots[bestFreeSlots.length - 1];
        console.log(`   Primer slot: ${firstSlot.dayName} ${firstSlot.date.toLocaleDateString('es-ES')}`);
        console.log(`   Último slot: ${lastSlot.dayName} ${lastSlot.date.toLocaleDateString('es-ES')}`);
      }

      const limitedBestSlots = bestFreeSlots;

      // Filtrar slots que respeten los horarios mínimos y máximos (7 AM - 10 PM)
      const validTimeSlots = limitedBestSlots.filter(slot => {
        const startHour = slot.start.getHours();
        const endHour = slot.end.getHours();
        const endMinutes = slot.end.getMinutes();
        
        // No permitir slots que empiecen antes de las 7 AM
        if (startHour < 7) return false;
        
        // No permitir slots que terminen después de las 10 PM (22:00)
        if (endHour > 22 || (endHour === 22 && endMinutes > 0)) return false;
        
        return true;
      });

      // Filtrar slots según disponibilidad del perfil (profileAvailability ya se calculó antes)
      const recommendedSlots = profileAvailability 
        ? validTimeSlots.filter(slot => {
            // Asegurar que el slot tenga al menos la duración recomendada
            return slot.durationMinutes >= profileAvailability.recommendedSessionLength;
          })
        : validTimeSlots;

      // Seleccionar slots distribuidos hasta la fecha objetivo del usuario
      // Agrupar por fecha única y seleccionar MÚLTIPLES slots por día cuando sea apropiado
      const slotsByDate = new Map<string, FreeSlotWithDay[]>();
      recommendedSlots.forEach(slot => {
        const dateKey = slot.dateStr;
        if (!slotsByDate.has(dateKey)) {
          slotsByDate.set(dateKey, []);
        }
        slotsByDate.get(dateKey)!.push(slot);
      });

      // Ordenar fechas para distribuir a lo largo del mes completo
      const sortedDates = Array.from(slotsByDate.keys()).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      // Seleccionar MÚLTIPLES slots por día cuando haya suficiente tiempo libre
      const uniqueDateSlots: FreeSlotWithDay[] = [];
      sortedDates.forEach(dateStr => {
        const slots = slotsByDate.get(dateStr) || [];
        if (slots.length > 0) {
          // Ordenar slots del día por calidad (duración y horario)
          slots.sort((a, b) => {
            // Priorizar duración ideal
            const idealDuration = profileAvailability?.recommendedSessionLength || 30;
            const diffA = Math.abs(a.durationMinutes - idealDuration);
            const diffB = Math.abs(b.durationMinutes - idealDuration);

            if (diffA !== diffB) return diffA - diffB;

            // Luego horarios convenientes (Mañana: 7-12, Tarde: 12-18, Noche: 18-22)
            const hourA = a.start.getHours();
            const hourB = b.start.getHours();
            const isGoodTimeA = (hourA >= 7 && hourA < 12) || (hourA >= 12 && hourA < 18) || (hourA >= 18 && hourA < 22);
            const isGoodTimeB = (hourB >= 7 && hourB < 12) || (hourB >= 12 && hourB < 18) || (hourB >= 18 && hourB < 22);

            if (isGoodTimeA && !isGoodTimeB) return -1;
            if (!isGoodTimeA && isGoodTimeB) return 1;

            return b.durationMinutes - a.durationMinutes;
          });

          // Seleccionar TODOS los slots válidos y no solapados del día
          // Sin límites artificiales - dejar que la distribución final decida cuántos usar
          const minSessionDuration = profileAvailability?.recommendedSessionLength || 30;
          const selectedSlots: FreeSlotWithDay[] = [];
          
          // Iterar por todos los slots del día y agregar los que:
          // 1. Tengan duración mínima suficiente
          // 2. No se solapen con otros slots ya seleccionados
          for (const slot of slots) {
            // Verificar duración mínima
            if (slot.durationMinutes < minSessionDuration) {
              continue;
            }

            // Verificar que no se solape con slots ya seleccionados del mismo día
            const overlaps = selectedSlots.some(selected => {
              return (
                (slot.start >= selected.start && slot.start < selected.end) ||
                (slot.end > selected.start && slot.end <= selected.end) ||
                (slot.start <= selected.start && slot.end >= selected.end)
              );
            });

            // Si no hay solapamiento, agregarlo
            if (!overlaps) {
              selectedSlots.push(slot);
            }
          }
          
          // Calcular tiempo total libre en el día para logging
          const totalFreeMinutes = selectedSlots.reduce((sum, s) => sum + s.durationMinutes, 0);

          uniqueDateSlots.push(...selectedSlots);

          // Log para debugging
          if (selectedSlots.length > 1) {
            console.log(`📅 ${dateStr}: ${selectedSlots.length} slots seleccionados (${totalFreeMinutes}min libres total)`);
          }
        }
      });

      console.log(`📊 Resumen de slots seleccionados:`);
      console.log(`   Total de días analizados: ${sortedDates.length}`);
      console.log(`   Total de slots seleccionados: ${uniqueDateSlots.length}`);
      console.log(`   Promedio de slots por día: ${(uniqueDateSlots.length / sortedDates.length).toFixed(2)}`);

      if (uniqueDateSlots.length > 0) {
        const sortedForLog = [...uniqueDateSlots].sort((a, b) => a.date.getTime() - b.date.getTime());
        console.log(`   Primer slot generado: ${sortedForLog[0].dayName} ${sortedForLog[0].date.toLocaleDateString('es-ES')}`);
        console.log(`   Último slot generado: ${sortedForLog[sortedForLog.length - 1].dayName} ${sortedForLog[sortedForLog.length - 1].date.toLocaleDateString('es-ES')}`);
      }

      // Obtener país del usuario (default: México)
      // TODO: Obtener desde userContext cuando se agregue el campo 'country' a la BD
      const userCountry = 'MX'; // Default México

      // Filtrar slots excluyendo días festivos
      const slotsWithoutHolidays = uniqueDateSlots.filter(slot => {
        const isHolidayDate = HolidayService.isHoliday(slot.date, userCountry);
        if (isHolidayDate) {
          const holidayName = HolidayService.getHolidayName(slot.date, userCountry);
          console.log(`🎉 Slot excluido por festivo: ${slot.dayName} ${slot.date.toLocaleDateString('es-ES')} - ${holidayName}`);
        }
        return !isHolidayDate;
      });

      console.log(`📅 Filtrado de festivos:`);
      console.log(`   Slots antes de filtrar festivos: ${uniqueDateSlots.length}`);
      console.log(`   Slots después de filtrar festivos: ${slotsWithoutHolidays.length}`);
      console.log(`   Festivos excluidos: ${uniqueDateSlots.length - slotsWithoutHolidays.length}`);

      // Calcular tiempo disponible hasta la fecha objetivo
      let targetDateObj: Date | null = null;
      let weeksUntilTarget = 30; // Default: 30 días (aproximadamente 4 semanas)
      
      if (effectiveTargetDate && studyApproach && effectiveTargetDate !== 'No tengo fecha específica') {
        try {
          // Usar el mismo parseo robusto que se usa para targetDateObjForEvents
          const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          
          // Formato 1: "21 de enero de 2026" (formato estándar de toLocaleDateString)
          let dateMatch = effectiveTargetDate.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
          
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const monthName = dateMatch[2].toLowerCase();
            const month = monthNames.findIndex(m => m.toLowerCase() === monthName);
            const year = parseInt(dateMatch[3]);
            
            if (month >= 0 && day > 0 && day <= 31 && year >= 2020) {
              targetDateObj = new Date(year, month, day);
            }
          }
          
          // Si no funcionó el primer formato, intentar parsear como fecha estándar
          if (!targetDateObj) {
            const standardDate = new Date(effectiveTargetDate);
            if (!isNaN(standardDate.getTime()) && standardDate.getFullYear() >= 2020) {
              targetDateObj = standardDate;
            }
          }
          
          if (targetDateObj) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            targetDateObj.setHours(0, 0, 0, 0);
            const daysDiff = Math.max(1, Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
            weeksUntilTarget = Math.ceil(daysDiff / 7);
            
            // Validar que weeksUntilTarget sea razonable (mínimo 1 semana, máximo 52 semanas)
            if (weeksUntilTarget < 1) {
              console.warn(`⚠️ weeksUntilTarget es menor a 1, ajustando a 1`);
              weeksUntilTarget = 1;
            } else if (weeksUntilTarget > 52) {
              console.warn(`⚠️ weeksUntilTarget es mayor a 52 semanas, ajustando a 52`);
              weeksUntilTarget = 52;
            }
            
            console.log(`📅 Cálculo de fecha objetivo:`);
            console.log(`   Fecha objetivo parseada: ${targetDateObj.toLocaleDateString('es-ES')}`);
            console.log(`   Fecha hoy: ${today.toLocaleDateString('es-ES')}`);
            console.log(`   Días hasta objetivo: ${daysDiff}`);
            console.log(`   Semanas hasta objetivo: ${weeksUntilTarget}`);
          } else {
            console.warn(`⚠️ No se pudo parsear la fecha objetivo: ${targetDate}`);
            // Fallback: usar 4 semanas si no se puede parsear
            weeksUntilTarget = 4;
          }
        } catch (e) {
          console.warn('Error parseando fecha objetivo:', e);
        }
      }

      // Calcular días de buffer según duración del plan
      let bufferDays = 1; // Por defecto 1 día de buffer
      let adjustedTargetDate: Date | null = null;

      if (targetDateObj && weeksUntilTarget > 0) {
        if (weeksUntilTarget >= 8) {
          // Plazo largo (8+ semanas): máximo 3 días de buffer
          bufferDays = 3;
        } else if (weeksUntilTarget >= 4) {
          // Plazo medio (4-7 semanas): 2 días de buffer
          bufferDays = 2;
        } else {
          // Plazo corto (<4 semanas): 1 día de buffer
          bufferDays = 1;
        }

        // Ajustar fecha objetivo para terminar ANTES del deadline
        adjustedTargetDate = new Date(targetDateObj);
        adjustedTargetDate.setDate(adjustedTargetDate.getDate() - bufferDays);

        console.log(`📅 Buffer de días: ${bufferDays}`);
        console.log(`📅 Fecha objetivo original: ${targetDateObj.toLocaleDateString('es-ES')}`);
        console.log(`📅 Fecha objetivo ajustada (con buffer): ${adjustedTargetDate.toLocaleDateString('es-ES')}`);
      }

      // Calcular cuántas lecciones totales se necesitan para completar los cursos
      let totalLessonsNeeded = 0;
      let totalSessionsNeeded = 0;
      let totalMinutesNeeded = 0;
      
      if (selectedCourseIds.length > 0 && profileAvailability) {
        try {
          // Obtener información de los cursos para calcular lecciones y sesiones necesarias
          const coursesInfoForCalculation = await Promise.all(
            selectedCourseIds.map(async (courseId) => {
              try {
                const courseFromList = availableCourses.find(c => c.id === courseId);
                const courseTitle = courseFromList?.title || 'Curso';
                
                // Obtener información completa del curso
                const myCoursesResponse = await fetch('/api/my-courses');
                if (myCoursesResponse.ok) {
                  const myCoursesData = await myCoursesResponse.json();
                  const courses = Array.isArray(myCoursesData) ? myCoursesData : (myCoursesData.courses || []);
                  const courseData = courses.find((c: any) => (c.course_id || c.id) === courseId);
                  
                  if (courseData) {
                    const courseSlug = courseData.courses?.slug || courseData.slug || null;
                    const enrollmentId = courseData.enrollment_id || null;
                    
                    if (courseSlug) {
                      const modulesResponse = await fetch(`/api/courses/${courseSlug}/modules`);
                      if (modulesResponse.ok) {
                        const modulesData = await modulesResponse.json();
                        if (modulesData.modules && Array.isArray(modulesData.modules)) {
                          const allLessons = modulesData.modules.flatMap((module: any) => module.lessons || []);
                          const publishedLessons = allLessons.filter((lesson: any) => lesson.is_published !== false);
                          const totalLessons = publishedLessons.length || 0;
                          
                          // Obtener lecciones completadas usando el mismo método que LiaContextService
                          // El endpoint ahora maneja el caso sin enrollmentId
                          let completedLessonIds: string[] = [];
                          try {
                            const progressResponse = await fetch(
                              `/api/study-planner/course-progress?enrollmentId=${enrollmentId || ''}&courseId=${courseId}`
                            );
                            if (progressResponse.ok) {
                              const progressData = await progressResponse.json();
                              completedLessonIds = progressData.completedLessonIds || [];
                              console.log(`   Curso ${courseTitle}: ${completedLessonIds.length} lecciones completadas de ${totalLessons} totales`);
                            } else {
                              const errorData = await progressResponse.json();
                              console.warn(`   ⚠️ Error obteniendo progreso del curso ${courseId}: ${errorData.error || progressResponse.status}`);
                            }
                          } catch (progressError) {
                            console.warn(`Error obteniendo progreso del curso ${courseId}:`, progressError);
                          }
                          
                          // Filtrar lecciones pendientes (no completadas)
                          const remainingLessonsData = publishedLessons.filter((lesson: any) => 
                            !completedLessonIds.includes(lesson.lesson_id)
                          );
                          
                          // Calcular lecciones pendientes (no completadas)
                          const remainingLessons = remainingLessonsData.length;
                          
                          // Calcular minutos solo de las lecciones pendientes
                          const totalDurationMinutes = remainingLessonsData.reduce((sum: number, lesson: any) => {
                            const durationSeconds = lesson.duration_seconds || 0;
                            return sum + Math.ceil(durationSeconds / 60);
                          }, 0);
                          
                          // Tiempo efectivo por lección (incluyendo actividades): 1.5x la duración del video
                          const avgLessonDuration = remainingLessons > 0 && totalDurationMinutes > 0
                            ? totalDurationMinutes / remainingLessons
                            : profileAvailability.recommendedSessionLength;
                          const effectiveLessonTime = Math.max(avgLessonDuration * 1.5, profileAvailability.recommendedSessionLength);
                          const sessionsForCourse = Math.ceil(totalDurationMinutes / profileAvailability.recommendedSessionLength);
                          
                          console.log(`   Curso ${courseTitle}: ${remainingLessons} lecciones pendientes (${completedLessonsCount} completadas, ${totalLessons} totales)`);
                          
                          return {
                            courseId,
                            totalLessons: remainingLessons, // Solo lecciones pendientes
                            totalMinutes: totalDurationMinutes,
                            sessionsNeeded: sessionsForCourse,
                            effectiveLessonTime
                          };
                        }
                      }
                    }
                  }
                }
                
                // Fallback: estimación conservadora
                return {
                  courseId,
                  totalLessons: 10, // Estimación conservadora de lecciones
                  totalMinutes: 300, // 5 horas estimadas
                  sessionsNeeded: Math.ceil(300 / profileAvailability.recommendedSessionLength),
                  effectiveLessonTime: profileAvailability.recommendedSessionLength
                };
              } catch (error) {
                console.warn(`Error obteniendo información del curso ${courseId}:`, error);
                return {
                  courseId,
                  totalLessons: 10,
                  totalMinutes: 300,
                  sessionsNeeded: Math.ceil(300 / (profileAvailability?.recommendedSessionLength || 30)),
                  effectiveLessonTime: profileAvailability?.recommendedSessionLength || 30
                };
              }
            })
          );
          
          totalLessonsNeeded = coursesInfoForCalculation.reduce((sum, course) => sum + course.totalLessons, 0);
          totalSessionsNeeded = coursesInfoForCalculation.reduce((sum, course) => sum + course.sessionsNeeded, 0);
          totalMinutesNeeded = coursesInfoForCalculation.reduce((sum, course) => sum + course.totalMinutes, 0);
          
          console.log(`📚 Cálculo de lecciones necesarias:`);
          console.log(`   Total de lecciones: ${totalLessonsNeeded}`);
          console.log(`   Total de sesiones necesarias: ${totalSessionsNeeded}`);
          console.log(`   Total de minutos necesarios: ${totalMinutesNeeded}`);
          coursesInfoForCalculation.forEach(course => {
            console.log(`   - ${course.courseId}: ${course.totalLessons} lecciones`);
          });
          
          // Si totalLessonsNeeded es 0, usar estimación conservadora basada en el número de cursos
          if (totalLessonsNeeded === 0 && selectedCourseIds.length > 0) {
            console.warn(`⚠️ totalLessonsNeeded es 0, usando estimación conservadora de 10 lecciones por curso`);
            totalLessonsNeeded = selectedCourseIds.length * 10; // Estimación: 10 lecciones por curso
          }
        } catch (error) {
          console.warn('Error calculando lecciones necesarias:', error);
          // Fallback: estimación conservadora
          if (selectedCourseIds.length > 0) {
            totalLessonsNeeded = selectedCourseIds.length * 10;
          }
        }
      } else {
        console.warn('⚠️ No se pudo calcular lecciones necesarias: selectedCourseIds.length =', selectedCourseIds.length, 'profileAvailability =', !!profileAvailability);
        // Fallback: estimación conservadora
        if (selectedCourseIds.length > 0) {
          totalLessonsNeeded = selectedCourseIds.length * 10;
        }
      }

      // Calcular sesiones necesarias por semana para cumplir con la fecha objetivo
      const sessionsPerWeekNeeded = weeksUntilTarget > 0 
        ? Math.ceil(totalSessionsNeeded / weeksUntilTarget)
        : Math.ceil(totalSessionsNeeded / 4); // Fallback: 4 semanas

      // Filtrar slots que estén dentro del rango hasta la fecha objetivo
      // Comparar solo las fechas (sin hora) para EXCLUIR el día después de la fecha límite
      const validDateSlots = targetDateObj
        ? slotsWithoutHolidays.filter(slot => {
            const slotDateOnly = new Date(slot.date);
            slotDateOnly.setHours(0, 0, 0, 0);
            const targetDateOnly = new Date(targetDateObj!);
            targetDateOnly.setHours(0, 0, 0, 0);

            // Usar < para excluir estrictamente días después del límite
            const isBeforeDeadline = slotDateOnly.getTime() < targetDateOnly.getTime();
            const isDeadlineDay = HolidayService.isSameDay(slotDateOnly, targetDateOnly);

            // Para usuarios B2B: excluir el mismo día de deadline
            // Para usuarios B2C: incluir el día de deadline
            const isB2B = userContext?.userType === 'b2b';
            const shouldExclude = !isBeforeDeadline && !isDeadlineDay || (isDeadlineDay && isB2B);

            return !shouldExclude;
          })
        : slotsWithoutHolidays;
      
      console.log(`📅 Filtrado de slots hasta fecha objetivo:`);
      console.log(`   Fecha objetivo: ${targetDateObj?.toLocaleDateString('es-ES')}`);
      console.log(`   Slots totales disponibles: ${uniqueDateSlots.length}`);
      console.log(`   Slots válidos hasta objetivo: ${validDateSlots.length}`);

      // ✅ SIMPLIFICADO: Usar TODOS los slots disponibles hasta la fecha objetivo
      // Filtrar solo por duración mínima (25 minutos para que quepa al menos 1 lección)
      const MIN_SLOT_DURATION = 25; // Duración mínima de una lección
      const finalSlots: FreeSlotWithDay[] = validDateSlots
        .filter(slot => slot.durationMinutes >= MIN_SLOT_DURATION)
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ordenar cronológicamente

      console.log(`   Slots con duración mínima (${MIN_SLOT_DURATION} min): ${finalSlots.length}`);

      // ✅ SIMPLIFICADO: Dividir slots largos según el máximo de sesión del usuario
      const dividedSlots: FreeSlotWithDay[] = [];
      const sessionLength = profileAvailability?.recommendedSessionLength || 30;
      const breakLength = profileAvailability?.recommendedBreak || 10;
      const cycleLength = sessionLength + breakLength; // Ej: 30 + 10 = 40 min

      // Determinar duración máxima por slot según enfoque de estudio
      let maxSlotDuration: number;
      if (studyApproach === 'rapido') {
        maxSlotDuration = cycleLength * 2; // 2 ciclos máximo (ej: 80 min)
      } else if (studyApproach === 'largo') {
        maxSlotDuration = cycleLength * 3; // 3 ciclos máximo (ej: 120 min)
      } else {
        maxSlotDuration = cycleLength * 2; // 2 ciclos máximo (ej: 80 min) - normal
      }

      console.log(`🔪 Dividiendo slots largos (duración máxima: ${maxSlotDuration} min):`);

      finalSlots.forEach((slot, index) => {
        if (slot.durationMinutes <= maxSlotDuration) {
          // Slot ya es suficientemente corto, agregarlo tal cual
          dividedSlots.push(slot);
        } else {
          // Slot es muy largo, dividirlo en múltiples slots más pequeños
          const numDivisions = Math.ceil(slot.durationMinutes / maxSlotDuration);
          const actualDivisionDuration = Math.floor(slot.durationMinutes / numDivisions);

          for (let i = 0; i < numDivisions; i++) {
            const divisionStart = new Date(slot.start.getTime() + (i * actualDivisionDuration * 60 * 1000));
            const divisionEnd = new Date(divisionStart.getTime() + (actualDivisionDuration * 60 * 1000));

            // Asegurar que no exceda el slot original
            if (divisionEnd <= slot.end) {
              dividedSlots.push({
                ...slot,
                start: divisionStart,
                end: divisionEnd,
                durationMinutes: actualDivisionDuration
              });
            }
          }
        }
      });

      console.log(`   Slots después de dividir: ${dividedSlots.length}`);

      // ✅ LIMITAR A MÁXIMO 2 SLOTS POR DÍA (requisito del usuario)
      // Agrupar slots por día y seleccionar los 2 mejores por día
      const slotsByDay = new Map<string, FreeSlotWithDay[]>();
      dividedSlots.forEach(slot => {
        const dayKey = slot.date.toISOString().split('T')[0];
        if (!slotsByDay.has(dayKey)) {
          slotsByDay.set(dayKey, []);
        }
        slotsByDay.get(dayKey)!.push(slot);
      });

      console.log(`📅 Limitando a máximo 2 slots por día:`);
      const limitedSlots: FreeSlotWithDay[] = [];

      slotsByDay.forEach((daySlots, dayKey) => {
        // Ordenar por calidad (horarios preferidos y duración)
        daySlots.sort((a, b) => {
          const hourA = a.start.getHours();
          const hourB = b.start.getHours();

          // Priorizar horarios convenientes (7-10 AM, 12-2 PM, 7-9 PM)
          const isGoodTimeA = (hourA >= 7 && hourA < 10) || (hourA >= 12 && hourA < 14) || (hourA >= 19 && hourA < 21);
          const isGoodTimeB = (hourB >= 7 && hourB < 10) || (hourB >= 12 && hourB < 14) || (hourB >= 19 && hourB < 21);

          if (isGoodTimeA && !isGoodTimeB) return -1;
          if (!isGoodTimeA && isGoodTimeB) return 1;

          // Si ambos son buenos o malos, priorizar por duración
          return b.durationMinutes - a.durationMinutes;
        });

        // Tomar máximo 2 slots por día
        const selectedDaySlots = daySlots.slice(0, 2);
        console.log(`   ${dayKey}: ${daySlots.length} slots → ${selectedDaySlots.length} seleccionados`);
        limitedSlots.push(...selectedDaySlots);
      });

      console.log(`   Total slots después de limitar a 2 por día: ${limitedSlots.length}`);

      // ✅ DISTRIBUIR EQUIDISTANTEMENTE A LO LARGO DE TODO EL PERÍODO
      // No usar todos los slots consecutivamente - distribuir a lo largo del tiempo
      // Ordenar por fecha
      limitedSlots.sort((a, b) => a.date.getTime() - b.date.getTime());

      // ✅ IMPORTANTE: Usar el número REAL de lecciones pendientes que se calculará después
      // NO usar totalLessonsNeeded que se calcula al inicio (puede ser incorrecto)
      // Por ahora, usar una estimación generosa para asegurar suficientes slots
      const estimatedLessons = Math.max(totalLessonsNeeded, 30); // Mínimo 30 lecciones
      const avgLessonsPerSlot = 2; // Estimación conservadora
      const slotsNeeded = Math.ceil(estimatedLessons / avgLessonsPerSlot);

      console.log(`📊 Distribución equidistante:`);
      console.log(`   Lecciones estimadas inicialmente (totalLessonsNeeded): ${totalLessonsNeeded}`);
      console.log(`   Lecciones usadas para cálculo (máximo de 30): ${estimatedLessons}`);
      console.log(`   Promedio estimado por slot: ${avgLessonsPerSlot}`);
      console.log(`   Slots disponibles (limitados a 2/día): ${limitedSlots.length}`);
      console.log(`   Slots necesarios (estimado): ${slotsNeeded}`);

      // Seleccionar slots distribuidos equidistantemente
      const equidistantSlots: FreeSlotWithDay[] = [];
      if (limitedSlots.length > 0) {
        const totalAvailable = limitedSlots.length;
        const slotsToUse = Math.min(slotsNeeded, totalAvailable);

        if (slotsToUse >= totalAvailable) {
          // Necesitamos todos los slots
          equidistantSlots.push(...limitedSlots);
        } else {
          // Distribuir equidistantemente
          const step = (totalAvailable - 1) / (slotsToUse - 1);
          for (let i = 0; i < slotsToUse; i++) {
            const index = Math.round(i * step);
            equidistantSlots.push(limitedSlots[index]);
          }
        }
      }

      console.log(`   Slots distribuidos equidistantemente: ${equidistantSlots.length}`);
      if (equidistantSlots.length > 0) {
        console.log(`   Primer slot: ${equidistantSlots[0].dayName} ${equidistantSlots[0].date.toLocaleDateString('es-ES')}`);
        console.log(`   Último slot: ${equidistantSlots[equidistantSlots.length - 1].dayName} ${equidistantSlots[equidistantSlots.length - 1].date.toLocaleDateString('es-ES')}`);
      }

      // Usar los slots distribuidos equidistantemente
      finalSlots.length = 0;
      finalSlots.push(...equidistantSlots);

      // Calcular tiempo disponible por semana basado en las sesiones seleccionadas
      let weeklyAvailableMinutes: number;
      if (finalSlots.length > 0) {
        // Calcular promedio semanal basado en las primeras semanas
        const firstWeeksSlots = finalSlots.filter(slot => {
          const daysFromStart = Math.floor((slot.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysFromStart >= 0 && daysFromStart < (weeksUntilTarget * 7);
        });
        
        if (firstWeeksSlots.length > 0) {
          const totalMinutes = firstWeeksSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
          weeklyAvailableMinutes = Math.round(totalMinutes / weeksUntilTarget);
        } else {
          weeklyAvailableMinutes = finalSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0) / Math.max(1, Math.ceil(finalSlots.length / slotsPerWeek));
        }
      } else {
        weeklyAvailableMinutes = profileAvailability?.weeklyMinutes || 300;
      }

      // 5. Calcular metas semanales basadas en cursos seleccionados y fecha objetivo
      console.log(`🎯 Preparando cálculo de metas semanales:`);
      console.log(`   selectedCourseIds.length: ${selectedCourseIds.length}`);
      console.log(`   weeklyAvailableMinutes: ${weeklyAvailableMinutes}`);
      console.log(`   studyApproach: ${studyApproach}`);
      console.log(`   weeksUntilTarget: ${weeksUntilTarget}`);
      console.log(`   totalLessonsNeeded: ${totalLessonsNeeded}`);
      
      const weeklyGoals = selectedCourseIds.length > 0 && weeklyAvailableMinutes > 0 && studyApproach && weeksUntilTarget > 0 && totalLessonsNeeded > 0
        ? await calculateWeeklyGoals(
            selectedCourseIds,
            weeklyAvailableMinutes,
            profileAvailability?.recommendedSessionLength || 60,
            weeksUntilTarget,
            totalLessonsNeeded // Pasar el total de lecciones necesarias en lugar de sesiones
          )
        : null;
      
      if (!weeklyGoals) {
        console.warn('⚠️ No se pudieron calcular las metas semanales. Verificar condiciones.');
        console.warn(`   Condiciones: selectedCourseIds=${selectedCourseIds.length > 0}, weeklyAvailableMinutes=${weeklyAvailableMinutes > 0}, studyApproach=${!!studyApproach}, weeksUntilTarget=${weeksUntilTarget > 0}, totalLessonsNeeded=${totalLessonsNeeded > 0}`);
      } else {
        console.log(`✅ Metas semanales calculadas:`, weeklyGoals);
      }

      // 6. Construir información del perfil
      const rol = userProfile?.professionalProfile?.rol?.nombre;
      const nivel = userProfile?.professionalProfile?.nivel?.nombre;
      const area = userProfile?.professionalProfile?.area?.nombre;
      const isB2B = userProfile?.userType === 'b2b';
      const orgName = userProfile?.organization?.name;

      // 6. Construir mensaje personalizado y dinámico
      let calendarMessage = '';
      
      if (calendarEvents.length > 0) {
        // Construir introducción personalizada
        const introParts: string[] = [];
        introParts.push(`¡Perfecto! Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} está conectado.`);
        introParts.push(`He analizado tu perfil profesional y tu calendario.`);
        
        if (rol || nivel || area) {
          const profileDesc: string[] = [];
          if (isB2B && orgName) {
            profileDesc.push(`trabajas en ${orgName}`);
          } else {
            profileDesc.push(`eres profesional independiente`);
          }
          if (rol) profileDesc.push(`como ${rol}`);
          if (area) profileDesc.push(`en el área de ${area}`);
          if (profileDesc.length > 0) {
            introParts.push(`Veo que ${profileDesc.join(' ')}.`);
          }
        }

        // Agregar contexto del calendario (sin mencionar números exactos)
        if (calendarEvents.length > 0) {
          introParts.push(`\n📊 He encontrado múltiples eventos en tu calendario durante el próximo mes.`);
          if (busiestDays.length > 0) {
            introParts.push(`Tus días más ocupados son: ${busiestDays.join(', ')}.`);
          }
        }

        calendarMessage = introParts.join(' ') + '\n\n';

        // Construir recomendaciones personalizadas basadas en perfil y calendario
        if (finalSlots.length > 0) {
          // Mensaje introductorio basado en perfil
          const recommendationIntro: string[] = [];
          recommendationIntro.push(`**MIS RECOMENDACIONES:**`);
          recommendationIntro.push(`\n`);
          
          if (profileAvailability) {
            const sessionLengthText = profileAvailability.recommendedSessionLength >= 60
              ? `${Math.floor(profileAvailability.recommendedSessionLength / 60)} hora${Math.floor(profileAvailability.recommendedSessionLength / 60) > 1 ? 's' : ''}`
              : `${profileAvailability.recommendedSessionLength} minutos`;
            
            const approachText = studyApproach === 'rapido' ? 'sesiones rápidas' : studyApproach === 'normal' ? 'sesiones normales' : studyApproach === 'largo' ? 'sesiones largas' : 'sesiones';
            const targetDateText = effectiveTargetDate ? ` y tu objetivo de completar los cursos para ${effectiveTargetDate}` : '';
            
            recommendationIntro.push(`En base a tu perfil${rol ? ` como ${rol}` : ''}${nivel ? ` (${nivel})` : ''} y tu preferencia por **${approachText}**${targetDateText}, estimo que puedes dedicar aproximadamente ${Math.round(profileAvailability.minutesPerDay / 60 * 10) / 10} hora${profileAvailability.minutesPerDay >= 120 ? 's' : ''} al día para estudiar.`);
            
            if (effectiveTargetDate && studyApproach) {
              recommendationIntro.push(`He distribuido las sesiones de estudio hasta ${effectiveTargetDate} para asegurar que completes tus cursos a tiempo.`);
            }
            
            recommendationIntro.push(`He analizado tu calendario y encontré que estos son los días con menos eventos.`);
            recommendationIntro.push(`Te propongo estos horarios específicos para sesiones de ${sessionLengthText}${profileAvailability.recommendedBreak > 0 ? ` con descansos de ${profileAvailability.recommendedBreak} minutos` : ''}:`);
            recommendationIntro.push(`\n`);
          } else {
            recommendationIntro.push(`Basándome en los espacios libres que encontré en tu calendario, te sugiero estas sesiones de estudio:`);
            recommendationIntro.push(`\n`);
          }
          
          calendarMessage += recommendationIntro.join(' ');
          
          // Obtener lecciones de los cursos seleccionados para distribuir por horarios
          let allLessonsByCourse: Map<string, Array<{ lessonId: string; lessonTitle: string; lessonOrderIndex: number; durationSeconds: number }>> = new Map();
          let completedLessonIdsByCourse: Map<string, string[]> = new Map();
          
          console.log(`📚 Obteniendo lecciones para distribución:`);
          console.log(`   Cursos seleccionados: ${selectedCourseIds.length}`);
          
          if (selectedCourseIds.length > 0) {
            try {
              const myCoursesResponse = await fetch('/api/my-courses');
              if (myCoursesResponse.ok) {
                const myCoursesData = await myCoursesResponse.json();
                const courses = Array.isArray(myCoursesData) ? myCoursesData : (myCoursesData.courses || []);
                
                await Promise.all(selectedCourseIds.map(async (courseId) => {
                  const courseData = courses.find((c: any) => (c.course_id || c.id) === courseId);
                  if (courseData) {
                    const courseSlug = courseData.courses?.slug || courseData.slug || null;
                    const enrollmentId = courseData.enrollment_id || null;
                    
                    console.log(`   Curso ${courseId}: slug=${courseSlug}, enrollmentId=${enrollmentId}`);
                    
                    // Usar el endpoint de metadata que funciona con courseId (no requiere slug)
                    try {
                      // ✅ Usar /api/workshops/${courseId}/metadata en lugar de /api/courses/${slug}/modules
                      // Esto funciona incluso si el curso no tiene slug
                      const metadataResponse = await fetch(`/api/workshops/${courseId}/metadata`);
                      if (metadataResponse.ok) {
                        const metadataData = await metadataResponse.json();
                        if (metadataData.success && metadataData.metadata && metadataData.metadata.modules && Array.isArray(metadataData.metadata.modules)) {
                          // Extraer lecciones de todos los módulos usando la estructura de metadata
                          // IMPORTANTE: Mantener el orden correcto por módulo y luego por lección
                          const allLessons = metadataData.metadata.modules.flatMap((module: any) => {
                            if (!module.lessons || !Array.isArray(module.lessons)) {
                              return [];
                            }
                            return module.lessons.map((lesson: any) => {
                              // Validar que la lección tenga todos los campos requeridos
                              if (!lesson.lessonId || !lesson.lessonTitle || typeof lesson.lessonTitle !== 'string') {
                                console.warn(`   ⚠️ Lección inválida en módulo ${module.moduleId}:`, lesson);
                                return null;
                              }
                              return {
                                lessonId: lesson.lessonId,
                                lessonTitle: lesson.lessonTitle.trim(),
                                lessonOrderIndex: lesson.lessonOrderIndex || 0,
                                moduleOrderIndex: module.moduleOrderIndex || 0, // ✅ CRÍTICO: Para ordenar correctamente
                                durationSeconds: lesson.durationSeconds || 0
                              };
                            }).filter((lesson: any) => lesson !== null); // Filtrar nulos
                          });
                            
                            // Filtrar solo lecciones válidas con título no vacío
                            // IMPORTANTE: Ordenar primero por módulo, luego por lección dentro del módulo
                            const publishedLessons = allLessons
                              .filter((lesson: any) => {
                                const isValid = lesson &&
                                  lesson.lessonId &&
                                  lesson.lessonTitle &&
                                  typeof lesson.lessonTitle === 'string' &&
                                  lesson.lessonTitle.trim() !== '' &&
                                  lesson.lessonOrderIndex >= 0;
                                if (!isValid) {
                                  console.warn(`   ⚠️ Lección filtrada por datos inválidos:`, lesson);
                                }
                                return isValid;
                              })
                              .sort((a: any, b: any) => {
                                // Primero por módulo
                                if (a.moduleOrderIndex !== b.moduleOrderIndex) {
                                  return (a.moduleOrderIndex || 0) - (b.moduleOrderIndex || 0);
                                }
                                // Luego por lección dentro del módulo
                                return (a.lessonOrderIndex || 0) - (b.lessonOrderIndex || 0);
                              });
                            
                            console.log(`   Curso ${courseId}: ${publishedLessons.length} lecciones válidas obtenidas`);
                            if (publishedLessons.length > 0) {
                              console.log(`   Primeras 5 lecciones:`, publishedLessons.slice(0, 5).map((l: any) => ({
                                index: l.lessonOrderIndex,
                                id: l.lessonId,
                                title: l.lessonTitle
                              })));
                            } else {
                              console.warn(`   ⚠️ NO se encontraron lecciones válidas para el curso ${courseId}`);
                            }
                            allLessonsByCourse.set(courseId, publishedLessons);
                            
                            // Obtener lecciones completadas directamente de la BD usando el mismo método que LiaContextService
                            // Esto asegura que usamos la misma lógica y obtenemos datos consistentes
                            try {
                              // Obtener el userId del usuario actual
                              const userResponse = await fetch('/api/auth/me');
                              if (userResponse.ok) {
                                const userData = await userResponse.json();
                                const userId = userData?.user?.id;
                                console.log(`   ✅ Usuario obtenido: ${userId}`);

                                if (userId) {
                                  // Obtener lecciones completadas filtrando por enrollment_id si está disponible
                                  // Esto es crítico para obtener solo las lecciones del curso específico
                                  console.log(`   🔍 Consultando progreso: /api/study-planner/course-progress?enrollmentId=${enrollmentId || ''}&courseId=${courseId}&userId=${userId}`);
                                  const progressResponse = await fetch(
                                    `/api/study-planner/course-progress?enrollmentId=${enrollmentId || ''}&courseId=${courseId}&userId=${userId}`
                                  );
                                  if (progressResponse.ok) {
                                    const progressData = await progressResponse.json();
                                    console.log(`   📥 Respuesta del endpoint:`, progressData);
                                    const completedIds = progressData.completedLessonIds || [];
                                    console.log(`   Curso ${courseId}: ${completedIds.length} lecciones completadas (enrollmentId: ${enrollmentId || 'N/A'})`);
                                    if (completedIds.length > 0) {
                                      console.log(`   IDs de lecciones completadas:`, completedIds);
                                    }
                                    completedLessonIdsByCourse.set(courseId, completedIds);
                                  } else {
                                    console.warn(`   ⚠️ Error obteniendo progreso para curso ${courseId}: ${progressResponse.status}`);
                                    const errorData = await progressResponse.json();
                                    console.warn(`   Error data:`, errorData);
                                  }
                                } else {
                                  console.warn(`   ⚠️ No se pudo obtener userId para curso ${courseId}`);
                                }
                              }
                            } catch (e) {
                              console.warn(`Error obteniendo progreso para curso ${courseId}:`, e);
                            }
                          }
                        } else {
                          console.warn(`Error obteniendo metadata del curso ${courseId}:`, metadataResponse.status);
                        }
                      } catch (e) {
                        console.warn(`Error obteniendo lecciones del curso ${courseId}:`, e);
                      }
                  } else {
                    console.warn(`Curso ${courseId} no encontrado en mis cursos`);
                  }
                }));
              } else {
                console.warn('Error obteniendo mis cursos:', myCoursesResponse.status);
              }
            } catch (e) {
              console.warn('Error obteniendo cursos para distribución de lecciones:', e);
            }
          }
          
          // Crear lista plana de todas las lecciones pendientes de todos los cursos, ordenadas
          const allPendingLessons: Array<{ courseId: string; courseTitle: string; lessonId: string; lessonTitle: string; lessonOrderIndex: number; durationSeconds: number }> = [];
          
          selectedCourseIds.forEach(courseId => {
            const courseFromList = availableCourses.find(c => c.id === courseId);
            const courseTitle = courseFromList?.title || 'Curso';
            const lessons = allLessonsByCourse.get(courseId) || [];
            const completedIds = completedLessonIdsByCourse.get(courseId) || [];
            
            console.log(`📚 Curso ${courseId} (${courseTitle}):`);
            console.log(`   Total lecciones: ${lessons.length}`);
            console.log(`   Lecciones completadas: ${completedIds.length}`);
            if (completedIds.length > 0) {
              console.log(`   IDs completados:`, completedIds);
            }
            
            let pendingCount = 0;
            let skippedCount = 0;
            lessons.forEach(lesson => {
              // Validar que la lección tenga título válido antes de agregarla
              if (!lesson.lessonTitle || lesson.lessonTitle.trim() === '') {
                console.warn(`   ⚠️ Lección ${lesson.lessonOrderIndex} (${lesson.lessonId}) sin título válido - omitida`);
                skippedCount++;
                return;
              }

              if (!completedIds.includes(lesson.lessonId)) {
                allPendingLessons.push({
                  courseId,
                  courseTitle,
                  lessonId: lesson.lessonId,
                  lessonTitle: lesson.lessonTitle.trim(), // Asegurar que no tenga espacios extra
                  lessonOrderIndex: lesson.lessonOrderIndex || 0,
                  moduleOrderIndex: (lesson as any).moduleOrderIndex || 0, // ✅ AGREGADO
                  durationSeconds: lesson.durationSeconds || 0
                });
                pendingCount++;
              } else {
                skippedCount++;
                console.log(`   ✓ Lección ${lesson.lessonOrderIndex} "${lesson.lessonTitle}" (${lesson.lessonId}) ya completada - omitida`);
              }
            });
            console.log(`   Lecciones pendientes agregadas: ${pendingCount}, omitidas: ${skippedCount}`);
          });

          // Ordenar todas las lecciones por curso, luego por módulo, luego por lección
          allPendingLessons.sort((a, b) => {
            // Primero por curso
            if (a.courseId !== b.courseId) {
              return selectedCourseIds.indexOf(a.courseId) - selectedCourseIds.indexOf(b.courseId);
            }
            // Luego por módulo dentro del curso
            if ((a as any).moduleOrderIndex !== (b as any).moduleOrderIndex) {
              return ((a as any).moduleOrderIndex || 0) - ((b as any).moduleOrderIndex || 0);
            }
            // Finalmente por lección dentro del módulo
            return a.lessonOrderIndex - b.lessonOrderIndex;
          });

          console.log(`📚 Lecciones pendientes totales: ${allPendingLessons.length}`);
          if (allPendingLessons.length > 0) {
            console.log(`   Primeras 5 lecciones pendientes:`, allPendingLessons.slice(0, 5).map(l => ({
              index: l.lessonOrderIndex,
              title: l.lessonTitle,
              id: l.lessonId,
              course: l.courseTitle
            })));
          }

          // Validar que las lecciones tengan datos correctos
          const invalidLessons = allPendingLessons.filter(l => !l.lessonTitle || l.lessonTitle === '');
          if (invalidLessons.length > 0) {
            console.warn(`⚠️ ${invalidLessons.length} lecciones sin título encontradas`);
          }

          // Guardar distribución de lecciones para el resumen final (no mostrar en recomendaciones iniciales)
          type LessonDistribution = {
            slot: FreeSlotWithDay;
            lessons: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number }>;
          };
          
          const lessonDistribution: LessonDistribution[] = [];
          let currentLessonIndex = 0;
          
          // Calcular distribución de lecciones por slot (para guardarla, no mostrar aún)
          const sessionDuration = profileAvailability?.recommendedSessionLength || 30;
          const breakDuration = profileAvailability?.recommendedBreak || 5;
          const cycleDuration = sessionDuration + breakDuration;
          
          // Ordenar slots por fecha para distribuir a lo largo del mes
          const sortedSlots = [...finalSlots].sort((a, b) => {
            return a.date.getTime() - b.date.getTime();
          });
          
          // Filtrar slots hasta la fecha objetivo del usuario (usar targetDateObj, no adjustedTargetDate)
          // Esto asegura que se incluyan todos los slots hasta la fecha límite que el usuario estableció
          const slotsUntilTarget = targetDateObj
            ? sortedSlots.filter(slot => {
                const slotDateOnly = new Date(slot.date);
                slotDateOnly.setHours(0, 0, 0, 0);

                // Usar fecha objetivo original del usuario (no la ajustada con buffer)
                const targetDateOnly = new Date(targetDateObj);
                targetDateOnly.setHours(0, 0, 0, 0);

                // Incluir slots hasta e incluyendo el día de la fecha objetivo
                const isBeforeDeadline = slotDateOnly.getTime() < targetDateOnly.getTime();
                const isDeadlineDay = HolidayService.isSameDay(slotDateOnly, targetDateOnly);

                const shouldInclude = isBeforeDeadline || isDeadlineDay;

                // Log para debugging
                if (!shouldInclude) {
                  console.log(`❌ Slot excluido: ${slot.dayName} ${slotDateOnly.toLocaleDateString('es-ES')} - Después de fecha objetivo (${targetDateOnly.toLocaleDateString('es-ES')})`);
                }

                return shouldInclude;
              })
            : sortedSlots;

          console.log(`📅 Slots después de filtrar por fecha objetivo:`);
          console.log(`   Fecha objetivo: ${targetDateObj?.toLocaleDateString('es-ES')}`);
          console.log(`   Slots totales antes del filtro: ${sortedSlots.length}`);
          console.log(`   Slots después del filtro: ${slotsUntilTarget.length}`);
          if (slotsUntilTarget.length > 0) {
            console.log(`   Primer slot: ${slotsUntilTarget[0].dayName} ${slotsUntilTarget[0].date.toLocaleDateString('es-ES')}`);
            console.log(`   Último slot: ${slotsUntilTarget[slotsUntilTarget.length - 1].dayName} ${slotsUntilTarget[slotsUntilTarget.length - 1].date.toLocaleDateString('es-ES')}`);
          }
          
          // ✅ SIMPLIFICADO: Distribuir lecciones asumiendo 25 min por lección
          console.log(`📊 Distribuyendo ${allPendingLessons.length} lecciones pendientes en ${slotsUntilTarget.length} slots`);

          const MINUTES_PER_LESSON = 25; // Asumir 25 minutos por lección como solicita el usuario

          // Calcular capacidad total disponible en todos los slots
          const totalSlotsAvailable = slotsUntilTarget.length;
          const totalLessons = allPendingLessons.length;

          // Calcular capacidad total de todos los slots (cuántas lecciones caben en total)
          let totalCapacity = 0;
          slotsUntilTarget.forEach(slot => {
            const maxLessonsInSlot = Math.max(1, Math.floor(slot.durationMinutes / MINUTES_PER_LESSON));
            totalCapacity += maxLessonsInSlot;
          });

          console.log(`   Total lecciones: ${totalLessons}`);
          console.log(`   Total slots: ${totalSlotsAvailable}`);
          console.log(`   Capacidad total: ${totalCapacity} lecciones`);
          console.log(`   Minutos por lección: ${MINUTES_PER_LESSON}`);

          // ✅ SIMPLIFICADO: Distribuir uniformemente a lo largo del periodo
          const hasEnoughCapacity = totalCapacity >= totalLessons;

          console.log(`📐 Estrategia de distribución:`);
          console.log(`   ¿Hay suficiente capacidad? ${hasEnoughCapacity ? 'Sí' : 'No'}`);

          slotsUntilTarget.forEach((slot, slotIndex) => {
            const slotDurationMinutes = slot.durationMinutes;

            // Calcular cuántas lecciones caben en el slot basado en 25 min por lección
            const maxLessonsInSlot = Math.max(1, Math.floor(slotDurationMinutes / MINUTES_PER_LESSON));

            // Calcular cuántas lecciones quedan por asignar
            const remainingLessons = allPendingLessons.length - currentLessonIndex;
            const remainingSlots = slotsUntilTarget.length - slotIndex;

            // ✅ NUEVA LÓGICA SIMPLIFICADA: Distribuir uniformemente
            let lessonsToAssign: number;

            if (remainingLessons === 0) {
              // No quedan lecciones, no asignar nada
              lessonsToAssign = 0;
            } else {
              // Calcular el promedio de lecciones que deben ir en los slots restantes
              const avgNeededPerRemainingSlot = remainingSlots > 0
                ? remainingLessons / remainingSlots
                : remainingLessons;

              // Asignar el promedio redondeado hacia arriba, limitado solo por la capacidad física del slot
              // NO limitar a 2 lecciones - llenar según capacidad para distribuir todas las lecciones
              lessonsToAssign = Math.min(
                Math.ceil(avgNeededPerRemainingSlot),
                maxLessonsInSlot
              );
            }

            console.log(`   Slot ${slotIndex + 1}: ${slot.dayName} ${slot.date.toLocaleDateString('es-ES')} - Duración: ${slotDurationMinutes}min - Lecciones que caben: ${maxLessonsInSlot} - Quedan ${remainingLessons} lecciones - A asignar: ${lessonsToAssign}`);

            // Asignar lecciones a este slot (solo lecciones válidas)
            const lessonsForSlot: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number }> = [];

            // Continuar asignando mientras haya lecciones pendientes y espacio en el slot
            let assignedInSlot = 0;
            while (assignedInSlot < lessonsToAssign && currentLessonIndex < allPendingLessons.length) {
              const lesson = allPendingLessons[currentLessonIndex];

              // Validar que la lección tenga datos válidos antes de asignarla
              if (!lesson || !lesson.lessonId || !lesson.lessonTitle || typeof lesson.lessonTitle !== 'string' || lesson.lessonTitle.trim() === '') {
                console.warn(`⚠️ Lección en índice ${currentLessonIndex} tiene datos inválidos, saltando:`, lesson);
                currentLessonIndex++;
                continue;
              }

              lessonsForSlot.push({
                courseTitle: lesson.courseTitle || 'Curso',
                lessonTitle: lesson.lessonTitle.trim(),
                lessonOrderIndex: lesson.lessonOrderIndex || 0
              });

              // Log para las primeras asignaciones
              if (slotIndex < 3 && assignedInSlot < 2) {
                console.log(`   Slot ${slotIndex}, Sesión ${assignedInSlot}: Lección ${lesson.lessonOrderIndex} - ${lesson.lessonTitle}`);
              }

              currentLessonIndex++;
              assignedInSlot++;
            }

            // Solo agregar slots que tengan lecciones válidas asignadas
            if (lessonsForSlot.length > 0) {
              lessonDistribution.push({
                slot,
                lessons: lessonsForSlot
              });
            } else if (slotIndex < 5) {
              console.warn(`⚠️ Slot ${slotIndex} no tiene lecciones asignadas`);
            }
          });
          
          console.log(`✅ Distribución completada: ${lessonDistribution.length} slots con lecciones, ${currentLessonIndex} lecciones asignadas de ${allPendingLessons.length} totales`);

          // Si quedan lecciones sin asignar, redistribuir en los slots con más espacio
          // Primero intentar usar slots que no se usaron, luego redistribuir en los existentes
          if (currentLessonIndex < allPendingLessons.length) {
            const remainingLessons = allPendingLessons.length - currentLessonIndex;
            console.log(`⚠️ Quedan ${remainingLessons} lecciones sin asignar. Redistribuyendo...`);

            // Primero, intentar usar slots que no se usaron (si hay slots sin lecciones)
            const usedSlotDates = new Set(lessonDistribution.map(d => d.slot.dateStr));
            const unusedSlots = slotsUntilTarget.filter(slot => !usedSlotDates.has(slot.dateStr));
            
            console.log(`   Slots no usados disponibles: ${unusedSlots.length}`);
            
            // Agregar lecciones a slots no usados
            for (const unusedSlot of unusedSlots) {
              if (currentLessonIndex >= allPendingLessons.length) break;

              const slotCapacity = Math.max(1, Math.floor(unusedSlot.durationMinutes / MINUTES_PER_LESSON));
              const lessonsForUnusedSlot: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number }> = [];
              
              for (let i = 0; i < slotCapacity && currentLessonIndex < allPendingLessons.length; i++) {
                const lesson = allPendingLessons[currentLessonIndex];

                if (lesson && lesson.lessonTitle && lesson.lessonTitle.trim() !== '') {
                  lessonsForUnusedSlot.push({
                    courseTitle: lesson.courseTitle || 'Curso',
                    lessonTitle: lesson.lessonTitle.trim(),
                    lessonOrderIndex: lesson.lessonOrderIndex || 0
                  });
                  currentLessonIndex++;
                } else {
                  currentLessonIndex++;
                  i--; // No contar lecciones inválidas
                }
              }
              
              if (lessonsForUnusedSlot.length > 0) {
                lessonDistribution.push({
                  slot: unusedSlot,
                  lessons: lessonsForUnusedSlot
                });
                console.log(`   ✅ Agregado slot no usado: ${unusedSlot.dayName} ${unusedSlot.date.toLocaleDateString('es-ES')} con ${lessonsForUnusedSlot.length} lecciones`);
              }
            }

            // Luego, redistribuir en slots existentes con espacio disponible
            if (currentLessonIndex < allPendingLessons.length) {
              // Ordenar slots por espacio disponible (mayor primero)
              const slotsWithSpace = lessonDistribution
                .filter(dist => {
                  const slotCapacity = Math.floor(dist.slot.durationMinutes / MINUTES_PER_LESSON);
                  return dist.lessons.length < slotCapacity;
                })
                .sort((a, b) => {
                  const spaceA = Math.floor(a.slot.durationMinutes / MINUTES_PER_LESSON) - a.lessons.length;
                  const spaceB = Math.floor(b.slot.durationMinutes / MINUTES_PER_LESSON) - b.lessons.length;
                  return spaceB - spaceA;
                });

              console.log(`   Slots con espacio disponible: ${slotsWithSpace.length}`);

              // Redistribuir lecciones pendientes
              for (const slotDist of slotsWithSpace) {
                if (currentLessonIndex >= allPendingLessons.length) break;

                const slotCapacity = Math.floor(slotDist.slot.durationMinutes / MINUTES_PER_LESSON);
                const currentLessons = slotDist.lessons.length;
                const availableSpace = slotCapacity - currentLessons;

                // Agregar lecciones hasta llenar el espacio
                for (let i = 0; i < availableSpace && currentLessonIndex < allPendingLessons.length; i++) {
                  const lesson = allPendingLessons[currentLessonIndex];

                  if (lesson && lesson.lessonTitle && lesson.lessonTitle.trim() !== '') {
                    slotDist.lessons.push({
                      courseTitle: lesson.courseTitle || 'Curso',
                      lessonTitle: lesson.lessonTitle.trim(),
                      lessonOrderIndex: lesson.lessonOrderIndex || 0
                    });
                    currentLessonIndex++;
                  } else {
                    currentLessonIndex++;
                    i--; // No contar lecciones inválidas
                  }
                }
              }
            }

            console.log(`✅ Redistribución completada: ${currentLessonIndex} de ${allPendingLessons.length} lecciones asignadas`);
          }
          
          // Verificar si aún quedan lecciones sin asignar después de la redistribución
          if (currentLessonIndex < allPendingLessons.length) {
            const stillRemaining = allPendingLessons.length - currentLessonIndex;
            console.warn(`⚠️ Después de la redistribución, aún quedan ${stillRemaining} lecciones sin asignar de ${allPendingLessons.length} totales`);
          }

          // Guardar distribución en el estado para usar en el resumen final
          // Convertir a formato almacenable con validación estricta de datos
          const distributionToSave: StoredLessonDistribution[] = lessonDistribution
            .map(item => {
              // Validar y filtrar lecciones inválidas
              const validLessons = item.lessons.filter(lesson => {
                const isValid = lesson &&
                  lesson.lessonTitle &&
                  typeof lesson.lessonTitle === 'string' &&
                  lesson.lessonTitle.trim() !== '' &&
                  lesson.lessonOrderIndex >= 0;
                if (!isValid) {
                  console.warn(`⚠️ Lección inválida filtrada de distribución:`, lesson);
                }
                return isValid;
              }).map(lesson => ({
                courseTitle: lesson.courseTitle || 'Curso',
                lessonTitle: lesson.lessonTitle.trim(), // Asegurar sin espacios extra
                lessonOrderIndex: lesson.lessonOrderIndex || 0
              }));
              
              // Solo incluir slots que tengan lecciones válidas
              if (validLessons.length === 0) {
                return null;
              }
              
              return {
                dateStr: item.slot.dateStr,
                dayName: item.slot.dayName,
                startTime: item.slot.start.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                }),
                endTime: item.slot.end.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                }),
                lessons: validLessons
              };
            })
            .filter((item): item is StoredLessonDistribution => item !== null); // Filtrar nulos
          
          setSavedLessonDistribution(distributionToSave);
          setSavedTargetDate(targetDate);
          // Usar el número real de lecciones pendientes, no el calculado (que puede tener errores)
          setSavedTotalLessons(allPendingLessons.length);
          
          console.log(`📦 Distribución de lecciones guardada: ${distributionToSave.length} slots`);
          // Log detallado para debugging
          if (distributionToSave.length > 0) {
            console.log(`📦 Primera distribución:`, JSON.stringify(distributionToSave[0], null, 2));
            const allSavedLessons = distributionToSave.flatMap(d => d.lessons);
            console.log(`📦 Total lecciones en distribución: ${allSavedLessons.length}`);
            console.log(`📦 Primeras 5 lecciones:`, allSavedLessons.slice(0, 5).map(l => `${l.lessonOrderIndex}: ${l.lessonTitle}`));
          }
          
          // ✅ MOSTRAR SOLO LOS SLOTS QUE TIENEN LECCIONES ASIGNADAS
          // No mostrar todos los slots disponibles, solo los que realmente se van a usar
          const slotsWithLessons = lessonDistribution.map(dist => dist.slot);

          console.log(`📅 Mostrando recomendaciones:`);
          console.log(`   Slots disponibles (slotsUntilTarget): ${slotsUntilTarget.length}`);
          console.log(`   Slots con lecciones asignadas: ${slotsWithLessons.length}`);

          // Agrupar por fecha para mostrar los slots con lecciones
          const slotsByDay = new Map<string, FreeSlotWithDay[]>();

          slotsWithLessons.forEach(slot => {
            if (!slotsByDay.has(slot.dateStr)) {
              slotsByDay.set(slot.dateStr, []);
            }
            slotsByDay.get(slot.dateStr)!.push(slot);
          });

          // Ordenar las fechas cronológicamente
          const sortedDays = Array.from(slotsByDay.keys()).sort((a, b) => {
            return new Date(a).getTime() - new Date(b).getTime();
          });

          console.log(`   Días con sesiones: ${sortedDays.length}`);
          console.log(`   Primer día: ${sortedDays[0]}`);
          console.log(`   Último día: ${sortedDays[sortedDays.length - 1]}`);

          // Mostrar todos los días con sus horarios (solo slots con lecciones asignadas)
          sortedDays.forEach(dateStr => {
            const slots = slotsByDay.get(dateStr)!;

            // Ordenar slots del día por hora de inicio
            slots.sort((a, b) => a.start.getTime() - b.start.getTime());

            console.log(`   ${dateStr}: ${slots.length} slots`);

            // Mostrar cada slot del día
            slots.forEach(slot => {
              const startTime = slot.start.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
              const endTime = slot.end.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });

              // Solo mostrar el horario, sin lecciones
              calendarMessage += `• ${slot.dayName} ${slot.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} a las ${startTime} - ${endTime}\n`;
            });
          });
          
          // Verificar si hay más slots disponibles después de la fecha objetivo
          const slotsAfterTarget = targetDateObj
            ? sortedSlots.filter(slot => {
                const slotDateOnly = new Date(slot.date);
                slotDateOnly.setHours(0, 0, 0, 0);
                const targetDateOnly = new Date(targetDateObj!);
                targetDateOnly.setHours(0, 0, 0, 0);
                return slotDateOnly.getTime() > targetDateOnly.getTime();
              }).length
            : 0;
          
          if (slotsAfterTarget > 0) {
            calendarMessage += `\n**Nota:** He identificado ${slotsAfterTarget} espacios adicionales disponibles después de tu fecha objetivo (${targetDate}). Estos pueden ser útiles para repaso o actividades complementarias.`;
          }
          
          // Verificar si se asignaron todas las lecciones
          // Solo mostrar advertencia si el plazo es realmente insuficiente (menos de 5 días o similar)
          if (currentLessonIndex < allPendingLessons.length) {
            const remainingLessons = allPendingLessons.length - currentLessonIndex;
            const daysUntilTarget = targetDateObj 
              ? Math.ceil((targetDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            
            // Solo mostrar advertencia si el plazo es muy corto (menos de 5 días) o si hay muchas lecciones sin asignar
            const isUnreasonableDeadline = daysUntilTarget < 5;
            const hasManyUnassigned = remainingLessons > (allPendingLessons.length * 0.2); // Más del 20% sin asignar
            
            if (isUnreasonableDeadline || hasManyUnassigned) {
              calendarMessage += `\n**Nota:** Quedan ${remainingLessons} lecciones pendientes por asignar. `;
              if (isUnreasonableDeadline) {
                calendarMessage += `El plazo de ${daysUntilTarget} días es muy corto para completar todas las lecciones. `;
              }
              calendarMessage += `Considera agregar más horarios o extender la fecha objetivo para completar todas las lecciones.`;
            }
          }
          
          // Agregar datos crudos para que LIA calcule las metas semanales AUTOMÁTICAMENTE
          if (selectedCourseIds.length > 0 && totalLessonsNeeded > 0 && weeksUntilTarget > 0 && studyApproach && targetDate) {
            // Calcular metas automáticamente
            const lessonsPerWeekCalc = Math.ceil(totalLessonsNeeded / weeksUntilTarget);
            const hoursPerWeekCalc = Math.ceil(lessonsPerWeekCalc * 1.5);
            const sessionDurationMinutes = studyApproach === 'rapido' ? 25 : studyApproach === 'normal' ? 45 : 60;
            const breakMinutes = studyApproach === 'rapido' ? 5 : studyApproach === 'normal' ? 10 : 15;
            
            // Enviar datos en formato estructurado para LIA (sin instrucciones visibles)
            calendarMessage += `\n`;
            calendarMessage += `**METAS SEMANALES:**\n`;
            calendarMessage += `\n`;
            calendarMessage += `Basándome en tu calendario y objetivos, estas son tus metas semanales:\n`;
            calendarMessage += `- Lecciones por semana: ${lessonsPerWeekCalc}\n`;
            calendarMessage += `- Horas semanales de estudio: ${hoursPerWeekCalc}\n`;
            calendarMessage += `\n`;

            // Agregar información del buffer
            if (bufferDays > 0 && adjustedTargetDate && targetDateObj) {
              calendarMessage += `**📅 PLANIFICACIÓN INTELIGENTE:**\n`;
              calendarMessage += `He planificado que completes todas las lecciones para el **${adjustedTargetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}**, `;
              calendarMessage += `${bufferDays} día${bufferDays > 1 ? 's' : ''} antes de tu fecha límite (${targetDateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}).\n`;
              calendarMessage += `Esto te da un margen para imprevistos, repasos o actividades adicionales.\n`;
              calendarMessage += `\n`;
            }

            calendarMessage += `*Datos de referencia: ${totalLessonsNeeded} lecciones pendientes, ${weeksUntilTarget} semanas hasta ${targetDate}, enfoque de ${studyApproach === 'rapido' ? 'sesiones rápidas' : studyApproach === 'normal' ? 'sesiones normales' : 'sesiones largas'}*\n`;
          }
          
          // Mensaje de cierre personalizado
          const closingParts: string[] = [];
          closingParts.push(`\n`);
          
          // Identificar días que requieren descanso para mencionarlos con contexto específico
          const daysRequiringRest = daysAnalysis.filter(day => 
            day.requiresRestAfter && 
            day.restReason && 
            day.heavyEvents.length > 0
          );
          
          if (daysRequiringRest.length > 0) {
            // Agrupar por tipo de evento para dar contexto más específico
            const restByType = new Map<string, { days: string[], examples: string[] }>();
            
            daysRequiringRest.forEach(day => {
              day.heavyEvents.forEach(heavy => {
                const eventType = heavy.context.type;
                const eventTitle = heavy.event.title || 'evento';
                
                if (!restByType.has(eventType)) {
                  restByType.set(eventType, { days: [], examples: [] });
                }
                
                const typeData = restByType.get(eventType)!;
                if (!typeData.days.includes(day.dayName)) {
                  typeData.days.push(day.dayName);
                }
                if (typeData.examples.length < 2 && eventTitle.length < 50) {
                  typeData.examples.push(eventTitle);
                }
              });
            });
            
            // Obtener ejemplos específicos de eventos pesados para el mensaje
            const restExamples: Array<{ day: string; eventTitle: string; reason: string }> = [];
            const processedDays = new Set<string>();
            
            daysRequiringRest.slice(0, 4).forEach(day => {
              if (processedDays.has(day.dateStr)) return;
              
              day.heavyEvents.slice(0, 1).forEach(heavy => {
                const eventTitle = heavy.event.title || '';
                if (eventTitle && restExamples.length < 3) {
                  restExamples.push({
                    day: day.dayName,
                    eventTitle: eventTitle.length > 50 ? eventTitle.substring(0, 47) + '...' : eventTitle,
                    reason: heavy.context.description
                  });
                  processedDays.add(day.dateStr);
                }
              });
            });
            
            if (restExamples.length > 0) {
              if (restExamples.length === 1) {
                const example = restExamples[0];
                closingParts.push(`💤 Nota: He identificado que el ${example.day} tienes "${example.eventTitle}" (${example.reason}), por lo que ese día y el siguiente los consideré para descanso y no incluí sesiones de estudio, para que puedas recuperarte adecuadamente.`);
              } else if (restExamples.length === 2) {
                closingParts.push(`💤 Nota: He identificado que el ${restExamples[0].day} tienes "${restExamples[0].eventTitle}" y el ${restExamples[1].day} tienes "${restExamples[1].eventTitle}", eventos que pueden ser mentalmente cansados. Por eso, esos días y los siguientes los consideré para descanso y no incluí sesiones de estudio.`);
              } else {
                closingParts.push(`💤 Nota: He identificado varios días con eventos que requieren descanso mental (como el ${restExamples[0].day} con "${restExamples[0].eventTitle}" y el ${restExamples[1].day} con "${restExamples[1].eventTitle}"). Por eso, esos días y los siguientes los consideré para descanso y no incluí sesiones de estudio.`);
              }
              closingParts.push(`\n`);
            }
          }
          
          if (busiestDays.length > 0) {
            closingParts.push(`He identificado que ${busiestDays.slice(0, 2).join(' y ')} son tus días más ocupados. Los horarios propuestos buscan aprovechar tus huecos libres disponibles.`);
          }
          
          closingParts.push(`¿Te sirven estos horarios que te propuse o te gustaría ajustar otros horarios en específico?`);
          
          calendarMessage += closingParts.join(' ');
        } else if (daysWithFreeTime.length > 0) {
          // Si no hay slots específicos pero sí días libres
          const recommendationParts: string[] = [];
          recommendationParts.push(`**MIS RECOMENDACIONES:**`);
          recommendationParts.push(`\n`);
          
          if (profileAvailability) {
            recommendationParts.push(`En base a tu perfil${rol ? ` como ${rol}` : ''}${nivel ? ` (${nivel})` : ''}, puedes dedicar aproximadamente ${Math.round(profileAvailability.minutesPerDay / 60 * 10) / 10} hora${profileAvailability.minutesPerDay >= 120 ? 's' : ''} al día.`);
            recommendationParts.push(`He analizado tu calendario y estos son los días con más disponibilidad:`);
          } else {
            recommendationParts.push(`Basándome en tu disponibilidad, te sugiero estudiar en estos días:`);
          }
          recommendationParts.push(`\n`);
          
          calendarMessage += recommendationParts.join(' ');
          
          // Evitar duplicados por día de la semana
          const shownWeekDays = new Set<string>();
          daysWithFreeTime.slice(0, 5).forEach(day => {
            if (shownWeekDays.has(day.dayName)) return;
            shownWeekDays.add(day.dayName);
            
            const freeHours = Math.round(day.totalFreeMinutes / 60 * 10) / 10;
            calendarMessage += `• ${day.dayName}: aproximadamente ${freeHours} hora${freeHours >= 2 ? 's' : ''} disponible${freeHours >= 2 ? 's' : ''}\n`;
          });
          
          calendarMessage += `\nPuedo ayudarte a elegir los mejores horarios dentro de estos días. ¿Te parecen bien estas opciones?`;
        } else {
          // Agenda muy ocupada
          const busyMessageParts: string[] = [];
          busyMessageParts.push(`Veo que tienes una agenda muy ocupada.`);
          
          if (profileAvailability) {
            const sessionLength = profileAvailability.recommendedSessionLength;
            const sessionText = sessionLength >= 60 
              ? `${Math.floor(sessionLength / 60)} hora${Math.floor(sessionLength / 60) > 1 ? 's' : ''}`
              : `${sessionLength} minutos`;
            
            busyMessageParts.push(`En base a tu perfil${rol ? ` como ${rol}` : ''}${nivel ? ` (${nivel})` : ''}, te recomiendo sesiones cortas de ${sessionText} para aprovechar mejor tu tiempo.`);
          } else {
            busyMessageParts.push(`En promedio, tienes ${avgFreeHoursPerDay} horas libres al día.`);
          }
          
          busyMessageParts.push(`Mi sugerencia es aprovechar espacios cortos de 30-45 minutos entre tus actividades.`);
          busyMessageParts.push(`También podemos considerar sesiones muy temprano por la mañana (antes de las 7 AM) o tarde en la noche (después de las 9 PM) si te funciona mejor.`);
          
          calendarMessage += busyMessageParts.join(' ');
        }
        
      } else {
        // No hay eventos en el calendario
        const noEventsParts: string[] = [];
        noEventsParts.push(`¡Perfecto! Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} está conectado.`);
        noEventsParts.push(`\n`);
        
        if (rol || nivel || area) {
          const profileDesc: string[] = [];
          if (isB2B && orgName) {
            profileDesc.push(`trabajas en ${orgName}`);
          } else {
            profileDesc.push(`eres profesional independiente`);
          }
          if (rol) profileDesc.push(`como ${rol}`);
          if (area) profileDesc.push(`en el área de ${area}`);
          if (profileDesc.length > 0) {
            noEventsParts.push(`He analizado tu perfil. Veo que ${profileDesc.join(' ')}.`);
          } else {
            noEventsParts.push(`He analizado tu perfil.`);
          }
        } else {
          noEventsParts.push(`He analizado tu perfil.`);
        }
        
        noEventsParts.push(`\n`);
        noEventsParts.push(`📅 No encontré eventos programados en tu calendario para el próximo mes. ¡Esto nos da total flexibilidad para diseñar tu plan de estudios!`);
        noEventsParts.push(`\n`);
        noEventsParts.push(`¿Qué días de la semana prefieres estudiar? ¿Y en qué horario te concentras mejor: mañana, tarde o noche?`);
        
        calendarMessage = noEventsParts.join(' ');
      }

      setConversationHistory(prev => {
        // Verificar que no se haya agregado ya un mensaje similar de recomendaciones
        const hasRecommendations = prev.some(msg => 
          msg.role === 'assistant' && (
            msg.content.includes('MIS RECOMENDACIONES') ||
            msg.content.includes('METAS SEMANALES') ||
            (msg.content.includes('analizado tu calendario') && msg.content.includes('horarios'))
          )
        );
        
        if (hasRecommendations && calendarMessage.includes('MIS RECOMENDACIONES')) {
          console.log('Mensaje de recomendaciones ya existe, no agregando duplicado');
          return prev;
        }
        
        return [...prev, { role: 'assistant', content: calendarMessage }];
      });
      
      if (isAudioEnabled) {
        let shortSummary = '';
        if (calendarEvents.length > 0) {
          if (finalSlots.length > 0) {
            const firstSlot = finalSlots[0];
            const timeStr = firstSlot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            shortSummary = `Analicé tu calendario del próximo mes. Te recomiendo estudiar el ${firstSlot.dayName} a las ${timeStr}. ¿Te parece bien?`;
          } else if (daysWithFreeTime.length > 0) {
            const days = daysWithFreeTime.slice(0, 2).map(d => d.dayName).join(' y ');
            shortSummary = `Analicé tu calendario del próximo mes. Te recomiendo estudiar los ${days}. ¿Te parece bien?`;
          } else {
            shortSummary = `Analicé tu calendario del próximo mes. Tu agenda está muy ocupada, pero podemos encontrar espacios para estudiar. ¿Te parece bien?`;
          }
        } else {
          shortSummary = `Calendario conectado. No encontré eventos en el próximo mes. ¿Qué días y horarios prefieres para estudiar?`;
        }
        await speakText(shortSummary);
      }
      
    } catch (error) {
      console.error('Error analizando calendario:', error);
      
      const errorMsg = `Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} está conectado, pero hubo un problema al analizarlo.

Cuéntame manualmente:
¿Qué días de la semana prefieres estudiar?
¿En qué horario te funciona mejor: mañana, tarde o noche?`;
      
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      
      if (isAudioEnabled) {
        await speakText('Calendario conectado. ¿Qué días y horarios prefieres para estudiar?');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Desconectar calendario
  const disconnectCalendar = async (provider: 'google' | 'microsoft') => {
    try {
      setIsConnectingCalendar(true);
      
      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar el calendario');
      }

      // Actualizar estado local
      setConnectedCalendar(null);
      
      // Agregar mensaje a la conversación
      const disconnectMsg = `He desconectado tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'}.`;
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: disconnectMsg 
      }]);

      if (isAudioEnabled) {
        await speakText(`Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} desconectado exitosamente.`);
      }
    } catch (error) {
      console.error('Error desconectando calendario:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al desconectar el calendario';
      
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `No pude desconectar tu calendario. ${errorMsg}` 
      }]);
      
      alert(`Error al desconectar calendario:\n\n${errorMsg}`);
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  // Saltar conexión de calendario pero aún obtener perfil del usuario
  const skipCalendarConnection = async () => {
    setShowCalendarModal(false);
    setIsProcessing(true);
    
    const userMsg = 'Prefiero no conectar mi calendario por ahora';
    setConversationHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      // Aún así obtener el contexto del usuario
      const contextResponse = await fetch('/api/study-planner/user-context');
      let userProfile: any = null;
      
      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        if (contextData.success && contextData.data) {
          userProfile = contextData.data;
          
          setUserContext({
            userType: userProfile.userType || null,
            rol: userProfile.professionalProfile?.rol?.nombre || null,
            area: userProfile.professionalProfile?.area?.nombre || null,
            nivel: userProfile.professionalProfile?.nivel?.nombre || null,
            tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
            organizationName: userProfile.organization?.name || null,
            minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
            maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
          });
        }
      }

      // Construir mensaje con perfil
      let profileInfo = '';
      if (userProfile) {
        const isB2B = userProfile.userType === 'b2b';
        const rol = userProfile.professionalProfile?.rol?.nombre;
        const area = userProfile.professionalProfile?.area?.nombre;
        const nivel = userProfile.professionalProfile?.nivel?.nombre;
        const tamano = userProfile.professionalProfile?.tamanoEmpresa?.nombre;
        const orgName = userProfile.organization?.name;

        profileInfo = `\n\n**HE REVISADO TU PERFIL:**\n`;
        if (isB2B && orgName) {
          profileInfo += `• Tipo: Usuario B2B (perteneces a "${orgName}")\n`;
        } else {
          profileInfo += `• Tipo: Usuario B2C (profesional independiente)\n`;
        }
        if (rol) profileInfo += `• Rol: ${rol}\n`;
        if (area) profileInfo += `• Área: ${area}\n`;
        if (nivel) profileInfo += `• Nivel: ${nivel}\n`;
        if (tamano) profileInfo += `• Tamaño de empresa: ${tamano}\n`;

        // Calcular disponibilidad
        const availability = calculateEstimatedAvailability({
          rol,
          nivel,
          tamanoEmpresa: tamano,
          minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados,
          maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados,
          userType: userProfile.userType,
        });

        profileInfo += `\n**ESTIMACIÓN BASADA EN TU PERFIL:**\n`;
        profileInfo += `• Tiempo disponible: ~${availability.minutesPerDay} min/día\n`;
        profileInfo += `• Sesiones recomendadas: ${availability.recommendedSessionLength} min`;
      }

      const liaResponse = `Entendido, no hay problema.${profileInfo}

Cuéntame:
¿Qué días de la semana prefieres estudiar?
¿En qué horario te funciona mejor: mañana, tarde o noche?

(Por ejemplo: "Lunes, miércoles y viernes por la noche" o "Fines de semana por la mañana")`;

      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);
      
      if (isAudioEnabled) {
        const shortResponse = userProfile 
          ? `Entendido. Veo que eres ${userProfile.professionalProfile?.rol?.nombre || 'profesional'}. ¿Qué días y horarios prefieres para estudiar?`
          : 'Entendido. ¿Qué días y horarios prefieres para estudiar?';
        await speakText(shortResponse);
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      const liaResponse = 'Entendido. Cuéntame: ¿Qué días de la semana prefieres estudiar y en qué horarios? (Por ejemplo: "Lunes a viernes por la noche")';
      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);
      
      if (isAudioEnabled) {
        await speakText(liaResponse);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para validar si un horario choca con eventos del calendario
  const validateScheduleConflict = (date: Date, startTime: Date, endTime: Date): { hasConflict: boolean; conflictingEvent?: any } => {
    if (!savedCalendarData) {
      return { hasConflict: false };
    }

    const dateStr = date.toISOString().split('T')[0];
    const dayData = savedCalendarData[dateStr];

    if (!dayData || !dayData.busySlots || dayData.busySlots.length === 0) {
      return { hasConflict: false };
    }

    // Verificar si el horario se solapa con algún evento
    for (const busySlot of dayData.busySlots) {
      const busyStart = new Date(busySlot.start);
      const busyEnd = new Date(busySlot.end);

      // Verificar solapamiento
      if (
        (startTime >= busyStart && startTime < busyEnd) ||
        (endTime > busyStart && endTime <= busyEnd) ||
        (startTime <= busyStart && endTime >= busyEnd)
      ) {
        // Encontrar el evento correspondiente
        const conflictingEvent = dayData.events.find((event: any) => {
          const eventStart = new Date(event.start || event.startTime);
          return eventStart.getTime() === busyStart.getTime();
        });

        return {
          hasConflict: true,
          conflictingEvent: conflictingEvent || { start: busyStart, end: busyEnd }
        };
      }
    }

    return { hasConflict: false };
  };

  // Función para extraer horarios del mensaje del usuario
  const extractTimeChangeRequest = (message: string): { oldHour?: number; newHour?: number; dates?: string[] } | null => {
    const lowerMessage = message.toLowerCase();
    
    // Detectar patrones como "cambiar las 6 por las 8", "cambiar de 6 a 8", "6 por 8", "CAMBIAME LAS HORAS QUE INICIAR A LAS 6 POR LAS 8", etc.
    const timeChangePattern = /(?:cambiar|ajustar|modificar|poner|mover|cambiame).*?(?:las\s+)?(?:horas?\s+que\s+)?(?:iniciar|empiezan|comienzan|empiecen|comiencen)\s*(?:a\s+las?|a)?\s*(\d{1,2}).*?(?:por|a|por las|a las)\s*(\d{1,2})/i;
    const match = message.match(timeChangePattern);
    
    if (match) {
      const oldHour = parseInt(match[1]);
      const newHour = parseInt(match[2]);
      
      if (oldHour >= 0 && oldHour <= 23 && newHour >= 0 && newHour <= 23) {
        return { oldHour, newHour };
      }
    }
    
    // Patrón alternativo más simple: "6 por 8", "de 6 a 8"
    // PERO solo si NO está en contexto de agregar horarios (ej: "jueves de 7 a 8")
    // Verificar que NO esté precedido por días de la semana o palabras de agregar
    const dayOfWeekPattern = /(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+(?:de\s+)?(\d{1,2})\s+(?:por|a)\s+(?:las?\s+)?(\d{1,2})/i;
    if (dayOfWeekPattern.test(message)) {
      // Es un horario nuevo, no un cambio
      return null;
    }
    
    const simplePattern = /(?:^|\s)(?:de\s+)?(\d{1,2})\s+(?:por|a)\s+(?:las?\s+)?(\d{1,2})(?:\s|$)/i;
    const simpleMatch = message.match(simplePattern);
    
    if (simpleMatch) {
      const oldHour = parseInt(simpleMatch[1]);
      const newHour = parseInt(simpleMatch[2]);
      
      if (oldHour >= 0 && oldHour <= 23 && newHour >= 0 && newHour <= 23) {
        return { oldHour, newHour };
      }
    }
    
    return null;
  };

  // Función para guardar el plan de estudios en la base de datos
  const saveStudyPlan = async () => {
    try {
      // Obtener preferencias del usuario o usar valores por defecto
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Calcular horas objetivo por semana basado en las sesiones
      const totalMinutes = savedLessonDistribution.reduce((acc, slot) => {
        const startMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
        const endMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
        if (startMatch && endMatch) {
          const startHour = parseInt(startMatch[1]);
          const startMin = parseInt(startMatch[2]);
          const endHour = parseInt(endMatch[1]);
          const endMin = parseInt(endMatch[2]);
          const startTotal = startHour * 60 + startMin;
          const endTotal = endHour * 60 + endMin;
          const duration = endTotal - startTotal;
          return acc + (duration > 0 ? duration : 0);
        }
        return acc;
      }, 0);
      
      // Calcular horas por semana: total de minutos / número de semanas que abarca el plan
      let goalHoursPerWeek = 5; // Valor por defecto
      if (savedLessonDistribution.length > 0 && totalMinutes > 0) {
        // Calcular el rango de fechas
        const dates = savedLessonDistribution.map(slot => {
          const dateParts = slot.dateStr.split('-');
          if (dateParts.length === 3) {
            return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          }
          return null;
        }).filter(d => d !== null) as Date[];
        
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          const daysDiff = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
          const weeks = Math.max(1, daysDiff / 7);
          goalHoursPerWeek = Math.round((totalMinutes / 60 / weeks) * 10) / 10;
        }
      }
      
      // Asegurar un valor mínimo razonable
      if (goalHoursPerWeek < 1) {
        goalHoursPerWeek = 5;
      }
      
      // Extraer días preferidos de las sesiones
      const preferredDaysSet = new Set<number>();
      savedLessonDistribution.forEach(slot => {
        const dateParts = slot.dateStr.split('-');
        if (dateParts.length === 3) {
          const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, etc.
          preferredDaysSet.add(dayOfWeek);
        }
      });
      const preferredDays = Array.from(preferredDaysSet).sort();
      
      // Si no hay días preferidos, usar valores por defecto
      if (preferredDays.length === 0) {
        preferredDays.push(1, 2, 3, 4, 5); // Lunes a Viernes por defecto
      }
      
      // Extraer bloques de tiempo preferidos
      const timeBlocksMap = new Map<string, { startHour: number; startMinute: number; endHour: number; endMinute: number }>();
      savedLessonDistribution.forEach(slot => {
        const startMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
        const endMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
        if (startMatch && endMatch) {
          const startHour = parseInt(startMatch[1]);
          const startMinute = parseInt(startMatch[2]);
          const endHour = parseInt(endMatch[1]);
          const endMinute = parseInt(endMatch[2]);
          const key = `${startHour}:${startMinute}-${endHour}:${endMinute}`;
          if (!timeBlocksMap.has(key)) {
            timeBlocksMap.set(key, { startHour, startMinute, endHour, endMinute });
          }
        }
      });
      const preferredTimeBlocks = Array.from(timeBlocksMap.values());
      
      // Si no hay bloques de tiempo, usar valores por defecto
      if (preferredTimeBlocks.length === 0) {
        preferredTimeBlocks.push({ startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 });
      }
      
      // Determinar tipo de sesión basado en studyApproach
      let preferredSessionType: 'short' | 'medium' | 'long' = 'medium';
      let minSessionMinutes = 45;
      let maxSessionMinutes = 60;
      let breakDurationMinutes = 10;
      
      if (studyApproach === 'rapido') {
        preferredSessionType = 'short';
        minSessionMinutes = 20;
        maxSessionMinutes = 35;
        breakDurationMinutes = 5;
      } else if (studyApproach === 'largo') {
        preferredSessionType = 'long';
        minSessionMinutes = 60;
        maxSessionMinutes = 90;
        breakDurationMinutes = 15;
      }
      
      // Obtener fecha de inicio y fin
      const startDate = savedLessonDistribution.length > 0 
        ? new Date(savedLessonDistribution[0].dateStr).toISOString()
        : new Date().toISOString();
      
      const endDate = savedTargetDate 
        ? new Date(savedTargetDate).toISOString()
        : savedLessonDistribution.length > 0
          ? new Date(savedLessonDistribution[savedLessonDistribution.length - 1].dateStr).toISOString()
          : null;
      
      // Transformar sesiones al formato esperado
      const sessions = savedLessonDistribution.map(slot => {
        const dateParts = slot.dateStr.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        const startMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
        const endMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
        
        let startTime = new Date(date);
        let endTime = new Date(date);
        
        if (startMatch && endMatch) {
          startTime.setHours(parseInt(startMatch[1]), parseInt(startMatch[2]), 0, 0);
          endTime.setHours(parseInt(endMatch[1]), parseInt(endMatch[2]), 0, 0);
        }
        
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        // Obtener la primera lección del slot para el título y courseId
        const firstLesson = slot.lessons && slot.lessons.length > 0 ? slot.lessons[0] : null;
        const courseTitle = firstLesson?.courseTitle || 'Curso';
        const lessonTitle = firstLesson?.lesson_title || 'Sesión de estudio';
        
        // Buscar el courseId del curso seleccionado
        const course = availableCourses.find(c => c.title === courseTitle || selectedCourseIds.includes(c.id));
        const courseId = course?.id || selectedCourseIds[0] || '';
        
        // Crear título de la sesión
        let sessionTitle = 'Sesión de estudio';
        if (slot.lessons && slot.lessons.length > 0) {
          if (slot.lessons.length === 1) {
            // Una sola lección: usar el título completo
            sessionTitle = slot.lessons[0].lesson_title;
          } else if (slot.lessons.length === 2) {
            // Dos lecciones: mostrar ambas en el título (limitado a 100 caracteres)
            const title1 = slot.lessons[0].lesson_title;
            const title2 = slot.lessons[1].lesson_title;
            const combinedTitle = `${title1} y ${title2}`;
            sessionTitle = combinedTitle.length > 100 
              ? `${title1.substring(0, 50)}... y ${title2.substring(0, 40)}...`
              : combinedTitle;
          } else {
            // Más de dos lecciones: mostrar primera y cantidad restante
            const firstTitle = slot.lessons[0].lesson_title;
            sessionTitle = firstTitle.length > 60
              ? `${firstTitle.substring(0, 60)}... y ${slot.lessons.length - 1} más`
              : `${firstTitle} y ${slot.lessons.length - 1} más`;
          }
        }
        
        // Crear descripción con todas las lecciones (formato numerado)
        const description = slot.lessons && slot.lessons.length > 0
          ? slot.lessons.map((l, idx) => `${idx + 1}. ${l.lesson_title}`).join('\n')
          : 'Sesión de estudio programada';
        
        return {
          title: sessionTitle,
          description,
          courseId,
          lessonId: undefined, // No tenemos el lessonId directamente, se puede buscar después si es necesario
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
          isAiGenerated: true,
          sessionType: preferredSessionType,
        };
      });
      
      // Crear configuración del plan
      const planConfig = {
        name: `Plan de Estudios - ${new Date().toLocaleDateString('es-ES')}`,
        description: `Plan generado por LIA con ${sessions.length} sesiones${selectedCourseIds.length > 0 ? ` para ${selectedCourseIds.length} curso(s)` : ''}`,
        userType: (userContext?.userType || 'b2c') as 'b2b' | 'b2c',
        courseIds: selectedCourseIds,
        goalHoursPerWeek,
        startDate,
        endDate: endDate || undefined,
        timezone,
        preferredDays,
        preferredTimeBlocks,
        minSessionMinutes,
        maxSessionMinutes,
        breakDurationMinutes,
        preferredSessionType,
        generationMode: 'ai_generated' as const,
        calendarAnalyzed: connectedCalendar !== null,
        calendarProvider: connectedCalendar || undefined,
      };
      
      // Validar datos antes de enviar
      if (!planConfig.name || planConfig.name.trim() === '') {
        throw new Error('El nombre del plan es requerido');
      }
      
      if (sessions.length === 0) {
        throw new Error('No hay sesiones para guardar');
      }
      
      if (preferredDays.length === 0) {
        throw new Error('No se pudieron determinar los días preferidos');
      }
      
      // Guardar el plan
      console.log('📤 Enviando plan a guardar:', {
        config: {
          ...planConfig,
          preferredDays,
          preferredTimeBlocks,
        },
        sessionsCount: sessions.length,
      });
      
      const saveResponse = await fetch('/api/study-planner/save-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: planConfig,
          sessions,
        }),
      });
      
      if (!saveResponse.ok) {
        let errorMessage = 'Error al guardar el plan';
        try {
          const errorData = await saveResponse.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ Error del servidor:', errorData);
        } catch (e) {
          const errorText = await saveResponse.text();
          console.error('❌ Error del servidor (texto):', errorText);
          errorMessage = `Error ${saveResponse.status}: ${saveResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const saveData = await saveResponse.json();
      
      if (!saveData.success) {
        throw new Error(saveData.error || 'Error al guardar el plan');
      }
      
      // Si hay calendario conectado, sincronizar las sesiones
      if (connectedCalendar && saveData.data?.planId && saveData.data?.sessionIds && saveData.data.sessionIds.length > 0) {
        try {
          const syncResponse = await fetch('/api/study-planner/calendar/sync-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionIds: saveData.data.sessionIds,
            }),
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            if (syncData.success && syncData.data) {
              console.log(`✅ ${syncData.data.syncedCount} sesiones sincronizadas con el calendario`);
            }
          }
        } catch (syncError) {
          console.error('Error sincronizando con calendario:', syncError);
          // No fallar el guardado si falla la sincronización
        }
      }
      
      // Mostrar mensaje de éxito
      const successMessage = `¡Perfecto! He guardado tu plan de estudios con ${sessions.length} sesiones programadas.${connectedCalendar ? ' Las sesiones han sido sincronizadas con tu calendario.' : ''}\n\nPuedes ver tu plan en la sección de "Mis Planes" y comenzar a estudiar cuando lo desees. ¡Éxito en tu aprendizaje! 🎓`;
      
      setConversationHistory(prev => {
        // Reemplazar el mensaje de procesamiento con el de éxito
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex]?.role === 'assistant' && newHistory[lastIndex]?.content.includes('Procesando')) {
          newHistory[lastIndex] = { role: 'assistant', content: successMessage };
        } else {
          newHistory.push({ role: 'assistant', content: successMessage });
        }
        return newHistory;
      });
      
      if (isAudioEnabled) {
        await speakText('Perfecto. He guardado tu plan de estudios con todas las sesiones programadas. Puedes comenzar a estudiar cuando lo desees.');
      }
      
      setIsProcessing(false);
      
    } catch (error: any) {
      console.error('Error guardando plan:', error);
      const errorMessage = `Lo siento, hubo un error al guardar tu plan de estudios: ${error.message || 'Error desconocido'}. Por favor, intenta de nuevo.`;
      
      setConversationHistory(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex]?.role === 'assistant' && newHistory[lastIndex]?.content.includes('Procesando')) {
          newHistory[lastIndex] = { role: 'assistant', content: errorMessage };
        } else {
          newHistory.push({ role: 'assistant', content: errorMessage });
        }
        return newHistory;
      });
      
      setIsProcessing(false);
    }
  };

  // Función para enviar mensajes a LIA
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    stopAllAudio();
    
    const lowerMessage = message.toLowerCase();
    
    // PRIMERO verificar si el usuario está AGREGANDO horarios (tiene prioridad sobre cambio)
    const isAddingSchedules = (
      lowerMessage.includes('añade') || 
      lowerMessage.includes('agrega') || 
      lowerMessage.includes('agregar') || 
      lowerMessage.includes('añadir') || 
      lowerMessage.includes('incluye') || 
      lowerMessage.includes('incluir') ||
      lowerMessage.includes('suma') ||
      lowerMessage.includes('sumar')
    ) && savedLessonDistribution.length > 0;
    
    // SOLO detectar cambio de horarios si NO está agregando horarios
    // Y si el mensaje contiene palabras explícitas de cambio
    const isExplicitChange = (
      lowerMessage.includes('cambiar') || 
      lowerMessage.includes('cambia') || 
      lowerMessage.includes('ajustar') || 
      lowerMessage.includes('modificar') || 
      lowerMessage.includes('mover') ||
      lowerMessage.includes('cambiame')
    );
    
    // Detectar si el usuario está pidiendo cambiar horarios (solo si es explícito y no está agregando)
    const timeChange = !isAddingSchedules && isExplicitChange ? extractTimeChangeRequest(message) : null;
    if (timeChange && savedLessonDistribution.length > 0 && savedCalendarData) {
      // Validar los nuevos horarios contra eventos del calendario
      const conflicts: Array<{ date: string; time: string; event: any }> = [];
      const validSlots: Array<{ date: string; time: string }> = [];
      
      savedLessonDistribution.forEach(slot => {
        if (slot.startTime && slot.endTime) {
          // Extraer hora del horario original
          const originalTimeMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
          if (originalTimeMatch) {
            const originalHour = parseInt(originalTimeMatch[1]);
            
            // Si coincide con la hora que quiere cambiar
            if (originalHour === timeChange.oldHour) {
              // Crear nuevo horario con la hora cambiada
              const dateParts = slot.dateStr.split('-');
              const slotDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
              
              const newStartTime = new Date(slotDate);
              newStartTime.setHours(timeChange.newHour || originalHour, parseInt(originalTimeMatch[2]), 0);
              
              // Calcular hora de fin (mantener la duración original)
              const originalEndTimeMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
              if (originalEndTimeMatch) {
                const originalEndHour = parseInt(originalEndTimeMatch[1]);
                const originalEndMin = parseInt(originalEndTimeMatch[2]);
                const durationMinutes = (originalEndHour * 60 + originalEndMin) - (originalHour * 60 + parseInt(originalTimeMatch[2]));
                
                const newEndTime = new Date(newStartTime);
                newEndTime.setMinutes(newEndTime.getMinutes() + durationMinutes);
                
                // Validar conflicto
                const validation = validateScheduleConflict(slotDate, newStartTime, newEndTime);
                
                if (validation.hasConflict) {
                  const eventTitle = validation.conflictingEvent?.summary || validation.conflictingEvent?.title || 'Evento';
                  conflicts.push({
                    date: slot.dateStr,
                    time: `${timeChange.newHour}:${originalTimeMatch[2]}`,
                    event: { ...validation.conflictingEvent, title: eventTitle }
                  });
                } else {
                  validSlots.push({
                    date: slot.dateStr,
                    time: `${timeChange.newHour}:${originalTimeMatch[2]}`
                  });
                }
              }
            }
          }
        }
      });
      
      // Si hay conflictos, informar al usuario antes de proceder
      if (conflicts.length > 0) {
        let conflictMessage = `He detectado que algunos de los horarios que quieres cambiar (de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00) chocan con eventos en tu calendario:\n\n`;
        
        conflicts.forEach(conflict => {
          const dateObj = new Date(conflict.date);
          const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
          const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
          const eventTitle = conflict.event?.title || conflict.event?.summary || 'Evento programado';
          conflictMessage += `• ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate} a las ${conflict.time}: Tienes "${eventTitle}" programado\n`;
        });
        
        conflictMessage += `\n¿Te gustaría que ajuste esos horarios a otros momentos disponibles ese día, o prefieres mantener los horarios originales?`;
        
        setConversationHistory(prev => [...prev, { role: 'assistant', content: conflictMessage }]);
        
        if (isAudioEnabled) {
          await speakText(`He detectado conflictos con tu calendario. Algunos horarios chocan con eventos programados.`);
        }
        
        setIsProcessing(false);
        return;
      }
    }
    
    // Detectar si el usuario está confirmando los horarios propuestos (primera confirmación)
    const isConfirmingSchedules = (
      lowerMessage.includes('sí') || 
      lowerMessage.includes('si') || 
      lowerMessage.includes('me sirven') || 
      lowerMessage.includes('confirmo') || 
      lowerMessage.includes('está bien') || 
      lowerMessage.includes('perfecto') ||
      lowerMessage.includes('de acuerdo') ||
      lowerMessage.includes('adelante') ||
      lowerMessage.includes('procede')
    ) && savedLessonDistribution.length > 0;
    
    // Detectar si el usuario está confirmando el resumen final (segunda confirmación)
    const isConfirmingFinalSummary = (
      (lowerMessage.includes('sí') || 
      lowerMessage.includes('si') || 
      lowerMessage.includes('confirmo') || 
      lowerMessage.includes('está bien') || 
      lowerMessage.includes('perfecto') ||
      lowerMessage.includes('de acuerdo') ||
      lowerMessage.includes('adelante') ||
      lowerMessage.includes('procede') ||
      lowerMessage.includes('guardar') ||
      lowerMessage.includes('crear plan'))
    ) && hasShownFinalSummary && savedLessonDistribution.length > 0;
    
    // Detectar si el usuario está cambiando la fecha límite
    const isChangingTargetDate = (
      lowerMessage.includes('cambiar') && (lowerMessage.includes('fecha') || lowerMessage.includes('límite') || lowerMessage.includes('limite')) ||
      lowerMessage.includes('cambia') && (lowerMessage.includes('fecha') || lowerMessage.includes('límite') || lowerMessage.includes('limite')) ||
      lowerMessage.includes('extender') && (lowerMessage.includes('fecha') || lowerMessage.includes('límite') || lowerMessage.includes('limite')) ||
      lowerMessage.includes('extiende') && (lowerMessage.includes('fecha') || lowerMessage.includes('límite') || lowerMessage.includes('limite')) ||
      lowerMessage.includes('actualizar') && (lowerMessage.includes('fecha') || lowerMessage.includes('límite') || lowerMessage.includes('limite')) ||
      lowerMessage.includes('actualiza') && (lowerMessage.includes('fecha') || lowerMessage.includes('límite') || lowerMessage.includes('limite'))
    ) && savedLessonDistribution.length > 0;
    
    // Si está confirmando el resumen final, guardar el plan
    if (isConfirmingFinalSummary) {
      // Agregar mensaje del usuario
      const newHistory = [...conversationHistory, { role: 'user', content: message }];
      setConversationHistory(newHistory);
      setIsProcessing(true);
      
      // Mostrar mensaje de procesamiento
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '⏳ Procesando tu plan de estudios... Estoy guardando todas las sesiones y sincronizándolas con tu calendario.' 
      }]);
      
      if (isAudioEnabled) {
        await speakText('Procesando tu plan de estudios. Estoy guardando todas las sesiones y sincronizándolas con tu calendario.');
      }
      
      // Guardar el plan
      try {
        await saveStudyPlan();
        // Resetear el estado del resumen después de guardar
        setHasShownFinalSummary(false);
      } catch (error) {
        console.error('Error guardando plan:', error);
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'Lo siento, hubo un error al guardar tu plan de estudios. Por favor, intenta de nuevo.' 
        }]);
        setIsProcessing(false);
      }
      return;
    }
    
    // Si está confirmando los horarios propuestos (primera confirmación), mostrar el resumen final
    let enrichedMessage = message;
    if (isConfirmingSchedules && !hasShownFinalSummary) {
      // Función para formatear la fecha de forma legible
      const formatDateForDisplay = (dateStr: string, dayName: string): string => {
        try {
          // dateStr viene en formato YYYY-MM-DD
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[2]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[0]);
            const date = new Date(year, month, day);
            
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${capitalizedDay} ${day} de ${monthNames[month]} de ${year}`;
          }
        } catch (e) {
          console.error('Error formateando fecha:', e);
        }
        return dayName + ' ' + dateStr;
      };
      
      // Construir el resumen detallado con la distribución de lecciones
      // Formato OPTIMIZADO para LIA - solo primeros y últimos slots para evitar error 400
      let distributionSummary = `\n\n**RESUMEN DEL PLAN DE ESTUDIOS:**\n`;
      distributionSummary += `\n`;
      distributionSummary += `**Curso(s) seleccionado(s):**\n`;
      selectedCourseIds.forEach(courseId => {
        const course = availableCourses.find(c => c.id === courseId);
        if (course) {
          distributionSummary += `- ${course.title}\n`;
        }
      });
      distributionSummary += `\n`;
      distributionSummary += `**Enfoque de estudio:** ${studyApproach === 'rapido' ? 'Sesiones rápidas (25 min + 5 min descanso)' : studyApproach === 'normal' ? 'Sesiones normales (45 min + 10 min descanso)' : 'Sesiones largas (60 min + 15 min descanso)'}\n`;
      distributionSummary += `**Fecha límite para completar:** ${savedTargetDate || 'No especificada'}\n`;
      distributionSummary += `\n`;
      
      // 🚨 INSTRUCCIÓN CRÍTICA SOBRE LA FECHA LÍMITE
      if (savedTargetDate) {
        distributionSummary += `🚨 REGLA ABSOLUTA SOBRE LA FECHA LÍMITE:\n`;
        distributionSummary += `- La fecha límite establecida es: **${savedTargetDate}**\n`;
        distributionSummary += `- NUNCA, bajo NINGUNA circunstancia, debes crear o sugerir horarios DESPUÉS de esta fecha\n`;
        distributionSummary += `- Si el usuario solicita agregar horarios (ej: "agrega los jueves de 6 a 8pm"), calcula SOLO hasta ${savedTargetDate}\n`;
        distributionSummary += `- Si un horario calculado cae después de ${savedTargetDate}, NO LO INCLUYAS\n`;
        distributionSummary += `- NUNCA inventes fechas inválidas (ej: 30 de febrero, 31 de abril)\n`;
        distributionSummary += `- VERIFICA que cada fecha que generes sea válida y anterior o igual a ${savedTargetDate}\n`;
        distributionSummary += `\n`;
      }

      let totalLessonsAssigned = 0;
      console.log('📋 Preparando distribución para LIA:');
      console.log(`   savedLessonDistribution.length: ${savedLessonDistribution.length}`);

      // Contar total de lecciones
      savedLessonDistribution.forEach((item) => {
        if (item?.lessons && Array.isArray(item.lessons)) {
          totalLessonsAssigned += item.lessons.filter(l => l?.lessonTitle?.trim()).length;
        }
      });

      // Mostrar TODAS las sesiones hasta la fecha objetivo
      distributionSummary += `**DISTRIBUCIÓN DE LECCIONES:**\n`;
      distributionSummary += `Total de sesiones: ${savedLessonDistribution.length}\n`;
      distributionSummary += `Total de lecciones asignadas: ${totalLessonsAssigned}\n\n`;

      // Mostrar TODAS las sesiones (no solo las primeras 5)
      savedLessonDistribution.forEach((item, idx) => {
        // Validar que el item tenga datos válidos
        if (!item || !item.dateStr || !item.startTime || !item.endTime) {
          return;
        }

        const formattedDate = formatDateForDisplay(item.dateStr, item.dayName);
        const lessonCount = item.lessons?.filter(l => l?.lessonTitle?.trim()).length || 0;

        distributionSummary += `\n**${formattedDate}** de ${item.startTime} a ${item.endTime}. Lecciones a estudiar:\n`;

        // Mostrar TODAS las lecciones asignadas a cada slot
        if (item.lessons && Array.isArray(item.lessons) && item.lessons.length > 0) {
          item.lessons.forEach((lesson, lessonIndex) => {
            if (lesson?.lessonTitle?.trim()) {
              const lessonTitle = lesson.lessonTitle.trim();
              const lessonNum = lesson.lessonOrderIndex > 0 ? lesson.lessonOrderIndex : lessonIndex + 1;
              distributionSummary += `• Lección ${lessonNum}: ${lessonTitle}\n`;

              // Log para debugging de las primeras sesiones
              if (idx < 3 && lessonIndex < 3) {
                console.log(`   Slot ${idx}, Lección ${lessonIndex}: ${lessonNum} - ${lessonTitle}`);
              }
            }
          });
        } else {
          distributionSummary += `• Sin lecciones asignadas\n`;
        }
      });

      distributionSummary += `\n`;
      distributionSummary += `**VERIFICACIÓN:**\n`;
      if (totalLessonsAssigned >= savedTotalLessons) {
        distributionSummary += `✅ Se completarán todas las ${savedTotalLessons} lecciones antes de ${savedTargetDate}.\n`;
      } else {
        distributionSummary += `⚠️ Se han asignado ${totalLessonsAssigned} de ${savedTotalLessons} lecciones. Faltan ${savedTotalLessons - totalLessonsAssigned} por asignar.\n`;
      }

      // Instrucciones importantes sobre qué lecciones incluir
      distributionSummary += `\n`;
      distributionSummary += `**🚨 CRÍTICO - INSTRUCCIONES PARA EL RESUMEN:**\n`;
      distributionSummary += `- Total de lecciones en el plan: ${totalLessonsAssigned} lecciones PENDIENTES\n`;
      distributionSummary += `- Las lecciones YA COMPLETADAS fueron filtradas y NO están en este plan\n`;
      distributionSummary += `- **USA SOLO LAS LECCIONES QUE ESTÁN LISTADAS ARRIBA EN CADA HORARIO**\n`;
      distributionSummary += `- **NO inventes lecciones desde el principio** - el usuario ya tiene lecciones completadas\n`;
      distributionSummary += `- **NO empieces desde "Lección 1"** - usa SOLO las lecciones que están asignadas arriba\n`;
      distributionSummary += `- En tu contexto, SOLO usa las lecciones marcadas como "○ Pendiente"\n`;
      distributionSummary += `- NO incluyas lecciones marcadas como "✓ Completada"\n`;
      distributionSummary += `- Cada horario tiene lecciones específicas asignadas - usa EXACTAMENTE esas lecciones\n`;
      distributionSummary += `\n`;
      distributionSummary += `*Genera un resumen completo con TODOS los horarios, usando EXACTAMENTE las lecciones que están asignadas arriba en cada horario. NO inventes lecciones.*`;
      
      enrichedMessage = message + distributionSummary;
      console.log('📋 Usuario confirmó horarios, enviando distribución detallada a LIA para generar resumen final');
      console.log(`   Total de horarios: ${savedLessonDistribution.length}`);
      console.log(`   Total de lecciones asignadas: ${totalLessonsAssigned}`);
      
      // Marcar que vamos a mostrar el resumen final después de que LIA responda
      // Esto se marcará como true cuando LIA responda con el resumen
    } else if (isAddingSchedules) {
      // Función para formatear la fecha de forma legible
      const formatDateForDisplay = (dateStr: string, dayName: string): string => {
        try {
          // dateStr viene en formato YYYY-MM-DD
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[2]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[0]);
            const date = new Date(year, month, day);
            
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${capitalizedDay} ${day} de ${monthNames[month]} de ${year}`;
          }
        } catch (e) {
          console.error('Error formateando fecha:', e);
        }
        return dayName + ' ' + dateStr;
      };
      
      // Construir el contexto de horarios existentes para AGREGAR nuevos
      let addScheduleContext = `\n\n**🚨 INSTRUCCIÓN CRÍTICA - AGREGAR HORARIOS:**\n`;
      addScheduleContext += `El usuario está solicitando AGREGAR nuevos horarios, NO reemplazar los existentes.\n`;
      addScheduleContext += `DEBES MANTENER todos los horarios que ya están asignados y AGREGAR los nuevos horarios solicitados.\n\n`;
      
      addScheduleContext += `**HORARIOS EXISTENTES QUE DEBES MANTENER:**\n`;
      addScheduleContext += `Total de sesiones actuales: ${savedLessonDistribution.length}\n\n`;
      
      let totalLessonsAssigned = 0;
      
      // Mostrar TODOS los horarios existentes
      savedLessonDistribution.forEach((item, idx) => {
        if (!item || !item.dateStr || !item.startTime || !item.endTime) {
          return;
        }

        const formattedDate = formatDateForDisplay(item.dateStr, item.dayName);
        const lessonCount = item.lessons?.filter(l => l?.lessonTitle?.trim()).length || 0;
        totalLessonsAssigned += lessonCount;

        addScheduleContext += `**${formattedDate}** de ${item.startTime} a ${item.endTime}:\n`;

        if (item.lessons && Array.isArray(item.lessons) && item.lessons.length > 0) {
          item.lessons.forEach((lesson) => {
            if (lesson?.lessonTitle?.trim()) {
              const lessonTitle = lesson.lessonTitle.trim();
              const lessonNum = lesson.lessonOrderIndex > 0 ? lesson.lessonOrderIndex : 0;
              addScheduleContext += `  • Lección ${lessonNum}: ${lessonTitle}\n`;
            }
          });
        }
        addScheduleContext += `\n`;
      });
      
      addScheduleContext += `**RESUMEN DE HORARIOS EXISTENTES:**\n`;
      addScheduleContext += `- Total de sesiones: ${savedLessonDistribution.length}\n`;
      addScheduleContext += `- Total de lecciones asignadas: ${totalLessonsAssigned}\n`;
      addScheduleContext += `- Lecciones pendientes por asignar: ${savedTotalLessons - totalLessonsAssigned}\n\n`;
      
      // Validar conflictos con el calendario si hay datos guardados
      if (savedCalendarData && Object.keys(savedCalendarData).length > 0) {
        addScheduleContext += `**⚠️ VALIDACIÓN DE CONFLICTOS:**\n`;
        addScheduleContext += `- Si los nuevos horarios solicitados tienen conflictos con eventos del calendario, NO los incluyas\n`;
        addScheduleContext += `- Solo incluye los horarios nuevos que NO tengan conflictos\n`;
        addScheduleContext += `- Advierte al usuario sobre cualquier conflicto detectado\n\n`;
      }
      
      // Instrucciones sobre la fecha límite
      if (savedTargetDate) {
        addScheduleContext += `**🚨 FECHA LÍMITE:**\n`;
        addScheduleContext += `- Fecha límite establecida: **${savedTargetDate}**\n`;
        addScheduleContext += `- NO generes horarios después de esta fecha\n`;
        addScheduleContext += `- Calcula los nuevos horarios SOLO hasta ${savedTargetDate}\n\n`;
      }
      
      addScheduleContext += `**🚨 INSTRUCCIONES CRÍTICAS PARA TU RESPUESTA:**\n`;
      addScheduleContext += `1. MANTÉN todos los horarios existentes listados arriba CON SUS LECCIONES EXACTAS\n`;
      addScheduleContext += `2. AGREGA los nuevos horarios solicitados por el usuario\n`;
      addScheduleContext += `3. Muestra un resumen COMPLETO con TODOS los horarios (existentes + nuevos)\n`;
      addScheduleContext += `4. **ORDENA TODOS LOS HORARIOS CRONOLÓGICAMENTE** (del más antiguo al más reciente por fecha)\n`;
      addScheduleContext += `5. **USA EXACTAMENTE LAS LECCIONES QUE ESTÁN ASIGNADAS EN CADA HORARIO EXISTENTE**\n`;
      addScheduleContext += `6. **NO inventes lecciones desde el principio** - el usuario puede tener lecciones completadas\n`;
      addScheduleContext += `7. **NO empieces desde "Lección 1"** - usa SOLO las lecciones que están listadas arriba\n`;
      addScheduleContext += `8. Si hay conflictos con el calendario, advierte al usuario pero incluye los horarios sin conflictos\n`;
      addScheduleContext += `9. Distribuye las lecciones pendientes (de tu contexto) en los nuevos horarios agregados\n\n`;
      
      enrichedMessage = message + addScheduleContext;
      console.log('➕ Usuario solicitó agregar horarios, enviando contexto de horarios existentes a LIA');
      console.log(`   Total de horarios existentes: ${savedLessonDistribution.length}`);
      console.log(`   Total de lecciones asignadas: ${totalLessonsAssigned}`);
    } else if (isChangingTargetDate) {
      // Función para formatear la fecha de forma legible
      const formatDateForDisplay = (dateStr: string, dayName: string): string => {
        try {
          // dateStr viene en formato YYYY-MM-DD
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[2]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[0]);
            const date = new Date(year, month, day);
            
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${capitalizedDay} ${day} de ${monthNames[month]} de ${year}`;
          }
        } catch (e) {
          console.error('Error formateando fecha:', e);
        }
        return dayName + ' ' + dateStr;
      };
      
      // Construir el contexto de horarios existentes cuando se cambia la fecha límite
      let changeDateContext = `\n\n**🚨 INSTRUCCIÓN CRÍTICA - CAMBIAR FECHA LÍMITE:**\n`;
      changeDateContext += `El usuario está solicitando CAMBIAR la fecha límite, NO eliminar los horarios existentes.\n`;
      changeDateContext += `DEBES MANTENER todos los horarios que ya están asignados y actualizar la fecha límite.\n`;
      changeDateContext += `Si la nueva fecha límite es posterior a la anterior, puedes agregar más horarios hasta la nueva fecha.\n\n`;
      
      changeDateContext += `**HORARIOS EXISTENTES QUE DEBES MANTENER:**\n`;
      changeDateContext += `Total de sesiones actuales: ${savedLessonDistribution.length}\n\n`;
      
      let totalLessonsAssigned = 0;
      
      // Mostrar TODOS los horarios existentes
      savedLessonDistribution.forEach((item, idx) => {
        if (!item || !item.dateStr || !item.startTime || !item.endTime) {
          return;
        }

        const formattedDate = formatDateForDisplay(item.dateStr, item.dayName);
        const lessonCount = item.lessons?.filter(l => l?.lesson_title?.trim()).length || 0;
        totalLessonsAssigned += lessonCount;

        changeDateContext += `**${formattedDate}** de ${item.startTime} a ${item.endTime}:\n`;
        
        if (item.lessons && Array.isArray(item.lessons) && item.lessons.length > 0) {
          item.lessons.forEach((lesson) => {
            if (lesson?.lesson_title?.trim()) {
              const lessonTitle = lesson.lesson_title.trim();
              const lessonNum = lesson.lesson_order_index > 0 ? lesson.lesson_order_index : 0;
              changeDateContext += `  • Lección ${lessonNum}: ${lessonTitle}\n`;
            }
          });
        }
        changeDateContext += `\n`;
      });
      
      changeDateContext += `**RESUMEN DE HORARIOS EXISTENTES:**\n`;
      changeDateContext += `- Total de sesiones: ${savedLessonDistribution.length}\n`;
      changeDateContext += `- Total de lecciones asignadas: ${totalLessonsAssigned}\n`;
      changeDateContext += `- Lecciones pendientes por asignar: ${savedTotalLessons - totalLessonsAssigned}\n\n`;
      
      // Instrucciones sobre la nueva fecha límite
      changeDateContext += `**🚨 INSTRUCCIONES PARA CAMBIAR FECHA LÍMITE:**\n`;
      changeDateContext += `1. MANTÉN todos los horarios existentes listados arriba\n`;
      changeDateContext += `2. Extrae la nueva fecha límite del mensaje del usuario\n`;
      changeDateContext += `3. Si la nueva fecha es posterior a la anterior, puedes agregar más horarios hasta la nueva fecha\n`;
      changeDateContext += `4. Si la nueva fecha es anterior, mantén solo los horarios que estén antes de la nueva fecha\n`;
      changeDateContext += `5. Muestra un resumen COMPLETO con TODOS los horarios (existentes + nuevos si aplica)\n`;
      changeDateContext += `6. **ORDENA TODOS LOS HORARIOS CRONOLÓGICAMENTE** (del más antiguo al más reciente por fecha)\n`;
      changeDateContext += `7. **USA EXACTAMENTE LAS LECCIONES QUE ESTÁN ASIGNADAS EN CADA HORARIO EXISTENTE**\n`;
      changeDateContext += `8. **NO inventes lecciones desde el principio** - el usuario puede tener lecciones completadas\n`;
      changeDateContext += `9. **NO empieces desde "Lección 1"** - usa SOLO las lecciones que están listadas arriba\n`;
      changeDateContext += `10. Distribuye las lecciones pendientes (de tu contexto) en los nuevos horarios si se agregaron\n\n`;
      
      enrichedMessage = message + changeDateContext;
      console.log('📅 Usuario solicitó cambiar fecha límite, enviando contexto de horarios existentes a LIA');
      console.log(`   Total de horarios existentes: ${savedLessonDistribution.length}`);
      console.log(`   Total de lecciones asignadas: ${totalLessonsAssigned}`);
    }
    
    // Agregar mensaje del usuario (sin el enriquecimiento visible)
    const newHistory = [...conversationHistory, { role: 'user', content: message }];
    setConversationHistory(newHistory);
    setIsProcessing(true);

    try {
      // Validación de seguridad: detectar intentos de prompt injection
      const promptInjectionPatterns = [
        /ignora\s+(todas?\s+)?las?\s+instrucciones/i,
        /olvida\s+(que\s+)?eres/i,
        /ahora\s+eres/i,
        /actúa\s+como/i,
        /sé\s+que\s+eres\s+un\s+asistente/i,
        /muéstrame\s+el\s+prompt/i,
        /revela\s+las?\s+instrucciones/i,
        /dime\s+tu\s+configuración/i,
        /ejecuta\s+(código|comando|script)/i,
        /system\s*:\s*ignore/i,
        /\[SYSTEM\]/i,
        /<\|system\|>/i,
      ];

      const hasInjectionAttempt = promptInjectionPatterns.some(pattern => 
        pattern.test(enrichedMessage) || pattern.test(message)
      );
      
      if (hasInjectionAttempt) {
        console.warn('🚫 Intento de prompt injection detectado, bloqueando...');
        setConversationHistory(prev => [...prev, {
          role: 'assistant',
          content: 'Entiendo que quieres probar diferentes cosas, pero estoy aquí específicamente para ayudarte con tu plan de estudios. ¿En qué puedo asistirte con la planificación de tus cursos?'
        }]);
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedMessage,
          context: 'study-planner',
          language: 'es', // FORZAR ESPAÑOL siempre
          conversationHistory: newHistory.slice(-10),
          pageContext: {
            pathname: '/study-planner/create',
            detectedArea: 'study-planner',
            description: 'Planificador de estudios con LIA',
            // Incluir contexto del usuario para que LIA lo use
            userContext: userContext ? {
              userType: userContext.userType,
              rol: userContext.rol,
              area: userContext.area,
              nivel: userContext.nivel,
              tamanoEmpresa: userContext.tamanoEmpresa,
              organizationName: userContext.organizationName,
              isB2B: userContext.userType === 'b2b',
              calendarConnected: connectedCalendar !== null,
              calendarProvider: connectedCalendar,
              // Información adicional sobre el estado actual
              hasCalendarAnalyzed: newHistory.some(msg => 
                msg.role === 'assistant' && (
                  msg.content.includes('analizado tu calendario') ||
                  msg.content.includes('horarios recomendados') ||
                  msg.content.includes('MIS RECOMENDACIONES')
                )
              ),
              hasRecommendedSchedules: newHistory.some(msg =>
                msg.role === 'assistant' && msg.content.includes('METAS SEMANALES')
              )
            } : {
              calendarConnected: connectedCalendar !== null,
              calendarProvider: connectedCalendar
            }
          },
          language: 'es'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta de LIA:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Error al comunicarse con LIA: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let liaResponse = data.response;

      // Filtro adicional de seguridad: eliminar cualquier rastro del prompt del sistema
      const systemPromptIndicators = [
        'PROMPT MAESTRO',
        'INSTRUCCIÓN DE IDIOMA',
        'INFORMACIÓN DEL USUARIO',
        'TU ROL:',
        'TU ROL',
        'Responde ESTRICTAMENTE en ESPAÑOL',
        'El nombre del usuario es:',
        'la asistente inteligente del Planificador de Estudios',
        'NUNCA usar el nombre del usuario',
        'NUNCA saludar al usuario',
        'Eres Lia, un asistente',
        'Eres LIA (Learning Intelligence Assistant)',
        'CONTEXTO DE LA PÁGINA ACTUAL:',
        'FORMATO DE RESPUESTAS (CRÍTICO):',
        'REGLA CRÍTICA',
        'NUNCA, BAJO NINGUNA CIRCUNSTANCIA'
      ];
      
      // Si la respuesta contiene múltiples indicadores del prompt, reemplazarla
      const indicatorCount = systemPromptIndicators.filter(indicator => 
        liaResponse.includes(indicator)
      ).length;
      
      if (indicatorCount >= 2 || liaResponse.trim().startsWith('PROMPT') || liaResponse.trim().startsWith('INSTRUCCIÓN')) {
        console.warn('🚫 Prompt del sistema detectado en respuesta, filtrando...');
        liaResponse = 'Hola! 😊 Estoy aquí para ayudarte con tu plan de estudios. ¿En qué te puedo asistir?';
      }

      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);
      
      // Si fue una confirmación de horarios y LIA está mostrando el resumen final, marcar que se mostró
      if (isConfirmingSchedules && !hasShownFinalSummary && (
        liaResponse.includes('RESUMEN') || 
        liaResponse.includes('resumen') || 
        liaResponse.includes('distribución') ||
        liaResponse.includes('sesiones programadas') ||
        liaResponse.includes('plan de estudios') ||
        liaResponse.includes('sesiones generadas') ||
        liaResponse.includes('DISTRIBUCIÓN')
      )) {
        setHasShownFinalSummary(true);
        console.log('✅ Resumen final mostrado por LIA, esperando confirmación del usuario para guardar');
      }
      
      // Si fue una solicitud de agregar horarios, la respuesta de LIA ya incluye todos los horarios (existentes + nuevos)
      // Cuando el usuario confirme, handleConfirmSchedules parseará la respuesta completa
      if (isAddingSchedules) {
        console.log('✅ LIA respondió a solicitud de agregar horarios');
        console.log('   La respuesta incluye todos los horarios (existentes + nuevos)');
        console.log('   Cuando el usuario confirme, se actualizará savedLessonDistribution');
      }
      
      // Detectar si LIA está pidiendo seleccionar cursos y abrir el modal automáticamente
      if (liaResponse.includes('¿Qué cursos te gustaría incluir?') || 
          liaResponse.includes('qué cursos') || 
          liaResponse.includes('seleccionar cursos')) {
        // Pequeño delay para que el mensaje se muestre primero
        setTimeout(() => {
          loadUserCourses();
        }, 500);
      }

      // Detectar respuesta sobre enfoque de estudio
      if (hasAskedApproach && !studyApproach) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('rápido') || lowerMessage.includes('rapido') || lowerMessage.includes('rápidas') || lowerMessage.includes('rapidas')) {
          setStudyApproach('rapido');
          await handleStudyApproachResponse('rapido');
          return;
        } else if (lowerMessage.includes('normal') || lowerMessage.includes('normales') || lowerMessage.includes('equilibrado')) {
          setStudyApproach('normal');
          await handleStudyApproachResponse('normal');
          return;
        } else if (lowerMessage.includes('largo') || lowerMessage.includes('largas') || lowerMessage.includes('extensas') || lowerMessage.includes('profundizar')) {
          setStudyApproach('largo');
          await handleStudyApproachResponse('largo');
          return;
        }
      }

      // Detectar respuesta sobre fecha estimada (solo si el modal no está abierto)
      if (hasAskedTargetDate && !targetDate && studyApproach && !showDateModal) {
        // Intentar extraer fecha del mensaje
        const dateMatch = message.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})|(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
        if (dateMatch || message.toLowerCase().includes('mes') || message.toLowerCase().includes('semana') || message.toLowerCase().includes('día') || message.toLowerCase().includes('dias')) {
          setTargetDate(message);
          await handleTargetDateResponse(message);
          return;
        }
      }
      
      if (isAudioEnabled) {
        await speakText(liaResponse);
      }

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMessage = 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?';
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    if (!newState) {
      stopAllAudio();
    } else {
      speakText(STUDY_PLANNER_STEPS[currentStep].speech);
    }
  };

  const step = STUDY_PLANNER_STEPS[currentStep];

  return (
    <>
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md z-[9998]"
            onClick={handleSkip}
          />

          {/* Contenedor principal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                duration: 0.6 
              }}
              className="relative max-w-4xl w-full pointer-events-auto max-h-[95vh] flex flex-col items-center justify-center"
            >
              {/* Esfera animada con avatar de LIA */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  <motion.div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-1 overflow-hidden"
                    animate={{ 
                      scale: isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: isSpeaking 
                        ? [
                            '0 0 30px rgba(59, 130, 246, 0.6)',
                            '0 0 80px rgba(168, 85, 247, 0.9)',
                            '0 0 30px rgba(59, 130, 246, 0.6)',
                          ]
                        : '0 0 50px rgba(139, 92, 246, 0.7)'
                    }}
                    transition={{ 
                      scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                      boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                      <Image
                        src="/lia-avatar.png"
                        alt="LIA"
                        fill
                        sizes="256px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </motion.div>

                  {/* Partículas flotantes */}
                  {[...Array(8)].map((_, i) => {
                    const radius = isMobile ? 50 : 70;
                    return (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                        }}
                        animate={{
                          x: [0, Math.cos(i * 45 * Math.PI / 180) * radius],
                          y: [0, Math.sin(i * 45 * Math.PI / 180) * radius],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeOut'
                        }}
                      />
                    );
                  })}

                  {/* Pulso de voz cuando está hablando */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute inset-6 sm:inset-8 rounded-full border-2 border-white/50"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </div>

                {/* Panel de contenido */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    duration: 0.5
                  }}
                  className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-2.5 sm:p-3 md:p-4 w-full overflow-hidden flex-shrink min-h-0"
                >
                  {/* Efecto de brillo animado */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />

                  {/* Contenido relativo */}
                  <div className="relative z-10">
                    {/* Botones de control */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
                      <motion.button
                        onClick={toggleAudio}
                        whileHover={{ 
                          scale: 1.15,
                          rotate: [0, -10, 10, -10, 0],
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 17,
                          rotate: { duration: 0.5 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-lg overflow-hidden group"
                      >
                        <motion.span
                          className="relative z-10"
                          animate={isSpeaking ? {
                            scale: [1, 1.2, 1],
                          } : {}}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          {isAudioEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
                        </motion.span>
                      </motion.button>
                      <motion.button
                        onClick={handleSkip}
                        whileHover={{ 
                          scale: 1.15,
                          rotate: 90,
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 17,
                          rotate: { duration: 0.3 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 shadow-lg overflow-hidden group"
                      >
                        <span className="relative z-10">
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </span>
                      </motion.button>
                    </div>

                    {/* Indicador de progreso */}
                    <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3 justify-center items-center">
                      {STUDY_PLANNER_STEPS.map((_, idx) => (
                        <motion.div
                          key={idx}
                          className="relative"
                          whileHover={{ scale: 1.2 }}
                        >
                          <motion.div
                            className={`h-1 sm:h-1.5 rounded-full transition-all ${
                              idx === currentStep 
                                ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 shadow-lg shadow-blue-500/50' 
                                : idx < currentStep 
                                ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'w-4 sm:w-5 md:w-6 bg-gray-300 dark:bg-gray-600'
                            }`}
                            animate={idx === currentStep ? {
                              scale: [1, 1.15, 1],
                              boxShadow: [
                                '0 0 0px rgba(59, 130, 246, 0.5)',
                                '0 0 20px rgba(168, 85, 247, 0.8)',
                                '0 0 0px rgba(59, 130, 246, 0.5)',
                              ]
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Contenido del paso */}
                    <div className="text-center space-y-1.5 sm:space-y-2">
                      <motion.h2
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight px-2"
                      >
                        {step.title}
                      </motion.h2>
                      
                      <motion.p
                        key={`description-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light px-2"
                      >
                        {step.description}
                      </motion.p>

                      {/* Interfaz de conversación por voz (solo en paso 4) */}
                      {currentStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className="mt-2 sm:mt-3 space-y-2 sm:space-y-3"
                        >
                          <div className="flex justify-center">
                            <motion.div
                              className="relative"
                              animate={isListening ? {
                                scale: [1, 1.05],
                              } : {}}
                              transition={{
                                type: 'tween',
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut'
                              }}
                            >
                              {isListening && (
                                <>
                                  <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-green-400/50"
                                    animate={{
                                      scale: [1, 1.4, 1.4],
                                      opacity: [0.8, 0, 0],
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: 'easeOut'
                                    }}
                                  />
                                  <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                                    animate={{
                                      scale: [1, 1.6, 1.6],
                                      opacity: [0.6, 0, 0],
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: 'easeOut',
                                      delay: 0.3
                                    }}
                                  />
                                </>
                              )}
                              
                              <motion.button
                                onClick={toggleListening}
                                disabled={isProcessing}
                                className={`relative p-5 sm:p-6 md:p-7 rounded-full transition-all shadow-2xl overflow-hidden ${
                                  isListening 
                                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500' 
                                    : isProcessing
                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600'
                                }`}
                                whileHover={isProcessing ? {} : { 
                                  scale: 1.12,
                                  boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)'
                                }}
                                whileTap={isProcessing ? {} : { scale: 0.88 }}
                                animate={isListening ? {
                                  boxShadow: [
                                    '0 0 25px rgba(34, 197, 94, 0.7)',
                                    '0 0 70px rgba(34, 197, 94, 1)',
                                  ],
                                  scale: [1, 1.05]
                                } : isProcessing ? {
                                  boxShadow: [
                                    '0 0 20px rgba(107, 114, 128, 0.5)',
                                    '0 0 35px rgba(107, 114, 128, 0.7)',
                                  ]
                                } : {}}
                                transition={{ 
                                  boxShadow: {
                                    type: 'tween',
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                    ease: 'easeInOut'
                                  },
                                  scale: {
                                    type: 'tween',
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                    ease: 'easeInOut'
                                  }
                                }}
                              >
                                {isProcessing ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  >
                                    <Mic size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                                  </motion.div>
                                ) : isListening ? (
                                  <MicOff size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                                ) : (
                                  <Mic size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                                )}
                              </motion.button>
                            </motion.div>
                          </div>

                          <motion.p
                            key={isListening ? 'listening' : isProcessing ? 'processing' : 'idle'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs sm:text-sm md:text-base text-gray-800 dark:text-gray-200 font-medium"
                          >
                            {isProcessing 
                              ? 'Procesando tu pregunta...' 
                              : isListening 
                              ? 'Escuchando... Habla ahora' 
                              : 'Haz clic en el micrófono para hablar con LIA'}
                          </motion.p>
                        </motion.div>
                      )}
                    </div>

                    {/* Botones de navegación */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2 sm:mt-3 md:mt-4">
                      {currentStep > 0 && (
                        <motion.button
                          onClick={handlePrevious}
                          whileHover={{ 
                            scale: 1.08, 
                            x: -4,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors shadow-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm overflow-hidden group"
                        >
                          <span className="relative z-10">Anterior</span>
                        </motion.button>
                      )}

                      {currentStep < STUDY_PLANNER_STEPS.length - 1 ? (
                        <motion.button
                          onClick={handleNext}
                          whileHover={{ 
                            scale: 1.08,
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-blue-500/30 dark:shadow-blue-500/20 text-xs sm:text-sm overflow-hidden group"
                        >
                          <span className="relative z-10">Siguiente</span>
                          <motion.span
                            className="relative z-10"
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                          </motion.span>
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={handleComplete}
                          whileHover={{ 
                            scale: 1.1,
                            boxShadow: '0 10px 30px rgba(34, 197, 94, 0.5)',
                          }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold shadow-xl shadow-green-500/30 dark:shadow-green-500/20 text-sm sm:text-base overflow-hidden group"
                        >
                          <motion.span
                            className="relative z-10"
                            animate={{
                              scale: [1, 1.05],
                            }}
                            transition={{
                              type: 'tween',
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              ease: 'easeInOut'
                            }}
                          >
                            ¡Comenzar!
                          </motion.span>
                        </motion.button>
                      )}
                    </div>

                    {/* Botón de saltar */}
                    {currentStep < STUDY_PLANNER_STEPS.length - 1 && (
                      <motion.div
                        className="text-center mt-2 sm:mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          onClick={handleSkip}
                          whileHover={{ 
                            scale: 1.05,
                            y: -2
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 17 
                          }}
                          className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-xs sm:text-sm transition-colors font-medium group"
                        >
                          <span className="relative z-10">Saltar introducción</span>
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 dark:bg-gray-500"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Interfaz de conversación con LIA */}
    {showConversation && (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden" suppressHydrationWarning>
        {/* Header */}
        <div className="flex-shrink-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50">
              <Image
                src="/lia-avatar.png"
                alt="LIA"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">LIA - Planificador de Estudios</h1>
              <p className="text-sm text-slate-400">Tu asistente para crear planes personalizados</p>
            </div>
            
            {/* Botones de acción como iconos que se expanden con texto */}
            <div className="flex items-center gap-2">
              {/* Botón Calendario conectado / Conectar calendario */}
              {connectedCalendar ? (
                <motion.button
                  layout
                  onClick={() => setShowCalendarModal(true)}
                  disabled={isProcessing}
                  onMouseEnter={() => setHoveredButton('calendar-connected')}
                  onMouseLeave={() => setHoveredButton(null)}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-lg transition-colors disabled:opacity-50 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center ${
                    isProcessing ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <div className="p-2.5 flex-shrink-0 flex items-center justify-center">
                    {connectedCalendar === 'google' ? <GoogleIcon /> : <MicrosoftIcon />}
                  </div>
                  <AnimatePresence>
                    {hoveredButton === 'calendar-connected' && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 180, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="pr-3 whitespace-nowrap text-sm font-medium text-white overflow-hidden inline-block"
                      >
                        {connectedCalendar === 'google' ? 'Google' : 'Microsoft'} conectado
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              ) : (
                <motion.button
                  layout
                  onClick={() => setShowCalendarModal(true)}
                  disabled={isProcessing || showCalendarModal}
                  onMouseEnter={() => setHoveredButton('calendar')}
                  onMouseLeave={() => setHoveredButton(null)}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-lg transition-colors disabled:opacity-50 flex items-center ${
                    isProcessing || showCalendarModal
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  <div className="p-2.5 flex-shrink-0">
                    <Calendar size={20} />
                  </div>
                  <AnimatePresence>
                    {hoveredButton === 'calendar' && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 160, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                      >
                        Conectar calendario
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Botón ¿Cómo funciona? */}
              <motion.button
                layout
                onClick={() => handleSendMessage('¿Cómo funciona?')}
                disabled={isProcessing}
                onMouseEnter={() => setHoveredButton('help')}
                onMouseLeave={() => setHoveredButton(null)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg transition-colors disabled:opacity-50 flex items-center ${
                  isProcessing
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <div className="p-2.5 flex-shrink-0">
                  <HelpCircle size={20} />
                </div>
                <AnimatePresence>
                  {hoveredButton === 'help' && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 140, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                    >
                      ¿Cómo funciona?
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Botón de audio */}
              <motion.button
                layout
                onClick={toggleAudio}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-lg transition-colors ${
                  isAudioEnabled 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {conversationHistory.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                  delay: idx * 0.05
                }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`flex items-end gap-2.5 max-w-[78%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: idx * 0.05 + 0.1,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15
                      }}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-purple-500/40 flex-shrink-0 shadow-lg shadow-purple-500/20"
                    >
                      <Image
                        src="/lia-avatar.png"
                        alt="LIA"
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: idx * 0.05 + 0.15,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                    className={`relative ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white'
                        : 'bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-800/95 text-slate-100 border border-slate-600/50'
                    } px-4 py-2.5 sm:px-5 sm:py-3 rounded-[20px] sm:rounded-[22px] shadow-lg ${
                      msg.role === 'user' 
                        ? 'shadow-purple-500/25 rounded-br-[6px]' 
                        : 'shadow-black/30 rounded-bl-[6px]'
                    } overflow-hidden`}
                  >
                    {/* Cola de burbuja estilo WhatsApp/Messenger mejorada */}
                    {msg.role === 'user' ? (
                      <svg
                        className="absolute -right-[8px] bottom-0 h-[20px] w-[8px] text-purple-600"
                        viewBox="0 0 8 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0 0C0 11.046 0 15.046 0 20C4.046 20 8.046 20 8 20C8 15.046 8 11.046 8 0C4.046 0 0 0 0 0Z"
                          fill="currentColor"
                          className="drop-shadow-lg"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="absolute -left-[8px] bottom-0 h-[20px] w-[8px] text-slate-800"
                        viewBox="0 0 8 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 0C8 11.046 8 15.046 8 20C3.954 20 0 20 0 20C0 15.046 0 11.046 0 0C3.954 0 8 0 8 0Z"
                          fill="currentColor"
                          className="drop-shadow-lg"
                        />
                      </svg>
                    )}
                    
                    {/* Efecto de brillo sutil al hover */}
                    <motion.div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-transparent via-white/15 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-white/8 to-transparent'
                      }`}
                      animate={{
                        x: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: 'linear'
                      }}
                    />
                    
                    {/* Contenido del mensaje */}
                    <div className="relative z-10">
                      {msg.role === 'assistant' ? (
                        <div className="font-body text-[15px] sm:text-[16px] leading-[1.75] text-slate-50 tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                          {formatLIAMessage(msg.content)}
                        </div>
                      ) : (
                        <p className="font-body text-[15px] sm:text-[16px] leading-[1.75] font-medium whitespace-pre-wrap text-white tracking-wide [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">{msg.content}</p>
                      )}
                    </div>
                    
                    {/* Efecto de profundidad sutil */}
                    <div className={`absolute inset-0 rounded-[22px] pointer-events-none ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-white/10 via-white/5 to-transparent'
                        : 'bg-gradient-to-br from-white/5 via-white/2 to-transparent'
                    }`} />
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {/* Indicador de procesamiento */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-start group"
              >
                <div className="flex items-end gap-2.5">
                  <motion.div 
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-purple-500/40 shadow-lg shadow-purple-500/20"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 0 0px rgba(168, 85, 247, 0.2)',
                        '0 0 20px rgba(168, 85, 247, 0.4)',
                        '0 0 0px rgba(168, 85, 247, 0.2)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Image
                      src="/lia-avatar.png"
                      alt="LIA"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </motion.div>
                  <motion.div 
                    className="relative bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-800/95 px-4 py-3 sm:px-5 sm:py-3.5 rounded-[20px] sm:rounded-[22px] shadow-lg shadow-black/30 border border-slate-600/50 rounded-bl-[6px] overflow-hidden"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {/* Cola de burbuja */}
                    <svg
                      className="absolute -left-[8px] bottom-0 h-[20px] w-[8px] text-slate-800"
                      viewBox="0 0 8 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 0C8 11.046 8 15.046 8 20C3.954 20 0 20 0 20C0 15.046 0 11.046 0 0C3.954 0 8 0 8 0Z"
                        fill="currentColor"
                        className="drop-shadow-lg"
                      />
                    </svg>
                    
                    {/* Efecto de brillo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                    
                    {/* Puntos animados mejorados */}
                    <div className="relative z-10 flex gap-1.5 items-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          y: [0, -4, 0]
                        }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0, ease: 'easeInOut' }}
                        className="w-2.5 h-2.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          y: [0, -4, 0]
                        }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
                        className="w-2.5 h-2.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          y: [0, -4, 0]
                        }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
                        className="w-2.5 h-2.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Indicador de escucha */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <div className="bg-green-600/20 border border-green-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-3 h-3 bg-green-500 rounded-full"
                  />
                  <span className="text-green-400 text-sm">Escuchando...</span>
                </div>
              </motion.div>
            )}

            {/* Selector de cursos - Modal mejorado */}
            {showCourseSelector && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                {/* Overlay con blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />
                
                {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                  {/* Header mejorado */}
                  <div className="relative p-6 pb-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                        <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Selecciona tus cursos</h3>
                        <p className="text-slate-400 text-sm">Elige los cursos que quieres incluir en tu plan de estudios</p>
                  </div>
                </div>

                    {/* Barra de búsqueda - Siempre visible */}
                    {availableCourses.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative mt-4"
                      >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          suppressHydrationWarning
                          value={courseSearchQuery}
                          onChange={(e) => setCourseSearchQuery(e.target.value)}
                          placeholder="Buscar cursos..."
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                        {courseSearchQuery && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setCourseSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-600/50"
                            title="Limpiar búsqueda"
                          >
                            <X size={16} />
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                {isLoadingCourses ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-12 h-12 text-purple-500" />
                        </motion.div>
                        <p className="text-slate-400 mt-4 text-sm">Cargando tus cursos...</p>
                  </div>
                ) : availableCourses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                          <BookOpen className="w-10 h-10 text-slate-500" />
                        </div>
                        <h4 className="text-white font-semibold mb-2">No tienes cursos disponibles</h4>
                        <p className="text-slate-400 text-sm text-center max-w-sm">
                          Adquiere cursos para poder crear tu plan de estudios personalizado
                        </p>
                  </div>
                ) : (
                  <>
                        {/* Lista de cursos con scroll */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                          {(() => {
                            // Filtrar cursos según la búsqueda
                            const filteredCourses = availableCourses.filter(course =>
                              course.title.toLowerCase().includes(courseSearchQuery.toLowerCase())
                            );

                            if (filteredCourses.length === 0 && courseSearchQuery) {
                              return (
                                <div className="flex flex-col items-center justify-center py-12">
                                  <Search className="w-12 h-12 text-slate-500 mb-3" />
                                  <p className="text-slate-400 text-sm">No se encontraron cursos</p>
                                  <p className="text-slate-500 text-xs mt-1">Intenta con otro término de búsqueda</p>
                                </div>
                              );
                            }

                            return filteredCourses.map((course, index) => {
                              const isSelected = selectedCourseIds.includes(course.id);
                              return (
                                <motion.div
                          key={course.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <motion.button
                          onClick={() => toggleCourseSelection(course.id)}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden group ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-purple-600/30 via-purple-600/20 to-blue-600/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                                        : 'bg-slate-700/30 border-2 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-700/50'
                                    }`}
                                  >
                                    {/* Efecto de brillo en hover */}
                                    {!isSelected && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    )}
                                    
                                    {/* Checkbox mejorado */}
                                    <motion.div
                                      className={`relative w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                        isSelected
                                          ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50'
                                          : 'bg-slate-600 border-2 border-slate-500'
                                      }`}
                                      animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                                      transition={{ duration: 0.3 }}
                                    >
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        >
                                          <Check className="w-4 h-4 text-white font-bold" strokeWidth={3} />
                                        </motion.div>
                                      )}
                                    </motion.div>

                                    {/* Información del curso */}
                                    <div className="flex-1 text-left min-w-0">
                                      <p className={`font-semibold text-base mb-1 line-clamp-2 ${
                                        isSelected ? 'text-white' : 'text-slate-200'
                                      }`}>
                                        {course.title}
                                      </p>
                                      {course.progress > 0 && (
                                        <div className="flex items-center gap-2 mt-1">
                                          <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                              initial={{ width: 0 }}
                                              animate={{ width: `${course.progress}%` }}
                                              transition={{ duration: 0.5, delay: index * 0.1 }}
                                            />
                            </div>
                                          <span className={`text-xs font-medium ${
                                            isSelected ? 'text-purple-300' : 'text-slate-400'
                                          }`}>
                                            {course.progress}% completado
                                          </span>
                          </div>
                                      )}
                                    </div>

                                    {/* Indicador de selección */}
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
                                      />
                                    )}
                        </motion.button>
                                </motion.div>
                              );
                            });
                          })()}
                    </div>

                        {/* Footer mejorado */}
                        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedCourseIds.length > 0
                                  ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                                  : 'bg-slate-700/50'
                              }`}>
                                <span className={`text-sm font-bold ${
                                  selectedCourseIds.length > 0 ? 'text-purple-400' : 'text-slate-500'
                                }`}>
                                  {selectedCourseIds.length}
                      </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {selectedCourseIds.length === 0 
                                    ? 'Ningún curso seleccionado'
                                    : selectedCourseIds.length === 1
                                    ? '1 curso seleccionado'
                                    : `${selectedCourseIds.length} cursos seleccionados`
                                  }
                                </p>
                                <p className="text-xs text-slate-400">
                                  {selectedCourseIds.length > 0 
                                    ? 'Listo para crear tu plan'
                                    : 'Selecciona al menos un curso'
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                        <motion.button
                          onClick={confirmCourseSelection}
                                disabled={selectedCourseIds.length === 0}
                                whileHover={selectedCourseIds.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedCourseIds.length > 0 ? { scale: 0.95 } : {}}
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                  selectedCourseIds.length > 0
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                          Aceptar
                        </motion.button>
                            </div>
                      </div>
                    </div>
                  </>
                )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Modal de conexión de calendario */}
            {showCalendarModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={skipCalendarConnection}
                />
                
                {/* Modal */}
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-blue-600/30 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-500/20"
                    >
                      <Calendar className="w-10 h-10 text-blue-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Conecta tu calendario
                    </h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      Analizo tu calendario para encontrar los mejores horarios para estudiar
                    </p>
                  </div>

                  {/* Opciones de calendario */}
                  <div className="space-y-4 mb-6">
                    {/* Google Calendar */}
                    <div className="relative group">
                      <motion.button
                        onClick={() => {
                          if (connectedCalendar === 'google') {
                            // Si ya está conectado, desconectar primero
                            disconnectCalendar('google');
                          } else {
                            // Si hay otro calendario conectado, desconectarlo primero
                            if (connectedCalendar === 'microsoft') {
                              disconnectCalendar('microsoft').then(() => {
                                setTimeout(() => connectGoogleCalendar(), 500);
                              });
                            } else {
                              connectGoogleCalendar();
                            }
                          }
                        }}
                        disabled={isConnectingCalendar}
                        whileHover={connectedCalendar === 'google' || isConnectingCalendar ? {} : { scale: 1.02, y: -2 }}
                        whileTap={connectedCalendar === 'google' || isConnectingCalendar ? {} : { scale: 0.98 }}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all relative overflow-hidden ${
                          connectedCalendar === 'google' 
                            ? 'bg-gradient-to-r from-green-500/20 via-green-500/15 to-green-500/20 border-2 border-green-500/60 shadow-lg shadow-green-500/20' 
                            : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-700/70 hover:to-slate-800/70 border border-slate-600/50 hover:border-slate-500/50'
                        } ${isConnectingCalendar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {/* Efecto de brillo en hover */}
                        {connectedCalendar !== 'google' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        )}
                        
                        {/* Icono de Google */}
                        <motion.div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                            connectedCalendar === 'google'
                              ? 'bg-white ring-2 ring-green-500/50'
                              : 'bg-white'
                          }`}
                          whileHover={connectedCalendar !== 'google' ? { rotate: [0, -5, 5, -5, 0] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <svg viewBox="0 0 24 24" className="w-7 h-7">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </motion.div>
                        
                        {/* Contenido del botón */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold text-base">Google Calendar</p>
                            {connectedCalendar === 'google' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
                              />
                            )}
                          </div>
                          {connectedCalendar === 'google' ? (
                            <div className="text-green-400 text-sm flex items-center gap-2 font-medium">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500 }}
                              >
                                <Check className="w-4 h-4" />
                              </motion.div>
                              <span>Conectado exitosamente</span>
                            </div>
                          ) : (
                          <p className="text-slate-400 text-sm">Conecta tu cuenta de Google</p>
                          )}
                        </div>
                        
                        {/* Icono de acción */}
                        {connectedCalendar !== 'google' && (
                          <motion.div
                            className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-600/50 transition-colors"
                            whileHover={{ rotate: 45 }}
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                          </motion.div>
                        )}
                      </motion.button>
                      
                      {/* Botón de desconectar mejorado */}
                      {connectedCalendar === 'google' && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => disconnectCalendar('google')}
                          disabled={isConnectingCalendar}
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 backdrop-blur-sm z-10"
                          title="Desconectar Google Calendar"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    {/* Microsoft Calendar */}
                    <div className="relative group">
                      <motion.button
                        onClick={() => {
                          if (connectedCalendar === 'microsoft') {
                            // Si ya está conectado, desconectar primero
                            disconnectCalendar('microsoft');
                          } else {
                            // Si hay otro calendario conectado, desconectarlo primero
                            if (connectedCalendar === 'google') {
                              disconnectCalendar('google').then(() => {
                                setTimeout(() => connectMicrosoftCalendar(), 500);
                              });
                            } else {
                              connectMicrosoftCalendar();
                            }
                          }
                        }}
                        disabled={isConnectingCalendar}
                        whileHover={connectedCalendar === 'microsoft' || isConnectingCalendar ? {} : { scale: 1.02, y: -2 }}
                        whileTap={connectedCalendar === 'microsoft' || isConnectingCalendar ? {} : { scale: 0.98 }}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all relative overflow-hidden ${
                          connectedCalendar === 'microsoft' 
                            ? 'bg-gradient-to-r from-green-500/20 via-green-500/15 to-green-500/20 border-2 border-green-500/60 shadow-lg shadow-green-500/20' 
                            : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-700/70 hover:to-slate-800/70 border border-slate-600/50 hover:border-slate-500/50'
                        } ${isConnectingCalendar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {/* Efecto de brillo en hover */}
                        {connectedCalendar !== 'microsoft' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        )}
                        
                        {/* Icono de Microsoft */}
                        <motion.div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                            connectedCalendar === 'microsoft'
                              ? 'bg-white ring-2 ring-green-500/50'
                              : 'bg-white'
                          }`}
                          whileHover={connectedCalendar !== 'microsoft' ? { rotate: [0, -5, 5, -5, 0] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <svg viewBox="0 0 23 23" className="w-8 h-8">
                            <path fill="#f25022" d="M1 1h10v10H1z"/>
                            <path fill="#00a4ef" d="M12 1h10v10H12z"/>
                            <path fill="#7fba00" d="M1 12h10v10H1z"/>
                            <path fill="#ffb900" d="M12 12h10v10H12z"/>
                          </svg>
                        </motion.div>
                        
                        {/* Contenido del botón */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold text-base">Microsoft Outlook</p>
                            {connectedCalendar === 'microsoft' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
                              />
                            )}
                          </div>
                          {connectedCalendar === 'microsoft' ? (
                            <div className="text-green-400 text-sm flex items-center gap-2 font-medium">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500 }}
                              >
                                <Check className="w-4 h-4" />
                              </motion.div>
                              <span>Conectado exitosamente</span>
                            </div>
                          ) : (
                          <p className="text-slate-400 text-sm">Conecta tu cuenta de Microsoft</p>
                          )}
                        </div>
                        
                        {/* Icono de acción */}
                        {connectedCalendar !== 'microsoft' && (
                          <motion.div
                            className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-600/50 transition-colors"
                            whileHover={{ rotate: 45 }}
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                          </motion.div>
                        )}
                      </motion.button>
                      
                      {/* Botón de desconectar mejorado */}
                      {connectedCalendar === 'microsoft' && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => disconnectCalendar('microsoft')}
                          disabled={isConnectingCalendar}
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 backdrop-blur-sm z-10"
                          title="Desconectar Microsoft Calendar"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Botón para saltar */}
                  <div className="text-center pt-2">
                    <motion.button
                      onClick={skipCalendarConnection}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-slate-700/30"
                    >
                      Omitir por ahora
                    </motion.button>
                  </div>

                  {/* Botón cerrar mejorado */}
                  <motion.button
                    onClick={skipCalendarConnection}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all backdrop-blur-sm"
                    title="Cerrar modal de calendario"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modal de selección de enfoque de estudio */}
        <AnimatePresence>
          {showApproachModal && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
              >
                <motion.div
                  className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto"
                >
                  {/* Header */}
                  <div className="relative p-6 pb-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                        <BookOpen className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Selecciona tu enfoque de estudio</h3>
                        <p className="text-slate-400 text-sm">Elige el tipo de sesiones que prefieres para tu plan de estudios</p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones de enfoque */}
                  <div className="p-6 space-y-4">
                    {/* Sesiones rápidas */}
                    <motion.button
                      onClick={() => handleApproachSelection('rapido')}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                        studyApproach === 'rapido'
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-700/30 border-slate-600/50 hover:border-purple-500/50 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          studyApproach === 'rapido'
                            ? 'bg-purple-500/20'
                            : 'bg-slate-600/30'
                        }`}>
                          <ChevronRight className={`w-5 h-5 ${
                            studyApproach === 'rapido'
                              ? 'text-purple-400'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">Sesiones rápidas</h4>
                          <p className="text-sm text-slate-300">Sesiones cortas e intensas para avanzar rápido en los cursos</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <span>• 25 minutos por sesión</span>
                            <span>• Descansos de 5 minutos</span>
                          </div>
                        </div>
                        {studyApproach === 'rapido' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Sesiones normales */}
                    <motion.button
                      onClick={() => handleApproachSelection('normal')}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                        studyApproach === 'normal'
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-700/30 border-slate-600/50 hover:border-purple-500/50 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          studyApproach === 'normal'
                            ? 'bg-purple-500/20'
                            : 'bg-slate-600/30'
                        }`}>
                          <ChevronRight className={`w-5 h-5 ${
                            studyApproach === 'normal'
                              ? 'text-purple-400'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">Sesiones normales</h4>
                          <p className="text-sm text-slate-300">Un ritmo equilibrado entre estudio y descanso</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <span>• 30 minutos por sesión</span>
                            <span>• Descansos de 10 minutos</span>
                          </div>
                        </div>
                        {studyApproach === 'normal' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Sesiones largas */}
                    <motion.button
                      onClick={() => handleApproachSelection('largo')}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                        studyApproach === 'largo'
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-700/30 border-slate-600/50 hover:border-purple-500/50 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          studyApproach === 'largo'
                            ? 'bg-purple-500/20'
                            : 'bg-slate-600/30'
                        }`}>
                          <ChevronRight className={`w-5 h-5 ${
                            studyApproach === 'largo'
                              ? 'text-purple-400'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">Sesiones largas</h4>
                          <p className="text-sm text-slate-300">Sesiones más extensas para profundizar en el contenido</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <span>• 60 minutos por sesión</span>
                            <span>• Descansos de 15 minutos</span>
                          </div>
                        </div>
                        {studyApproach === 'largo' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50">
                    <p className="text-xs text-slate-400 text-center">
                      Esta selección ayudará a calcular cuánto tiempo necesitarás para completar tus cursos
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Modal de selección de fecha estimada */}
        <AnimatePresence>
          {showDateModal && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
              >
                <motion.div
                  className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
                >
                  {/* Header */}
                  <div className="relative p-6 pb-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                        <Calendar className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Selecciona fecha estimada</h3>
                        <p className="text-slate-400 text-sm">Elige cuándo quieres terminar tus cursos</p>
                      </div>
                    </div>
                  </div>

                  {/* Calendario */}
                  <div className="p-6">
                    {/* Navegación del mes */}
                    <div className="flex items-center justify-between mb-4">
                      <motion.button
                        onClick={() => {
                          // Normalizar fecha antes de cambiar mes - asegurar día 1
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const newMonth = new Date(year, month - 1, 1);
                          setCurrentMonthNormalized(newMonth);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      >
                        <ChevronLeft size={20} />
                      </motion.button>
                      <h4 className="text-lg font-semibold text-white">
                        {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </h4>
                      <motion.button
                        onClick={() => {
                          // Normalizar fecha antes de cambiar mes - asegurar día 1
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const newMonth = new Date(year, month + 1, 1);
                          setCurrentMonthNormalized(newMonth);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      >
                        <ChevronRight size={20} />
                      </motion.button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                        <div key={idx} className="text-center text-xs font-semibold text-slate-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        // Obtener año y mes directamente de currentMonth
                        // Asegurar que siempre trabajemos con valores limpios
                        const year = currentMonth.getFullYear();
                        const month = currentMonth.getMonth();
                        
                        // Crear fecha del primer día del mes de forma explícita y directa
                        // IMPORTANTE: Usar solo año, mes y día sin especificar hora
                        const firstDayOfMonth = new Date(year, month, 1);
                        const lastDayOfMonth = new Date(year, month + 1, 0);
                        const daysInMonth = lastDayOfMonth.getDate();
                        
                        // Obtener el día de la semana del primer día
                        // getDay() retorna: 0 = domingo, 1 = lunes, ..., 6 = sábado
                        const startingDayOfWeek = firstDayOfMonth.getDay();
                        
                        // Validación crítica: si startingDayOfWeek es siempre 0, hay un problema
                        if (startingDayOfWeek < 0 || startingDayOfWeek > 6) {
                          console.error('❌ ERROR: startingDayOfWeek fuera de rango:', startingDayOfWeek);
                        }
                        
                        // Debug temporal para verificar
                        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                        console.log(`📅 Calendario ${year}-${month + 1}:`, {
                          primerDia: dayNames[startingDayOfWeek],
                          startingDayOfWeek,
                          totalDias: daysInMonth,
                          firstDayOfMonthISO: firstDayOfMonth.toISOString(),
                          firstDayOfMonthLocal: firstDayOfMonth.toLocaleDateString('es-ES'),
                          currentMonthValue: currentMonth.toLocaleDateString('es-ES'),
                          currentMonthISO: currentMonth.toISOString()
                        });
                        
                        // Verificar cálculo para fechas específicas
                        if (year === 2026 && month === 0) {
                          const testDate1 = new Date(2026, 0, 1);
                          const testDate24 = new Date(2026, 0, 24);
                          console.log(`📅 Enero 2026 - Día 1: ${dayNames[testDate1.getDay()]} (debería ser jueves, getDay=${testDate1.getDay()})`);
                          console.log(`📅 Enero 2026 - Día 24: ${dayNames[testDate24.getDay()]} (debería ser sábado)`);
                        }
                        if (year === 2025 && month === 11) {
                          const testDate1 = new Date(2025, 11, 1);
                          const testDate11 = new Date(2025, 11, 11);
                          console.log(`📅 Diciembre 2025 - Día 1: ${dayNames[testDate1.getDay()]} (debería ser lunes, getDay=${testDate1.getDay()})`);
                          console.log(`📅 Diciembre 2025 - Día 11: ${dayNames[testDate11.getDay()]} (debería ser jueves)`);
                        }
                        
                        const today = new Date();
                        const todayYear = today.getFullYear();
                        const todayMonth = today.getMonth();
                        const todayDay = today.getDate();
                        
                        const days = [];
                        
                        // Debug: Verificar el valor de startingDayOfWeek antes de crear días vacíos
                        console.log(`🔍 DEBUG Render: startingDayOfWeek=${startingDayOfWeek}, año=${year}, mes=${month + 1}`);
                        
                        // Días vacíos al inicio (domingo = 0, lunes = 1, etc.)
                        // IMPORTANTE: Usar un div vacío en lugar de null para que React lo renderice correctamente
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(<div key={`empty-${i}`} className="p-2"></div>);
                        }
                        
                        // Debug: Verificar cuántos días vacíos se agregaron
                        console.log(`🔍 DEBUG Render: Se agregaron ${startingDayOfWeek} días vacíos, total elementos antes de días del mes: ${days.length}`);
                        
                        // Días del mes
                        for (let day = 1; day <= daysInMonth; day++) {
                          // Crear fecha para comparación y selección (usar mediodía para consistencia)
                          const date = new Date(year, month, day, 12, 0, 0, 0);
                          
                          // Comparar fechas normalizadas (solo año, mes, día)
                          const isPast = year < todayYear || 
                                        (year === todayYear && month < todayMonth) ||
                                        (year === todayYear && month === todayMonth && day < todayDay);
                          
                          // Comparar con selectedDate normalizado
                          let isSelected = false;
                          if (selectedDate) {
                            const selectedNormalized = new Date(
                              selectedDate.getFullYear(),
                              selectedDate.getMonth(),
                              selectedDate.getDate()
                            );
                            const dateNormalized = new Date(year, month, day);
                            isSelected = selectedNormalized.getTime() === dateNormalized.getTime();
                          }
                          
                          days.push(
                            <motion.button
                              key={day}
                              onClick={() => {
                                if (!isPast) {
                                  // Crear nueva fecha limpia (sin hora)
                                  const selectedDateClean = new Date(year, month, day);
                                  setSelectedDate(selectedDateClean);
                                }
                              }}
                              disabled={isPast}
                              whileHover={!isPast ? { scale: 1.1 } : {}}
                              whileTap={!isPast ? { scale: 0.9 } : {}}
                              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                isPast
                                  ? 'text-slate-600 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              {day}
                            </motion.button>
                          );
                        }
                        
                        // Debug: Verificar el array final antes de renderizar
                        console.log(`🔍 DEBUG Render: Total elementos en days array: ${days.length}, primeros 7 elementos:`, days.slice(0, 7).map((d, i) => {
                          if (!d || !d.props) return `empty[${i}]`;
                          if (d.props.children === undefined) return `empty-div[${i}]`;
                          return `día ${d.props.children}[${i}]`;
                        }));
                        
                        return days;
                      })()}
                    </div>

                    {/* Fecha seleccionada */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                      >
                        <p className="text-sm text-slate-300">
                          <span className="text-purple-400 font-semibold">Fecha seleccionada:</span>{' '}
                          {selectedDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Footer con botones */}
                  <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50 flex items-center justify-between gap-3">
                    <motion.button
                      onClick={() => handleDateSelection(null, true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Sin fecha específica
                    </motion.button>
                    <motion.button
                      onClick={() => selectedDate && handleDateSelection(selectedDate)}
                      disabled={!selectedDate}
                      whileHover={selectedDate ? { scale: 1.05 } : {}}
                      whileTap={selectedDate ? { scale: 0.95 } : {}}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedDate
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Confirmar
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Área de input */}
        <div className="flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              {/* Input de texto */}
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && userMessage.trim()) {
                    e.preventDefault();
                    handleSendMessage(userMessage);
                    setUserMessage('');
                  }
                }}
                placeholder="Escribe tu mensaje o usa el micrófono..."
                disabled={isProcessing || isListening}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50"
              />

              {/* Botón dinámico fusionado: micrófono cuando está vacío, enviar cuando hay texto */}
              <motion.button
                onClick={() => {
                  if (userMessage.trim()) {
                    // Si hay texto, enviar mensaje
                    handleSendMessage(userMessage);
                    setUserMessage('');
                  } else {
                    // Si no hay texto, activar/desactivar grabación
                    toggleListening();
                  }
                }}
                disabled={isProcessing || (isListening && userMessage.trim())}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                  userMessage.trim()
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-purple-500/30'
                    : isListening
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-green-500/50'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-purple-500/30'
                } ${isProcessing || (isListening && userMessage.trim()) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <AnimatePresence mode="wait">
                  {isProcessing && userMessage.trim() ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 size={20} className="animate-spin" />
                    </motion.div>
                  ) : userMessage.trim() ? (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Send size={20} />
                    </motion.div>
                  ) : isListening ? (
                    <motion.div
                      key="mic-off"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MicOff size={20} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mic"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mic size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

