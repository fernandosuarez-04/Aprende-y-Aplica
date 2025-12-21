/**
 * UserContextService
 * 
 * Servicio para obtener y analizar el contexto completo del usuario
 * incluyendo tipo (B2B/B2C), perfil profesional, organización,
 * cursos asignados/adquiridos y preferencias de estudio.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  UserType,
  UserContext,
  UserBasicInfo,
  UserProfessionalProfile,
  OrganizationInfo,
  WorkTeam,
  CourseAssignment,
  StudyPreferences,
  CalendarIntegration,
  B2BCourseAssignment,
  B2CCoursePurchase,
  TeamCourseAssignment,
  CourseInfo,
  LearningRoute,
} from '../types/user-context.types';

export class UserContextService {
  /**
   * Determina si el usuario es B2B o B2C basado en organization_id
   */
  static async getUserType(userId: string): Promise<UserType> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo tipo de usuario:', error);
        // En caso de error, default a B2C en lugar de lanzar excepción
        console.warn(`[UserContextService] Defaulting to b2c for user ${userId} due to error`);
        return 'b2c';
      }

      const userType = data.organization_id ? 'b2b' : 'b2c';

      // Log para debugging
      console.log(`[UserContextService] Detección de tipo de usuario:`, {
        userId,
        organization_id: data.organization_id,
        userType,
      });

      return userType;
    } catch (unexpectedError) {
      console.error('Error inesperado obteniendo tipo de usuario:', unexpectedError);
      // Default a B2C si hay error inesperado
      return 'b2c';
    }
  }

  /**
   * Obtiene la información básica del usuario
   */
  static async getUserBasicInfo(userId: string): Promise<UserBasicInfo> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          profile_picture_url,
          cargo_rol,
          type_rol
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo información básica del usuario:', error);
        // Retornar información mínima en lugar de lanzar excepción
        return {
          id: userId,
          username: null,
          email: null,
          firstName: null,
          lastName: null,
          displayName: null,
          profilePictureUrl: null,
          cargoRol: null,
          typeRol: null,
        };
      }

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        profilePictureUrl: data.profile_picture_url,
        cargoRol: data.cargo_rol,
        typeRol: data.type_rol,
      };
    } catch (unexpectedError) {
      console.error('Error inesperado obteniendo información básica del usuario:', unexpectedError);
      return {
        id: userId,
        username: null,
        email: null,
        firstName: null,
        lastName: null,
        displayName: null,
        profilePictureUrl: null,
        cargoRol: null,
        typeRol: null,
      };
    }
  }

  /**
   * Obtiene el perfil profesional completo del usuario
   * con JOINs a roles, areas, niveles, tamanos_empresa, sectores, relaciones
   */
  static async getUserProfile(userId: string): Promise<UserProfessionalProfile | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_perfil')
      .select(`
        cargo_titulo,
        rol_id,
        nivel_id,
        area_id,
        relacion_id,
        tamano_id,
        sector_id,
        pais,
        dificultad_id,
        uso_ia_respuesta,
        roles:rol_id (id, slug, nombre, area_id),
        niveles:nivel_id (id, slug, nombre),
        areas:area_id (id, slug, nombre),
        relaciones:relacion_id (id, slug, nombre),
        tamanos_empresa:tamano_id (id, slug, nombre, min_empleados, max_empleados),
        sectores:sector_id (id, slug, nombre)
      `)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No existe perfil, retornar null
        return null;
      }
      console.error('Error obteniendo perfil del usuario:', error);
      return null;
    }
    
    const profile: UserProfessionalProfile = {
      cargoTitulo: data.cargo_titulo,
      pais: data.pais,
      dificultadId: data.dificultad_id,
      usoIaRespuesta: data.uso_ia_respuesta,
    };
    
    // Mapear rol
    if (data.roles && typeof data.roles === 'object' && !Array.isArray(data.roles)) {
      const rol = data.roles as { id: number; slug: string; nombre: string; area_id?: number };
      profile.rol = {
        id: rol.id,
        slug: rol.slug,
        nombre: rol.nombre,
        areaId: rol.area_id,
      };
    }
    
    // Mapear nivel
    if (data.niveles && typeof data.niveles === 'object' && !Array.isArray(data.niveles)) {
      const nivel = data.niveles as { id: number; slug: string; nombre: string };
      profile.nivel = {
        id: nivel.id,
        slug: nivel.slug,
        nombre: nivel.nombre,
      };
    }
    
    // Mapear área
    if (data.areas && typeof data.areas === 'object' && !Array.isArray(data.areas)) {
      const area = data.areas as { id: number; slug: string; nombre: string };
      profile.area = {
        id: area.id,
        slug: area.slug,
        nombre: area.nombre,
      };
    }
    
    // Mapear relación
    if (data.relaciones && typeof data.relaciones === 'object' && !Array.isArray(data.relaciones)) {
      const relacion = data.relaciones as { id: number; slug: string; nombre: string };
      profile.relacion = {
        id: relacion.id,
        slug: relacion.slug,
        nombre: relacion.nombre,
      };
    }
    
    // Mapear tamaño de empresa
    if (data.tamanos_empresa && typeof data.tamanos_empresa === 'object' && !Array.isArray(data.tamanos_empresa)) {
      const tamano = data.tamanos_empresa as { id: number; slug: string; nombre: string; min_empleados?: number; max_empleados?: number };
      profile.tamanoEmpresa = {
        id: tamano.id,
        slug: tamano.slug,
        nombre: tamano.nombre,
        minEmpleados: tamano.min_empleados,
        maxEmpleados: tamano.max_empleados,
      };
    }
    
    // Mapear sector
    if (data.sectores && typeof data.sectores === 'object' && !Array.isArray(data.sectores)) {
      const sector = data.sectores as { id: number; slug: string; nombre: string };
      profile.sector = {
        id: sector.id,
        slug: sector.slug,
        nombre: sector.nombre,
      };
    }
    
    return profile;
  }

  /**
   * Obtiene la información de la organización del usuario (solo B2B)
   */
  static async getUserOrganization(userId: string): Promise<OrganizationInfo | null> {
    const supabase = await createClient();
    
    // Primero obtener el organization_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    if (userError || !userData.organization_id) {
      return null;
    }
    
    // Obtener información de la organización
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        logo_url,
        subscription_plan,
        max_users
      `)
      .eq('id', userData.organization_id)
      .single();
    
    if (error) {
      console.error('Error obteniendo organización:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logoUrl: data.logo_url,
      // industry no existe en la tabla, usar null
      industry: null,
      // size no existe, usar max_users como referencia
      size: data.max_users ? `${data.max_users} usuarios` : null,
      plan: data.subscription_plan,
    };
  }

  /**
   * Obtiene los equipos de trabajo del usuario (solo B2B)
   */
  static async getUserWorkTeams(userId: string): Promise<WorkTeam[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('work_team_members')
      .select(`
        role,
        status,
        work_teams:team_id (
          team_id,
          name,
          description,
          course_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) {
      console.error('Error obteniendo equipos de trabajo:', error);
      return [];
    }
    
    return data.map((item) => {
      const team = item.work_teams as unknown as {
        team_id: string;
        name: string;
        description?: string;
        course_id?: string;
      };
      
      return {
        teamId: team.team_id,
        name: team.name,
        description: team.description,
        role: item.role as 'member' | 'leader' | 'co-leader',
        status: item.status as 'active' | 'inactive',
        courseId: team.course_id,
      };
    });
  }

  /**
   * Obtiene los cursos asignados a un usuario B2B por la organización
   */
  static async getB2BCourseAssignments(userId: string): Promise<B2BCourseAssignment[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        organization_id,
        user_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        completion_percentage,
        completed_at,
        message,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        ),
        assigner:assigned_by (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'cancelled');
    
    if (error) {
      console.error('Error obteniendo asignaciones de cursos B2B:', error);
      return [];
    }
    
    return data.map((item) => {
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
        price?: number;
        average_rating?: number;
        student_count?: number;
      };
      
      const assigner = item.assigner as unknown as {
        display_name?: string;
        first_name?: string;
        last_name?: string;
      } | null;
      
      return {
        id: item.id,
        organizationId: item.organization_id,
        userId: item.user_id,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        assignedBy: item.assigned_by,
        assignedByName: assigner?.display_name || 
          (assigner?.first_name && assigner?.last_name 
            ? `${assigner.first_name} ${assigner.last_name}` 
            : undefined),
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: item.status as B2BCourseAssignment['status'],
        completionPercentage: item.completion_percentage,
        completedAt: item.completed_at,
        message: item.message,
      };
    });
  }

  /**
   * Obtiene los cursos asignados por equipos de trabajo (B2B)
   */
  static async getTeamCourseAssignments(userId: string): Promise<TeamCourseAssignment[]> {
    const supabase = await createClient();
    
    // Primero obtener los equipos del usuario
    const { data: teams, error: teamsError } = await supabase
      .from('work_team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (teamsError || !teams.length) {
      return [];
    }
    
    const teamIds = teams.map(t => t.team_id);
    
    // Obtener asignaciones de cursos de esos equipos
    const { data, error } = await supabase
      .from('work_team_course_assignments')
      .select(`
        id,
        team_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        message,
        work_teams:team_id (
          name
        ),
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        ),
        assigner:assigned_by (
          display_name,
          first_name,
          last_name
        )
      `)
      .in('team_id', teamIds)
      .neq('status', 'completed');
    
    if (error) {
      console.error('Error obteniendo asignaciones de equipos:', error);
      return [];
    }
    
    return data.map((item) => {
      const team = item.work_teams as unknown as { name: string };
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
        price?: number;
        average_rating?: number;
        student_count?: number;
      };
      
      const assigner = item.assigner as unknown as {
        display_name?: string;
        first_name?: string;
        last_name?: string;
      } | null;
      
      return {
        id: item.id,
        teamId: item.team_id,
        teamName: team.name,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        assignedBy: item.assigned_by,
        assignedByName: assigner?.display_name || 
          (assigner?.first_name && assigner?.last_name 
            ? `${assigner.first_name} ${assigner.last_name}` 
            : undefined),
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: item.status as TeamCourseAssignment['status'],
        message: item.message,
      };
    });
  }

  /**
   * Obtiene los cursos adquiridos por un usuario B2C
   */
  static async getB2CCoursePurchases(userId: string): Promise<B2CCoursePurchase[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('course_purchases')
      .select(`
        purchase_id,
        user_id,
        course_id,
        purchased_at,
        access_status,
        expires_at,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        )
      `)
      .eq('user_id', userId)
      .eq('access_status', 'active');
    
    if (error) {
      console.error('Error obteniendo compras de cursos B2C:', error);
      return [];
    }
    
    // Obtener progreso de enrollments
    const courseIds = data.map(d => d.course_id);
    const { data: enrollments } = await supabase
      .from('user_course_enrollments')
      .select('course_id, progress_percentage')
      .eq('user_id', userId)
      .in('course_id', courseIds);
    
    const progressMap = new Map(
      (enrollments || []).map(e => [e.course_id, e.progress_percentage])
    );
    
    return data.map((item) => {
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
        price?: number;
        average_rating?: number;
        student_count?: number;
      };
      
      return {
        purchaseId: item.purchase_id,
        userId: item.user_id,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        purchasedAt: item.purchased_at,
        accessStatus: item.access_status as B2CCoursePurchase['accessStatus'],
        expiresAt: item.expires_at,
        completionPercentage: progressMap.get(item.course_id) || 0,
      };
    });
  }

  /**
   * Obtiene los cursos del usuario según su tipo (B2B o B2C)
   */
  static async getUserCourses(userId: string, userType: UserType): Promise<CourseAssignment[]> {
    if (userType === 'b2b') {
      // Obtener asignaciones de organización y de equipos
      const [orgAssignments, teamAssignments] = await Promise.all([
        this.getB2BCourseAssignments(userId),
        this.getTeamCourseAssignments(userId),
      ]);
      
      // Convertir a formato unificado
      const courses: CourseAssignment[] = [];
      
      // Agregar asignaciones de organización
      for (const assignment of orgAssignments) {
        courses.push({
          courseId: assignment.courseId,
          course: assignment.course,
          userType: 'b2b',
          dueDate: assignment.dueDate,
          assignedBy: assignment.assignedByName,
          status: assignment.status,
          completionPercentage: assignment.completionPercentage,
          source: 'organization',
        });
      }
      
      // Agregar asignaciones de equipo (evitar duplicados)
      for (const assignment of teamAssignments) {
        const exists = courses.some(c => c.courseId === assignment.courseId);
        if (!exists) {
          courses.push({
            courseId: assignment.courseId,
            course: assignment.course,
            userType: 'b2b',
            dueDate: assignment.dueDate,
            assignedBy: assignment.assignedByName,
            status: assignment.status,
            completionPercentage: 0,
            source: 'team',
          });
        }
      }
      
      return courses;
    } else {
      // B2C: obtener cursos comprados
      const purchases = await this.getB2CCoursePurchases(userId);
      
      return purchases.map(purchase => ({
        courseId: purchase.courseId,
        course: purchase.course,
        userType: 'b2c',
        status: purchase.accessStatus,
        completionPercentage: purchase.completionPercentage || 0,
        source: 'purchase',
      }));
    }
  }

  /**
   * Obtiene las preferencias de estudio del usuario
   */
  static async getStudyPreferences(userId: string): Promise<StudyPreferences | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('study_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error obteniendo preferencias de estudio:', error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      timezone: data.timezone,
      preferredTimeOfDay: data.preferred_time_of_day,
      preferredDays: data.preferred_days,
      dailyTargetMinutes: data.daily_target_minutes,
      weeklyTargetMinutes: data.weekly_target_minutes,
      preferredSessionType: data.preferred_session_type,
      minSessionMinutes: data.min_session_minutes,
      maxSessionMinutes: data.max_session_minutes,
      breakDurationMinutes: data.break_duration_minutes,
      calendarConnected: data.calendar_connected || false,
      calendarProvider: data.calendar_provider,
    };
  }

  /**
   * Obtiene la integración de calendario del usuario
   */
  static async getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error obteniendo integración de calendario:', error);
      return null;
    }
    
    const isConnected = !!data.access_token && 
      (!data.expires_at || new Date(data.expires_at) > new Date());
    
    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider as 'google' | 'microsoft',
      isConnected,
      expiresAt: data.expires_at,
      scope: data.scope,
    };
  }

  /**
   * Obtiene las rutas de aprendizaje del usuario
   */
  static async getLearningRoutes(userId: string): Promise<LearningRoute[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('learning_routes')
      .select(`
        id,
        user_id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error obteniendo rutas de aprendizaje:', error);
      return [];
    }
    
    // Por ahora retornar sin los cursos específicos de cada ruta
    // Se puede expandir después para incluir los cursos
    return data.map(route => ({
      id: route.id,
      userId: route.user_id,
      name: route.name,
      description: route.description,
      courses: [], // TODO: Cargar cursos de la ruta
      isActive: route.is_active,
      createdAt: route.created_at,
      updatedAt: route.updated_at,
    }));
  }

  /**
   * Obtiene el contexto completo del usuario para el planificador
   */
  static async getFullUserContext(userId: string): Promise<UserContext> {
    // Obtener tipo de usuario primero
    const userType = await this.getUserType(userId);
    
    console.log(`[UserContextService] getFullUserContext - userType detectado: ${userType} para userId: ${userId}`);
    
    // Obtener datos en paralelo
    const [
      user,
      professionalProfile,
      organization,
      workTeams,
      courses,
      studyPreferences,
      calendarIntegration,
      learningRoutes,
    ] = await Promise.all([
      this.getUserBasicInfo(userId),
      this.getUserProfile(userId),
      userType === 'b2b' ? this.getUserOrganization(userId) : Promise.resolve(null),
      userType === 'b2b' ? this.getUserWorkTeams(userId) : Promise.resolve([]),
      this.getUserCourses(userId, userType),
      this.getStudyPreferences(userId),
      this.getCalendarIntegration(userId),
      this.getLearningRoutes(userId),
    ]);
    
    const context = {
      user,
      userType,
      professionalProfile: professionalProfile || undefined,
      organization: organization || undefined,
      workTeams: workTeams.length > 0 ? workTeams : undefined,
      courses,
      studyPreferences: studyPreferences || undefined,
      calendarIntegration: calendarIntegration || undefined,
      learningRoutes: learningRoutes.length > 0 ? learningRoutes : undefined,
    };
    
    console.log(`[UserContextService] getFullUserContext - Contexto construido:`, {
      userType: context.userType,
      hasOrganization: !!context.organization,
      organizationName: context.organization?.name,
      coursesCount: context.courses.length,
    });
    
    return context;
  }

  /**
   * Verifica si el usuario tiene cursos con plazos próximos (B2B)
   */
  static async getUpcomingDeadlines(userId: string, daysAhead: number = 14): Promise<B2BCourseAssignment[]> {
    const supabase = await createClient();
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const { data, error } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        organization_id,
        user_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        completion_percentage,
        completed_at,
        message,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active
        )
      `)
      .eq('user_id', userId)
      .not('due_date', 'is', null)
      .lt('due_date', futureDate.toISOString())
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo plazos próximos:', error);
      return [];
    }
    
    return data.map((item) => {
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
      };
      
      return {
        id: item.id,
        organizationId: item.organization_id,
        userId: item.user_id,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
        },
        assignedBy: item.assigned_by,
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: item.status as B2BCourseAssignment['status'],
        completionPercentage: item.completion_percentage,
        completedAt: item.completed_at,
        message: item.message,
      };
    });
  }
}
