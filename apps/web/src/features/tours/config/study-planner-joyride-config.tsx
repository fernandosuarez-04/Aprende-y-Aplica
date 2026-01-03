import { Step } from 'react-joyride';
import React from 'react';

export const studyPlannerJoyrideSteps: Step[] = [
  {
    target: '#lia-planner-header',
    title: '¡Bienvenido al Planificador!',
    content: (
      <p>
        Aquí comienza tu viaje de aprendizaje personalizado. LIA, tu asistente inteligente, te ayudará a crear un plan de estudios adaptado a tus necesidades.
      </p>
    ),
    placement: 'bottom' as const,
    disableBeacon: true,
  },
  {
    target: '#lia-chat-input',
    title: 'Habla con LIA',
    content: (
      <p>
        ¿Tienes dudas o necesitas ajustar tu plan? Puedes chatear con LIA en cualquier momento. ¡Es experta en optimizar tu aprendizaje!
      </p>
    ),
    placement: 'top' as const,
  },
  {
    target: '#lia-voice-button',
    title: 'Modo de Voz',
    content: (
      <p>
        Si prefieres hablar, activa el micrófono. LIA te escuchará y responderá instantáneamente. Ideal para sesiones de estudio manos libres.
      </p>
    ),
    placement: 'top' as const,
  },
  {
    target: '#lia-calendar-button',
    title: 'Conecta tu Calendario',
    content: (
      <p>
        Para una planificación perfecta, permite que LIA consulte tu disponibilidad. Así evitará programar sesiones cuando estés ocupado.
      </p>
    ),
    placement: 'bottom' as const,
  }
];
