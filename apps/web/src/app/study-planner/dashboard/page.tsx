'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { StudyPlan, StudySession } from '@aprende-y-aplica/shared';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarIntegrationSettings } from '@/features/study-planner/components/CalendarIntegrationSettings';

export default function StudyPlannerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [calendarIntegrations, setCalendarIntegrations] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const processedParamsRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  // Definir loadDashboardData primero usando useCallback
  const loadDashboardData = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('⏸️ loadDashboardData ya está en ejecución, omitiendo...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🔄 Cargando datos del dashboard...');

      // Cargar planes, sesiones y rutas en paralelo
      const [plansRes, sessionsRes, routesRes, integrationsRes] = await Promise.all([
        fetch('/api/study-planner/plans', { cache: 'no-store' }),
        fetch('/api/study-planner/sessions', { cache: 'no-store' }),
        fetch('/api/study-planner/routes', { cache: 'no-store' }),
        fetch('/api/study-planner/calendar-integrations', { cache: 'no-store' }),
      ]);

      console.log('📊 Respuestas recibidas:', {
        plans: plansRes.status,
        sessions: sessionsRes.status,
        routes: routesRes.status,
        integrations: integrationsRes.status,
      });

      if (!plansRes.ok) {
        const errorText = await plansRes.text();
        console.error('❌ Error loading plans:', plansRes.status, errorText);
        throw new Error(`Error al cargar planes: ${plansRes.status}`);
      }

      if (!sessionsRes.ok) {
        const errorText = await sessionsRes.text();
        console.error('❌ Error loading sessions:', sessionsRes.status, errorText);
        throw new Error(`Error al cargar sesiones: ${sessionsRes.status}`);
      }

      const plansData = await plansRes.json();
      const sessionsData = await sessionsRes.json();
      const routesData = routesRes.ok ? await routesRes.json() : { routes: [] };
      const integrationsData = integrationsRes.ok ? await integrationsRes.json() : { integrations: [] };

      console.log('✅ Datos cargados:', {
        plans: plansData.plans?.length || 0,
        sessions: sessionsData.sessions?.length || 0,
        routes: routesData.routes?.length || 0,
        integrations: integrationsData.integrations?.length || 0,
      });

      if (plansData.plans && plansData.plans.length > 0) {
        console.log('📋 Planes encontrados:', plansData.plans.map((p: any) => ({
          id: p.id,
          name: p.name,
          user_id: p.user_id,
          created_at: p.created_at,
        })));
      }

      if (routesData.routes && routesData.routes.length > 0) {
        console.log('🛣️ Rutas encontradas:', routesData.routes.map((r: any) => ({
          id: r.id,
          name: r.name,
          course_count: r.course_count,
        })));
      }

      setPlans(plansData.plans || []);
      setSessions(sessionsData.sessions || []);
      setRoutes(routesData.routes || []);
      setCalendarIntegrations(integrationsData.integrations || []);
    } catch (err: any) {
      console.error('💥 Error loading dashboard:', err);
      setError(err.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Sin dependencias para evitar re-creaciones

  // Cargar datos
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth');
      return;
    }

    loadDashboardData();
  }, [user, authLoading, loadDashboardData]);

  // Manejar mensajes de éxito/error de OAuth (solo cuando cambian los searchParams)
  useEffect(() => {
    const success = searchParams?.get('success');
    const errorParam = searchParams?.get('error');

    // Solo procesar si hay un parámetro nuevo y no se ha procesado antes
    if (!success && !errorParam) return;

    // Crear una clave única para este parámetro
    const paramKey = success ? `success-${success}` : `error-${errorParam}`;
    
    // Si ya se procesó este parámetro, no hacer nada
    if (processedParamsRef.current.has(paramKey)) {
      return;
    }

    // Marcar como procesado
    processedParamsRef.current.add(paramKey);

    if (success) {
      const messages: Record<string, string> = {
        google_connected: 'Google Calendar conectado exitosamente',
        microsoft_connected: 'Microsoft Outlook conectado exitosamente',
      };
      setNotification({
        type: 'success',
        message: messages[success] || 'Operación completada exitosamente',
      });
      // Limpiar query params sin causar re-render
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('success');
        // Usar replaceState en lugar de router.replace para evitar re-renders
        window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
      }
      // Recargar integraciones después de un pequeño delay, solo si el modal no está abierto
      if (!showCalendarSettings) {
        setTimeout(() => {
          loadDashboardData();
        }, 500);
      }
    }

    if (errorParam) {
      const messages: Record<string, string> = {
        oauth_error: 'Error al conectar el calendario. Por favor, intenta de nuevo.',
        no_code: 'No se recibió el código de autorización',
        not_configured: 'El servicio de calendario no está configurado',
        token_exchange_failed: 'Error al obtener los tokens de acceso',
        save_failed: 'Error al guardar la conexión',
        internal_error: 'Error interno del servidor',
      };
      setNotification({
        type: 'error',
        message: messages[errorParam] || 'Ocurrió un error',
      });
      // Limpiar query params sin causar re-render
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        // Usar replaceState en lugar de router.replace para evitar re-renders
        window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
      }
    }
  }, [searchParams, showCalendarSettings, loadDashboardData]); // Removido router de dependencias

  // Auto-ocultar notificación después de 5 segundos (separado para evitar loops)
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Recargar cuando se vuelve a la página (después de crear un plan)
  // Solo si el modal NO está abierto para evitar recargas mientras se usa
  useEffect(() => {
    // No agregar listeners si el modal está abierto
    if (showCalendarSettings) {
      return;
    }

    let lastFocusTime = Date.now();
    const MIN_TIME_BETWEEN_RELOADS = 2000; // 2 segundos mínimo entre recargas

    const handleFocus = () => {
      const now = Date.now();
      // Solo recargar si han pasado al menos 2 segundos desde la última recarga
      if (
        document.visibilityState === 'visible' && 
        !showCalendarSettings &&
        (now - lastFocusTime) >= MIN_TIME_BETWEEN_RELOADS &&
        !isLoadingRef.current
      ) {
        lastFocusTime = now;
        loadDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [showCalendarSettings, loadDashboardData]);

  // Obtener el plan activo (el más reciente, ordenado por created_at)
  const activePlan = plans.length > 0 
    ? [...plans].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    : null;

  // Formatear sesiones para FullCalendar
  const calendarEvents = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    start: session.start_time,
    end: session.end_time,
    backgroundColor: getStatusColor(session.status),
    borderColor: getStatusColor(session.status),
    extendedProps: {
      status: session.status,
      description: session.description,
      courseId: session.course_id,
    },
  }));

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'planned':
        return '#8b5cf6'; // purple
      case 'cancelled':
        return '#ef4444'; // red
      case 'skipped':
        return '#6b7280'; // gray
      default:
        return '#6366f1'; // indigo
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Notificación de éxito/error */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Planificador de Estudio
              </h1>
              <p className="text-slate-300">
                Gestiona tus planes y sesiones de estudio
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                title="Recargar datos"
              >
                <Loader2 className="w-4 h-4" />
                Recargar
              </button>
              <button
                onClick={() => setShowCalendarSettings(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Calendarios
              </button>
              <button
                onClick={() => router.push('/study-planner/create')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Plan
              </button>
            </div>
          </div>
        </div>

        {/* Plan Activo */}
        {activePlan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/30 rounded-lg">
                    <BookOpen className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{activePlan.name}</h2>
                    <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-xs font-semibold mt-1 inline-block">
                      ✓ Plan Activo
                    </span>
                  </div>
                </div>
                {activePlan.description && (
                  <p className="text-slate-200 mb-4 text-sm">{activePlan.description}</p>
                )}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-300" />
                    <span className="text-slate-200">
                      <span className="text-white font-bold">{activePlan.goal_hours_per_week}h</span> por semana
                    </span>
                  </div>
                  {activePlan.start_date && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-300" />
                      <span className="text-slate-200">
                        Inicio: <span className="text-white font-semibold">
                          {new Date(activePlan.start_date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                  {activePlan.end_date && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-300" />
                      <span className="text-slate-200">
                        Fin: <span className="text-white font-semibold">
                          {new Date(activePlan.end_date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                  {sessions.length > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-300" />
                      <span className="text-slate-200">
                        <span className="text-white font-bold">{sessions.length}</span> sesiones programadas
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push(`/study-planner/plans/${activePlan.id}`)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg"
              >
                Ver detalles
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : plans.length === 0 ? null : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-yellow-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/30"
          >
            <div className="flex items-center gap-2 text-yellow-300">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">
                Se encontraron {plans.length} plan(es) pero no se pudo determinar el activo. 
                <button 
                  onClick={loadDashboardData}
                  className="ml-2 underline hover:text-yellow-200"
                >
                  Recargar
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* Rutas de Aprendizaje */}
        {routes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Rutas de Aprendizaje ({routes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{route.name}</h3>
                  {route.description && (
                    <p className="text-slate-300 text-sm mb-3">{route.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">
                      {route.course_count || 0} curso(s)
                    </span>
                    <button
                      onClick={() => router.push(`/study-planner/routes/${route.id}`)}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      Ver →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sin Plan Activo */}
        {!activePlan && plans.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center"
          >
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              No tienes un plan activo
            </h3>
            <p className="text-slate-300 mb-6">
              Crea tu primer plan de estudio para comenzar
            </p>
            <button
              onClick={() => router.push('/study-planner/create')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Plan de Estudio
            </button>
          </motion.div>
        )}

        {/* Calendario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Calendario de Sesiones
          </h2>
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={calendarEvents}
              locale="es"
              height="auto"
              eventClick={(info) => {
                router.push(`/study-planner/session/${info.event.id}`);
              }}
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventDisplay="block"
              eventTextColor="#ffffff"
              dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={false}
            />
          </div>
          <style jsx global>{`
            .calendar-container {
              background: rgba(15, 23, 42, 0.9);
              border-radius: 0.75rem;
              padding: 1.5rem;
              border: 1px solid rgba(71, 85, 105, 0.3);
            }
            
            .calendar-container :global(.fc) {
              color: #e2e8f0;
              font-family: inherit;
              background: transparent;
            }
            
            .calendar-container :global(.fc-header-toolbar) {
              margin-bottom: 1.5rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid rgba(71, 85, 105, 0.3);
            }
            
            .calendar-container :global(.fc-toolbar-title) {
              color: #ffffff;
              font-weight: 700;
              font-size: 1.5rem;
              text-transform: capitalize;
            }
            
            .calendar-container :global(.fc-button) {
              background-color: rgba(59, 130, 246, 0.2) !important;
              border-color: rgba(59, 130, 246, 0.4) !important;
              color: #93c5fd !important;
              padding: 0.5rem 1rem !important;
              border-radius: 0.5rem !important;
              font-weight: 500 !important;
              transition: all 0.2s !important;
              text-transform: capitalize !important;
            }
            
            .calendar-container :global(.fc-button:hover) {
              background-color: rgba(59, 130, 246, 0.4) !important;
              border-color: rgba(59, 130, 246, 0.6) !important;
              color: #ffffff !important;
            }
            
            .calendar-container :global(.fc-button-active) {
              background-color: #3b82f6 !important;
              border-color: #3b82f6 !important;
              color: #ffffff !important;
            }
            
            .calendar-container :global(.fc-button:focus) {
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
            }
            
            .calendar-container :global(.fc-daygrid-day) {
              background-color: rgba(30, 41, 59, 0.6) !important;
              border-color: rgba(71, 85, 105, 0.4) !important;
            }
            
            .calendar-container :global(.fc-daygrid-day:hover) {
              background-color: rgba(30, 41, 59, 0.8) !important;
            }
            
            .calendar-container :global(.fc-day-today) {
              background-color: rgba(59, 130, 246, 0.25) !important;
            }
            
            .calendar-container :global(.fc-daygrid-day-number) {
              color: #e2e8f0 !important;
              padding: 0.5rem !important;
              font-weight: 500 !important;
            }
            
            .calendar-container :global(.fc-day-today .fc-daygrid-day-number) {
              color: #ffffff !important;
              font-weight: 700 !important;
              background-color: rgba(59, 130, 246, 0.3);
              border-radius: 50%;
              width: 2rem;
              height: 2rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .calendar-container :global(.fc-col-header-cell) {
              background-color: rgba(15, 23, 42, 0.9) !important;
              border-color: rgba(71, 85, 105, 0.4) !important;
              padding: 0.75rem 0.5rem !important;
            }
            
            .calendar-container :global(.fc-col-header-cell-cushion) {
              color: #cbd5e1 !important;
              font-weight: 600 !important;
              text-transform: capitalize !important;
              font-size: 0.875rem !important;
            }
            
            .calendar-container :global(.fc-event) {
              border-radius: 0.5rem !important;
              padding: 0.375rem 0.625rem !important;
              border: none !important;
              cursor: pointer !important;
              font-size: 0.875rem !important;
              font-weight: 500 !important;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
            }
            
            .calendar-container :global(.fc-event:hover) {
              opacity: 0.9 !important;
              transform: translateY(-2px) !important;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
            }
            
            .calendar-container :global(.fc-event-title) {
              padding: 0 !important;
              font-weight: 600 !important;
            }
            
            .calendar-container :global(.fc-daygrid-event) {
              margin: 0.25rem 0 !important;
            }
            
            .calendar-container :global(.fc-more-link) {
              color: #93c5fd !important;
              font-weight: 600 !important;
              text-decoration: underline !important;
            }
            
            .calendar-container :global(.fc-timegrid-slot) {
              border-color: rgba(71, 85, 105, 0.3) !important;
            }
            
            .calendar-container :global(.fc-timegrid-col) {
              background-color: rgba(30, 41, 59, 0.4) !important;
            }
            
            .calendar-container :global(.fc-timegrid-now-indicator-line) {
              border-color: #3b82f6 !important;
              border-width: 2px !important;
            }
            
            .calendar-container :global(.fc-scrollgrid) {
              border-color: rgba(71, 85, 105, 0.4) !important;
            }
            
            .calendar-container :global(.fc-scrollgrid-section-header) {
              background-color: rgba(15, 23, 42, 0.9) !important;
            }
            
            .calendar-container :global(.fc-daygrid-more-link) {
              color: #93c5fd !important;
              font-weight: 600 !important;
            }
            
            .calendar-container :global(.fc-popover) {
              background-color: rgba(15, 23, 42, 0.95) !important;
              border-color: rgba(71, 85, 105, 0.5) !important;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
            }
            
            .calendar-container :global(.fc-popover-header) {
              background-color: rgba(30, 41, 59, 0.9) !important;
              color: #ffffff !important;
            }
            
            .calendar-container :global(.fc-popover-title) {
              color: #ffffff !important;
            }
          `}</style>
        </motion.div>

        {/* Integraciones de Calendario */}
        {calendarIntegrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Calendarios Conectados
            </h3>
            <div className="flex flex-wrap gap-3">
              {calendarIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="px-4 py-2 bg-white/10 rounded-lg flex items-center gap-2"
                >
                  <span className="text-white capitalize">{integration.provider}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Configuración de Calendarios */}
      {showCalendarSettings && (
        <CalendarIntegrationSettings
          isOpen={showCalendarSettings}
          onClose={() => {
            setShowCalendarSettings(false);
          }}
          onIntegrationChange={() => {
            // Solo recargar integraciones cuando cambien, no toda la página
            if (!isLoadingRef.current) {
              loadDashboardData();
            }
          }}
        />
      )}
    </div>
  );
}

