// Tipos compartidos para LIA
export interface CourseLessonContext {
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
}

export interface LiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

