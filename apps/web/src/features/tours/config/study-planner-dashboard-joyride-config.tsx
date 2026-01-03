import { Step } from 'react-joyride';
import React from 'react';

export const studyPlannerDashboardJoyrideSteps: Step[] = [
  {
    target: '#dashboard-calendar-container',
    title: 'Tu Calendario de Estudios',
    content: (
      <p>
        Aquí puedes visualizar todas tus sesiones de estudio programadas. Haz clic en un evento para ver detalles o reprogramarlo.
      </p>
    ),
    placement: 'right' as const,
    disableBeacon: true,
  },
  {
    target: '#dashboard-connect-calendar-button',
    title: 'Sincronización',
    content: (
      <p>
        Conecta tu calendario de Google o Microsoft para que LIA pueda organizar tus estudios respetando tu agenda personal.
      </p>
    ),
    placement: 'bottom-start' as const,
  },
  {
    target: '#dashboard-new-plan-button',
    title: 'Nuevo Plan',
    content: (
      <p>
         ¿Necesitas empezar de cero? Crea un nuevo plan de estudios en cualquier momento.
      </p>
    ),
    placement: 'bottom' as const,
  },
  {
    target: '#dashboard-settings-button',
    title: 'Ajustes Rápidos',
    content: (
      <p>
        Accede a configuraciones rápidas como filtrar eventos o cambiar preferencias de visualización.
      </p>
    ),
    placement: 'bottom' as const,
  },
  {
    target: '#dashboard-lia-panel',
    title: 'LIA Coach',
    content: (
      <p>
        Tu asistente personal siempre está aquí. Pídele reprogramar sesiones, consejos de estudio o que analice tu progreso.
      </p>
    ),
    placement: 'left' as const,
  }
];
