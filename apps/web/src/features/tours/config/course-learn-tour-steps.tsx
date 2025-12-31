import React from 'react';
import { Step } from 'nextstepjs';
import { 
  PlayCircle, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  Sparkles, 
  ListChecks, 
  Bot,
  Layers,
  StickyNote,
  Layout
} from 'lucide-react';

// Tour ID for the Course Learning Page
export const COURSE_LEARN_TOUR_ID = 'course-learn-tour';

export const courselearnTourSteps: Step[] = [
  {
    tour: COURSE_LEARN_TOUR_ID,
    steps: [
      // 1. Welcome / Overview
      {
        icon: <Layout className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Bienvenido a tu Experiencia de Aprendizaje',
        content: (
          <p>
            Este es tu espacio de aprendizaje personalizado. Aquí encontrarás todas las herramientas 
            para <strong className="text-white">dominar el contenido</strong> del curso de manera efectiva.
          </p>
        ),
        selector: 'body',
        side: 'center',
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 0,
      },
      // 2. Course Content Panel (Sidebar)
      {
        icon: <Layers className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Temario del Curso',
        content: (
          <div className="space-y-3">
            <p>
              En el panel izquierdo encontrarás el <strong className="text-white">temario completo</strong>:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Todos los módulos organizados</li>
              <li>Lecciones con su duración</li>
              <li>Tu progreso de avance</li>
              <li>Actividades y materiales de cada lección</li>
            </ul>
          </div>
        ),
        selector: '#tour-course-sidebar',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
      },
      // 3. Video Tab
      {
        icon: <PlayCircle className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Contenido en Video',
        content: (
          <p>
            La pestaña <strong className="text-white">Video</strong> muestra el contenido principal 
            de cada lección. Puedes navegar entre lecciones con los controles del reproductor.
          </p>
        ),
        selector: '#tour-tab-video',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      // 4. Transcription Tab
      {
        icon: <FileText className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Transcripción Interactiva',
        content: (
          <div className="space-y-3">
            <p>
              La <strong className="text-white">Transcripción</strong> te permite:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Leer todo lo que se dice en el video</li>
              <li>Buscar palabras clave específicas</li>
              <li>Copiar secciones para tus notas</li>
              <li>Seguir el video mientras lees</li>
            </ul>
          </div>
        ),
        selector: '#tour-tab-transcript',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
        // Action: Switch to transcript tab
      },
      // 5. Summary Tab
      {
        icon: <BookOpen className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Resumen de la Lección',
        content: (
          <p>
            El <strong className="text-white">Resumen</strong> condensa los puntos clave de la lección 
            en un formato fácil de revisar. Perfecto para repasos rápidos antes de exámenes.
          </p>
        ),
        selector: '#tour-tab-summary',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      // 6. Activities Tab
      {
        icon: <ListChecks className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Actividades Prácticas',
        content: (
          <div className="space-y-3">
            <p>
              En <strong className="text-white">Actividades</strong> encontrarás:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Ejercicios para practicar lo aprendido</li>
              <li>Quizzes para evaluar tu comprensión</li>
              <li>Reflexiones guiadas con LIA</li>
            </ul>
            <p className="text-white/70 text-sm">
              Algunas actividades son <span className="text-red-400">obligatorias</span> para avanzar.
            </p>
          </div>
        ),
        selector: '#tour-tab-activities',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      // 7. Questions Tab
      {
        icon: <HelpCircle className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Preguntas y Discusión',
        content: (
          <p>
            La sección de <strong className="text-white">Preguntas</strong> te permite hacer consultas 
            sobre la lección y ver respuestas de instructores y compañeros.
          </p>
        ),
        selector: '#tour-tab-questions',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },

      // 9. LIA Assistant - Main Highlight
      {
        icon: <Bot className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Conoce a LIA, tu Asistente IA',
        content: (
          <div className="space-y-3">
            <p>
              <strong className="text-[#00D4B3]">LIA</strong> es tu asistente de aprendizaje potenciado por IA:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Resuelve tus dudas sobre el contenido</li>
              <li>Explica conceptos de formas diferentes</li>
              <li>Te guía en actividades de reflexión</li>
              <li>Sugiere recursos adicionales</li>
            </ul>
            <p className="text-white/70 text-sm mt-2">
              ¡Haz clic en el botón para abrir el chat con LIA!
            </p>
          </div>
        ),
        selector: '#tour-lia-course-button',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 50,
      },
      // 10. LIA Panel Features (when open)
      {
        icon: <Sparkles className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Interactúa con LIA',
        content: (
          <div className="space-y-3">
            <p>
              Cuando abras el panel de LIA, podrás:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li><strong className="text-white">Escribir preguntas</strong> en lenguaje natural</li>
              <li><strong className="text-white">Usar el micrófono</strong> para hablar</li>
              <li><strong className="text-white">Ver sugerencias</strong> contextuales</li>
              <li><strong className="text-white">Copiar respuestas</strong> a tus notas</li>
            </ul>
            <p className="text-[#00D4B3] text-sm mt-2">
              LIA recuerda el contexto de tu lección actual.
            </p>
          </div>
        ),
        selector: '#tour-lia-panel',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
      },
      // 11. Wrap Up
      {
        icon: <Sparkles className="w-6 h-6 text-[#00D4B3]" />,
        title: '¡Todo Listo para Aprender!',
        content: (
          <div className="space-y-3">
            <p>
              Ya conoces todas las herramientas. Algunos consejos:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Completa las actividades obligatorias</li>
              <li>Usa LIA cuando tengas dudas</li>
              <li>Toma notas de los conceptos clave</li>
              <li>Revisa los resúmenes antes de avanzar</li>
            </ul>
            <p className="text-white font-semibold mt-3">
              ¡Disfruta tu aprendizaje! 🚀
            </p>
          </div>
        ),
        selector: 'body',
        side: 'center',
        showControls: true,
        showSkip: false,
        pointerPadding: 0,
        pointerRadius: 0,
      },
    ],
  },
];
