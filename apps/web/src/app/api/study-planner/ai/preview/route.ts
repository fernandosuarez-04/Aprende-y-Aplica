import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { goals, availability, preferences, selected_courses } = body

    // Validate request
    if (!goals || !availability || !preferences) {
      return NextResponse.json(
        { message: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    if (!selected_courses || selected_courses.length === 0) {
      return NextResponse.json(
        { message: 'Debes seleccionar al menos un curso' },
        { status: 400 }
      )
    }

    // TODO: Call AI service to generate preview
    // For now, return a mock preview
    const mockPreview = {
      plan_name: `Plan IA - ${goals.primary_goal || 'Aprendizaje'}`,
      total_sessions: selected_courses.length * 12,
      total_study_hours: selected_courses.length * 12 * (availability.daily_minutes / 60),
      estimated_completion_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      sessions_by_week: {},
      sessions_by_course: {},
      ai_metadata: {
        algorithm_version: '1.0.0',
        generation_timestamp: new Date().toISOString(),
        goals,
        availability,
        preferences,
        scores: {
          retention_score: 85,
          completion_score: 80,
          balance_score: 82,
        },
        techniques_applied: ['spaced_repetition', 'interleaving', 'pomodoro'],
        reasoning: 'Plan optimizado con IA para máximo aprendizaje',
      },
      insights: [
        {
          type: 'tip',
          category: 'retention',
          message: 'Tu plan está optimizado para máxima retención',
          icon: '🧠',
        },
      ],
    }

    return NextResponse.json({ success: true, preview: mockPreview })
  } catch (error) {
    console.error('Error generating AI preview:', error)
    return NextResponse.json(
      {
        message: 'Error al generar preview',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
