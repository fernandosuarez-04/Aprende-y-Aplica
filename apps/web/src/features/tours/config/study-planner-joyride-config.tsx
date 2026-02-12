import { Step } from 'react-joyride';
import React from 'react';
import { Sparkles, MessageCircle, Mic, Calendar } from 'lucide-react';

export const studyPlannerJoyrideSteps: Step[] = [
  {
    target: '#SofLIA-planner-header',
    title: '¡Bienvenido al Planificador!',
    content: (
      <p>
        Aquí comienza tu viaje de aprendizaje personalizado. SofLIA, tu asistente inteligente, te ayudará a crear un plan de estudios adaptado a tus necesidades.
      </p>
    ),
    placement: 'bottom' as const,
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#SofLIA-chat-input',
    title: 'Habla con SofLIA',
    content: (
      <p>
        ¿Tienes dudas o necesitas ajustar tu plan? Puedes chatear con SofLIA en cualquier momento. ¡Es experta en optimizar tu aprendizaje!
      </p>
    ),
    placement: 'top' as const,
    data: {
      icon: <MessageCircle className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#SofLIA-voice-button',
    title: 'Modo de Voz',
    content: (
      <p>
        Si prefieres hablar, activa el micrófono. SofLIA te escuchará y responderá instantáneamente. Ideal para sesiones de estudio manos libres.
      </p>
    ),
    placement: 'top' as const,
    data: {
      icon: <Mic className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#SofLIA-calendar-button',
    title: 'Conecta tu Calendario',
    content: (
      <p>
        Para una planificación perfecta, permite que SofLIA consulte tu disponibilidad. Así evitará programar sesiones cuando estés ocupado.
      </p>
    ),
    placement: 'bottom' as const,
    data: {
      icon: <Calendar className="w-5 h-5 text-[#00D4B3]" />
    }
  }
];
