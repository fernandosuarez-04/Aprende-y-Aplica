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

export const COURSE_LEARN_TOUR_ID = 'course-learn-tour';

// Helper component for content styling - Adaptado para light/dark mode
const TourContent = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
    {children}
  </div>
);

const Highlight = ({ children, color = 'default' }: { children: React.ReactNode, color?: string }) => (
  <strong className={color === 'default' ? 'text-gray-900 dark:text-white' : 'text-[#00D4B3]'}>
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
    title: 'Bienvenido a tu Experiencia',
    disableBeacon: true,
    data: {
      icon: <Layout className="w-5 h-5 text-[#00D4B3]" />
    }
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
        <ul className="space-y-2 list-disc pl-4 text-gray-700 dark:text-white/90">
          <li>Todos los módulos organizados</li>
          <li>Lecciones con su duración</li>
          <li>Tu progreso de avance</li>
          <li>Actividades y materiales de cada lección</li>
        </ul>
      </TourContent>
    ),
    title: 'Temario del Curso',
    disableBeacon: true,
    spotlightPadding: 0,
    data: {
      icon: <Layers className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  // 3. All Tabs Container - Un solo paso para todas las pestañas
  {
    target: '#tour-tabs-container',
    placement: 'bottom',
    content: (
      <TourContent>
        <p className="mb-3">
          Estas pestañas te dan acceso a diferentes tipos de contenido:
        </p>
        <ul className="space-y-2 text-gray-700 dark:text-white/90">
          <li className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-[#00D4B3] shrink-0" />
            <span><Highlight>Video</Highlight> - Contenido principal de la lección</span>
          </li>
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00D4B3] shrink-0" />
            <span><Highlight>Transcripción</Highlight> - Lee y busca en el texto</span>
          </li>
          <li className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00D4B3] shrink-0" />
            <span><Highlight>Resumen</Highlight> - Puntos clave condensados</span>
          </li>
          <li className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-[#00D4B3] shrink-0" />
            <span><Highlight>Actividades</Highlight> - Ejercicios y quizzes</span>
          </li>
          <li className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#00D4B3] shrink-0" />
            <span><Highlight>Preguntas</Highlight> - Consultas y discusión</span>
          </li>
        </ul>
      </TourContent>
    ),
    title: 'Pestañas de Contenido',
    disableBeacon: true,
    spotlightPadding: 8,
    data: {
      icon: <Layers className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  // 4. LIA Assistant
  {
    target: '#tour-lia-course-button',
    placement: 'top',
    content: (
      <TourContent>
        <p>
          <Highlight color="accent">LIA</Highlight> es tu asistente IA. Resuelve dudas,
          explica conceptos y te guía en reflexiones.
        </p>
        <p className="text-gray-600 dark:text-white/70 text-xs mt-2">
          ¡Haz clic para abrir el chat!
        </p>
      </TourContent>
    ),
    title: 'Conoce a LIA',
    disableBeacon: true,
    data: {
      liaAction: 'open',
      icon: <Bot className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  // 5. LIA Panel Features (This step assumes panel is OPEN)
  {
    target: '#tour-lia-panel',
    placement: 'left',
    content: (
      <TourContent>
        <p>
          Cuando abras el panel de LIA, podrás:
        </p>
        <ul className="space-y-2 list-disc pl-4 text-gray-700 dark:text-white/90">
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
    title: 'Interactúa con LIA',
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  // 6. Wrap Up
  {
    target: 'body',
    placement: 'center',
    content: (
      <TourContent>
        <p>
          Ya conoces todas las herramientas. Algunos consejos:
        </p>
        <ul className="space-y-2 list-disc pl-4 text-gray-700 dark:text-white/90">
          <li>Completa las actividades obligatorias</li>
          <li>Usa LIA cuando tengas dudas</li>
          <li>Toma notas de los conceptos clave</li>
          <li>Revisa los resúmenes antes de avanzar</li>
        </ul>
        <p className="text-gray-900 dark:text-white font-semibold mt-3">
          ¡Disfruta tu aprendizaje! 🚀
        </p>
      </TourContent>
    ),
    title: '¡Todo Listo!',
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-[#00D4B3]" />
    }
  },
];
