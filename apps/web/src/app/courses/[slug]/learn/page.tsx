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
  User
} from 'lucide-react';
import { UserDropdown } from '../../../../core/components/UserDropdown';
import { NotesModal } from '../../../../core/components/NotesModal';
import { VideoPlayer } from '../../../../core/components/VideoPlayer';

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
  transcript_content?: string;
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

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'transcript' | 'summary' | 'activities' | 'community'>('video');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isMaterialCollapsed, setIsMaterialCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    id: string;
    title: string;
    content: string;
    tags: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(6);
  const [liaMessage, setLiaMessage] = useState('');
  const [liaMessages, setLiaMessages] = useState<Array<{
    id: string;
    type: 'user' | 'lia';
    content: string;
    timestamp: Date;
  }>>([
    {
      id: '1',
      type: 'lia',
      content: '¡Hola! Soy LIA, tu tutora personalizada. Estoy aquí para acompañarte en tu aprendizaje con conceptos fundamentales explicados de forma clara. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
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


  // Función para enviar mensaje a LIA
  const sendLiaMessage = () => {
    if (!liaMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: liaMessage.trim(),
      timestamp: new Date()
    };

    setLiaMessages(prev => [...prev, userMessage]);
    setLiaMessage('');

    // Simular respuesta de LIA (en una implementación real, esto sería una llamada a la API)
    setTimeout(() => {
      const liaResponse = {
        id: (Date.now() + 1).toString(),
        type: 'lia' as const,
        content: `Entiendo tu pregunta sobre "${liaMessage.trim()}". Como tu tutora personalizada, te ayudo a comprender mejor los conceptos. ¿Te gustaría que profundice en algún aspecto específico?`,
        timestamp: new Date()
      };
      setLiaMessages(prev => [...prev, liaResponse]);
    }, 1000);
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

  // Función para guardar nota (nueva o editada)
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

      if (editingNote) {
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
        
        const updatedNote = await response.json();
        
        // Actualizar la nota en la lista local
        setSavedNotes(prev => prev.map(note => 
          note.id === editingNote.id 
            ? {
                id: updatedNote.note_id || updatedNote.id,
                title: noteData.title,
                content: noteData.content.substring(0, 50) + (noteData.content.length > 50 ? '...' : ''),
                fullContent: noteData.content,
                tags: noteData.tags,
                timestamp: formatTimestamp(updatedNote.updated_at || updatedNote.created_at || new Date().toISOString()),
                lessonId: currentLesson.lesson_id
              }
            : note
        ));
        
        // Actualizar estadísticas y recargar notas
        updateNotesStats();
        loadLessonNotes(currentLesson.lesson_id, slug);
      } else {
        // Crear nueva nota
        const response = await fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notePayload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          alert(`Error al guardar la nota: ${errorData.error || 'Error desconocido'}`);
          return;
        }
        
        const newNote = await response.json();
        
        // Formatear la nota según la estructura esperada
        const formattedNote = {
          id: newNote.note_id || newNote.id,
          title: noteData.title,
          content: noteData.content.substring(0, 50) + (noteData.content.length > 50 ? '...' : ''),
          fullContent: noteData.content,
          tags: noteData.tags,
          timestamp: formatTimestamp(newNote.created_at || new Date().toISOString()),
          lessonId: currentLesson.lesson_id
        };
        
        setSavedNotes(prev => [formattedNote, ...prev]);
        
        // Actualizar estadísticas y recargar notas
        updateNotesStats();
        loadLessonNotes(currentLesson.lesson_id, slug);
      }
      
      setIsNotesModalOpen(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error al guardar nota:', error);
    }
  };

  // Función para eliminar nota
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;
    
    try {
      const response = await fetch(`/api/courses/${params.slug}/lessons/${currentLesson?.lesson_id}/notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSavedNotes(prev => prev.filter(note => note.id !== noteId));
        // Actualizar estadísticas
        updateNotesStats();
      }
    } catch (error) {
      console.error('Error al eliminar nota:', error);
    }
  };

  // Función para actualizar estadísticas de notas
  const updateNotesStats = () => {
    const totalNotes = savedNotes.length;
    const uniqueLessons = new Set(savedNotes.map(note => note.lessonId)).size;
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
    
    setNotesStats({
      totalNotes,
      lessonsWithNotes: `${uniqueLessons}/${totalLessons}`,
      lastUpdate: new Date().toLocaleString()
    });
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
    }
  }, [currentLesson?.lesson_id, slug]);


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
    <div className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 overflow-hidden">
      {/* Header superior con nueva estructura */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800/90 via-purple-900/20 to-slate-800/90 backdrop-blur-md border-b border-slate-700/50 px-4 py-2 shrink-0 relative z-50"
      >
        <div className="flex items-center justify-between w-full">
          {/* Sección izquierda: Botón regresar | Logo | Nombre del taller */}
          <div className="flex items-center gap-3">
        {/* Botón de regreso */}
        <button
          onClick={() => router.back()}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
              <ArrowLeft className="w-4 h-4 text-white" />
        </button>

            {/* Logo de la empresa */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <img 
              src="/icono.png" 
              alt="Aprende y Aplica" 
              className="w-6 h-6 rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-6 h-6 bg-white rounded flex items-center justify-center"><span class="text-blue-600 font-bold text-xs">A&A</span></div>';
                }
              }}
            />
          </div>

            {/* Separador visual */}
            <div className="w-px h-5 bg-slate-600/50"></div>

            {/* Nombre del taller */}
          <div>
              <h1 className="text-base font-bold text-white">{course.title || course.course_title}</h1>
            <p className="text-xs text-slate-400">Taller de Aprende y Aplica</p>
          </div>
        </div>

          {/* Sección central: Progreso */}
          <div className="flex items-center gap-3">
            {/* Barra de progreso */}
          <div className="flex items-center gap-2">
              <div className="w-40 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full shadow-lg"
              />
            </div>
              <span className="text-xs text-white/80 font-medium bg-slate-700/30 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center">
              {courseProgress}%
            </span>
          </div>
        </div>

          {/* Sección derecha: Usuario */}
        <div className="flex items-center gap-2">
            {/* Menú de usuario */}
            <UserDropdown />
          </div>
        </div>
      </motion.div>

      {/* Contenido principal - 3 paneles */}
      <div className="flex-1 flex overflow-hidden bg-slate-900/50 backdrop-blur-sm relative z-10">
        {/* Panel Izquierdo - Material del Curso */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col overflow-hidden shadow-xl my-2 ml-2"
            >
              {/* Header con línea separadora alineada con panel central */}
              <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between p-3 rounded-t-lg shrink-0 h-[56px]">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                    Material del Curso
                  </h2>
                  <button
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/70" />
                  </button>
                </div>

              {/* Contenido con scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Sección de Material del Curso */}
                <div className="mb-8">
                  {/* Header de Contenido con botón de colapsar */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Contenido
                    </h3>
                    <button
                      onClick={() => setIsMaterialCollapsed(!isMaterialCollapsed)}
                      className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title={isMaterialCollapsed ? "Expandir Contenido" : "Colapsar Contenido"}
                    >
                      {isMaterialCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-white/70" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-white/70" />
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
            </motion.div>
          )}
        </AnimatePresence>
          </div>

                {/* Línea separadora entre Material y Notas */}
                <div className="border-b border-slate-700/50 mb-6"></div>

                {/* Sección de Notas */}
                <div className="space-y-4">
                  {/* Header de Notas con botones de colapsar y nueva nota */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Mis Notas
                    </h3>
                    <div className="flex items-center gap-2">
                      {!isNotesCollapsed && (
                        <button
                          onClick={openNewNoteModal}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Nueva Nota"
                        >
                          <span className="text-sm font-bold text-white/70">+</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                        className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                        title={isNotesCollapsed ? "Expandir Notas" : "Colapsar Notas"}
                      >
                        {isNotesCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-white/70" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-white/70" />
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
                            className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30 hover:bg-slate-700/50 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-400 font-medium">{note.title}</span>
                              <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{note.timestamp}</span>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra vertical para abrir panel izquierdo */}
        {!isLeftPanelOpen && (
          <div className="w-12 bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col shadow-xl my-2 ml-2 z-10">
            <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-center p-3 rounded-t-lg shrink-0 h-[56px]">
            <button
              onClick={() => setIsLeftPanelOpen(true)}
              className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Mostrar material del curso"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            </div>
          </div>
        )}

        {/* Panel Central - Contenido del video */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-xl my-2 mx-2">
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
              <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex gap-2 p-3 rounded-t-lg h-[56px] items-center">
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

        {/* Panel Derecho - Solo LIA */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col shadow-xl overflow-hidden my-2 mr-2"
            >
              {/* Header LIA con línea separadora alineada con panel central */}
              <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between p-3 rounded-t-lg shrink-0 h-[56px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight">LIA</h3>
                    <p className="text-xs text-slate-400 leading-tight">Tu tutora personalizada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                >
                  <ChevronRight className="w-4 h-4 text-white/70" />
                </button>
              </div>

              {/* Chat de LIA expandido */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Área de mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {liaMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-slate-700/50 text-white/90 border border-slate-600/50'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Área de entrada */}
                <div className="border-t border-slate-700/50 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe tu pregunta a LIA..."
                      value={liaMessage}
                      onChange={(e) => setLiaMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendLiaMessage();
                        }
                      }}
                      className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                    <button
                      onClick={sendLiaMessage}
                      disabled={!liaMessage.trim()}
                      className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra vertical para abrir panel derecho */}
        {!isRightPanelOpen && (
          <div className="w-12 bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col shadow-xl my-2 mr-2 z-10">
            <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-center p-3 rounded-t-lg shrink-0 h-[56px]">
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Mostrar LIA"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Notas */}
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
    </div>
  );
}

// Componentes de contenido
function VideoContent({ lesson }: { lesson: Lesson }) {
  // Verificar si la lección tiene video
  const hasVideo = lesson.video_provider && lesson.video_provider_id;
  
  // Debug logging
  console.log('VideoContent - Lesson data:', {
    lesson_id: lesson.lesson_id,
    lesson_title: lesson.lesson_title,
    video_provider: lesson.video_provider,
    video_provider_id: lesson.video_provider_id,
    hasVideo,
    fullLesson: lesson
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{lesson.lesson_title}</h2>
        {lesson.lesson_description && (
          <p className="text-slate-300 mt-2">{lesson.lesson_description}</p>
        )}
      </div>
      
      {hasVideo ? (
        <div className="aspect-video rounded-xl overflow-hidden border border-carbon-600">
          <VideoPlayer
            videoProvider={lesson.video_provider!}
            videoProviderId={lesson.video_provider_id!}
            title={lesson.lesson_title}
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl flex items-center justify-center border border-carbon-600 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-600 transition-all transform group-hover:scale-110">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
            <p className="text-white/70">Video no disponible</p>
          </div>
        </div>
      )}
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

