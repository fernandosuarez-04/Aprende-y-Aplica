/**
 * API de LIA Analytics - Conversaciones
 * 
 * Lista paginada de conversaciones con detalles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    
    const supabase = await createClient();
    
    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const contextType = searchParams.get('contextType');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'started_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Construir query base
    let query = supabase
      .from('lia_conversations')
      .select(`
        conversation_id,
        user_id,
        context_type,
        started_at,
        ended_at,
        total_messages,
        total_lia_messages,
        device_type,
        browser,
        is_completed
      `, { count: 'exact' });
    
    // Aplicar filtros
    if (contextType) {
      query = query.eq('context_type', contextType);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('started_at', endDate);
    }
    
    // Aplicar ordenamiento y paginación
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data: conversations, count, error } = await query;
    
    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener conversaciones' },
        { status: 500 }
      );
    }
    
    // Obtener información de usuarios (usando tabla 'users')
    const userIds = [...new Set(conversations?.map(c => c.user_id) || [])];
    let usersMap = new Map();
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, display_name, email, profile_picture_url')
        .in('id', userIds);
      
      usersMap = new Map(users?.map(u => [u.id, u]) || []);
    }
    
    // Helper para obtener nombre de usuario
    const getUserName = (u: any) => {
      if (u.display_name) return u.display_name;
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      if (fullName) return fullName;
      return u.username || 'Usuario';
    };
    
    // Obtener métricas de cada conversación
    const conversationIds = conversations?.map(c => c.conversation_id) || [];
    
    let messagesMetrics: any[] = [];
    if (conversationIds.length > 0) {
      const { data } = await supabase
        .from('lia_messages')
        .select('conversation_id, tokens_used, cost_usd, response_time_ms')
        .in('conversation_id', conversationIds);
      messagesMetrics = data || [];
    }
    
    // Agrupar métricas por conversación
    const metricsMap = new Map<string, { tokens: number; cost: number; avgResponseTime: number; messageCount: number; totalResponseTime: number }>();
    
    messagesMetrics?.forEach(m => {
      const existing = metricsMap.get(m.conversation_id) || { 
        tokens: 0, 
        cost: 0, 
        avgResponseTime: 0, 
        messageCount: 0,
        totalResponseTime: 0
      };
      
      const totalResponseTime = existing.totalResponseTime + (m.response_time_ms || 0);
      const messageCount = existing.messageCount + 1;
      
      metricsMap.set(m.conversation_id, {
        tokens: existing.tokens + (m.tokens_used || 0),
        cost: existing.cost + (m.cost_usd || 0),
        avgResponseTime: m.response_time_ms ? Math.round(totalResponseTime / messageCount) : existing.avgResponseTime,
        messageCount,
        totalResponseTime
      });
    });
    
    // Enriquecer datos de conversaciones
    const enrichedConversations = conversations?.map(conv => {
      const user = usersMap.get(conv.user_id);
      const metrics = metricsMap.get(conv.conversation_id) || { 
        tokens: 0, 
        cost: 0, 
        avgResponseTime: 0, 
        messageCount: 0 
      };
      
      // Calcular duración
      let durationSeconds = null;
      if (conv.started_at && conv.ended_at) {
        durationSeconds = Math.round(
          (new Date(conv.ended_at).getTime() - new Date(conv.started_at).getTime()) / 1000
        );
      }
      
      return {
        id: conv.conversation_id,
        user: user ? {
          id: user.id,
          name: getUserName(user),
          email: user.email,
          avatar: user.profile_picture_url
        } : null,
        contextType: conv.context_type || 'general',
        startedAt: conv.started_at,
        endedAt: conv.ended_at,
        totalMessages: conv.total_messages || 0,
        liaMessages: conv.total_lia_messages || 0,
        tokens: metrics.tokens,
        cost: Number(metrics.cost.toFixed(6)),
        avgResponseTimeMs: metrics.avgResponseTime,
        durationSeconds,
        isCompleted: conv.is_completed,
        deviceType: conv.device_type,
        browser: conv.browser
      };
    }) || [];
    
    // Calcular estadísticas de la página
    const pageStats = {
      totalTokens: enrichedConversations.reduce((sum, c) => sum + c.tokens, 0),
      totalCost: enrichedConversations.reduce((sum, c) => sum + c.cost, 0),
      avgMessages: enrichedConversations.length > 0 
        ? Math.round(enrichedConversations.reduce((sum, c) => sum + c.totalMessages, 0) / enrichedConversations.length)
        : 0
    };
    
    return NextResponse.json({
      success: true,
      data: {
        conversations: enrichedConversations,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        pageStats
      }
    });
    
  } catch (error) {
    console.error('Error en LIA Analytics Conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
