// Tipos de Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  fingerprint?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// Tipos de Curso (según PRD)
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  status: CourseStatus;
  estimatedDuration: number; // en minutos
  difficulty: CourseDifficulty;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  modules: Module[];
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Tipos de Módulo
export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  isUnlocked: boolean;
  videos: Video[];
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de Video
export interface Video {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  url: string;
  duration: number; // en segundos
  order: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de Progreso
export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  percentage: number;
  completedModules: number;
  totalModules: number;
  lastWatchedVideoId?: string;
  startedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface ModuleProgress {
  id: string;
  userId: string;
  moduleId: string;
  percentage: number;
  isCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface VideoProgress {
  id: string;
  userId: string;
  videoId: string;
  watchedPercentage: number;
  isWatched: boolean; // 90%+ watched
  lastWatchedAt: Date;
  updatedAt: Date;
}

// Tipos de Comunidad
export interface CommunityQuestion {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  votesCount: number;
  answersCount: number;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  answers?: CommunityAnswer[];
}

export interface CommunityAnswer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  votesCount: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Vote {
  id: string;
  userId: string;
  targetType: 'question' | 'answer';
  targetId: string;
  voteType: 'up' | 'down';
  createdAt: Date;
}

// Tipos de Chat LIA
export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  courseContext?: string;
  moduleContext?: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de Evaluaciones
export interface Evaluation {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  questions: EvaluationQuestion[];
  passingScore: number; // Porcentaje mínimo para aprobar
  timeLimit?: number; // en minutos
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationQuestion {
  id: string;
  evaluationId: string;
  type: 'multiple_choice' | 'text';
  question: string;
  options?: string[]; // Para múltiple opción
  correctAnswer?: string;
  explanation?: string;
  order: number;
}

export interface EvaluationAttempt {
  id: string;
  userId: string;
  evaluationId: string;
  answers: EvaluationAnswer[];
  score: number;
  isPassed: boolean;
  completedAt: Date;
  createdAt: Date;
}

export interface EvaluationAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

// Tipos de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    statusCode?: number;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  fingerprint?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Tipos de Estado de UI
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos de Notificaciones
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// Tipos de Sesiones Zoom
export interface ZoomSession {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  duration: number; // en minutos
  joinUrl: string;
  meetingId: string;
  password?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enums adicionales
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum VoteType {
  UP = 'up',
  DOWN = 'down',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text',
}

// Tipos de Contenido para Landing Page
export * from './content';

// Tipos de Planificador de Estudio
export * from './study-planner';
