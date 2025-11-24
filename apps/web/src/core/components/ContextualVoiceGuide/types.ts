export interface VoiceGuideStep {
  id: number;
  title: string;
  description: string;
  speech: string;
  action?: {
    label: string;
    path: string;
  };
}

export interface ContextualVoiceGuideProps {
  /** Identificador único para este tour (ej: 'prompt-directory', 'workshops') */
  tourId: string;
  
  /** Pasos del tour con títulos, descripciones y textos de voz */
  steps: VoiceGuideStep[];
  
  /** Rutas donde el tour debe aparecer automáticamente (ej: ['/prompt-directory']) */
  triggerPaths: string[];
  
  /** Si true, se puede reproducir múltiples veces. Si false, solo la primera vez */
  isReplayable?: boolean;
  
  /** Delay antes de mostrar el tour (ms). Default: 1000 */
  showDelay?: number;
  
  /** Título del botón de ayuda/replay. Default: "Ver tour guiado" */
  replayButtonLabel?: string;
  
  /** Si el tour debe mostrarse solo cuando el usuario está autenticado */
  requireAuth?: boolean;
}
