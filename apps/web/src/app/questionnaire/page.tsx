'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Target,
  Brain,
  TrendingUp,
  Users,
  BookOpen,
  Award
} from 'lucide-react';

interface Question {
  id: number;
  codigo: string;
  section: string;
  bloque: string;
  area_id: number;
  exclusivo_rol_id: number | null;
  texto: string;
  tipo: string;
  opciones: Array<{ value: string; label: string }>;
  peso: number;
  escala: { min: number; max: number };
  scoring: { type: string };
  respuesta_existente: any;
}

interface UserProfile {
  area_id: number;
  rol_id: number;
}

interface QuestionnaireData {
  questions: Question[];
  total: number;
  userProfile: UserProfile;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Obtener el token de Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session data:', { session: !!session, error: sessionError });
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Error de autenticación. Por favor inicia sesión nuevamente.');
        return;
      }
      
      if (!session?.access_token) {
        console.warn('No hay sesión activa');
        setError('No hay sesión activa. Por favor inicia sesión.');
        return;
      }
      
      console.log('Token encontrado, haciendo request...');
      
      const response = await fetch('/api/questionnaire/questions-client', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const result = await response.json();

      if (response.ok) {
        setData(result);
        
        // Inicializar respuestas existentes
        const existingAnswers: Record<number, any> = {};
        result.questions.forEach((question: Question) => {
          if (question.respuesta_existente) {
            existingAnswers[question.id] = question.respuesta_existente;
          }
        });
        setAnswers(existingAnswers);
      } else {
        setError(result.error || 'Error al cargar las preguntas');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveAnswer = async (questionId: number, value: any) => {
    try {
      setSaving(true);
      
      // Obtener el token de Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No hay sesión activa para guardar respuesta');
        return;
      }
      
      const response = await fetch(`/api/questionnaire/questions/${questionId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ valor: value })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error saving answer:', result.error);
        // No mostramos error al usuario para no interrumpir el flujo
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const currentQuestion = data?.questions[currentQuestionIndex];
    if (currentQuestion && answers[currentQuestion.id]) {
      await saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
    }
    
    if (currentQuestionIndex < (data?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    const currentQuestion = data?.questions[currentQuestionIndex];
    if (currentQuestion && answers[currentQuestion.id]) {
      await saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
    }
    
    // Redirigir a resultados o dashboard
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-white text-lg">Cargando cuestionario...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-700 dark:text-white/70 mb-6">{error || 'No se pudieron cargar las preguntas'}</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/statistics')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Volver al Perfil
            </button>
            {error?.includes('sesión') && (
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / data.questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/statistics')}
              className="flex items-center text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al Perfil
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700 dark:text-white/70">
                <BookOpen className="w-5 h-5 mr-2" />
                <span className="text-sm">
                  {currentQuestionIndex + 1} de {data.questions.length}
                </span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-white/70">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">{answeredQuestions} respondidas</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-primary to-purple-500 h-2 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-xl"
          >
            {/* Question Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm text-primary font-medium uppercase tracking-wide">
                    {currentQuestion.section} • {currentQuestion.bloque}
                  </h3>
                  <p className="text-gray-600 dark:text-white/60 text-sm">
                    Pregunta {currentQuestion.codigo}
                  </p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion.texto}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.opciones?.map((opcion, index) => (
                <motion.button
                  key={opcion.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerChange(currentQuestion.id, opcion.value)}
                  className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                    answers[currentQuestion.id] === opcion.value
                      ? 'bg-primary/20 dark:bg-primary/20 border-primary dark:border-primary text-gray-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/20 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      answers[currentQuestion.id] === opcion.value
                        ? 'border-primary bg-primary dark:border-primary dark:bg-primary'
                        : 'border-gray-300 dark:border-white/40'
                    }`}>
                      {answers[currentQuestion.id] === opcion.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-medium">{opcion.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
                }`}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Anterior
              </button>

              <div className="flex items-center space-x-4">
                {saving && (
                  <div className="flex items-center text-gray-600 dark:text-white/60">
                    <div className="w-4 h-4 border-2 border-gray-400 dark:border-white/30 border-t-gray-600 dark:border-t-white/60 rounded-full animate-spin mr-2"></div>
                    <span className="text-sm">Guardando...</span>
                  </div>
                )}
              </div>

              {currentQuestionIndex === data.questions.length - 1 ? (
                <button
                  onClick={handleFinish}
                  disabled={!answers[currentQuestion.id]}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    answers[currentQuestion.id]
                      ? 'bg-gradient-to-r from-primary to-purple-500 text-white hover:from-primary/80 hover:to-purple-500/80'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Award className="w-5 h-5 mr-2" />
                  Finalizar
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    answers[currentQuestion.id]
                      ? 'bg-primary text-white hover:bg-primary/80'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                  }`}
                >
                  Siguiente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
