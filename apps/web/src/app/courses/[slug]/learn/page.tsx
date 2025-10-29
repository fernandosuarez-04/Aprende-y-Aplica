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
  ArrowLeft,
  ScrollText,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  Save,
  FileDown,
  Send
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
  id: string;
  course_id?: string;
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
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(6);
  const [liaMessage, setLiaMessage] = useState('');
  const [currentNote, setCurrentNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
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
  const [savingNote, setSavingNote] = useState(false);

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
        const mappedNotes = notes.map((note: any) => ({
          id: note.note_id,
          title: note.note_title,
          content: note.note_content.substring(0, 50) + (note.note_content.length > 50 ? '...' : ''),
          timestamp: formatTimestamp(note.updated_at || note.created_at),
          lessonId: note.lesson_id,
          fullContent: note.note_content, // Guardar contenido completo
          tags: note.note_tags || []
        }));
        setSavedNotes(mappedNotes);
      } else if (response.status === 401) {
        // Usuario no autenticado, dejar notas vacías
        setSavedNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
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

  // Función para agregar etiqueta
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !noteTags.includes(tag)) {
      setNoteTags([...noteTags, tag]);
      setTagInput('');
    }
  };

  // Función para eliminar etiqueta
  const removeTag = (tagToRemove: string) => {
    setNoteTags(noteTags.filter(tag => tag !== tagToRemove));
  };

  // Función para guardar una nota
  const saveNote = async () => {
    // Validaciones
    if (!currentNote.trim()) {
      alert('El contenido de la nota es requerido');
      return;
    }

    if (!noteTitle.trim()) {
      alert('El título de la nota es requerido');
      return;
    }

    if (!currentLesson || !course) {
      alert('Debe seleccionar una lección');
      return;
    }

    setSavingNote(true);
    try {
      const response = await fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_title: noteTitle.trim(),
          note_content: currentNote.trim(),
          note_tags: noteTags.length > 0 ? noteTags : [],
          source_type: 'manual'
        })
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: 'Error al procesar respuesta del servidor' };
      }

      if (response.ok) {
        const savedNote = responseData;
        // Agregar la nota al estado local
        const newNote = {
          id: savedNote.note_id,
          title: savedNote.note_title,
          content: savedNote.note_content.substring(0, 50) + (savedNote.note_content.length > 50 ? '...' : ''),
          timestamp: formatTimestamp(savedNote.created_at),
          lessonId: savedNote.lesson_id,
          fullContent: savedNote.note_content,
          tags: savedNote.note_tags || []
        };
        setSavedNotes([newNote, ...savedNotes]);
        setCurrentNote('');
        setNoteTitle('');
        setNoteTags([]);
        
        // Recargar estadísticas
        await loadNotesStats(slug);
      } else if (response.status === 401) {
        console.error('Error de autenticación:', responseData);
        alert('Debes iniciar sesión para guardar notas. Por favor, inicia sesión e intenta nuevamente.');
      } else if (response.status === 400) {
        console.error('Error de validación:', responseData);
        alert(`Error de validación: ${responseData.error || 'Datos inválidos'}\n\nDetalles: ${JSON.stringify(responseData, null, 2)}`);
      } else {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        alert(`Error al guardar nota (${response.status}): ${responseData.error || responseData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert(`Error al guardar la nota: ${error instanceof Error ? error.message : 'Error de conexión'}`);
    } finally {
      setSavingNote(false);
    }
  };

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${slug}`);
        
        if (!response.ok) throw new Error('Curso no encontrado');
        
        const courseData = await response.json();
        console.log('Course data loaded:', courseData);
        setCourse(courseData);
        
        // Cargar módulos y lecciones usando el slug
        await loadModules(slug);
        
        // Cargar estadísticas de notas del curso usando el slug
        await loadNotesStats(slug);
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

  // Cargar notas cuando cambia la lección actual
  useEffect(() => {
    if (currentLesson && slug) {
      loadLessonNotes(currentLesson.lesson_id, slug);
      setCurrentNote(''); // Limpiar nota actual al cambiar de lección
      setNoteTitle(currentLesson.lesson_title); // Establecer título por defecto
      setNoteTags([]); // Limpiar etiquetas
    } else {
      // Si no hay lección, limpiar campos
      setCurrentNote('');
      setNoteTitle('');
      setNoteTags([]);
    }
  }, [currentLesson?.lesson_id, slug]);

  // Debug: Log para verificar estado del botón
  useEffect(() => {
    if (!currentLesson || !noteTitle.trim() || !currentNote.trim()) {
      console.log('Botón deshabilitado:', {
        currentLesson: !!currentLesson,
        noteTitle: noteTitle.trim(),
        currentNote: currentNote.trim(),
        savingNote
      });
    }
  }, [currentLesson, noteTitle, currentNote, savingNote]);

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
        
        // Actualizar estadísticas de notas con el total de lecciones
        const totalLessons = allLessons.length;
        setNotesStats(prev => ({
          ...prev,
          lessonsWithNotes: totalLessons > 0 ? `0/${totalLessons}` : '0/0'
        }));
        
        // Seleccionar la primera lección disponible o la siguiente no completada
        if (data.length > 0 && data[0].lessons.length > 0) {
          const nextIncomplete = allLessons.find((l: Lesson) => !l.is_completed);
          const selectedLesson = nextIncomplete || data[0].lessons[0];
          setCurrentLesson(selectedLesson);
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 overflow-hidden -mt-0">
      {/* Header superior mejorado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800/90 via-purple-900/20 to-slate-800/90 backdrop-blur-md border-b border-slate-700/50 px-6 py-3 flex items-center justify-between"
      >
        {/* Botón de regreso */}
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Icono de empresa y nombre del taller */}
        <div className="flex items-center gap-3 mx-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <img 
              src="/icono.png" 
              alt="Aprende y Aplica" 
              className="w-6 h-6 rounded"
              onError={(e) => {
                // Fallback si no carga la imagen
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-6 h-6 bg-white rounded flex items-center justify-center"><span class="text-blue-600 font-bold text-xs">A&A</span></div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{course.course_title}</h1>
            <p className="text-xs text-slate-400">Taller de Aprende y Aplica</p>
          </div>
        </div>

        {/* Barra de progreso mejorada */}
        <div className="flex-1 mx-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full shadow-lg"
              />
            </div>
            <span className="text-sm text-white/80 font-medium bg-slate-700/30 px-3 py-1 rounded-full">
              {courseProgress}%
            </span>
          </div>
        </div>

        {/* Botones de acción adicionales */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Material del curso"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="LIA y Notas"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Contenido principal - 3 paneles */}
      <div className="flex-1 flex overflow-hidden bg-slate-900/50 backdrop-blur-sm">
        {/* Panel Izquierdo - Material del Curso */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-lg overflow-y-auto shadow-xl my-2 ml-2"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    Material del Curso
                  </h2>
                  <button
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/70" />
                  </button>
                </div>

                {modules.map((module, moduleIndex) => (
                  <div key={module.module_id} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{moduleIndex + 1}</span>
                      </div>
                      <h3 className="font-semibold text-white text-lg">{module.module_title}</h3>
                    </div>

                    {/* Estadísticas del módulo mejoradas */}
                    <div className="flex gap-3 mb-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 font-medium">
                        {module.lessons.filter(l => l.is_completed).length}/{module.lessons.length} completados
                      </span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 font-medium">
                        {Math.round((module.lessons.filter(l => l.is_completed).length / module.lessons.length) * 100)}% completado
                      </span>
                    </div>

                    {/* Lista de lecciones mejorada */}
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isActive = currentLesson?.lesson_id === lesson.lesson_id;
                        const isCompleted = lesson.is_completed;

                        return (
                          <motion.button
                            key={lesson.lesson_id}
                            whileHover={{ x: 4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentLesson(lesson)}
                            className={`w-full p-4 rounded-xl transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                                : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700/70 hover:border-slate-600/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : isActive 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'bg-slate-600/50 text-slate-400'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </div>
                              
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
                                  {lesson.lesson_title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs text-slate-400">{formatDuration(lesson.duration_seconds)}</span>
                                </div>
                              </div>

                              {isActive && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="w-3 h-3 bg-blue-400 rounded-full shadow-lg"
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

        {/* Barra vertical para abrir panel izquierdo */}
        {!isLeftPanelOpen && (
          <div className="w-12 bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-start pt-4 z-10 shadow-lg my-2 ml-2">
            <button
              onClick={() => setIsLeftPanelOpen(true)}
              className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Mostrar material del curso"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Panel Central - Contenido del video */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50 backdrop-blur-sm">
          {modules.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <BookOpen className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Este curso aún no tiene contenido</h3>
                <p className="text-slate-400">Los módulos y lecciones se agregarán pronto</p>
              </div>
            </div>
          ) : currentLesson ? (
            <>
              {/* Tabs mejorados */}
              <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex gap-2 p-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
                <p className="text-slate-400">No hay lecciones disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho - LIA y Notas */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col shadow-xl overflow-hidden my-2 mr-2"
            >
          {/* LIA Assistant */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">LIA</h3>
                <p className="text-xs text-slate-400">Tu tutora personalizada</p>
              </div>
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
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
                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notas - Sección completa integrada */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-blue-400" />
                Mis Notas
              </h3>
            </div>

            {/* Área de escritura de notas */}
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4 mb-4 space-y-4">
              {/* Campo de título */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Título de la nota *</label>
                <input
                  type="text"
                  placeholder="Ej: Conceptos clave de la lección"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-600/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Campo de contenido */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Contenido *</label>
              <textarea
                placeholder="Comienza a escribir tu nota aquí..."
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  className="w-full h-32 bg-slate-600/50 border border-slate-600/50 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

              {/* Campo de etiquetas */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Etiquetas</label>
                <div className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="Agregar etiqueta..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 h-8 bg-slate-600/50 border border-slate-600/50 rounded-lg px-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-slate-400"
                  />
                  <button
                    onClick={addTag}
                    className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg font-semibold transition-colors shrink-0"
                    title="Agregar etiqueta"
                  >
                    +
                  </button>
                </div>
                {noteTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {noteTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-300 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
                </div>

            {/* Botones de acción */}
            <div className="flex gap-2 mb-6">
              <button 
                onClick={saveNote}
                disabled={savingNote || !currentNote.trim() || !noteTitle.trim() || !currentLesson}
                title={
                  !currentLesson 
                    ? 'Debe seleccionar una lección'
                    : !noteTitle.trim() 
                    ? 'El título es requerido'
                    : !currentNote.trim()
                    ? 'El contenido es requerido'
                    : savingNote
                    ? 'Guardando...'
                    : 'Guardar nota'
                }
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
              >
                <Save className="w-4 h-4" />
                {savingNote ? 'Guardando...' : 'Guardar'}
                      </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-blue-500/25">
                <FileDown className="w-4 h-4" />
                        Exportar
                      </button>
                    </div>

            {/* Notas guardadas */}
            <div className="space-y-3 mb-6">
              <h3 className="text-white font-semibold text-sm">Notas guardadas</h3>
              <div className="space-y-2">
                {savedNotes.length === 0 ? (
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 text-center">
                    <p className="text-sm text-slate-400">No hay notas guardadas aún</p>
                    <p className="text-xs text-slate-500 mt-1">Guarda tu primera nota para comenzar</p>
                  </div>
                ) : (
                  savedNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30 hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setCurrentNote(note.fullContent || note.content);
                        setNoteTitle(note.title);
                        setNoteTags(note.tags || []);
                      }}
                    >
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-400 font-medium">{note.title}</span>
                        <span className="text-xs text-slate-400">{note.timestamp}</span>
                      </div>
                      <p className="text-sm text-white/70 line-clamp-2 mb-2">
                        {note.content}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30"
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
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Progreso de Notas
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Notas creadas</span>
                  <span className="text-green-400 font-medium">{notesStats.totalNotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Lecciones con notas</span>
                  <span className="text-blue-400 font-medium">{notesStats.lessonsWithNotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Última actualización</span>
                  <span className="text-slate-400">{notesStats.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra vertical para abrir panel derecho */}
        {!isRightPanelOpen && (
          <div className="w-12 bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-start pt-4 z-10 shadow-lg my-2 mr-2">
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Mostrar LIA y Notas"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
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

