import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * POST /api/business/courses/[id]/purchase
 * Adquiere un curso para el usuario business autenticado
 * Requiere membresía activa
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: courseId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Validar que el usuario tenga membresía activa
    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa para adquirir cursos'
      }, { status: 403 })
    }

    // Obtener el curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, slug')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      logger.error('Error fetching course:', courseError)
      return NextResponse.json({
        success: false,
        error: 'Curso no encontrado'
      }, { status: 404 })
    }

    // Verificar si el usuario ya tiene acceso al curso
    const { data: existingPurchase } = await supabase
      .from('course_purchases')
      .select('purchase_id, access_status')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .eq('access_status', 'active')
      .single()

    if (existingPurchase) {
      return NextResponse.json({
        success: false,
        error: 'Ya tienes acceso a este curso'
      }, { status: 400 })
    }

    // Calcular precio en centavos
    const price = course.price || 0
    const priceInCents = Math.round(price * 100)

    // 0. Crear o obtener método de pago temporal (si no existe ya)
    let paymentMethodId: string
    const { data: existingPaymentMethod } = await supabase
      .from('payment_methods')
      .select('payment_method_id')
      .eq('user_id', currentUser.id)
      .eq('payment_method_type', 'bank_transfer')
      .like('payment_method_name', '%Temporal%')
      .maybeSingle()

    if (existingPaymentMethod) {
      paymentMethodId = existingPaymentMethod.payment_method_id
      logger.info('Usando método de pago existente:', paymentMethodId)
    } else {
      const { data: tempPaymentMethod, error: paymentMethodError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: currentUser.id,
          payment_method_type: 'bank_transfer',
          payment_method_name: 'Pago Temporal (Business Panel)',
          encrypted_data: {
            temporary: true,
            created_for: 'business_panel_course_purchase',
            note: 'Método temporal para compras desde Business Panel',
            created_at: new Date().toISOString()
          },
          is_active: true,
          is_default: false
        })
        .select()
        .single()

      if (paymentMethodError || !tempPaymentMethod) {
        logger.error('Error creando método de pago temporal:', paymentMethodError)
        return NextResponse.json({
          success: false,
          error: 'Error al crear método de pago'
        }, { status: 500 })
      }
      paymentMethodId = tempPaymentMethod.payment_method_id
      logger.info('Método de pago temporal creado:', paymentMethodId)
    }

    // 1. Crear transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        course_id: course.id,
        payment_method_id: paymentMethodId,
        amount_cents: priceInCents,
        currency: 'USD',
        transaction_status: 'completed',
        transaction_type: 'course_purchase',
        processed_at: new Date().toISOString(),
        processor_response: {
          business_panel_purchase: true,
          subscription_required: true
        }
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      logger.error('Error creating transaction:', transactionError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear la transacción'
      }, { status: 500 })
    }

    // 2. Crear registro en course_purchases
    const { data: purchase, error: purchaseError } = await supabase
      .from('course_purchases')
      .insert({
        user_id: currentUser.id,
        course_id: course.id,
        transaction_id: transaction.transaction_id,
        original_price_cents: priceInCents,
        discounted_price_cents: priceInCents,
        final_price_cents: priceInCents,
        currency: 'USD',
        access_status: 'active',
        purchase_method: 'direct',
        purchase_notes: 'Compra desde Business Panel - Membresía activa requerida',
        metadata: {
          business_panel: true,
          subscription_required: true,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (purchaseError || !purchase) {
      logger.error('Error creating purchase:', purchaseError)
      // Intentar eliminar la transacción creada
      await supabase.from('transactions').delete().eq('transaction_id', transaction.transaction_id)
      
      return NextResponse.json({
        success: false,
        error: 'Error al crear la compra'
      }, { status: 500 })
    }

    // 3. Crear enrollment (inscripción al curso)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .insert({
        user_id: currentUser.id,
        course_id: course.id,
        enrollment_status: 'active',
        overall_progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (enrollmentError) {
      logger.error('Error creating enrollment:', enrollmentError)
      // No revertimos la compra, solo lo registramos
      logger.warn('Compra creada pero enrollment falló:', enrollmentError)
    }

    // 4. Actualizar el purchase con el enrollment_id si se creó correctamente
    if (enrollment) {
      await supabase
        .from('course_purchases')
        .update({ enrollment_id: enrollment.enrollment_id })
        .eq('purchase_id', purchase.purchase_id)
    }

    // 5. Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Curso adquirido exitosamente',
      data: {
        purchase_id: purchase.purchase_id,
        transaction_id: transaction.transaction_id,
        enrollment_id: enrollment?.enrollment_id,
        course_id: course.id,
        course_title: course.title,
        price_paid: priceInCents,
        currency: 'USD',
        access_status: 'active'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]/purchase:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

