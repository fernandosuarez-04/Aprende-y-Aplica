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
  User,
  Copy,
  Check,
  Plus,
  RotateCcw
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
  summary_content?: string;
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
  const [activeTab, setActiveTab] = useState<'video' | 'transcript' | 'summary' | 'activities' | 'questions'>('video');
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
  const [isCourseCompletedModalOpen, setIsCourseCompletedModalOpen] = useState(false);
  const [isCannotCompleteModalOpen, setIsCannotCompleteModalOpen] = useState(false);

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

  // Función para encontrar todas las lecciones ordenadas en una lista plana
  const getAllLessonsOrdered = (): Array<{ lesson: Lesson; module: Module }> => {
    const allLessons: Array<{ lesson: Lesson; module: Module }> = [];
    
    // Ordenar módulos por module_order_index
    const sortedModules = [...modules].sort((a, b) => a.module_order_index - b.module_order_index);
    
    sortedModules.forEach((module) => {
      // Ordenar lecciones por lesson_order_index dentro de cada módulo
      const sortedLessons = [...module.lessons].sort((a, b) => a.lesson_order_index - b.lesson_order_index);
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
    
    if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
    
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

  // Función para marcar una lección como completada (local y BD)
  const markLessonAsCompleted = async (lessonId: string): Promise<boolean> => {
    if (!canCompleteLesson(lessonId)) {
      console.log('No se puede completar la lección porque la anterior no está completada');
      return false;
    }

    // Actualizar estado local primero (optimistic update)
    setModules((prevModules) => {
      const updatedModules = prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.lesson_id === lessonId
            ? { ...lesson, is_completed: true }
            : lesson
        ),
      }));

      // Recalcular el progreso del curso con los módulos actualizados
      const allLessons = updatedModules.flatMap((m: Module) => m.lessons);
      const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
      const totalProgress = allLessons.length > 0 
        ? Math.round((completedLessons.length / allLessons.length) * 100)
        : 0;
      
      // Actualizar progreso del curso
      setCourseProgress(totalProgress);

      return updatedModules;
    });

    // Actualizar currentLesson si es la lección actual
    if (currentLesson?.lesson_id === lessonId) {
      setCurrentLesson((prev) => prev ? { ...prev, is_completed: true } : null);
    }

    // Guardar en la base de datos
    try {
      const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        
        // Si el error es que la lección anterior no está completada, revertir el estado local
        if (errorData.code === 'PREVIOUS_LESSON_NOT_COMPLETED') {
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
            const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
            const totalProgress = allLessons.length > 0 
              ? Math.round((completedLessons.length / allLessons.length) * 100)
              : 0;
            
            setCourseProgress(totalProgress);
            return updatedModules;
          });

          if (currentLesson?.lesson_id === lessonId) {
            setCurrentLesson((prev) => prev ? { ...prev, is_completed: false } : null);
          }

          console.error('Error del servidor:', errorData.error);
          return false;
        }

        // Para otros errores, loguear pero mantener el estado local
        console.error('Error al guardar progreso en BD:', errorData);
        return true; // Retornar true porque el estado local se actualizó
      }

      const result = await response.json();
      
      // Actualizar progreso con el valor del servidor si está disponible
      if (result.progress?.overall_progress !== undefined) {
        setCourseProgress(Math.round(result.progress.overall_progress));
      }

      return true;
    } catch (error) {
      console.error('Error al guardar progreso en BD:', error);
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
      setActiveTab('video');
      // Hacer scroll hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para navegar a la lección siguiente
  const navigateToNextLesson = async () => {
    // Si hay una lección actual, intentar marcarla como completada antes de avanzar
    if (currentLesson) {
      await markLessonAsCompleted(currentLesson.lesson_id);
    }

    const nextLesson = getNextLesson();
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      // Cambiar al tab de video cuando navegas
      setActiveTab('video');
      // Hacer scroll hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para borrar progreso local
  const resetLocalProgress = () => {
    if (!confirm('¿Estás seguro de que quieres borrar todo tu progreso local? Esta acción no se puede deshacer.')) {
      return;
    }

    // Resetear todas las lecciones a no completadas
    setModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          is_completed: false
        })),
      }))
    );

    // Actualizar currentLesson si está completada
    if (currentLesson?.is_completed) {
      setCurrentLesson((prev) => prev ? { ...prev, is_completed: false } : null);
    }

    // Resetear progreso del curso
    setCourseProgress(0);

    // Si no hay lección seleccionada o la actual está completada, seleccionar la primera
    const allLessons = getAllLessonsOrdered();
    if (allLessons.length > 0 && (!currentLesson || currentLesson.is_completed)) {
      setCurrentLesson(allLessons[0].lesson);
    }
  };

  // Función para manejar el cambio de lección desde el panel
  const handleLessonChange = async (selectedLesson: Lesson) => {
    // Si hay una lección actual y se está avanzando (seleccionando una lección posterior)
    if (currentLesson) {
      const allLessons = getAllLessonsOrdered();
      const currentIndex = allLessons.findIndex(
        (item) => item.lesson.lesson_id === currentLesson.lesson_id
      );
      const selectedIndex = allLessons.findIndex(
        (item) => item.lesson.lesson_id === selectedLesson.lesson_id
      );

      // Si se está avanzando (seleccionando una lección posterior), marcar como completada la actual
      if (selectedIndex > currentIndex) {
        await markLessonAsCompleted(currentLesson.lesson_id);
      }
    }

    setCurrentLesson(selectedLesson);
    setActiveTab('video');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    { id: 'video' as const, label: 'Video', icon: Play },
    { id: 'transcript' as const, label: 'Transcripción', icon: ScrollText },
    { id: 'summary' as const, label: 'Resumen', icon: FileText },
    { id: 'activities' as const, label: 'Actividades', icon: Activity },
    { id: 'questions' as const, label: 'Preguntas', icon: MessageCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-carbon flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-white/70 text-lg">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-carbon flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Curso no encontrado</h1>
          <p className="text-gray-700 dark:text-white/70 mb-8">El curso que buscas no existe</p>
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
    <div className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900/30 dark:to-slate-900 overflow-hidden">
      {/* Header superior con nueva estructura */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2 shrink-0 relative z-40"
      >
        <div className="flex items-center justify-between w-full">
          {/* Sección izquierda: Botón regresar | Logo | Nombre del taller */}
          <div className="flex items-center gap-3">
        {/* Botón de regreso */}
        <button
          onClick={() => router.back()}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
        >
              <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
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
            <div className="w-px h-5 bg-gray-300 dark:bg-slate-600/50"></div>

            {/* Nombre del taller */}
          <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">{course.title || course.course_title}</h1>
            <p className="text-xs text-gray-600 dark:text-slate-400">Taller de Aprende y Aplica</p>
          </div>
        </div>

          {/* Sección central: Progreso */}
          <div className="flex items-center gap-3">
            {/* Barra de progreso */}
          <div className="flex items-center gap-2">
              <div className="w-40 h-1.5 bg-gray-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full shadow-lg"
              />
            </div>
              <span className="text-xs text-gray-900 dark:text-white/80 font-medium bg-gray-100 dark:bg-slate-700/30 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center">
              {courseProgress}%
            </span>
          </div>
        </div>

          {/* Sección derecha: Usuario */}
        <div className="flex items-center gap-2">
            {/* Botón para resetear progreso local */}
            <button
              onClick={resetLocalProgress}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
              title="Borrar progreso local"
            >
              <RotateCcw className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </button>
            {/* Menú de usuario */}
            <UserDropdown />
          </div>
        </div>
      </motion.div>

      {/* Contenido principal - 3 paneles */}
      <div className="flex-1 flex overflow-hidden bg-gray-100 dark:bg-slate-900/50 backdrop-blur-sm relative z-10">
        {/* Panel Izquierdo - Material del Curso */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col overflow-hidden shadow-xl my-2 ml-2 border border-gray-200 dark:border-slate-700/50"
            >
              {/* Header con línea separadora alineada con panel central */}
              <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between p-3 rounded-t-lg shrink-0 h-[56px]">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                    Material del Curso
                  </h2>
                  <button
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-white/70" />
                  </button>
                </div>

              {/* Contenido con scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Sección de Material del Curso */}
                <div className="mb-8">
                  {/* Header de Contenido con botón de colapsar */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Contenido
                    </h3>
                    <button
                      onClick={() => setIsMaterialCollapsed(!isMaterialCollapsed)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      title={isMaterialCollapsed ? "Expandir Contenido" : "Colapsar Contenido"}
                    >
                      {isMaterialCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-gray-700 dark:text-white/70" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-700 dark:text-white/70" />
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
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{module.module_title}</h3>
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
                            onClick={() => handleLessonChange(lesson)}
                            className={`w-full p-4 rounded-xl transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                                : 'bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-slate-700/70 hover:border-gray-300 dark:hover:border-slate-600/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : isActive 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'bg-gray-200 dark:bg-slate-600/50 text-gray-600 dark:text-slate-400'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </div>
                              
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/80'}`}>
                                  {lesson.lesson_title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                  <span className="text-xs text-gray-500 dark:text-slate-400">{formatDuration(lesson.duration_seconds)}</span>
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
                <div className="border-b border-gray-200 dark:border-slate-700/50 mb-6"></div>

                {/* Sección de Notas */}
                <div className="space-y-4">
                  {/* Header de Notas con botones de colapsar y nueva nota */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Mis Notas
                    </h3>
                    <div className="flex items-center gap-2">
                      {!isNotesCollapsed && (
                        <button
                          onClick={openNewNoteModal}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Nueva Nota"
                        >
                          <span className="text-sm font-bold text-gray-700 dark:text-white/70">+</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        title={isNotesCollapsed ? "Expandir Notas" : "Colapsar Notas"}
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
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Notas guardadas</h3>
              <div className="space-y-2">
                {savedNotes.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-4 border border-gray-200 dark:border-slate-600/30 text-center">
                    <p className="text-sm text-gray-600 dark:text-slate-400">No hay notas guardadas aún</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Guarda tu primera nota para comenzar</p>
                  </div>
                ) : (
                  savedNotes.map((note) => (
                    <div 
                      key={note.id} 
                            className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3 border border-gray-200 dark:border-slate-600/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{note.title}</span>
                              <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-slate-400">{note.timestamp}</span>
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
                      <p className="text-sm text-gray-700 dark:text-white/70 line-clamp-2 mb-2">
                        {note.content}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded border border-blue-500/30"
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
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Progreso de Notas
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/70">Notas creadas</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{notesStats.totalNotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/70">Lecciones con notas</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{notesStats.lessonsWithNotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/70">Última actualización</span>
                  <span className="text-gray-600 dark:text-slate-400">{notesStats.lastUpdate}</span>
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
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(false);
                  setIsNotesCollapsed(false);
                }}
                className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
                title="Mostrar material del curso"
              >
                <ChevronRight className="w-5 h-5 text-white" />
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
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors"
                title="Ver lecciones"
              >
                <Layers className="w-4 h-4 text-white/80" />
              </button>

              {/* Abrir notas y cerrar lecciones */}
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(true);
                  setIsNotesCollapsed(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors"
                title="Ver notas"
              >
                <FileText className="w-4 h-4 text-white/80" />
              </button>

              {/* Abrir notas, cerrar lecciones y abrir modal de nueva nota */}
              <button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                  setIsMaterialCollapsed(true);
                  setIsNotesCollapsed(false);
                  openNewNoteModal();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-colors shadow-lg shadow-blue-500/25"
                title="Nueva nota"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Panel Central - Contenido del video */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-xl my-2 mx-2 border border-gray-200 dark:border-slate-700/50">
          {modules.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <BookOpen className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Este curso aún no tiene contenido</h3>
                <p className="text-gray-600 dark:text-slate-400">Los módulos y lecciones se agregarán pronto</p>
              </div>
            </div>
          ) : currentLesson ? (
            <>
              {/* Tabs mejorados */}
              <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex gap-2 p-3 rounded-t-lg h-[56px] items-center">
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
                          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50'
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
                    {activeTab === 'video' && (
                      <VideoContent 
                        lesson={currentLesson} 
                        modules={modules}
                        onNavigatePrevious={navigateToPreviousLesson}
                        onNavigateNext={navigateToNextLesson}
                        getPreviousLesson={getPreviousLesson}
                        getNextLesson={getNextLesson}
                        markLessonAsCompleted={markLessonAsCompleted}
                        canCompleteLesson={canCompleteLesson}
                        onCourseCompleted={() => setIsCourseCompletedModalOpen(true)}
                        onCannotComplete={() => setIsCannotCompleteModalOpen(true)}
                      />
                    )}
                    {activeTab === 'transcript' && <TranscriptContent lesson={currentLesson} slug={slug} />}
                    {activeTab === 'summary' && <SummaryContent lesson={currentLesson} />}
                    {activeTab === 'activities' && <ActivitiesContent lesson={currentLesson} slug={slug} />}
                    {activeTab === 'questions' && <QuestionsContent slug={slug} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 dark:text-slate-400">No hay lecciones disponibles</p>
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
              className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col shadow-xl overflow-hidden my-2 mr-2 border border-gray-200 dark:border-slate-700/50"
            >
              {/* Header LIA con línea separadora alineada con panel central */}
              <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between p-3 rounded-t-lg shrink-0 h-[56px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">LIA</h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 leading-tight">Tu tutora personalizada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700 dark:text-white/70" />
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
                            : 'bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-white/90 border border-gray-200 dark:border-slate-600/50'
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
                <div className="border-t border-gray-200 dark:border-slate-700/50 p-4">
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
                      className="flex-1 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
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
          <div className="w-12 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex flex-col shadow-xl my-2 mr-2 z-10 border border-gray-200 dark:border-slate-700/50">
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-center p-3 rounded-t-lg shrink-0 h-[56px]">
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Mostrar LIA"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
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
              className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6"
            >
              {/* Icono de éxito */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                ¡Felicidades!
              </h3>

              {/* Mensaje */}
              <p className="text-slate-300 text-center mb-6">
                Has completado el curso exitosamente. ¡Buen trabajo!
              </p>

              {/* Botón de cerrar */}
              <button
                onClick={() => setIsCourseCompletedModalOpen(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
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
              className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6"
            >
              {/* Icono de advertencia */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                  <HelpCircle className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                No puedes completar esta lección
              </h3>

              {/* Mensaje */}
              <p className="text-slate-300 text-center mb-6">
                Tienes lecciones pendientes que debes completar antes de terminar el curso. Completa todas las lecciones anteriores en orden.
              </p>

              {/* Botón de cerrar */}
              <button
                onClick={() => setIsCannotCompleteModalOpen(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  onCannotComplete
}: { 
  lesson: Lesson;
  modules: Module[];
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
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
  const hasPreviousVideo = hasPreviousLesson && previousLesson.video_provider && previousLesson.video_provider_id;
  const hasNextVideo = hasNextLesson && nextLesson.video_provider && nextLesson.video_provider_id;
  
  // Determinar si es la última lección
  const isLastLesson = !hasNextLesson;
  
  // Debug logging
  console.log('VideoContent - Lesson data:', {
    lesson_id: lesson.lesson_id,
    lesson_title: lesson.lesson_title,
    video_provider: lesson.video_provider,
    video_provider_id: lesson.video_provider_id,
    hasVideo,
    hasPreviousVideo,
    hasNextVideo,
    fullLesson: lesson
  });
  
  return (
    <div className="space-y-6">
      <div className="relative">
        {hasVideo ? (
          <div className="aspect-video rounded-xl overflow-hidden border border-carbon-600 relative">
            <VideoPlayer
              videoProvider={lesson.video_provider!}
              videoProviderId={lesson.video_provider_id!}
              title={lesson.lesson_title}
              className="w-full h-full"
            />
            
            {/* Botones de navegación - Centrados verticalmente */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4">
              {/* Botón anterior - lado izquierdo */}
              {hasPreviousVideo && (
                <button
                  onClick={onNavigatePrevious}
                  className="pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
                    Anterior
                  </span>
                </button>
              )}
              
              {/* Botón siguiente o terminar - lado derecho */}
              {(hasNextVideo || isLastLesson) && (
                <button
                  onClick={isLastLesson ? async () => {
                    // Verificar si se puede completar la lección
                    if (lesson && canCompleteLesson(lesson.lesson_id)) {
                      // Marcar la última lección como completada antes de terminar
                      const success = await markLessonAsCompleted(lesson.lesson_id);
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
                  } : onNavigateNext}
                  className={`pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3 ${
                    isLastLesson ? 'bg-green-500/50 hover:bg-green-600/70' : ''
                  }`}
                >
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
                    {isLastLesson ? 'Terminar' : 'Siguiente'}
                  </span>
                  {isLastLesson ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  )}
                </button>
              )}
            </div>
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
            
            {/* Botones de navegación incluso si no hay video - Centrados verticalmente */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4">
              {/* Botón anterior - lado izquierdo */}
              {hasPreviousVideo && (
                <button
                  onClick={onNavigatePrevious}
                  className="pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
                    Anterior
                  </span>
                </button>
              )}
              
              {/* Botón siguiente o terminar - lado derecho */}
              {(hasNextVideo || isLastLesson) && (
                <button
                  onClick={isLastLesson ? async () => {
                    // Verificar si se puede completar la lección
                    if (lesson && canCompleteLesson(lesson.lesson_id)) {
                      // Marcar la última lección como completada antes de terminar
                      const success = await markLessonAsCompleted(lesson.lesson_id);
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
                  } : onNavigateNext}
                  className={`pointer-events-auto h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-slate-600/30 group w-10 hover:w-32 hover:pl-3 hover:pr-3 ${
                    isLastLesson ? 'bg-green-500/50 hover:bg-green-600/70' : ''
                  }`}
                >
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
                    {isLastLesson ? 'Terminar' : 'Siguiente'}
                  </span>
                  {isLastLesson ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white">{lesson.lesson_title}</h2>
        {lesson.lesson_description && (
          <p className="text-slate-300 mt-2">{lesson.lesson_description}</p>
        )}
      </div>
    </div>
  );
}

function TranscriptContent({ lesson, slug }: { lesson: Lesson | null; slug: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Verificar si existe contenido de transcripción
  const hasTranscript = lesson?.transcript_content && lesson.transcript_content.trim().length > 0;
  
  // Calcular tiempo de lectura estimado (palabras por minuto promedio: 200)
  const estimatedReadingTime = lesson?.transcript_content 
    ? Math.ceil(lesson.transcript_content.split(/\s+/).length / 200)
    : 0;
  
  // Función para descargar la transcripción
  const handleDownloadTranscript = () => {
    if (!lesson?.transcript_content) return;
    
    const blob = new Blob([lesson.transcript_content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcripcion-${lesson.lesson_title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Función para copiar al portapapeles
  const handleCopyToClipboard = async () => {
    if (!lesson?.transcript_content) return;
    
    try {
      await navigator.clipboard.writeText(lesson.transcript_content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset después de 2 segundos
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      alert('Error al copiar al portapapeles');
    }
  };
  
  // Función para guardar en notas
  const handleSaveToNotes = async () => {
    if (!lesson?.transcript_content) return;
    
    setIsSaving(true);
    
    try {
      // Preparar payload según el formato que espera la API REST
      const notePayload = {
        note_title: `Transcripción: ${lesson?.lesson_title}`,
        note_content: lesson.transcript_content,
        note_tags: ['transcripción', 'automática'],
        source_type: 'manual' // Usar valor válido según la restricción de la BD
      };

      console.log('=== DEBUG TRANSCRIPCIÓN ===');
      console.log('Enviando payload de nota:', notePayload);
      console.log('URL de la API:', `/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`);

      const response = await fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(notePayload)
      });
      
      console.log('Respuesta del servidor:', response.status, response.statusText);
      console.log('Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          console.log('Respuesta del servidor (texto):', responseText);
          
          if (responseText) {
            errorData = JSON.parse(responseText);
          } else {
            errorData = { error: 'Respuesta vacía del servidor' };
          }
        } catch (parseError) {
          console.error('Error al parsear respuesta JSON:', parseError);
          errorData = { error: 'Error al procesar respuesta del servidor' };
        }
        
        console.error('Error detallado del servidor:', errorData);
        alert(`Error al guardar la transcripción en notas:\n\n${errorData.error || 'Error desconocido'}\n\nDetalles: ${errorData.message || 'Sin detalles adicionales'}\n\nCódigo de estado: ${response.status}`);
        return;
      }
      
      const newNote = await response.json();
      console.log('Nota creada exitosamente:', newNote);
      console.log('=== FIN DEBUG ===');
      
      // Mostrar mensaje de éxito
      alert('✅ Transcripción guardada exitosamente en notas');
      
      // Aquí podrías actualizar la lista de notas si es necesario
      // loadLessonNotes(lesson.lesson_id, slug);
      
    } catch (error) {
      console.error('Error al guardar transcripción en notas:', error);
      console.log('=== FIN DEBUG (ERROR) ===');
      alert(`❌ Error al guardar la transcripción en notas:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nRevisa la consola para más detalles.`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!lesson) {
  return (
      <div className="space-y-6">
    <div>
          <h2 className="text-2xl font-bold text-white mb-2">Transcripción del Video</h2>
        </div>
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Selecciona una lección</h3>
          <p className="text-slate-400">
            Selecciona una lección del panel izquierdo para ver su transcripción
        </p>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Transcripción del Video</h2>
        <p className="text-slate-300 text-sm">{lesson.lesson_title}</p>
      </div>
      
      {hasTranscript ? (
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 overflow-hidden">
          {/* Header de la transcripción */}
          <div className="bg-carbon-700 px-6 py-4 border-b border-carbon-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ScrollText className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Transcripción Completa</h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>{lesson.transcript_content?.length || 0} caracteres</span>
                <span>•</span>
                <span>{estimatedReadingTime} min lectura</span>
              </div>
            </div>
          </div>
          
          {/* Contenido de la transcripción */}
          <div className="p-6">
            <div className="prose prose-invert max-w-none">
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {lesson.transcript_content}
              </div>
            </div>
          </div>
          
          {/* Footer con acciones */}
          <div className="bg-carbon-700 px-6 py-4 border-t border-carbon-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleCopyToClipboard}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors hover:bg-carbon-600 px-3 py-2 rounded-lg"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{isCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button 
                  onClick={handleDownloadTranscript}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors hover:bg-carbon-600 px-3 py-2 rounded-lg"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="text-sm">Descargar</span>
                </button>
                <button 
                  onClick={handleSaveToNotes}
                  disabled={isSaving}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors hover:bg-carbon-600 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span className="text-sm">{isSaving ? 'Guardando...' : 'Guardar en notas'}</span>
                </button>
              </div>
              <div className="text-xs text-slate-500">
                Última actualización: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Transcripción no disponible</h3>
          <p className="text-slate-400 mb-4">
            Esta lección aún no tiene transcripción disponible. La transcripción se agregará próximamente.
          </p>
          <div className="text-sm text-slate-500">
            <p>• Verifica que el video tenga audio</p>
            <p>• La transcripción se genera automáticamente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryContent({ lesson }: { lesson: Lesson }) {
  // Verificar si existe contenido de resumen
  const hasSummary = lesson?.summary_content && lesson.summary_content.trim().length > 0;
  
  // Calcular tiempo de lectura estimado (palabras por minuto promedio: 200)
  const estimatedReadingTime = lesson?.summary_content 
    ? Math.ceil(lesson.summary_content.split(/\s+/).length / 200)
    : 0;

  if (!hasSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Resumen del Video</h2>
          <p className="text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Resumen no disponible</h3>
          <p className="text-slate-400 mb-4">
            Esta lección aún no tiene resumen disponible. El resumen se agregará próximamente.
          </p>
          <div className="text-sm text-slate-500">
            <p>• El resumen se genera o agrega manualmente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Resumen del Video</h2>
        <p className="text-slate-300 text-sm">{lesson.lesson_title}</p>
      </div>
      
      <div className="bg-carbon-600 rounded-xl border border-carbon-500 overflow-hidden">
        {/* Header del resumen */}
        <div className="bg-carbon-700 px-6 py-4 border-b border-carbon-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Resumen Completo</h3>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <span>{lesson.summary_content?.split(/\s+/).length || 0} palabras</span>
              <span>•</span>
              <span>{estimatedReadingTime} min lectura</span>
            </div>
          </div>
        </div>
        
        {/* Contenido del resumen */}
        <div className="p-6">
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
              {lesson.summary_content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitiesContent({ lesson, slug }: { lesson: Lesson; slug: string }) {
  const [activities, setActivities] = useState<Array<{
    activity_id: string;
    activity_title: string;
    activity_description?: string;
    activity_type: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat';
    activity_content: string;
    ai_prompts?: string;
    activity_order_index: number;
    is_required: boolean;
  }>>([]);
  const [materials, setMaterials] = useState<Array<{
    material_id: string;
    material_title: string;
    material_description?: string;
    material_type: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading';
    file_url?: string;
    external_url?: string;
    content_data?: any;
    material_order_index: number;
    is_downloadable: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivitiesAndMaterials() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar actividades
        const activitiesResponse = await fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/activities`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData || []);
        } else {
          setActivities([]);
        }

        // Cargar materiales
        const materialsResponse = await fetch(`/api/courses/${slug}/lessons/${lesson.lesson_id}/materials`);
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setMaterials(materialsData || []);
        } else {
          setMaterials([]);
        }
      } catch (error) {
        console.error('Error loading activities and materials:', error);
        setActivities([]);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    }

    loadActivitiesAndMaterials();
  }, [lesson?.lesson_id, slug]);

  const hasActivities = activities.length > 0;
  const hasMaterials = materials.length > 0;
  const hasContent = hasActivities || hasMaterials;

  if (loading) {
  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Actividades</h2>
          <p className="text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Actividades</h2>
          <p className="text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>
        
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-slate-400" />
      </div>
          <h3 className="text-white text-lg font-semibold mb-2">Actividades no disponibles</h3>
          <p className="text-slate-400 mb-4">
            Esta lección aún no tiene actividades disponibles. Las actividades se agregarán próximamente.
          </p>
          <div className="text-sm text-slate-500">
            <p>• Las actividades se agregan manualmente</p>
            <p>• Contacta al instructor si necesitas ayuda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Actividades</h2>
        <p className="text-slate-300 text-sm">{lesson.lesson_title}</p>
        </div>

      {/* Actividades */}
      {hasActivities && (
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 overflow-hidden">
          {/* Header de actividades */}
          <div className="bg-carbon-700 px-6 py-4 border-b border-carbon-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Actividades</h3>
      </div>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>{activities.length} actividad{activities.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Contenido de actividades */}
          <div className="p-6 space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.activity_id}
                className="bg-carbon-700/50 rounded-lg p-5 border border-carbon-600/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold text-lg">{activity.activity_title}</h4>
                      {activity.is_required && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                          Requerida
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 capitalize">
                        {activity.activity_type}
                      </span>
                    </div>
                    {activity.activity_description && (
                      <p className="text-slate-300 text-sm mb-3">{activity.activity_description}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-carbon-800/50 rounded-lg p-4 mb-3">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {activity.activity_content}
                    </div>
                  </div>
                </div>

                {activity.ai_prompts && (
                  <div className="mt-4 pt-4 border-t border-carbon-600/50">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <h5 className="text-purple-400 font-semibold text-sm">Prompts y Ejercicios</h5>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="prose prose-invert max-w-none">
                        <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
                          {activity.ai_prompts}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materiales */}
      {hasMaterials && (
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 overflow-hidden">
          {/* Header de materiales */}
          <div className="bg-carbon-700 px-6 py-4 border-b border-carbon-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Materiales</h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>{materials.length} material{materials.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Contenido de materiales */}
          <div className="p-6 space-y-4">
            {materials.map((material) => (
              <div
                key={material.material_id}
                className="bg-carbon-700/50 rounded-lg p-5 border border-carbon-600/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold text-lg">{material.material_title}</h4>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 capitalize">
                        {material.material_type}
                      </span>
                      {material.is_downloadable && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                          Descargable
                        </span>
                      )}
                    </div>
                    {material.material_description && (
                      <p className="text-slate-300 text-sm mb-3">{material.material_description}</p>
                    )}
                  </div>
                </div>
                
                {/* Enlaces y acciones */}
                <div className="flex items-center gap-3">
                  {material.external_url && (
                    <a
                      href={material.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors border border-blue-500/30"
                    >
                      <FileDown className="w-4 h-4" />
                      <span className="text-sm">Abrir enlace</span>
                    </a>
                  )}
                  {material.file_url && (
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors border border-green-500/30"
                    >
                      <FileDown className="w-4 h-4" />
                      <span className="text-sm">Ver archivo</span>
                    </a>
                  )}
                  {material.content_data && typeof material.content_data === 'object' && (
                    <div className="flex-1 bg-carbon-800/50 rounded-lg p-3 border border-carbon-600/50">
                      <p className="text-slate-300 text-sm">
                        {JSON.stringify(material.content_data, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsContent({ slug }: { slug: string }) {
  const [questions, setQuestions] = useState<Array<{
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
    user: {
      id: string;
      username: string;
      display_name?: string;
      first_name?: string;
      last_name?: string;
      profile_picture_url?: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved' | 'pinned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadQuestions() {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Construir URL con filtros
        const params = new URLSearchParams();
        if (filter === 'resolved') params.append('resolved', 'true');
        else if (filter === 'unresolved') params.append('resolved', 'false');
        if (filter === 'pinned') params.append('pinned', 'true');
        if (searchQuery) params.append('search', searchQuery);

        const url = `/api/courses/${slug}/questions${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setQuestions(data || []);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [slug, filter, searchQuery]);

  const getUserDisplayName = (user: any) => {
    return user?.display_name || 
           (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null) ||
           user?.username || 
           'Usuario';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Preguntas y Respuestas</h2>
        </div>
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Preguntas y Respuestas</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Hacer Pregunta
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-carbon-700/50 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === 'unresolved'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sin resolver
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resueltas
            </button>
            <button
              onClick={() => setFilter('pinned')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === 'pinned'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fijadas
            </button>
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar preguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-carbon-700/50 border border-carbon-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-carbon-600 rounded-xl border border-carbon-500 p-8 text-center">
          <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">No hay preguntas</h3>
          <p className="text-slate-400 mb-4">
            {searchQuery ? 'No se encontraron preguntas con tu búsqueda' : 'Aún no hay preguntas en este curso'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Hacer Primera Pregunta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-carbon-600 rounded-xl border border-carbon-500 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => setSelectedQuestion(selectedQuestion === question.id ? null : question.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {question.is_pinned && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                          Fijada
                        </span>
                      )}
                      {question.is_resolved && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Resuelta
                        </span>
                      )}
                    </div>
                    {question.title && (
                      <h3 className="text-white font-semibold text-lg mb-2">{question.title}</h3>
                    )}
                    <p className="text-slate-300 text-sm line-clamp-2">{question.content}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-carbon-500/50">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{getUserDisplayName(question.user)}</span>
                    </div>
                    <span>{formatTimeAgo(question.created_at)}</span>
                    <div className="flex items-center gap-4">
                      <span>{question.response_count} respuestas</span>
                      <span>{question.view_count} vistas</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      selectedQuestion === question.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
              
              {selectedQuestion === question.id && (
                <QuestionDetail
                  questionId={question.id}
                  slug={slug}
                  onClose={() => setSelectedQuestion(null)}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateQuestionForm
          slug={slug}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            // Recargar preguntas
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function QuestionDetail({ questionId, slug, onClose }: { questionId: string; slug: string; onClose: () => void }) {
  const [question, setQuestion] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    async function loadQuestion() {
      try {
        setLoading(true);
        const [questionRes, responsesRes] = await Promise.all([
          fetch(`/api/courses/${slug}/questions/${questionId}`),
          fetch(`/api/courses/${slug}/questions/${questionId}/responses`)
        ]);

        if (questionRes.ok) {
          const questionData = await questionRes.json();
          setQuestion(questionData);
        }

        if (responsesRes.ok) {
          const responsesData = await responsesRes.json();
          setResponses(responsesData);
        }
      } catch (error) {
        console.error('Error loading question:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [questionId, slug]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.stopPropagation();
    if (!newResponse.trim()) return;

    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newResponse.trim() })
      });

      if (response.ok) {
        const newResponseData = await response.json();
        setResponses(prev => [...prev, { ...newResponseData, replies: [] }]);
        setNewResponse('');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_response_id: parentId
        })
      });

      if (response.ok) {
        const newReplyData = await response.json();
        setResponses(prev => prev.map(r => 
          r.id === parentId 
            ? { ...r, replies: [...(r.replies || []), newReplyData] }
            : r
        ));
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 border-t border-carbon-500/50 bg-carbon-700/30">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="p-6 border-t border-carbon-500/50 bg-carbon-700/30" onClick={(e) => e.stopPropagation()}>
      <div className="mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">{question.title || 'Pregunta'}</h3>
        <p className="text-slate-300 whitespace-pre-wrap">{question.content}</p>
      </div>

      <div className="space-y-4 mb-6">
        {responses.map((response) => (
          <div key={response.id} className="bg-carbon-800/50 rounded-lg p-4 border border-carbon-600/50">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">
                    {response.user?.display_name || response.user?.username || 'Usuario'}
                  </span>
                  {response.is_instructor_answer && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                      Instructor
                    </span>
                  )}
                  {response.is_approved_answer && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      ✓ Respuesta Aprobada
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm mb-3">{response.content}</p>
                <button
                  onClick={() => setReplyingTo(replyingTo === response.id ? null : response.id)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  Responder
                </button>
              </div>
            </div>

            {replyingTo === response.id && (
              <div className="mt-3 pl-11">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full px-4 py-2 bg-carbon-700 border border-carbon-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSubmitReply(response.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="px-4 py-2 bg-carbon-600 hover:bg-carbon-500 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {response.replies && response.replies.length > 0 && (
              <div className="mt-4 pl-11 space-y-3 border-l-2 border-carbon-600/50">
                {response.replies.map((reply: any) => (
                  <div key={reply.id} className="bg-carbon-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-xs">
                        {reply.user?.display_name || reply.user?.username || 'Usuario'}
                      </span>
                      {reply.is_instructor_answer && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                          Instructor
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-carbon-600/50 pt-4">
        <textarea
          value={newResponse}
          onChange={(e) => setNewResponse(e.target.value)}
          placeholder="Escribe tu respuesta..."
          className="w-full px-4 py-2 bg-carbon-700 border border-carbon-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          rows={4}
        />
        <button
          onClick={handleSubmitResponse}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Enviar Respuesta
        </button>
      </div>
    </div>
  );
}

function CreateQuestionForm({ slug, onClose, onSuccess }: { slug: string; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/courses/${slug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim()
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error al crear la pregunta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-carbon-700 rounded-xl border border-carbon-600 p-6 w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-semibold text-xl mb-4">Hacer una Pregunta</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de tu pregunta..."
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-slate-300 text-sm mb-2">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe tu pregunta..."
              required
              rows={6}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-carbon-600 hover:bg-carbon-500 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Pregunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

