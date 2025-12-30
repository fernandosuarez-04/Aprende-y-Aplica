import React from 'react';
import { Step } from 'nextstepjs';
import { Layout, BarChart2, BookOpen, Award, User, Bot, Rocket } from 'lucide-react';

// Pasos del tour para el Dashboard de Business User
export const DASHBOARD_TOUR_ID = 'business-dashboard';

export const dashboardTourSteps: Step[] = [
  {
    tour: DASHBOARD_TOUR_ID,
    steps: [
      {
        icon: <Layout className="w-6 h-6 text-[#00D4B3]" />,
        title: '¡Bienvenido a tu Espacio de Aprendizaje!',
        content: (
          <p>
            Este es tu centro personal de desarrollo. Desde aquí podrás visualizar tu <strong className="text-white">progreso</strong>, continuar tus cursos y alcanzar tus <strong className="text-white">metas profesionales</strong>.
          </p>
        ),
        selector: '#tour-hero-section',
        side: 'center',
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 24,
      },
      {
        icon: <BarChart2 className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Estadísticas Generales',
        content: (
          <p>
            Aquí tienes una vista rápida de tu actividad. Revisa tus <strong className="text-white">cursos asignados</strong>, el estado de tu <strong className="text-white">progreso</strong> y los <strong className="text-white">certificados</strong> que has ganado.
          </p>
        ),
        selector: '#tour-stats-section',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
        // Evitar que nextstepjs intente hacer scroll automáticamente si ya lo manejamos o si causa problemas
        viewportID: 'main-scroll-container'
      },
      {
        icon: <BookOpen className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Tus Cursos',
        content: (
          <p>
            Consulta los cursos asignados y su estado actual. Mantén un seguimiento detallado de la formación.
          </p>
        ),
        selector: '#tour-stat-courses',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
      },
      {
        icon: <Award className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Tus Certificados',
        content: (
          <p>
            Visualiza los certificados obtenidos y el <strong className="text-white">crecimiento profesional</strong> de tu equipo.
          </p>
        ),
        selector: '#tour-stat-certificates',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
      },
      {
        icon: <User className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Menú de Usuario',
        content: (
          <div className="space-y-3">
            <p>En este menú encontrarás herramientas vitales:</p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>
                <strong className="text-white">Planificador de Estudios</strong>: Crea y gestiona tu ruta de aprendizaje.
              </li>
              <li>
                <strong className="text-white">Editar Perfil</strong>: Actualiza tu información personal.
              </li>
              <li>
                <strong className="text-white">Idioma</strong>: Cambia el lenguaje de la plataforma según tu preferencia.
              </li>
            </ul>
          </div>
        ),
        selector: '#tour-user-dropdown-trigger',
        side: 'bottom-right',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 15,
      },
      {
        icon: <Bot className="w-6 h-6 text-[#00D4B3]" />,
        title: '¡Tu Asistente LIA!',
        content: (
          <div className="space-y-3">
            <p className="font-medium text-[#00D4B3]">
              LIA es lo más importante de tu experiencia.
            </p>
            <p>Tu Learning Intelligence Assistant está aquí 24/7 para:</p>
            <ul className="space-y-2 list-disc pl-4 text-white/90">
              <li>Resolver cualquier duda sobre cursos o la plataforma.</li>
              <li>Ayudarte a analizar tu progreso.</li>
              <li>Reportar errores o dar feedback.</li>
            </ul>
            <p className="font-medium text-white">¡Habla con ella cuando lo necesites!</p>
          </div>
        ),
        selector: '#tour-lia-button',
        side: 'top-right',
        showControls: true,
        showSkip: true,
        pointerPadding: 15,
        pointerRadius: 50,
      },
      {
        icon: <Rocket className="w-6 h-6 text-[#00D4B3]" />,
        title: '¡Hora de Planificar!',
        content: (
          <p>
            Para comenzar con el pie derecho, vamos a dirigirte al <strong className="text-white">Planificador de Estudios</strong> para crear tu primer plan personalizado. ¡Vamos allá!
          </p>
        ),
        selector: '#tour-hero-section',
        side: 'bottom',
        showControls: true,
        showSkip: false,
        pointerPadding: 10,
        pointerRadius: 15,
        nextRoute: '/study-planner/create'
      },
    ],
  },
];

// Configuración de estilos del tour (tema oscuro)
export const tourCardStyles = {
  backgroundColor: '#1E2329',
  color: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(0, 212, 179, 0.2)',
};

export const tourButtonStyles = {
  primary: {
    backgroundColor: '#00D4B3',
    color: '#0A2540',
    borderRadius: '8px',
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '#9CA3AF',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
  },
};
