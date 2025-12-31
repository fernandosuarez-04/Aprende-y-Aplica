import { Step } from 'react-joyride';
import React from 'react';

export const studyPlannerDashboardJoyrideSteps: Step[] = [
  {
    target: '#dashboard-calendar-container',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Tu Calendario de Estudios</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Aquí puedes visualizar todas tus sesiones de estudio programadas. Haz clic en un evento para ver detalles o reprogramarlo.
        </p>
      </div>
    ),
    placement: 'right' as const,
    disableBeacon: true,
  },
  {
    target: '#dashboard-connect-calendar-button',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Sincronización</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Conecta tu calendario de Google o Microsoft para que LIA pueda organizar tus estudios respetando tu agenda personal.
        </p>
      </div>
    ),
    placement: 'bottom-start' as const,
  },
  {
    target: '#dashboard-new-plan-button',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Nuevo Plan</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
         ¿Necesitas empezar de cero? Crea un nuevo plan de estudios en cualquier momento.
        </p>
      </div>
    ),
    placement: 'bottom' as const,
  },
  {
    target: '#dashboard-settings-button',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Ajustes Rápidos</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Accede a configuraciones rápidas como filtrar eventos o cambiar preferencias de visualización.
        </p>
      </div>
    ),
    placement: 'bottom' as const,
  },
  {
    target: '#dashboard-lia-panel',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">LIA Coach</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Tu asistente personal siempre está aquí. Pídele reprogramar sesiones, consejos de estudio o que analice tu progreso.
        </p>
      </div>
    ),
    placement: 'left' as const,
  }
];
