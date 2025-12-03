'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  TrendingUp,
  XCircle,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { StudyPlan, StudySession } from '@aprende-y-aplica/shared';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    goal_hours_per_week: 0,
    start_date: '',
    end_date: '',
    preferred_days: [] as number[],
    preferred_time_blocks: [] as any[],
    preferred_session_type: 'medium' as 'short' | 'medium' | 'long',
  });
  const [updating, setUpdating] = useState(false);

  const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayNumbers = [0, 1, 2, 3, 4, 5, 6];

  useEffect(() => {
    if (planId) {
      fetchPlanData();
    }
  }, [planId]);

  // Detectar si se debe mostrar el modal de edición
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam === 'true' && plan) {
      setIsEditing(true);
      setEditForm({
        name: plan.name || '',
        description: plan.description || '',
        goal_hours_per_week: plan.goal_hours_per_week || 0,
      });
      // Limpiar el parámetro de la URL
      router.replace(`/study-planner/plans/${planId}`, { scroll: false });
    }
  }, [searchParams, plan, planId, router]);

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar plan y sesiones en paralelo
      const [planRes, sessionsRes] = await Promise.all([
        fetch(`/api/study-planner/plans`),
        fetch(`/api/study-planner/sessions?plan_id=${planId}`),
      ]);

      if (!planRes.ok) {
        throw new Error('Error al cargar el plan');
      }

      const plansData = await planRes.json();
      const planData = plansData.plans?.find((p: StudyPlan) => p.id === planId);

      if (!planData) {
        throw new Error('Plan no encontrado');
      }

      // Parsear preferred_days si vienen como strings desde la BD
      if (planData.preferred_days && Array.isArray(planData.preferred_days)) {
        planData.preferred_days = planData.preferred_days.map((day: any) => {
          const parsed = parseInt(String(day), 10);
          return isNaN(parsed) ? day : parsed;
        });
      }

      setPlan(planData);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        console.log('📅 Sesiones recibidas:', {
          count: sessionsData.sessions?.length || 0,
          sample: sessionsData.sessions?.[0] || null,
        });
        setSessions(sessionsData.sessions || []);
        
        // Si no hay sesiones, ofrecer regenerarlas
        if (sessionsData.sessions?.length === 0) {
          console.warn('⚠️ No se encontraron sesiones para este plan');
        }
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSessions = async () => {
    if (!planId || !plan) return;
    
    try {
      // Intentar obtener los cursos desde la descripción del plan o desde otras fuentes
      // La descripción dice "Plan con 2 curso(s)", pero necesitamos los IDs reales
      // Por ahora, enviar una petición sin course_ids y dejar que el endpoint los busque
      
      const response = await fetch(`/api/study-planner/plans/${planId}/regenerate-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // El endpoint buscará los cursos automáticamente desde múltiples fuentes
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Error al regenerar sesiones');
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      
      // Recargar los datos
      await fetchPlanData();
    } catch (err) {
      console.error('Error regenerating sessions:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleDeleteSessions = async () => {
    if (!planId || !plan) return;
    
    // Confirmar antes de eliminar
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar todas las sesiones planificadas de este plan?\n\nSe eliminarán ${sessions.length} sesión(es). Esta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/study-planner/plans/${planId}/delete-sessions`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Error al eliminar sesiones');
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      
      // Recargar los datos
      await fetchPlanData();
    } catch (err) {
      console.error('Error deleting sessions:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleEditPlan = () => {
    if (!plan) return;
    setIsEditing(true);
    
    // Parsear preferred_days
    const preferredDays = Array.isArray(plan.preferred_days)
      ? plan.preferred_days.map((day: any) => parseInt(String(day), 10)).filter((day: number) => !isNaN(day) && day >= 0 && day <= 6)
      : [];

    // Parsear preferred_time_blocks
    let preferredTimeBlocks: any[] = [];
    try {
      if (typeof plan.preferred_time_blocks === 'string') {
        preferredTimeBlocks = JSON.parse(plan.preferred_time_blocks);
      } else if (Array.isArray(plan.preferred_time_blocks)) {
        preferredTimeBlocks = plan.preferred_time_blocks;
      }
    } catch (e) {
      console.error('Error parseando preferred_time_blocks:', e);
    }

    setEditForm({
      name: plan.name || '',
      description: plan.description || '',
      goal_hours_per_week: plan.goal_hours_per_week || 0,
      start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : '',
      end_date: plan.end_date ? new Date(plan.end_date).toISOString().split('T')[0] : '',
      preferred_days: preferredDays,
      preferred_time_blocks: preferredTimeBlocks,
      preferred_session_type: (plan.preferred_session_type as 'short' | 'medium' | 'long') || 'medium',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: '',
      description: '',
      goal_hours_per_week: 0,
      start_date: '',
      end_date: '',
      preferred_days: [],
      preferred_time_blocks: [],
      preferred_session_type: 'medium',
    });
  };

  const toggleDay = (day: number) => {
    setEditForm(prev => ({
      ...prev,
      preferred_days: (prev.preferred_days || []).includes(day)
        ? (prev.preferred_days || []).filter(d => d !== day)
        : [...(prev.preferred_days || []), day].sort(),
    }));
  };

  const addTimeBlock = () => {
    setEditForm(prev => ({
      ...prev,
      preferred_time_blocks: [
        ...(prev.preferred_time_blocks || []),
        { day: 1, start: '09:00', end: '10:00', label: 'Lunes' },
      ],
    }));
  };

  const removeTimeBlock = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      preferred_time_blocks: (prev.preferred_time_blocks || []).filter((_, i) => i !== index),
    }));
  };

  const updateTimeBlock = (index: number, field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      preferred_time_blocks: (prev.preferred_time_blocks || []).map((block, i) => {
        if (i === index) {
          const updatedBlock = { ...block, [field]: value };
          // Si se actualiza el día, actualizar también el label
          if (field === 'day') {
            updatedBlock.label = dayLabels[value];
          }
          return updatedBlock;
        }
        return block;
      }),
    }));
  };

  const handleSaveEdit = async () => {
    if (!planId) return;

    if (!editForm.name.trim()) {
      alert('El nombre del plan no puede estar vacío');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/study-planner/plans/${planId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description?.trim() || null,
          goal_hours_per_week: parseFloat(String(editForm.goal_hours_per_week)) || 0,
          start_date: editForm.start_date || null,
          end_date: editForm.end_date || null,
          preferred_days: (editForm.preferred_days && editForm.preferred_days.length > 0) ? editForm.preferred_days : [1, 2, 3, 4, 5],
          preferred_time_blocks: (editForm.preferred_time_blocks && editForm.preferred_time_blocks.length > 0) ? editForm.preferred_time_blocks : [],
          preferred_session_type: editForm.preferred_session_type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Error al actualizar el plan');
      }

      const result = await response.json();
      alert('✅ Plan actualizado correctamente');
      
      setIsEditing(false);
      // Recargar los datos
      await fetchPlanData();
    } catch (err) {
      console.error('Error updating plan:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planId || !plan) return;
    
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el plan "${plan.name}"?\n\nEsta acción eliminará el plan y todas sus sesiones (${sessions.length} sesión(es)). Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/study-planner/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Error al eliminar el plan');
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      
      // Redirigir al dashboard
      router.push('/study-planner/dashboard');
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };


  const getStatusColor = (status: string): string => {
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
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En progreso';
      case 'planned':
        return 'Planificada';
      case 'cancelled':
        return 'Cancelada';
      case 'skipped':
        return 'Omitida';
      default:
        return status;
    }
  };

  // Formatear sesiones para FullCalendar
  const calendarEvents = sessions
    .filter((session) => {
      // Filtrar sesiones con fechas válidas
      if (!session.start_time || !session.end_time) {
        console.warn('⚠️ Sesión sin fechas válidas:', session.id);
        return false;
      }
      return true;
    })
    .map((session) => {
      // Asegurar que las fechas estén en formato ISO válido para FullCalendar
      const startDate = new Date(session.start_time);
      const endDate = new Date(session.end_time);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('⚠️ Sesión con fechas inválidas:', {
          id: session.id,
          start_time: session.start_time,
          end_time: session.end_time,
        });
        return null;
      }

      return {
        id: session.id,
        title: session.title || 'Sesión de estudio',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: getStatusColor(session.status),
        borderColor: getStatusColor(session.status),
        extendedProps: {
          status: session.status,
          description: session.description,
          courseId: session.course_id,
        },
      };
    })
    .filter((event) => event !== null); // Filtrar eventos nulos

  console.log('📅 Eventos del calendario formateados (plan detail):', {
    totalSessions: sessions.length,
    validEvents: calendarEvents.length,
    sampleEvent: calendarEvents[0] || null,
  });

  // Estadísticas
  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    planned: sessions.filter(s => s.status === 'planned').length,
    inProgress: sessions.filter(s => s.status === 'in_progress').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Cargando plan de estudio...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-slate-300 mb-6">{error || 'Plan no encontrado'}</p>
          <button
            onClick={() => router.push('/study-planner/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Modal de Edición */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl p-6 border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Editar Plan</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                disabled={updating}
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Plan
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nombre del plan"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Descripción del plan (opcional)"
                  rows={3}
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Horas por Semana
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.goal_hours_per_week}
                  onChange={(e) => setEditForm({ ...editForm, goal_hours_per_week: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Horas por semana"
                  disabled={updating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={updating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={updating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de Sesión
                </label>
                <select
                  value={editForm.preferred_session_type}
                  onChange={(e) => setEditForm({ ...editForm, preferred_session_type: e.target.value as 'short' | 'medium' | 'long' })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={updating}
                >
                  <option value="short">Corta (≤30 min)</option>
                  <option value="medium">Media (30-60 min)</option>
                  <option value="long">Larga (&gt;60 min)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Días Preferidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayNumbers.map((dayNum) => (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => toggleDay(dayNum)}
                      disabled={updating}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        (editForm.preferred_days || []).includes(dayNum)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } disabled:opacity-50`}
                    >
                      {dayLabels[dayNum]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Bloques de Tiempo
                  </label>
                  <button
                    type="button"
                    onClick={addTimeBlock}
                    disabled={updating}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(!editForm.preferred_time_blocks || editForm.preferred_time_blocks.length === 0) ? (
                    <p className="text-slate-400 text-sm">No hay bloques de tiempo configurados</p>
                  ) : (
                    (editForm.preferred_time_blocks || []).map((block, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-slate-700 rounded-lg">
                        <select
                          value={block.day ?? 1}
                          onChange={(e) => updateTimeBlock(index, 'day', parseInt(e.target.value))}
                          className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={updating}
                        >
                          {dayNumbers.map((dayNum) => (
                            <option key={dayNum} value={dayNum}>
                              {dayLabels[dayNum]}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={block.start || '09:00'}
                          onChange={(e) => updateTimeBlock(index, 'start', e.target.value)}
                          className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={updating}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={block.end || '10:00'}
                          onChange={(e) => updateTimeBlock(index, 'end', e.target.value)}
                          className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={updating}
                        />
                        <button
                          type="button"
                          onClick={() => removeTimeBlock(index)}
                          disabled={updating}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={updating || !editForm.name.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
                  <button
                    onClick={() => router.push('/study-planner/dashboard')}
                    className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Volver al Dashboard
                  </button>

                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-purple-500/20">
                            <BookOpen className="w-6 h-6 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white">{plan.name}</h1>
                            {plan.description && (
                              <p className="text-slate-300 mt-2">{plan.description}</p>
                            )}
                          </div>
                        </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-6">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">
                      <span className="text-white font-semibold">{plan.goal_hours_per_week}h</span> por semana
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">
                      <span className="text-white font-semibold">{stats.total}</span> sesiones
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm">
                      <span className="text-white font-semibold">{stats.completed}</span> completadas
                    </span>
                  </div>
                  {plan.start_date && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">
                        Inicio: <span className="text-white font-semibold">
                          {new Date(plan.start_date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditPlan()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Editar plan"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeletePlan()}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  title="Eliminar plan"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
                {sessions.length === 0 ? (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex-1">
                    <p className="text-yellow-300 text-sm mb-3">
                      ⚠️ No se encontraron sesiones para este plan. Puedes regenerarlas ahora.
                    </p>
                    <button
                      onClick={handleRegenerateSessions}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Regenerar Sesiones
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleRegenerateSessions}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Regenerar Sesiones
                    </button>
                    <button
                      onClick={handleDeleteSessions}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Eliminar Todas las Sesiones
                    </button>
                  </>
                )}
            </div>
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-white font-bold text-xl">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Planificadas</p>
                <p className="text-white font-bold text-xl">{stats.planned}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">En progreso</p>
                <p className="text-white font-bold text-xl">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Completadas</p>
                <p className="text-white font-bold text-xl">{stats.completed}</p>
              </div>
            </div>
          </div>
        </motion.div>

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
            {calendarEvents.length > 0 ? (
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
                dayHeaderFormat={{ weekday: 'short' }}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                allDaySlot={false}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No hay sesiones programadas</p>
                <p className="text-sm">
                  {sessions.length === 0 
                    ? 'Las sesiones se crearán automáticamente cuando crees un plan con cursos y horarios configurados.'
                    : `Se encontraron ${sessions.length} sesión(es) pero no se pudieron mostrar en el calendario.`}
                </p>
              </div>
            )}
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
              color: #ffffff !important;
              font-weight: 600 !important;
              text-transform: capitalize !important;
              font-size: 0.875rem !important;
            }
            
            .calendar-container :global(.fc-col-header-cell a) {
              color: #ffffff !important;
            }
            
            .calendar-container :global(.fc-col-header-cell th) {
              color: #ffffff !important;
            }
            
            .calendar-container :global(.fc-daygrid-day-top) {
              flex-direction: row !important;
              justify-content: flex-start !important;
            }
            
            .calendar-container :global(.fc-daygrid-day-number) {
              color: #e2e8f0 !important;
              padding: 0.5rem !important;
              font-weight: 500 !important;
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

        {/* Lista de Sesiones */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-400" />
              Próximas Sesiones
            </h2>
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{session.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.start_time).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.start_time).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} - {new Date(session.end_time).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: `${getStatusColor(session.status)}20`,
                            color: getStatusColor(session.status),
                            border: `1px solid ${getStatusColor(session.status)}40`,
                          }}
                        >
                          {getStatusLabel(session.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

