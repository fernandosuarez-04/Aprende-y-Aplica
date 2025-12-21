'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight, Building2, BookOpen, TrendingUp, Award, Calendar, Brain, Sparkles, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  speech: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    path: string;
  };
}

const STORAGE_KEY = 'has-seen-business-user-onboarding';

// Pasos del tour para Business User
function useBusinessUserOnboardingSteps() {
  return useMemo(() => [
    {
      id: 1,
      title: '¡Bienvenido a tu Portal de Aprendizaje!',
      description: 'Soy LIA, tu asistente de aprendizaje inteligente. Estoy aquí para guiarte en tu desarrollo profesional dentro de tu organización.',
      speech: 'Bienvenido a tu Portal de Aprendizaje Corporativo. Soy LIA, tu asistente de aprendizaje inteligente. Estoy aquí para guiarte en tu desarrollo profesional dentro de tu organización.',
      icon: <Building2 className="w-6 h-6" />
    },
    {
      id: 2,
      title: 'Tus Cursos Asignados',
      description: 'Tu organización te ha asignado cursos específicos para tu crecimiento. Aquí podrás ver todos los cursos que debes completar y tu progreso en cada uno.',
      speech: 'Tu organización te ha asignado cursos específicos para tu crecimiento profesional. Aquí podrás ver todos los cursos que debes completar y seguir tu progreso en cada uno de ellos.',
      icon: <BookOpen className="w-6 h-6" />
    },
    {
      id: 3,
      title: 'Seguimiento de tu Progreso',
      description: 'En la parte superior verás estadísticas de tu avance: cursos asignados, en progreso, completados y certificados obtenidos. ¡Mantén el ritmo!',
      speech: 'En la parte superior del panel verás estadísticas de tu avance: cursos asignados, cursos en progreso, completados y certificados obtenidos. ¡Mantén el ritmo y alcanza tus metas!',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 4,
      title: 'Planificador de Estudios Inteligente',
      description: 'A continuación te llevaré al Planificador de Estudios con IA. Esta herramienta te ayudará a organizar tu tiempo de aprendizaje de forma óptima.',
      speech: 'A continuación te llevaré al Planificador de Estudios Inteligente. Esta poderosa herramienta con inteligencia artificial te ayudará a organizar tu tiempo de aprendizaje de forma óptima y personalizada.',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 5,
      title: '¿Cómo funciona el Planificador?',
      description: 'El planificador analiza tus cursos asignados, tu disponibilidad horaria y tus preferencias de estudio para crear un plan personalizado que maximice tu aprendizaje.',
      speech: 'El planificador analiza tus cursos asignados, tu disponibilidad horaria y tus preferencias de estudio. Con esta información, crea un plan completamente personalizado que maximiza tu aprendizaje y se adapta a tu ritmo de vida.',
      icon: <Brain className="w-6 h-6" />
    },
    {
      id: 6,
      title: 'Beneficios del Planificador',
      description: 'Recibirás recordatorios inteligentes, seguimiento de metas, sugerencias de horarios óptimos y reportes de productividad. ¡Todo diseñado para tu éxito!',
      speech: 'Con el planificador recibirás recordatorios inteligentes, seguimiento de tus metas de aprendizaje, sugerencias de horarios óptimos según tu rendimiento, y reportes de productividad. ¡Todo está diseñado para garantizar tu éxito profesional!',
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      id: 7,
      title: '¡Vamos a crear tu plan!',
      description: 'Ahora te llevaré al Planificador de Estudios para que configures tu primer plan de aprendizaje. Juntos lograremos tus objetivos de desarrollo profesional.',
      speech: 'Ahora te llevaré al Planificador de Estudios para que configures tu primer plan de aprendizaje personalizado. Juntos lograremos todos tus objetivos de desarrollo profesional. ¡Comencemos!',
      icon: <Rocket className="w-6 h-6" />
    }
  ] as OnboardingStep[], []);
}

export function BusinessUserOnboardingAgent() {
  const ONBOARDING_STEPS = useBusinessUserOnboardingSteps();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const hasAttemptedOpenRef = useRef<boolean>(false);
  const isOpeningRef = useRef<boolean>(false);

  // Detiene todo audio/voz en reproducción
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

  // Verificar si es la primera visita
  useEffect(() => {
    if (isOpeningRef.current || hasAttemptedOpenRef.current || isVisible) {
      return;
    }

    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);

    if (!hasSeenOnboarding) {
      hasAttemptedOpenRef.current = true;
      isOpeningRef.current = true;

      setTimeout(() => {
        const stillHasntSeen = localStorage.getItem(STORAGE_KEY) !== 'true';
        if (stillHasntSeen && !isVisible) {
          setIsVisible(true);
        }
        isOpeningRef.current = false;
      }, 1500); // Un poco más de delay para que cargue el dashboard
    } else {
      hasAttemptedOpenRef.current = true;
    }
  }, [isVisible]);

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

    window.addEventListener('open-business-user-onboarding', handleOpenOnboarding);

    return () => {
      window.removeEventListener('open-business-user-onboarding', handleOpenOnboarding);
    };
  }, []);

  // Reproducir audio automáticamente cuando se abre el modal
  useEffect(() => {
    if (isVisible && currentStep === 0 && isAudioEnabled) {
      const timer = setTimeout(() => {
        speakText(ONBOARDING_STEPS[0].speech);
        setHasUserInteracted(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

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
        // Fallback a Web Speech API
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
            text: text,
            model_id: modelId,
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.65,
              style: 0.3,
              use_speaker_boost: false
            },
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
        // Abortado intencionalmente
      } else {
        console.error('Error en síntesis de voz:', error);
      }
      setIsSpeaking(false);
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

    if (nextStep < ONBOARDING_STEPS.length) {
      setCurrentStep(nextStep);
      speakText(ONBOARDING_STEPS[nextStep].speech);
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
      speakText(ONBOARDING_STEPS[prevStep].speech);
    }
  };

  const handleSkip = () => {
    stopAllAudio();
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
      hasAttemptedOpenRef.current = true;
    }
  };

  const handleComplete = () => {
    stopAllAudio();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
      hasAttemptedOpenRef.current = true;
    }

    setIsVisible(false);

    // Redirigir al Planificador de Estudios
    router.push('/study-planner/create');
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    if (!newState) {
      stopAllAudio();
    } else {
      speakText(ONBOARDING_STEPS[currentStep].speech);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
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
              {/* Esfera animada estilo JARVIS */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                {/* Esfera central con anillos */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  {/* Esfera central con foto de LIA */}
                  <motion.div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-1 overflow-hidden"
                    animate={{
                      scale: isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: isSpeaking
                        ? [
                            '0 0 30px rgba(16, 185, 129, 0.6)',
                            '0 0 80px rgba(20, 184, 166, 0.9)',
                            '0 0 30px rgba(16, 185, 129, 0.6)',
                          ]
                        : '0 0 50px rgba(20, 184, 166, 0.7)'
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
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)',
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
                    {/* Botones de control */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
                      <motion.button
                        onClick={toggleAudio}
                        whileHover={{
                          scale: 1.15,
                          rotate: [0, -10, 10, -10, 0],
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 17,
                          rotate: { duration: 0.5 }
                        }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-lg overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-emerald-500/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
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

                    {/* Indicador de progreso */}
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
                                ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/50'
                                : idx < currentStep
                                ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'w-4 sm:w-5 md:w-6 bg-gray-300 dark:bg-gray-600'
                            }`}
                            animate={idx === currentStep ? {
                              scale: [1, 1.15, 1],
                              boxShadow: [
                                '0 0 0px rgba(16, 185, 129, 0.5)',
                                '0 0 20px rgba(20, 184, 166, 0.8)',
                                '0 0 0px rgba(16, 185, 129, 0.5)',
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
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 blur-md opacity-50"
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

                    {/* Icono del paso */}
                    <div className="flex justify-center mb-2">
                      <motion.div
                        key={`icon-${currentStep}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                      >
                        {step.icon}
                      </motion.div>
                    </div>

                    {/* Contenido del paso */}
                    <div className="text-center space-y-1.5 sm:space-y-2">
                      <motion.h2
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight px-2"
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
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-600/0 dark:via-gray-600/50 dark:to-gray-600/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">Anterior</span>
                        </motion.button>
                      )}

                      {currentStep < ONBOARDING_STEPS.length - 1 ? (
                        <motion.button
                          onClick={handleNext}
                          whileHover={{
                            scale: 1.08,
                            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                          }}
                          whileTap={{ scale: 0.92 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 17
                          }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/30 dark:shadow-emerald-500/20 text-xs sm:text-sm overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
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
                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.5)',
                          }}
                          whileTap={{ scale: 0.9 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 17
                          }}
                          className="relative w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold shadow-xl shadow-emerald-500/30 dark:shadow-emerald-500/20 text-sm sm:text-base overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                          />
                          <motion.span
                            className="relative z-10 flex items-center gap-2"
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
                            <Rocket size={18} />
                            Ir al Planificador
                          </motion.span>
                        </motion.button>
                      )}
                    </div>

                    {/* Botón de saltar */}
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
  );
}

// Función para resetear el onboarding (útil para testing)
export function resetBusinessUserOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Función para abrir el onboarding manualmente
export function openBusinessUserOnboarding() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-business-user-onboarding'));
  }
}
