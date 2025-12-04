import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../lib/nanobana/templates';

// Tipos compartidos para LIA
export interface CourseLessonContext {
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  courseDescription?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  transcriptContent?: string;
  summaryContent?: string;
  videoTime?: number;
  durationSeconds?: number;
  userRole?: string;
  difficultyDetected?: {
    patterns: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    overallScore: number;
    shouldIntervene: boolean;
  };
}

// Interfaz para NanoBanana generado
export interface GeneratedNanoBananaData {
  schema: NanoBananaSchema;
  jsonString: string;
  domain: NanoBananaDomain;
  outputFormat: OutputFormat;
}

export interface LiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // 🎨 Datos de NanoBanana generado (opcional)
  generatedNanoBanana?: GeneratedNanoBananaData;
}

