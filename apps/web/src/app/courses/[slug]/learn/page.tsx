'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Activity,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ScrollText,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  Save,
  FileDown,
  Send,
  X
} from 'lucide-react';

interface Lesson {
  lesson_id: string;
  lesson_title: string;
  lesson_order_index: number;
  duration_seconds: number;
  is_completed: boolean;
  progress_percentage: number;
}

interface Module {
  module_id: string;
  module_title: string;
  module_order_index: number;
  lessons: Lesson[];
}

interface CourseData {
  course_id: string;
  course_title: string;
  course_description: string;
  course_thumbnail: string;
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'transcript' | 'summary' | 'activities' | 'community'>('video');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(6);
  const [liaMessage, setLiaMessage] = useState('');

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${slug}`);
        
        if (!response.ok) throw new Error('Curso no encontrado');
        
        const courseData = await response.json();
        console.log('Course data loaded:', courseData);
        setCourse(courseData);
        
        // Cargar módulos y lecciones usando slug
        await loadModules(slug);
      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCourse();
    }
  }, [slug]);

  const loadModules = async (courseSlug: string) => {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/modules`);
      if (response.ok) {
        const data = await response.json();
        console.log('Modules data loaded:', data);
        setModules(data);
        
        // Calcular progreso general del curso
        const allLessons = data.flatMap((m: Module) => m.lessons);
        const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
        const totalProgress = allLessons.length > 0 
          ? Math.round((completedLessons.length / allLessons.length) * 100)
          : 0;
        setCourseProgress(totalProgress);
        
        // Seleccionar la primera lección disponible o la siguiente no completada
        if (data.length > 0 && data[0].lessons.length > 0) {
          const nextIncomplete = allLessons.find((l: Lesson) => !l.is_completed);
          setCurrentLesson(nextIncomplete || data[0].lessons[0]);
        }
      } else {
        console.error('Error fetching modules:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'video' as const, label: 'Video', icon: Play },
    { id: 'transcript' as const, label: 'Transcripción', icon: ScrollText },
    { id: 'summary' as const, label: 'Resumen', icon: FileText },
    { id: 'activities' as const, label: 'Actividades', icon: Activity },
    { id: 'community' as const, label: 'Comunidad', icon: MessageCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Curso no encontrado</h1>
          <p className="text-white/70 mb-8">El curso que buscas no existe</p>
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
    <div className="h-screen flex flex-col bg-carbon overflow-hidden">
      {/* Header con progreso */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-carbon-700 border-b border-carbon-600 px-6 py-4 flex items-center justify-between"
      >
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-carbon-600 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex-1 mx-8">
          <h1 className="text-xl font-bold text-white mb-1">{course.course_title}</h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-carbon-600 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
            <span className="text-sm text-white/70 font-medium">{courseProgress}%</span>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal - 3 paneles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Material del Curso */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-carbon-700 border-r border-carbon-600 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Material del Curso
                  </h2>
                  <button
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="p-1 hover:bg-carbon-600 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </button>
                </div>

                {modules.map((module, moduleIndex) => (
                  <div key={module.module_id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-white">{module.module_title}</h3>
                    </div>

                    {/* Estadísticas del módulo */}
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        {module.lessons.filter(l => l.is_completed).length}/{module.lessons.length} completados
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        6% completado
                      </span>
                    </div>

                    {/* Lista de lecciones */}
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isActive = currentLesson?.lesson_id === lesson.lesson_id;
                        const isCompleted = lesson.is_completed;

                        return (
                          <motion.button
                            key={lesson.lesson_id}
                            whileHover={{ x: 4 }}
                            onClick={() => setCurrentLesson(lesson)}
                            className={`w-full p-3 rounded-lg transition-all ${
                              isActive
                                ? 'bg-blue-500/20 border-2 border-blue-500'
                                : 'bg-carbon-600/50 border-2 border-transparent hover:bg-carbon-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                              ) : (
                                <Play className="w-5 h-5 text-white/50 flex-shrink-0" />
                              )}
                              
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                                  {lesson.lesson_title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-white/40" />
                                  <span className="text-xs text-white/40">{formatDuration(lesson.duration_seconds)}</span>
                                </div>
                              </div>

                              {isActive && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón para abrir panel izquierdo */}
        {!isLeftPanelOpen && (
          <button
            onClick={() => setIsLeftPanelOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-carbon-700 border-r border-carbon-600 p-2 hover:bg-carbon-600 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Panel Central - Contenido del video */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {modules.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-carbon-600 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-white/50" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Este curso aún no tiene contenido</h3>
                <p className="text-white/70">Los módulos y lecciones se agregarán pronto</p>
              </div>
            </div>
          ) : currentLesson ? (
            <>
              {/* Tabs */}
              <div className="bg-carbon-700 border-b border-carbon-600 flex gap-1 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'text-white/50 hover:text-white hover:bg-carbon-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Contenido del tab activo */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full p-6"
                  >
                    {activeTab === 'video' && <VideoContent lesson={currentLesson} />}
                    {activeTab === 'transcript' && <TranscriptContent lesson={currentLesson} />}
                    {activeTab === 'summary' && <SummaryContent lesson={currentLesson} />}
                    {activeTab === 'activities' && <ActivitiesContent lesson={currentLesson} />}
                    {activeTab === 'community' && <CommunityContent />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/70">No hay lecciones disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho - LIA y Notas */}
        <div className="w-80 bg-carbon-700 border-l border-carbon-600 flex flex-col">
          {/* LIA Assistant */}
          <div className="p-4 border-b border-carbon-600">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">LIA</h3>
                <p className="text-xs text-white/50">Tu tutora personalizada</p>
              </div>
              <button
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className="p-2 hover:bg-carbon-600 rounded transition-colors"
              >
                <FileText className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-white/90 leading-relaxed">
                ¡Hola! Soy LIA, tu tutora personalizada. Estoy aquí para acompañarte en tu aprendizaje
                con conceptos fundamentales explicados de forma clara.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pregunta a LIA..."
                value={liaMessage}
                onChange={(e) => setLiaMessage(e.target.value)}
                className="flex-1 px-3 py-2 bg-carbon-600 border border-carbon-500 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Notas */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Mis Notas
              </h3>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-carbon-600 rounded transition-colors">
                  <FileDown className="w-4 h-4 text-white/70" />
                </button>
                <button className="p-1.5 hover:bg-carbon-600 rounded transition-colors">
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            <div className="bg-carbon-600 rounded-lg p-4 min-h-[200px]">
              <textarea
                placeholder="Comienza a escribir tu nota aquí..."
                className="w-full h-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder:text-white/30"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes de contenido
function VideoContent({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{lesson.lesson_title}</h2>
      
      <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl flex items-center justify-center border border-carbon-600 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-600 transition-all transform group-hover:scale-110">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
          <p className="text-white/70">Video de la lección</p>
        </div>
      </div>
    </div>
  );
}

function TranscriptContent({ lesson }: { lesson: Lesson }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Transcripción del Video - {lesson.lesson_title}</h2>
      <div className="bg-carbon-600 rounded-lg p-6">
        <p className="text-white/70 text-center py-8">
          Esta lección aún no tiene transcripción disponible
        </p>
      </div>
    </div>
  );
}

function SummaryContent({ lesson }: { lesson: Lesson }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Resumen del Video - {lesson.lesson_title}</h2>
      <div className="bg-carbon-600 rounded-lg p-6">
        <p className="text-white/70 text-center py-8">
          Esta lección aún no tiene resumen disponible
        </p>
      </div>
    </div>
  );
}

function ActivitiesContent({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Actividades del Video - {lesson.lesson_title}</h2>
      
      <div className="bg-carbon-600 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Descripción de la Actividad</h3>
        </div>
        <p className="text-white/70">Este video no tiene ninguna Actividad</p>
      </div>

      <div className="bg-carbon-600 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Prompts y Ejercicios</h3>
        </div>
        <p className="text-white/70">Este video no tiene ninguna Actividad</p>
      </div>
    </div>
  );
}

function CommunityContent() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Comunidad del Taller</h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
          <span className="text-lg">+</span>
          Hacer Pregunta
        </button>
      </div>
      
      <div className="space-y-4">
        <p className="text-white/70 text-center py-12">No hay preguntas aún en esta lección</p>
      </div>
    </div>
  );
}

