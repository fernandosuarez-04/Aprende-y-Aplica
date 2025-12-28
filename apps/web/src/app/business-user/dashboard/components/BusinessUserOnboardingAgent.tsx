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
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
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
      // Flag para indicar al Study Planner que viene del tour del Business User
      localStorage.setItem('coming-from-business-tour', 'true');
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
                {/* Esfera central con anillos - Simplified */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  {/* Esfera central con foto de LIA - Static with simple glow */}
                  <div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-1 overflow-hidden"
                    style={{
                      boxShadow: isSpeaking 
                        ? '0 0 60px rgba(20, 184, 166, 0.8)' 
                        : '0 0 40px rgba(20, 184, 166, 0.5)'
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
                  </div>

                  {/* Simple speaking indicator - CSS only */}
                  {isSpeaking && (
                    <div
                      className="absolute inset-6 sm:inset-8 rounded-full border-2 border-white/40 animate-ping"
                      style={{ animationDuration: '1.5s' }}
                    />
                  )}
                </div>

                {/* Panel de contenido - Simplified */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-2.5 sm:p-3 md:p-4 w-full overflow-hidden flex-shrink min-h-0"
                >
                  {/* Static gradient background - no animation */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)',
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
                    {/* Botones de control - Simplified */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
                      <button
                        onClick={toggleAudio}
                        className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-lg hover:scale-110 active:scale-95"
                      >
                        {isAudioEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={handleSkip}
                        className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 shadow-lg hover:scale-110 active:scale-95"
                      >
                        <X size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Indicador de progreso - Simplified */}
                    <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3 justify-center items-center">
                      {ONBOARDING_STEPS.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentStep
                              ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/50'
                              : idx < currentStep
                              ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'w-4 sm:w-5 md:w-6 bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Icono del paso - Simplified */}
                    <div className="flex justify-center mb-2">
                      <div
                        className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                      >
                        {step.icon}
                      </div>
                    </div>

                    {/* Contenido del paso */}
                    <div className="text-center space-y-1.5 sm:space-y-2">
                      <h2
                        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight px-2"
                      >
                        {step.title}
                      </h2>

                      <p
                        className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light px-2"
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Botones de navegación - Simplified */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2 sm:mt-3 md:mt-4">
                      {currentStep > 0 && (
                        <button
                          onClick={handlePrevious}
                          className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm hover:scale-105 active:scale-95"
                        >
                          Anterior
                        </button>
                      )}

                      {currentStep < ONBOARDING_STEPS.length - 1 ? (
                        <button
                          onClick={handleNext}
                          className="w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/30 text-xs sm:text-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-2xl"
                        >
                          Siguiente
                          <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleComplete}
                          className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold shadow-xl shadow-emerald-500/30 text-sm sm:text-base transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-2xl flex items-center justify-center gap-2"
                        >
                          <Rocket size={18} />
                          Ir al Planificador
                        </button>
                      )}
                    </div>

                    {/* Botón de saltar - Simplified */}
                    {currentStep < ONBOARDING_STEPS.length - 1 && (
                      <div className="text-center mt-2 sm:mt-3">
                        <button
                          onClick={handleSkip}
                          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-xs sm:text-sm transition-colors font-medium hover:underline"
                        >
                          Saltar introducción
                        </button>
                      </div>
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
