import { Step } from 'react-joyride';
import React from 'react';
import { Sparkles, MessageCircle, Mic, Calendar } from 'lucide-react';

export const studyPlannerJoyrideSteps: Step[] = [
  {
    target: '#lia-planner-header',
    title: '¡Bienvenido al Planificador!',
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
          Aquí comienza tu viaje de aprendizaje personalizado. LIA, tu asistente inteligente, te ayudará a crear un plan de estudios adaptado a tus necesidades.
        </p>
      </div>
    ),
    placement: 'bottom' as const,
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#lia-chat-input',
    title: 'Habla con LIA',
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
          ¿Tienes dudas o necesitas ajustar tu plan? Puedes chatear con LIA en cualquier momento. ¡Es experta en optimizar tu aprendizaje!
        </p>
      </div>
    ),
    placement: 'top' as const,
    data: {
      icon: <MessageCircle className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#lia-voice-button',
    title: 'Modo de Voz',
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
          Si prefieres hablar, activa el micrófono. LIA te escuchará y responderá instantáneamente. Ideal para sesiones de estudio manos libres.
        </p>
      </div>
    ),
    placement: 'top' as const,
    data: {
      icon: <Mic className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#lia-calendar-button',
    title: 'Conecta tu Calendario',
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
          Para una planificación perfecta, permite que LIA consulte tu disponibilidad. Así evitará programar sesiones cuando estés ocupado.
        </p>
      </div>
    ),
    placement: 'bottom' as const,
    data: {
      icon: <Calendar className="w-5 h-5 text-[#00D4B3]" />
    }
  }
];
