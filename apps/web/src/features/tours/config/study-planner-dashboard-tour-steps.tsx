
import { Step } from "nextstepjs";
import { 
  Calendar, 
  Settings, 
  MessageSquare, 
  Link,
  Plus,
  Trash2
} from "lucide-react";
import React from 'react';

export const studyPlannerDashboardTourSteps: { tour: string; steps: Step[] }[] = [
  {
    tour: "study-planner-dashboard-tour",
    steps: [
      {
        icon: <Calendar className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Tu Calendario de Estudios',
        content: (
          <div className="space-y-2">
            <p>
              Aquí puedes visualizar todas tus sesiones de estudio programadas. Haz clic en un evento para ver detalles o reprogramarlo.
            </p>
          </div>
        ),
        selector: '#dashboard-calendar-container',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 16,
        pointerRadius: 10,
      },
      {
        icon: <Link className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Sincronización',
        content: (
          <div className="space-y-2">
            <p>
              Conecta tu calendario de Google o Microsoft para que LIA pueda organizar tus estudios respetando tu agenda personal.
            </p>
          </div>
        ),
        selector: '#dashboard-connect-calendar-button',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 10,
      },
      {
        icon: <Plus className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Nuevo Plan',
        content: (
          <div className="space-y-2">
            <p>
              ¿Necesitas empezar de cero? Crea un nuevo plan de estudios en cualquier momento.
            </p>
          </div>
        ),
        selector: '#dashboard-new-plan-button',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 10,
      },
      {
        icon: <Settings className="w-6 h-6 text-[#00D4B3]" />,
        title: 'Ajustes Rápidos',
        content: (
          <div className="space-y-2">
            <p>
              Accede a configuraciones rápidas como filtrar eventos o cambiar preferencias de visualización.
            </p>
          </div>
        ),
        selector: '#dashboard-settings-button',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 10,
      },
      {
        icon: <MessageSquare className="w-6 h-6 text-[#00D4B3]" />,
        title: 'LIA Coach',
        content: (
          <div className="space-y-2">
            <p>
              Tu asistente personal siempre está aquí. Pídele reprogramar sesiones, consejos de estudio o que analice tu progreso.
            </p>
          </div>
        ),
        selector: '#dashboard-lia-panel',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 30,
      }
    ],
  },
];
