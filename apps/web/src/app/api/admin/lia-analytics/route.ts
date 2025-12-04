/**
 * API de LIA Analytics - Endpoint Principal
 * 
 * Proporciona métricas resumidas del uso y costos de LIA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

function getDateRange(period: string): DateRange {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  
  let startDate = new Date(now);
  
  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar rol de administrador
    const { data: userData } = await supabase
      .from('usuarios')
      .select('cargo_rol')
      .eq('id', user.id)
      .single();
    
    if (userData?.cargo_rol !== 'Administrador') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }
    
    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');
    
    let startDate: Date;
    let endDate: Date;
    
    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    
    // ===== MÉTRICAS PRINCIPALES =====
    
    // Total de conversaciones
    const { count: totalConversations } = await supabase
      .from('lia_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    // Total de mensajes y métricas
    const { data: messagesData } = await supabase
      .from('lia_messages')
      .select('tokens_used, cost_usd, response_time_ms, model_used, role')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    const totalMessages = messagesData?.length || 0;
    const assistantMessages = messagesData?.filter(m => m.role === 'assistant') || [];
    const totalTokens = messagesData?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0;
    const totalCostUsd = messagesData?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;
    
    // Tiempo de respuesta promedio (solo mensajes del asistente)
    const responseTimes = assistantMessages
      .filter(m => m.response_time_ms)
      .map(m => m.response_time_ms);
    const avgResponseTimeMs = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    // Actividades completadas
    const { count: completedActivities } = await supabase
      .from('lia_activity_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());
    
    // ===== COSTOS POR DÍA =====
    const { data: dailyCosts } = await supabase
      .from('lia_messages')
      .select('created_at, cost_usd, tokens_used')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });
    
    // Agrupar por día
    const costsByDay = new Map<string, { cost: number; tokens: number; messages: number }>();
    dailyCosts?.forEach(msg => {
      const date = new Date(msg.created_at).toISOString().split('T')[0];
      const existing = costsByDay.get(date) || { cost: 0, tokens: 0, messages: 0 };
      costsByDay.set(date, {
        cost: existing.cost + (msg.cost_usd || 0),
        tokens: existing.tokens + (msg.tokens_used || 0),
        messages: existing.messages + 1
      });
    });
    
    const costsByPeriod = Array.from(costsByDay.entries()).map(([date, data]) => ({
      date,
      cost: Number(data.cost.toFixed(6)),
      tokens: data.tokens,
      messages: data.messages
    }));
    
    // ===== DISTRIBUCIÓN POR CONTEXTO =====
    const { data: contextData } = await supabase
      .from('lia_conversations')
      .select(`
        context_type,
        conversation_id
      `)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    // Obtener costos por conversación
    const conversationIds = contextData?.map(c => c.conversation_id) || [];
    
    const { data: messagesByConversation } = await supabase
      .from('lia_messages')
      .select('conversation_id, cost_usd, tokens_used')
      .in('conversation_id', conversationIds);
    
    // Crear mapa de costos por conversación
    const costByConversation = new Map<string, { cost: number; tokens: number }>();
    messagesByConversation?.forEach(m => {
      const existing = costByConversation.get(m.conversation_id) || { cost: 0, tokens: 0 };
      costByConversation.set(m.conversation_id, {
        cost: existing.cost + (m.cost_usd || 0),
        tokens: existing.tokens + (m.tokens_used || 0)
      });
    });
    
    // Agrupar por tipo de contexto
    const contextCounts = new Map<string, { count: number; cost: number; tokens: number }>();
    contextData?.forEach(conv => {
      const type = conv.context_type || 'general';
      const convCosts = costByConversation.get(conv.conversation_id) || { cost: 0, tokens: 0 };
      const existing = contextCounts.get(type) || { count: 0, cost: 0, tokens: 0 };
      contextCounts.set(type, {
        count: existing.count + 1,
        cost: existing.cost + convCosts.cost,
        tokens: existing.tokens + convCosts.tokens
      });
    });
    
    const totalContextCount = Array.from(contextCounts.values()).reduce((sum, c) => sum + c.count, 0);
    const contextDistribution = Array.from(contextCounts.entries()).map(([contextType, data]) => ({
      contextType,
      count: data.count,
      cost: Number(data.cost.toFixed(6)),
      tokens: data.tokens,
      percentage: totalContextCount > 0 ? Number(((data.count / totalContextCount) * 100).toFixed(1)) : 0
    }));
    
    // ===== USO POR MODELO =====
    const modelCounts = new Map<string, { tokens: number; cost: number; count: number }>();
    assistantMessages?.forEach(m => {
      const model = m.model_used || 'gpt-4o-mini';
      const existing = modelCounts.get(model) || { tokens: 0, cost: 0, count: 0 };
      modelCounts.set(model, {
        tokens: existing.tokens + (m.tokens_used || 0),
        cost: existing.cost + (m.cost_usd || 0),
        count: existing.count + 1
      });
    });
    
    const totalModelTokens = Array.from(modelCounts.values()).reduce((sum, m) => sum + m.tokens, 0);
    const modelUsage = Array.from(modelCounts.entries()).map(([model, data]) => ({
      model,
      tokens: data.tokens,
      cost: Number(data.cost.toFixed(6)),
      count: data.count,
      percentage: totalModelTokens > 0 ? Number(((data.tokens / totalModelTokens) * 100).toFixed(1)) : 0
    }));
    
    // ===== MÉTRICAS DE HOY Y COMPARACIÓN =====
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const { data: todayMessages } = await supabase
      .from('lia_messages')
      .select('cost_usd, tokens_used')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());
    
    const todayCost = todayMessages?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;
    const todayTokens = todayMessages?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0;
    
    // Ayer para comparación
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);
    
    const { data: yesterdayMessages } = await supabase
      .from('lia_messages')
      .select('cost_usd, tokens_used')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());
    
    const yesterdayCost = yesterdayMessages?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;
    
    // Calcular cambio porcentual
    const costChange = yesterdayCost > 0 
      ? Number((((todayCost - yesterdayCost) / yesterdayCost) * 100).toFixed(1))
      : 0;
    
    // ===== PROYECCIÓN MENSUAL =====
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailyCost = daysInPeriod > 0 ? totalCostUsd / daysInPeriod : 0;
    const projectedMonthlyCost = avgDailyCost * 30;
    
    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: period
        },
        summary: {
          totalConversations: totalConversations || 0,
          totalMessages,
          totalTokens,
          totalCostUsd: Number(totalCostUsd.toFixed(6)),
          avgResponseTimeMs,
          completedActivities: completedActivities || 0
        },
        today: {
          cost: Number(todayCost.toFixed(6)),
          tokens: todayTokens,
          messages: todayMessages?.length || 0,
          costChange
        },
        projections: {
          dailyAvg: Number(avgDailyCost.toFixed(6)),
          monthlyEstimate: Number(projectedMonthlyCost.toFixed(4))
        },
        costsByPeriod,
        contextDistribution,
        modelUsage
      }
    });
    
  } catch (error) {
    console.error('Error en LIA Analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

