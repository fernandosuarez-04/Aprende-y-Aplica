import React from 'react';
import { Step } from 'react-joyride';
import { 
  PlayCircle, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  ListChecks, 
  Bot,
  Layers,
  Layout
} from 'lucide-react';
import { JoyrideTooltip } from '../components/JoyrideTooltip';

export const COURSE_LEARN_TOUR_ID = 'course-learn-tour';

// Helper component for content styling
const TourContent = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-3 text-sm text-gray-200">
    {children}
  </div>
);

const Highlight = ({ children, color = 'white' }: { children: React.ReactNode, color?: string }) => (
  <strong className={color === 'white' ? 'text-white' : 'text-[#00D4B3]'}>
    {children}
  </strong>
);

export const courseLearnJoyrideSteps: Step[] = [
  // 1. Welcome / Overview
  {
    target: 'body',
    placement: 'center',
    content: (
      <TourContent>
        <p>
          Este es tu espacio de aprendizaje personalizado. Aquí encontrarás todas las herramientas 
          para <Highlight>dominar el contenido</Highlight> del curso de manera efectiva.
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <Layout className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Bienvenido a tu Experiencia</span>
      </div>
    ),
    disableBeacon: true,
  },
  // 2. Course Content Panel (Sidebar)
  {
    target: '#tour-course-sidebar',
    placement: 'right',
    content: (
      <TourContent>
        <p>
          En el panel izquierdo encontrarás el <Highlight>temario completo</Highlight>:
        </p>
        <ul className="space-y-2 list-disc pl-4 text-white/90">
          <li>Todos los módulos organizados</li>
          <li>Lecciones con su duración</li>
          <li>Tu progreso de avance</li>
          <li>Actividades y materiales de cada lección</li>
        </ul>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Temario del Curso</span>
      </div>
    ),
    disableBeacon: true,
    spotlightPadding: 0,
  },
  // 3. Video Tab
  {
    target: '#tour-tab-video',
    placement: 'bottom',
    content: (
      <TourContent>
        <p>
          La pestaña <Highlight>Video</Highlight> muestra el contenido principal 
          de cada lección. Puedes navegar entre lecciones con los controles del reproductor.
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Contenido en Video</span>
      </div>
    ),
    disableBeacon: true,
    data: { tabId: 'tour-tab-video' }
  },
  // 4. Transcription Tab
  {
    target: '#tour-tab-transcript',
    placement: 'bottom',
    content: (
      <TourContent>
        <div className="space-y-3">
          <p>
            La <Highlight>Transcripción</Highlight> te permite:
          </p>
          <ul className="space-y-2 list-disc pl-4 text-white/90">
            <li>Leer todo lo que se dice en el video</li>
            <li>Buscar palabras clave específicas</li>
            <li>Copiar secciones para tus notas</li>
            <li>Seguir el video mientras lees</li>
          </ul>
        </div>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Transcripción Interactiva</span>
      </div>
    ),
    disableBeacon: true,
    data: { tabId: 'tour-tab-transcript' }
  },
  // 5. Summary Tab
  {
    target: '#tour-tab-summary',
    placement: 'bottom',
    content: (
      <TourContent>
        <p>
          El <Highlight>Resumen</Highlight> condensa los puntos clave de la lección 
          en un formato fácil de revisar. Perfecto para repasos rápidos antes de exámenes.
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Resumen de la Lección</span>
      </div>
    ),
    disableBeacon: true,
    data: { tabId: 'tour-tab-summary' }
  },
  // 6. Activities Tab
  {
    target: '#tour-tab-activities',
    placement: 'bottom',
    content: (
      <TourContent>
        <p>
          En <Highlight>Actividades</Highlight> encontrarás:
        </p>
        <ul className="space-y-2 list-disc pl-4 text-white/90">
          <li>Ejercicios para practicar lo aprendido</li>
          <li>Quizzes para evaluar tu comprensión</li>
          <li>Reflexiones guiadas con LIA</li>
        </ul>
        <p className="text-white/70 text-sm">
          Algunas actividades son <span className="text-red-400">obligatorias</span> para avanzar.
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <ListChecks className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Actividades Prácticas</span>
      </div>
    ),
    disableBeacon: true,
    data: { tabId: 'tour-tab-activities' }
  },
  // 7. Questions Tab
  {
    target: '#tour-tab-questions',
    placement: 'bottom',
    content: (
      <TourContent>
        <p>
          La sección de <Highlight>Preguntas</Highlight> te permite hacer consultas 
          sobre la lección y ver respuestas de instructores y compañeros.
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Preguntas y Discusión</span>
      </div>
    ),
    disableBeacon: true,
    data: { tabId: 'tour-tab-questions' }
  },
  // 8. LIA Assistant
  {
    target: '#tour-lia-course-button',
    placement: 'top',
    content: (
      <TourContent>
        <p>
          <Highlight color="green">LIA</Highlight> es tu asistente IA. Resuelve dudas, 
          explica conceptos y te guía en reflexiones.
        </p>
        <p className="text-white/70 text-xs mt-2">
          ¡Haz clic para abrir el chat!
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Conoce a LIA</span>
      </div>
    ),
    disableBeacon: true,
    data: { liaAction: 'open' }
  },
  // 9. LIA Panel Features (This step assumes panel is OPEN)
  {
    target: '#tour-lia-panel',
    placement: 'left',
    content: (
      <TourContent>
        <p>
          Cuando abras el panel de LIA, podrás:
        </p>
        <ul className="space-y-2 list-disc pl-4 text-white/90">
          <li><Highlight>Escribir preguntas</Highlight> en lenguaje natural</li>
          <li><Highlight>Usar el micrófono</Highlight> para hablar</li>
          <li><Highlight>Ver sugerencias</Highlight> contextuales</li>
          <li><Highlight>Copiar respuestas</Highlight> a tus notas</li>
        </ul>
        <p className="text-[#00D4B3] text-sm mt-2">
          LIA recuerda el contexto de tu lección actual.
        </p>
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">Interactúa con LIA</span>
      </div>
    ),
    disableBeacon: true,
  },
  // 10. Wrap Up
  {
    target: 'body',
    placement: 'center',
    content: (
      <TourContent>
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
      </TourContent>
    ),
    title: (
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#00D4B3]" />
        <span className="text-white font-bold">¡Todo Listo!</span>
      </div>
    ),
    disableBeacon: true,
  },
];

