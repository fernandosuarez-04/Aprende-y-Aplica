/**
 * Cliente wrapper para session-recorder
 * Carga dinámicamente el módulo solo en el cliente
 */

// Definir el tipo localmente para evitar imports de rrweb en el servidor
export interface RecordingSession {
  events: any[];
  startTime: number;
  endTime?: number;
}

let sessionRecorderInstance: any = null;

/**
 * Obtiene la instancia del session recorder (lazy loading)
 */
async function getSessionRecorder() {
  if (typeof window === 'undefined') {
    throw new Error('session-recorder solo funciona en el navegador');
  }

  if (!sessionRecorderInstance) {
    const module = await import('./session-recorder');
    sessionRecorderInstance = module.sessionRecorder;
  }

  return sessionRecorderInstance;
}

/**
 * API pública que carga el recorder dinámicamente
 */
export const sessionRecorderClient = {
  async startRecording(maxDuration?: number): Promise<void> {
    const recorder = await getSessionRecorder();
    return recorder.startRecording(maxDuration);
  },

  async stop(): Promise<RecordingSession | null> {
    if (typeof window === 'undefined') return null;
    if (!sessionRecorderInstance) return null;
    return sessionRecorderInstance.stop();
  },

  async captureSnapshot(): Promise<RecordingSession | null> {
    if (typeof window === 'undefined') return null;
    if (!sessionRecorderInstance) return null;
    return sessionRecorderInstance.captureSnapshot();
  },

  async getCurrentSession(): Promise<RecordingSession | null> {
    if (typeof window === 'undefined') return null;
    if (!sessionRecorderInstance) return null;
    return sessionRecorderInstance.getCurrentSession();
  },

  isActive(): boolean {
    if (typeof window === 'undefined') return false;
    if (!sessionRecorderInstance) return false;
    return sessionRecorderInstance.isActive();
  },

  exportSession(session: RecordingSession): string {
    return JSON.stringify(session);
  },

  exportSessionBase64(session: RecordingSession): string {
    const json = JSON.stringify(session);

    if (typeof window !== 'undefined') {
      const encoder = new TextEncoder();
      const data = encoder.encode(json);
      const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString);
    }

    return '';
  },

  getSessionSizeFormatted(session: RecordingSession): string {
    const json = JSON.stringify(session);
    const bytes = new Blob([json]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
};
