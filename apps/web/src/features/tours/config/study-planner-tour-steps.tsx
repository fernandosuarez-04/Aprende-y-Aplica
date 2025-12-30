
import { Step } from "nextstepjs";
import { 
  MessageSquare, 
  Mic, 
  Calendar, 
  BookOpen, 
  Zap,
  Target
} from "lucide-react";
import React from 'react';

export const studyPlannerTourSteps: { tour: string; steps: Step[] }[] = [
  {
    tour: "study-planner-tour",
    steps: [
      {
        icon: <BookOpen className="w-6 h-6 text-[#00D4B3]" />,
        title: '¡Bienvenido al Planificador!',
        content: (
          <div className="space-y-2">
            <p>
              Aquí comienza tu viaje de aprendizaje personalizado. LIA, tu asistente inteligente, te ayudará a crear un plan de estudios adaptado a tus necesidades.
            </p>
          </div>
        ),
        selector: '#lia-planner-header',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 16,
        pointerRadius: 10,
      },
      {
        icon: <MessageSquare className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Habla con LIA',
        content: (
          <div className="space-y-2">
            <p>
              ¿Tienes dudas o necesitas ajustar tu plan? Puedes chatear con LIA en cualquier momento. ¡Es experta en optimizar tu aprendizaje!
            </p>
          </div>
        ),
        selector: '#lia-chat-input',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <Mic className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Modo de Voz',
        content: (
          <div className="space-y-2">
            <p>
              Si prefieres hablar, activa el micrófono. LIA te escuchará y responderá instantáneamente. Ideal para sesiones de estudio manos libres.
            </p>
          </div>
        ),
        selector: '#lia-voice-button',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 5,
        pointerRadius: 50,
      },
      {
        icon: <Calendar className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Conecta tu Calendario',
        content: (
          <div className="space-y-2">
            <p>
              Para una planificación perfecta, permite que LIA consulte tu disponibilidad. Así evitará programar sesiones cuando estés ocupado.
            </p>
          </div>
        ),
        selector: '#lia-calendar-button',
        side: 'bottom-right',
        showControls: true,
        showSkip: true,
        pointerPadding: 5,
        pointerRadius: 10,
        nextRoute: '/study-planner/create', // Mantenerse en la misma pagina
      }
    ],
  },
];
