import React from 'react';
import { Step } from 'nextstepjs';
import { Layout, Users, BarChart2, Zap, Clock, ShieldCheck, Menu, Bot } from 'lucide-react';

// Tour ID for the Business Panel (Manager/Admin View)
export const BUSINESS_PANEL_TOUR_ID = 'business-panel-tour';

export const businessPanelTourSteps: Step[] = [
  {
    tour: BUSINESS_PANEL_TOUR_ID,
    steps: [
      {
        icon: <Layout className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Panel de Gestión Empresarial',
        content: (
          <p>
            Bienvenido a tu centro de comando. Desde aquí podrás gestionar toda tu <strong className="text-white">organización</strong>, supervisar el progreso de los usuarios y administrar el contenido educativo.
          </p>
        ),
        selector: '#tour-hero-section',
        side: 'center', // Usar center para garantizar visibilidad en todas las pantallas
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 24,
      },
      {
        icon: <Menu className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Navegación Principal',
        content: (
          <p>
            En este menú encontrarás todas las herramientas necesarias: gestión de usuarios, creación de cursos, reportes detallados y configuración de equipos.
          </p>
        ),
        selector: '#tour-sidebar-nav',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
      },
      {
        icon: <BarChart2 className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Métricas de Impacto',
        content: (
          <p>
            Visualiza en tiempo real el rendimiento de tu equipo. Monitoriza usuarios activos, cursos completados y el niivel de <strong>engagement</strong> general de la organización.
          </p>
        ),
        selector: '#tour-stats-section',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
        viewportID: 'main-scroll-container',
      },
      {
        icon: <Clock className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Actividad Reciente',
        content: (
          <p>
            Mantente al tanto de lo último que ocurre. Aquí verás quién ha completado un curso, obtenido un certificado o iniciado sesión recientemente.
          </p>
        ),
        selector: '#tour-activity-card',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
        viewportID: 'main-scroll-container',
      },
      {
        icon: <Zap className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Acciones Rápidas',
        content: (
          <div className="space-y-3">
            <p>Accesos directos para las tareas más frecuentes:</p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Gestionar usuarios</li>
              <li>Asignar cursos</li>
              <li>Ver reportes detallados</li>
              <li>Configuraciones del sistema</li>
            </ul>
          </div>
        ),
        selector: '#tour-quick-actions-list',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 30,
        pointerRadius: 15,
        viewportID: 'main-scroll-container',
      },
      {
        icon: <Bot className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Asistente LIA',
        content: (
          <div className="space-y-3">
            <p>
              Tu asistente inteligente siempre está disponible. LIA puede ayudarte a:
            </p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Resolver dudas sobre la plataforma</li>
              <li>Generar ideas para planes de carrera</li>
              <li>Sugerir cursos basados en roles</li>
            </ul>
          </div>
        ),
        selector: '#tour-lia-button',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 50,
      },
      {
        icon: <ShieldCheck className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Todo Listo',
        content: (
          <p>
            Ya conoces lo básico. Explora las secciones del menú lateral para profundizar en cada área. ¡Empieza a potenciar el aprendizaje de tu equipo!
          </p>
        ),
        selector: 'body', // Fallback center
        side: 'center',
        showControls: true,
        showSkip: false,
        pointerPadding: 0,
        pointerRadius: 0,
      },
    ],
  },
];
