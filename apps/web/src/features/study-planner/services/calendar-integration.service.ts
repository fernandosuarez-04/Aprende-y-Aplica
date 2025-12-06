/**
 * CalendarIntegrationService
 * 
 * Servicio para integrar y analizar calendarios de Google y Microsoft
 * para el planificador de estudios.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  CalendarIntegration,
  CalendarEvent,
  CalendarAvailability,
  TimeBlock,
} from '../types/user-context.types';

// Configuración de OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/study-planner/calendar/callback';

export class CalendarIntegrationService {
  /**
   * Genera la URL de autorización para Google Calendar
   */
  static getGoogleAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ].join(' ');
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ provider: 'google', userId }),
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Genera la URL de autorización para Microsoft Calendar
   */
  static getMicrosoftAuthUrl(userId: string): string {
    const scopes = [
      'offline_access',
      'Calendars.Read',
      'User.Read',
    ].join(' ');
    
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      state: JSON.stringify({ provider: 'microsoft', userId }),
    });
    
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Conecta Google Calendar usando el código de autorización
   */
  static async connectGoogleCalendar(userId: string, authCode: string): Promise<CalendarIntegration | null> {
    try {
      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || '',
          client_secret: GOOGLE_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error('Error obteniendo tokens de Google:', await tokenResponse.text());
        return null;
      }
      
      const tokens = await tokenResponse.json();
      
      // Guardar en base de datos
      return await this.saveCalendarIntegration(userId, 'google', tokens);
      
    } catch (error) {
      console.error('Error conectando Google Calendar:', error);
      return null;
    }
  }

  /**
   * Conecta Microsoft Calendar usando el código de autorización
   */
  static async connectMicrosoftCalendar(userId: string, authCode: string): Promise<CalendarIntegration | null> {
    try {
      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID || '',
          client_secret: MICROSOFT_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          scope: 'offline_access Calendars.Read User.Read',
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error('Error obteniendo tokens de Microsoft:', await tokenResponse.text());
        return null;
      }
      
      const tokens = await tokenResponse.json();
      
      // Guardar en base de datos
      return await this.saveCalendarIntegration(userId, 'microsoft', tokens);
      
    } catch (error) {
      console.error('Error conectando Microsoft Calendar:', error);
      return null;
    }
  }

  /**
   * Guarda o actualiza la integración de calendario en la base de datos
   */
  private static async saveCalendarIntegration(
    userId: string,
    provider: 'google' | 'microsoft',
    tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    }
  ): Promise<CalendarIntegration | null> {
    const supabase = await createClient();
    
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
    
    // Verificar si ya existe una integración
    const { data: existing } = await supabase
      .from('calendar_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    let result;
    
    if (existing) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: expiresAt,
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error actualizando integración:', error);
        return null;
      }
      result = data;
    } else {
      // Crear nueva
      const { data, error } = await supabase
        .from('calendar_integrations')
        .insert({
          user_id: userId,
          provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creando integración:', error);
        return null;
      }
      result = data;
    }
    
    return {
      id: result.id,
      userId: result.user_id,
      provider: result.provider as 'google' | 'microsoft',
      isConnected: true,
      expiresAt: result.expires_at,
      scope: result.scope,
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
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
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
   * Refresca el token de acceso si está expirado
   */
  static async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    const supabase = await createClient();
    
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!integration) {
      return null;
    }
    
    // Verificar si el token está por expirar (menos de 5 minutos)
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    const needsRefresh = !expiresAt || 
      (expiresAt.getTime() - Date.now()) < 5 * 60 * 1000;
    
    if (!needsRefresh) {
      return integration.access_token;
    }
    
    if (!integration.refresh_token) {
      console.error('No hay refresh token disponible');
      return null;
    }
    
    // Refrescar token según el proveedor
    let tokenUrl: string;
    let bodyParams: Record<string, string>;
    
    if (integration.provider === 'google') {
      tokenUrl = 'https://oauth2.googleapis.com/token';
      bodyParams = {
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      };
    } else {
      tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      bodyParams = {
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
        scope: 'offline_access Calendars.Read User.Read',
      };
    }
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyParams),
      });
      
      if (!response.ok) {
        console.error('Error refrescando token:', await response.text());
        return null;
      }
      
      const tokens = await response.json();
      
      // Actualizar en base de datos
      const newExpiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;
      
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
      
      return tokens.access_token;
      
    } catch (error) {
      console.error('Error refrescando token:', error);
      return null;
    }
  }

  /**
   * Obtiene eventos del calendario de Google
   */
  static async getGoogleCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      });
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error('Error obteniendo eventos de Google:', await response.text());
        return [];
      }
      
      const data = await response.json();
      
      return (data.items || []).map((event: any) => ({
        id: event.id,
        title: event.summary || 'Sin título',
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        isAllDay: !!event.start?.date,
        isRecurring: !!event.recurringEventId,
        location: event.location,
        status: event.status === 'confirmed' ? 'confirmed' : 
                event.status === 'tentative' ? 'tentative' : 'cancelled',
      }));
      
    } catch (error) {
      console.error('Error obteniendo eventos de Google:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos del calendario de Microsoft
   */
  static async getMicrosoftCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $orderby: 'start/dateTime',
        $top: '100',
      });
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error('Error obteniendo eventos de Microsoft:', await response.text());
        return [];
      }
      
      const data = await response.json();
      
      return (data.value || []).map((event: any) => ({
        id: event.id,
        title: event.subject || 'Sin título',
        description: event.bodyPreview,
        startTime: event.start?.dateTime,
        endTime: event.end?.dateTime,
        isAllDay: event.isAllDay,
        isRecurring: !!event.seriesMasterId,
        location: event.location?.displayName,
        status: event.showAs === 'busy' ? 'confirmed' : 
                event.showAs === 'tentative' ? 'tentative' : 'cancelled',
      }));
      
    } catch (error) {
      console.error('Error obteniendo eventos de Microsoft:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos del calendario del usuario
   */
  static async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    // Refrescar token si es necesario
    const accessToken = await this.refreshTokenIfNeeded(userId);
    
    if (!accessToken) {
      return [];
    }
    
    // Obtener integración para saber el proveedor
    const integration = await this.getCalendarIntegration(userId);
    
    if (!integration || !integration.isConnected) {
      return [];
    }
    
    if (integration.provider === 'google') {
      return this.getGoogleCalendarEvents(accessToken, startDate, endDate);
    } else {
      return this.getMicrosoftCalendarEvents(accessToken, startDate, endDate);
    }
  }

  /**
   * Analiza la disponibilidad basándose en eventos del calendario
   */
  static analyzeAvailability(
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date,
    preferredDays: number[] = [1, 2, 3, 4, 5], // Lunes a viernes por defecto
    workingHours: { start: number; end: number } = { start: 8, end: 20 }
  ): CalendarAvailability[] {
    const availability: CalendarAvailability[] = [];
    
    // Iterar por cada día en el rango
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Solo analizar días preferidos
      if (preferredDays.includes(dayOfWeek)) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(workingHours.start, 0, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(workingHours.end, 0, 0, 0);
        
        // Obtener eventos del día
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          return eventStart.toDateString() === currentDate.toDateString() ||
                 (eventStart < dayEnd && eventEnd > dayStart);
        });
        
        // Calcular slots ocupados y libres
        const busySlots: TimeBlock[] = [];
        for (const event of dayEvents) {
          if (event.status === 'cancelled') continue;
          
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          
          busySlots.push({
            startHour: eventStart.getHours(),
            startMinute: eventStart.getMinutes(),
            endHour: eventEnd.getHours(),
            endMinute: eventEnd.getMinutes(),
          });
        }
        
        // Ordenar slots ocupados
        busySlots.sort((a, b) => 
          (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
        );
        
        // Calcular slots libres
        const freeSlots: TimeBlock[] = [];
        let lastEndHour = workingHours.start;
        let lastEndMinute = 0;
        
        for (const busy of busySlots) {
          // Si hay espacio antes del slot ocupado
          if (busy.startHour * 60 + busy.startMinute > lastEndHour * 60 + lastEndMinute) {
            freeSlots.push({
              startHour: lastEndHour,
              startMinute: lastEndMinute,
              endHour: busy.startHour,
              endMinute: busy.startMinute,
            });
          }
          
          // Actualizar fin del último slot ocupado
          const busyEndMinutes = busy.endHour * 60 + busy.endMinute;
          const lastEndMinutes = lastEndHour * 60 + lastEndMinute;
          if (busyEndMinutes > lastEndMinutes) {
            lastEndHour = busy.endHour;
            lastEndMinute = busy.endMinute;
          }
        }
        
        // Agregar slot libre al final del día si hay
        if (lastEndHour * 60 + lastEndMinute < workingHours.end * 60) {
          freeSlots.push({
            startHour: lastEndHour,
            startMinute: lastEndMinute,
            endHour: workingHours.end,
            endMinute: 0,
          });
        }
        
        // Calcular totales
        let totalFreeMinutes = 0;
        for (const slot of freeSlots) {
          totalFreeMinutes += (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute);
        }
        
        let totalBusyMinutes = 0;
        for (const slot of busySlots) {
          totalBusyMinutes += (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute);
        }
        
        availability.push({
          date: currentDate.toISOString().split('T')[0],
          freeSlots,
          busySlots,
          totalFreeMinutes,
          totalBusyMinutes,
        });
      }
      
      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return availability;
  }

  /**
   * Encuentra slots libres que cumplan con la duración mínima requerida
   */
  static findFreeTimeSlots(
    availability: CalendarAvailability[],
    minDurationMinutes: number
  ): Array<{ date: string; slot: TimeBlock }> {
    const suitableSlots: Array<{ date: string; slot: TimeBlock }> = [];
    
    for (const day of availability) {
      for (const slot of day.freeSlots) {
        const slotDuration = (slot.endHour * 60 + slot.endMinute) - 
                            (slot.startHour * 60 + slot.startMinute);
        
        if (slotDuration >= minDurationMinutes) {
          suitableSlots.push({
            date: day.date,
            slot,
          });
        }
      }
    }
    
    return suitableSlots;
  }

  /**
   * Desconecta el calendario del usuario
   */
  static async disconnectCalendar(userId: string, provider?: 'google' | 'microsoft'): Promise<boolean> {
    const supabase = await createClient();
    
    let query = supabase
      .from('calendar_integrations')
      .delete()
      .eq('user_id', userId);
    
    if (provider) {
      query = query.eq('provider', provider);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error desconectando calendario:', error);
      return false;
    }
    
    return true;
  }
}

