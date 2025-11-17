'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getPlatformContext } from '../../../lib/lia/page-metadata';

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

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: '¡Bienvenido a Aprende y Aplica!',
    description: 'Soy tu asistente inteligente. Estoy aquí para guiarte en tu viaje de aprendizaje con inteligencia artificial.',
    speech: 'Bienvenido a Aprende y Aplica. Soy tu asistente inteligente. Estoy aquí para guiarte en tu viaje de aprendizaje con inteligencia artificial.'
  },
  {
    id: 2,
    title: 'Conoce a LIA',
    description: 'LIA es tu compañera de aprendizaje que te acompañará en todas partes. Puede responder tus preguntas, ayudarte con tareas y adaptarse al contexto de cada página.',
    speech: 'LIA es tu compañera de aprendizaje que te acompañará en todas partes. Puede responder tus preguntas y adaptarse al contexto de cada página.',
    action: {
      label: 'Ver Dashboard',
      path: '/dashboard'
    }
  },
  {
    id: 3,
    title: 'Explora el contenido',
    description: 'Accede a cursos, talleres, comunidades y noticias sobre IA. Todo diseñado para que aprendas de manera práctica y efectiva.',
    speech: 'Accede a cursos, talleres, comunidades y noticias sobre inteligencia artificial. Todo diseñado para que aprendas de manera práctica y efectiva.',
    action: {
      label: 'Ver Cursos',
      path: '/courses'
    }
  },
  {
    id: 4,
    title: 'Directorio de Prompts',
    description: 'Descubre y crea prompts de IA profesionales. Una herramienta poderosa para maximizar el potencial de la inteligencia artificial.',
    speech: 'Descubre y crea prompts de IA profesionales. Una herramienta poderosa para maximizar el potencial de la inteligencia artificial.',
    action: {
      label: 'Ver Prompts',
      path: '/prompt-directory'
    }
  },
  {
    id: 5,
    title: '¡Estás listo!',
    description: 'Ahora puedes comenzar tu aventura. Recuerda, LIA estará siempre disponible en la esquina inferior derecha para ayudarte.',
    speech: 'Ahora puedes comenzar tu aventura. Recuerda, LIA estará siempre disponible para ayudarte.',
    action: {
      label: 'Comenzar',
      path: '/dashboard'
    }
  }
];

export function OnboardingAgent() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar si es la primera visita
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('has-seen-onboarding');
    
    // Solo mostrar en dashboard y si no ha visto el onboarding
    if (!hasSeenOnboarding && pathname === '/dashboard') {
      // Pequeño delay para que la página cargue primero
      setTimeout(() => {
        setIsVisible(true);
        // NO reproducir audio automáticamente, esperar interacción del usuario
        // El audio se activará cuando el usuario haga clic en "Siguiente"
      }, 1000);
    }
  }, [pathname]);

  // Función para síntesis de voz con ElevenLabs
  const speakText = async (text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined') return;

    // Detener cualquier audio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setIsSpeaking(true);

      // Acceder directamente a las variables sin validación previa
      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = '15Y62ZlO8it2f5wduybx';
      const modelId = 'eleven_multilingual_v2';

      // Debug: mostrar valores
      console.log('🔍 ElevenLabs Config:', { 
        apiKey: apiKey.substring(0, 15) + '...', 
        voiceId,
        modelId
      });

      if (!apiKey || !voiceId) {
        console.warn('⚠️ ElevenLabs credentials not found, using fallback Web Speech API');
        
        // Fallback a Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
        return;
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: modelId || 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      // Intentar reproducir el audio
      try {
        await audio.play();
      } catch (playError: any) {
        console.warn('⚠️ Autoplay bloqueado por el navegador:', playError.message);
        // El audio se reproducirá cuando el usuario haga clic en "Siguiente" o cualquier botón
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error en síntesis de voz con ElevenLabs:', error);
      setIsSpeaking(false);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNext = () => {
    // Marcar que el usuario ha interactuado (activa audio)
    // Si es la primera interacción, reproducir el audio del paso actual primero
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      // Reproducir el audio del paso actual antes de avanzar
      speakText(ONBOARDING_STEPS[currentStep].speech);
      return;
    }
    
    const nextStep = currentStep + 1;
    
    if (nextStep < ONBOARDING_STEPS.length) {
      setCurrentStep(nextStep);
      speakText(ONBOARDING_STEPS[nextStep].speech);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    // Marcar que el usuario ha interactuado
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsVisible(false);
    localStorage.setItem('has-seen-onboarding', 'true');
  };

  const handleComplete = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const lastStep = ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
    
    if (lastStep.action) {
      router.push(lastStep.action.path);
    }
    
    setIsVisible(false);
    localStorage.setItem('has-seen-onboarding', 'true');
  };

  const handleActionClick = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.action) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      router.push(step.action.path);
      setIsVisible(false);
      localStorage.setItem('has-seen-onboarding', 'true');
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    if (!newState) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
    } else {
      speakText(ONBOARDING_STEPS[currentStep].speech);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
            onClick={handleSkip}
          />

          {/* Contenedor principal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="relative max-w-4xl w-full pointer-events-auto"
            >
              {/* Esfera animada estilo JARVIS */}
              <div className="relative flex flex-col items-center">
                {/* Esfera central con anillos */}
                <div className="relative w-64 h-64 mb-8">
                  {/* Anillos orbitales externos */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  />
                  
                  <motion.div
                    className="absolute inset-4 rounded-full border-2 border-purple-400/30"
                    animate={{ 
                      rotate: -360,
                      scale: [1, 1.15, 1],
                    }}
                    transition={{ 
                      rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
                    }}
                  />

                  <motion.div
                    className="absolute inset-8 rounded-full border-2 border-cyan-400/30"
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ 
                      rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }
                    }}
                  />

                  {/* Esfera central con foto de LIA */}
                  <motion.div
                    className="absolute inset-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-1 overflow-hidden"
                    animate={{ 
                      scale: isSpeaking ? [1, 1.1, 1] : 1,
                      boxShadow: isSpeaking 
                        ? [
                            '0 0 20px rgba(59, 130, 246, 0.5)',
                            '0 0 60px rgba(168, 85, 247, 0.8)',
                            '0 0 20px rgba(59, 130, 246, 0.5)',
                          ]
                        : '0 0 40px rgba(139, 92, 246, 0.6)'
                    }}
                    transition={{ 
                      scale: { duration: 0.5, repeat: Infinity },
                      boxShadow: { duration: 1, repeat: Infinity }
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
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        x: [0, Math.cos(i * 30 * Math.PI / 180) * 120],
                        y: [0, Math.sin(i * 30 * Math.PI / 180) * 120],
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
                  ))}

                  {/* Pulso de voz cuando está hablando */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute inset-12 rounded-full border-4 border-white/50"
                      animate={{
                        scale: [1, 1.5, 1],
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full"
                >
                  {/* Botón de cerrar */}
                  <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>

                  {/* Botón de audio */}
                  <button
                    onClick={toggleAudio}
                    className="absolute top-4 right-16 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
                  >
                    {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>

                  {/* Indicador de progreso */}
                  <div className="flex gap-2 mb-6 justify-center">
                    {ONBOARDING_STEPS.map((_, idx) => (
                      <motion.div
                        key={idx}
                        className={`h-1 rounded-full transition-all ${
                          idx === currentStep 
                            ? 'w-12 bg-gradient-to-r from-blue-500 to-purple-500' 
                            : idx < currentStep 
                            ? 'w-8 bg-green-500' 
                            : 'w-8 bg-gray-600'
                        }`}
                        animate={idx === currentStep ? {
                          scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </div>

                  {/* Contenido del paso */}
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      {step.title}
                    </h2>
                    
                    <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                      {step.description}
                    </p>
                  </div>

                  {/* Botones de navegación */}
                  <div className="flex gap-4 justify-center items-center mt-8">
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrevious}
                        className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all"
                      >
                        Anterior
                      </button>
                    )}

                    {step.action && (
                      <button
                        onClick={handleActionClick}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold transition-all flex items-center gap-2 shadow-lg"
                      >
                        {step.action.label}
                        <ChevronRight size={20} />
                      </button>
                    )}

                    {currentStep < ONBOARDING_STEPS.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold transition-all flex items-center gap-2 shadow-lg"
                      >
                        Siguiente
                        <ChevronRight size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={handleComplete}
                        className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold transition-all shadow-lg"
                      >
                        ¡Comenzar!
                      </button>
                    )}
                  </div>

                  {/* Botón de saltar */}
                  {currentStep < ONBOARDING_STEPS.length - 1 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={handleSkip}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Saltar introducción
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
