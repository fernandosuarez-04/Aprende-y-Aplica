// Tipos para el sistema de estadísticas de personalización de experiencia

export interface User {
  id: string
  username: string
  profile_picture_url?: string
  email?: string
}

export interface UserProfile {
  id: string
  user_id: string
  cargo_titulo: string
  rol_id: number
  nivel_id: number
  area_id: number
  relacion_id: number
  tamano_id: number
  sector_id: number
  pais: string
  creado_en: string
  actualizado_en: string
  // Relaciones
  users?: User
  roles?: Role
  niveles?: Level
  areas?: Area
  relaciones?: Relationship
  tamanos_empresa?: CompanySize
  sectores?: Sector
}

export interface Role {
  id: number
  slug: string
  nombre: string
  area_id: number
  area?: Area
}

export interface Level {
  id: number
  slug: string
  nombre: string
}

export interface Area {
  id: number
  slug: string
  nombre: string
}

export interface Relationship {
  id: number
  slug: string
  nombre: string
}

export interface CompanySize {
  id: number
  slug: string
  nombre: string
  min_empleados: number
  max_empleados: number
}

export interface Sector {
  id: number
  slug: string
  nombre: string
}

export interface Question {
  id: number
  codigo: string
  section: string
  bloque: string
  area_id: number
  exclusivo_rol_id?: number
  texto: string
  tipo: string
  opciones?: any
  locale: string
  peso: number
  escala?: any
  scoring?: any
  created_at: string
  respuesta_correcta?: string
  // Relaciones
  area?: Area
  exclusivo_rol?: Role
}

export interface Answer {
  id: number
  pregunta_id: number
  valor: any
  respondido_en: string
  user_perfil_id: string
  // Relaciones
  pregunta?: Question
  user_perfil?: UserProfile
}

export interface RoleSynonym {
  id: number
  role_id: number
  alias: string
  // Relaciones
  role?: Role
}

export interface GenAIAdoption {
  id: number
  pais: string
  indice_aipi: number
  fuente: string
  fecha_fuente: string
}

// Tipos para estadísticas agregadas
export interface UserStats {
  totalUsers: number
  usersByRole: Array<{ role: string; count: number }>
  usersByLevel: Array<{ level: string; count: number }>
  usersByArea: Array<{ area: string; count: number }>
  usersBySector: Array<{ sector: string; count: number }>
  usersByCountry: Array<{ country: string; count: number }>
  usersByCompanySize: Array<{ size: string; count: number }>
}

export interface QuestionStats {
  totalQuestions: number
  questionsByArea: Array<{ area: string; count: number }>
  questionsByType: Array<{ type: string; count: number }>
  questionsBySection: Array<{ section: string; count: number }>
}

export interface AnswerStats {
  totalAnswers: number
  answersByQuestion: Array<{ question: string; count: number }>
  answersByUser: Array<{ user: string; count: number }>
  averageAnswersPerUser: number
}

export interface GenAIStats {
  totalRecords: number
  averageAIPIIndex: number
  countriesWithData: number
  topCountries: Array<{ country: string; index: number }>
}

// Tipos para formularios de creación/edición
export interface CreateUserProfileData {
  user_id: string
  cargo_titulo: string
  rol_id: number
  nivel_id: number
  area_id: number
  relacion_id: number
  tamano_id: number
  sector_id: number
  pais: string
}

export interface UpdateUserProfileData {
  cargo_titulo?: string
  rol_id?: number
  nivel_id?: number
  area_id?: number
  relacion_id?: number
  tamano_id?: number
  sector_id?: number
  pais?: string
}

export interface CreateQuestionData {
  codigo: string
  section: string
  bloque: string
  area_id: number
  exclusivo_rol_id?: number
  texto: string
  tipo: string
  opciones?: any
  locale: string
  peso: number
  escala?: any
  scoring?: any
  respuesta_correcta?: string
}

export interface UpdateQuestionData {
  codigo?: string
  section?: string
  bloque?: string
  area_id?: number
  exclusivo_rol_id?: number
  texto?: string
  tipo?: string
  opciones?: any
  locale?: string
  peso?: number
  escala?: any
  scoring?: any
  respuesta_correcta?: string
}

export interface CreateAnswerData {
  pregunta_id: number
  valor: any
  user_perfil_id: string
}

export interface UpdateAnswerData {
  valor?: any
}

export interface CreateGenAIAdoptionData {
  pais: string
  indice_aipi: number
  fuente: string
  fecha_fuente: string
}

export interface UpdateGenAIAdoptionData {
  pais?: string
  indice_aipi?: number
  fuente?: string
  fecha_fuente?: string
}
