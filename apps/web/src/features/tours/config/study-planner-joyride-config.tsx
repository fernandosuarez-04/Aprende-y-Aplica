import { Step } from 'react-joyride';
import React from 'react';

export const studyPlannerJoyrideSteps: Step[] = [
  {
    target: '#lia-planner-header',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">¡Bienvenido al Planificador!</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Aquí comienza tu viaje de aprendizaje personalizado. LIA, tu asistente inteligente, te ayudará a crear un plan de estudios adaptado a tus necesidades.
        </p>
      </div>
    ),
    placement: 'bottom' as const,
    disableBeacon: true,
  },
  {
    target: '#lia-chat-input',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Habla con LIA</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          ¿Tienes dudas o necesitas ajustar tu plan? Puedes chatear con LIA en cualquier momento. ¡Es experta en optimizar tu aprendizaje!
        </p>
      </div>
    ),
    placement: 'top' as const,
  },
  {
    target: '#lia-voice-button',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Modo de Voz</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Si prefieres hablar, activa el micrófono. LIA te escuchará y responderá instantáneamente. Ideal para sesiones de estudio manos libres.
        </p>
      </div>
    ),
    placement: 'top' as const,
  },
  {
    target: '#lia-calendar-button',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">Conecta tu Calendario</h3>
        <p className="text-gray-200 text-sm leading-relaxed">
          Para una planificación perfecta, permite que LIA consulte tu disponibilidad. Así evitará programar sesiones cuando estés ocupado.
        </p>
      </div>
    ),
    placement: 'bottom' as const,
  }
];
