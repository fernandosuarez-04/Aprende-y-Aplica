'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight, Mic, MicOff } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/I18nProvider';
import { getPlatformContext, getAvailableLinksForLIA } from '../../../lib/lia/page-metadata';
import { useVoiceAgent } from '@/lib/voice';

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
    '/dashboard': 'panel principal del usuario - catálogo completo de talleres y cursos disponibles',
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

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  speech: string;
  action?: {
    label: string;
    path: string;
  };
}

// Hook para obtener los pasos traducidos
function useOnboardingSteps() {
  const { t } = useTranslation('common');

  return useMemo(() => [
    {
      id: 1,
      title: t('onboarding.steps.1.title'),
      description: t('onboarding.steps.1.description'),
      speech: t('onboarding.steps.1.speech')
    },
    {
      id: 2,
      title: t('onboarding.steps.2.title'),
      description: t('onboarding.steps.2.description'),
      speech: t('onboarding.steps.2.speech'),
      action: {
        label: t('onboarding.steps.2.actionLabel'),
        path: '/dashboard'
      }
    },
    {
      id: 3,
      title: t('onboarding.steps.3.title'),
      description: t('onboarding.steps.3.description'),
      speech: t('onboarding.steps.3.speech'),
      action: {
        label: t('onboarding.steps.3.actionLabel'),
        path: '/courses'
      }
    },
    {
      id: 4,
      title: t('onboarding.steps.4.title'),
      description: t('onboarding.steps.4.description'),
      speech: t('onboarding.steps.4.speech'),
      action: {
        label: t('onboarding.steps.4.actionLabel'),
        path: '/prompt-directory'
      }
    },
    {
      id: 5,
      title: t('onboarding.steps.5.title'),
      description: t('onboarding.steps.5.description'),
      speech: t('onboarding.steps.5.speech'),
    },
    {
      id: 6,
      title: t('onboarding.steps.6.title'),
      description: t('onboarding.steps.6.description'),
      speech: t('onboarding.steps.6.speech'),
      action: {
        label: t('onboarding.steps.6.actionLabel'),
        path: '/dashboard'
      }
    }
  ] as OnboardingStep[], [t]);
}

export function OnboardingAgent() {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const ONBOARDING_STEPS = useOnboardingSteps();

  // 🎙️ Mapeo de idiomas para reconocimiento de voz
  const speechLanguageMap: Record<string, string> = {
    'es': 'es-ES',
    'en': 'en-US',
    'pt': 'pt-BR'
  };

  // ✅ NUEVO: Hook de voz unificado con Gemini
  const voice = useVoiceAgent({
    mode: 'gemini',
    context: 'conversational',
    language: speechLanguageMap[language] || 'es-ES',
    systemInstruction: `Eres LIA, la asistente de voz de Aprende y Aplica.
    Estás ayudando al usuario en su primer recorrido por la plataforma (onboarding).
    Responde de forma breve, clara y amigable a las preguntas del usuario.
    Tu objetivo es que el usuario se sienta bienvenido y aprenda a usar la plataforma.`,
    onError: (error) => {
      console.error('🔴 [OnboardingAgent] Error en voice agent:', error);
    },
  });

  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para conversación por voz
  const [transcript, setTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);

  const lastTranscriptRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const processingRef = useRef<boolean>(false);
  const conversationHistoryRef = useRef(conversationHistory);
  const router = useRouter();
  const pathname = usePathname();
  const hasAttemptedOpenRef = useRef<boolean>(false);
  const isOpeningRef = useRef<boolean>(false);

  // Logging detallado para debugging
  useEffect(() => {
    console.log('🎙️ [OnboardingAgent] Estado de voz:', {
      selectedAgent: voice.selectedAgent,
      isConnected: voice.isConnected,
      isSpeaking: voice.isSpeaking,
      isListening: voice.isListening,
      isProcessing: voice.isProcessing,
      connectionState: voice.connectionState,
    });
  }, [voice.selectedAgent, voice.isConnected, voice.isSpeaking, voice.isListening, voice.isProcessing, voice.connectionState]);

  // Conectar a Gemini al montar
  useEffect(() => {
    console.log('🔌 [OnboardingAgent] Conectando a Gemini...');
    voice.connect().then(() => {
      console.log('✅ [OnboardingAgent] Conectado a Gemini exitosamente');
    }).catch((error) => {
      console.error('❌ [OnboardingAgent] Error conectando a Gemini:', error);
    });

    return () => {
      console.log('🔌 [OnboardingAgent] Desconectando de Gemini...');
      voice.disconnect();
    };
  }, []);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar si es la primera visita
  useEffect(() => {
    if (isOpeningRef.current || hasAttemptedOpenRef.current || isVisible) {
      return;
    }

    const hasSeenOnboarding = localStorage.getItem('has-seen-onboarding');

    if (!hasSeenOnboarding && pathname === '/dashboard') {
      hasAttemptedOpenRef.current = true;
      isOpeningRef.current = true;

      setTimeout(() => {
        const stillHasntSeen = localStorage.getItem('has-seen-onboarding') !== 'true';
        if (stillHasntSeen && !isVisible) {
          setIsVisible(true);
        }
        isOpeningRef.current = false;
      }, 1000);
    } else {
      hasAttemptedOpenRef.current = true;
    }
  }, [pathname, isVisible]);

  // Listener para abrir el modal manualmente
  useEffect(() => {
    const handleOpenOnboarding = () => {
      hasAttemptedOpenRef.current = false;
      isOpeningRef.current = true;
      setIsVisible(true);
      setCurrentStep(0);
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 100);
    };

    window.addEventListener('open-onboarding', handleOpenOnboarding);

    return () => {
      window.removeEventListener('open-onboarding', handleOpenOnboarding);
    };
  }, []);

  // Reproducir audio automáticamente cuando se abre el modal
  useEffect(() => {
    if (isVisible && currentStep === 0 && isAudioEnabled && voice.isConnected) {
      const timer = setTimeout(() => {
        console.log('🔊 [OnboardingAgent] Reproduciendo paso inicial:', ONBOARDING_STEPS[0].speech);
        voice.speak(ONBOARDING_STEPS[0].speech).catch((err) => {
          console.error('❌ [OnboardingAgent] Error reproduciendo paso inicial:', err);
        });
        setHasUserInteracted(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, voice.isConnected]);

  // Función para iniciar/detener escucha
  const toggleListening = async () => {
    console.log('🎤 [OnboardingAgent] Toggle listening. Estado actual:', voice.isListening);

    if (voice.isListening) {
      console.log('⏹️ [OnboardingAgent] Deteniendo escucha...');
      voice.stopListening();
    } else {
      try {
        console.log('🎙️ [OnboardingAgent] Iniciando escucha...');
        console.log('🔍 [OnboardingAgent] Estado de conexión:', voice.connectionState);
        console.log('🔍 [OnboardingAgent] ¿Está conectado?:', voice.isConnected);

        if (!voice.isConnected) {
          console.warn('⚠️ [OnboardingAgent] No conectado. Intentando conectar...');
          await voice.connect();
          console.log('✅ [OnboardingAgent] Conectado exitosamente');
        }

        voice.setIsProcessing(false);
        await voice.startListening();
        console.log('✅ [OnboardingAgent] Escucha iniciada correctamente');
        setTranscript('');
      } catch (error: any) {
        console.error('❌ [OnboardingAgent] Error al iniciar escucha:', error);
        console.error('❌ [OnboardingAgent] Error detallado:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        });

        if (error?.name === 'NotAllowedError') {
          alert(t('onboarding.voice.micPermissionNeeded'));
        } else {
          alert(t('onboarding.voice.micError'));
        }
      }
    }
  };

  // Función para procesar pregunta de voz con LIA
  const handleVoiceQuestion = async (question: string) => {
    if (!question.trim()) return;

    if (processingRef.current) {
      console.warn('⚠️ [OnboardingAgent] Ya hay una pregunta procesándose, ignorando.');
      return;
    }

    console.log('💬 [OnboardingAgent] Procesando pregunta:', question);

    voice.stopAllAudio();
    processingRef.current = true;
    voice.setIsProcessing(true);

    // Evitar preguntas similares
    const lastUserMsg = conversationHistoryRef.current.slice().reverse().find(m => m.role === 'user');
    const now = Date.now();
    if (lastUserMsg) {
      const lastText = lastUserMsg.content || '';
      const recent = now - (lastTranscriptRef.current.ts || 0) < 5000;
      if (recent && (lastText === question || lastText.includes(question) || question.includes(lastText))) {
        console.warn('⚠️ [OnboardingAgent] Pregunta similar ya procesada, ignorando.');
        processingRef.current = false;
        voice.setIsProcessing(false);
        return;
      }
    }

    try {
      console.log('🤖 [OnboardingAgent] Enviando pregunta a LIA...');

      const currentPathname = pathname || '/dashboard';
      const detectedArea = detectContextFromURL(currentPathname);
      const pageDescription = getPageContextInfo(currentPathname);
      const platformContextStr = getPlatformContext ? getPlatformContext() : undefined;
      const availableLinks = getAvailableLinksForLIA ? getAvailableLinksForLIA() : undefined;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: 'onboarding',
          conversationHistory: conversationHistory || [],
          userName: undefined,
          pageContext: {
            pathname: currentPathname,
            detectedArea: detectedArea,
            description: pageDescription,
            platformContext: platformContextStr,
            availableLinks: availableLinks
          },
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con LIA');
      }

      const data = await response.json();
      const liaResponse = data.response;

      console.log('💬 [OnboardingAgent] Respuesta de LIA:', liaResponse);

      // Actualizar historial de conversación
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

      // Reproducir respuesta con Gemini
      console.log('🔊 [OnboardingAgent] Reproduciendo respuesta de LIA...');
      await voice.speak(liaResponse);
      console.log('✅ [OnboardingAgent] Respuesta reproducida');

    } catch (error) {
      console.error('❌ [OnboardingAgent] Error procesando pregunta:', error);
      const errorMessage = t('onboarding.voice.errorProcessing');
      try {
        await voice.speak(errorMessage);
      } catch(e) {
        console.error('❌ [OnboardingAgent] Error reproduciendo mensaje de error:', e);
      }
    } finally {
      processingRef.current = false;
      voice.setIsProcessing(false);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      voice.stopAllAudio();
    };
  }, []);

  const handleNext = () => {
    voice.stopAllAudio();
    setHasUserInteracted(true);

    const nextStep = currentStep + 1;

    if (nextStep < ONBOARDING_STEPS.length) {
      setCurrentStep(nextStep);
      console.log('➡️ [OnboardingAgent] Avanzando al paso:', nextStep);
      voice.speak(ONBOARDING_STEPS[nextStep].speech).catch((err) => {
        console.error('❌ [OnboardingAgent] Error reproduciendo paso:', err);
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    voice.stopAllAudio();

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      console.log('⬅️ [OnboardingAgent] Retrocediendo al paso:', prevStep);
      voice.speak(ONBOARDING_STEPS[prevStep].speech).catch((err) => {
        console.error('❌ [OnboardingAgent] Error reproduciendo paso:', err);
      });
    }
  };

  const handleSkip = () => {
    voice.stopAllAudio();
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('has-seen-onboarding', 'true');
      hasAttemptedOpenRef.current = true;
    }
  };

  const handleComplete = () => {
    voice.stopAllAudio();
    if (typeof window !== 'undefined') {
      localStorage.setItem('has-seen-onboarding', 'true');
      hasAttemptedOpenRef.current = true;
    }

    const lastStep = ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];

    setIsVisible(false);

    if (lastStep.action) {
      router.push(lastStep.action.path);
    }
  };

  const handleActionClick = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.action) {
      voice.stopAllAudio();
      if (typeof window !== 'undefined') {
        localStorage.setItem('has-seen-onboarding', 'true');
        hasAttemptedOpenRef.current = true;
      }
      setIsVisible(false);
      router.push(step.action.path);
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    if (!newState) {
      voice.stopAllAudio();
    } else {
      voice.speak(ONBOARDING_STEPS[currentStep].speech).catch((err) => {
        console.error('❌ [OnboardingAgent] Error reproduciendo paso:', err);
      });
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay mejorado con gradiente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md z-[9998]"
            onClick={handleSkip}
          />

          {/* Contenedor principal sin scroll */}
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
              {/* Esfera animada estilo JARVIS - Más compacta */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                {/* Esfera central con anillos - Más pequeña para pantallas pequeñas */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  {/* Esfera central con foto de LIA - Más compacta */}
                  <motion.div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-1 overflow-hidden"
                    animate={{
                      scale: voice.isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: voice.isSpeaking
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
                    {/* Foto de LIA */}
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

                  {/* Partículas flotantes - Más pequeñas y compactas */}
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

                  {/* Pulso de voz cuando está hablando - Más compacto */}
                  {voice.isSpeaking && (
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

                {/* Panel de contenido - Más compacto sin scroll */}
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
                  {/* Efecto de brillo animado en el borde */}
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

                  {/* Patrón de fondo sutil */}
                  <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                      backgroundSize: '40px 40px',
                    }} />
                  </div>

                  {/* Contenido relativo */}
                  <div className="relative z-10">
                    {/* Botones de control - Con animaciones mejoradas */}
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
                        <motion.div
                          className="absolute inset-0 bg-blue-500/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.span
                          className="relative z-10"
                          animate={voice.isSpeaking ? {
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
                        <motion.div
                          className="absolute inset-0 bg-red-500/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="relative z-10">
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </span>
                      </motion.button>
                    </div>

                    {/* Indicador de progreso - Más compacto */}
                    <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3 justify-center items-center">
                      {ONBOARDING_STEPS.map((_, idx) => (
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
                          {idx === currentStep && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-md opacity-50"
                              animate={{
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                              }}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Contenido del paso - Más compacto */}
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

                    {/* Interfaz de conversación por voz (solo en paso 5) - Más compacta */}
                    {currentStep === 4 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="mt-2 sm:mt-3 space-y-2 sm:space-y-3"
                      >
                        {/* Botón de micrófono más compacto */}
                        <div className="flex justify-center">
                          <motion.div
                            className="relative"
                            animate={voice.isListening ? {
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
                            {/* Anillos de pulso cuando está escuchando */}
                            {voice.isListening && (
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
                              disabled={voice.isProcessing}
                              className={`relative p-5 sm:p-6 md:p-7 rounded-full transition-all shadow-2xl overflow-hidden ${
                                voice.isListening
                                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
                                  : voice.isProcessing
                                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600'
                              }`}
                              whileHover={voice.isProcessing ? {} : {
                                scale: 1.12,
                                boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)'
                              }}
                              whileTap={voice.isProcessing ? {} : { scale: 0.88 }}
                              animate={voice.isListening ? {
                                boxShadow: [
                                  '0 0 25px rgba(34, 197, 94, 0.7)',
                                  '0 0 70px rgba(34, 197, 94, 1)',
                                ],
                                scale: [1, 1.05]
                              } : voice.isProcessing ? {
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
                              {/* Efecto de brillo animado */}
                              {!voice.isProcessing && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                                  initial={{ x: '-100%' }}
                                  animate={{ x: '200%' }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                    ease: 'linear'
                                  }}
                                />
                              )}
                              {voice.isProcessing ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                  <Mic size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                                </motion.div>
                              ) : voice.isListening ? (
                                <MicOff size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                              ) : (
                                <Mic size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                              )}
                            </motion.button>
                          </motion.div>
                        </div>

                        {/* Estado del micrófono compacto */}
                        <motion.p
                          key={voice.isListening ? 'listening' : voice.isProcessing ? 'processing' : 'idle'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium"
                        >
                          {voice.isProcessing
                            ? t('onboarding.voice.processing')
                            : voice.isListening
                            ? t('onboarding.voice.listening')
                            : t('onboarding.voice.clickToSpeak')}
                        </motion.p>
                      </motion.div>
                    )}
                  </div>

                    {/* Botones de navegación - Con animaciones mejoradas */}
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
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-600/0 dark:via-gray-600/50 dark:to-gray-600/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{t('onboarding.buttons.previous')}</span>
                        </motion.button>
                      )}

                      {/* Solo mostrar el botón de acción si NO es el último paso */}
                      {step.action && currentStep < ONBOARDING_STEPS.length - 1 && (
                        <motion.button
                          onClick={handleActionClick}
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
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{step.action.label}</span>
                          <motion.span
                            className="relative z-10"
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                          </motion.span>
                        </motion.button>
                      )}

                      {currentStep < ONBOARDING_STEPS.length - 1 ? (
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
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">
                            <span className="hidden sm:inline">{currentStep === 4 ? t('onboarding.buttons.continueWithoutAsking') : t('onboarding.buttons.next')}</span>
                            <span className="sm:hidden">{currentStep === 4 ? t('onboarding.buttons.continue') : t('onboarding.buttons.next')}</span>
                          </span>
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
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                          />
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
                            {t('onboarding.buttons.start')}
                          </motion.span>
                        </motion.button>
                      )}
                    </div>

                    {/* Botón de saltar - Con animación mejorada */}
                    {currentStep < ONBOARDING_STEPS.length - 1 && (
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
                          className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs sm:text-sm transition-colors font-medium group"
                        >
                          <span className="relative z-10">{t('onboarding.buttons.skipIntro')}</span>
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
  );
}
