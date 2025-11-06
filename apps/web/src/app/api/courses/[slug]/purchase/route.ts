import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/courses/[slug]/purchase
 * Procesa la compra de un curso para el usuario autenticado
 * 
 * Esta es una implementación temporal que crea la compra sin procesamiento de pago real
 * para que funcione mientras se implementa la integración con la API de pagos.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Await params (requerido en Next.js 15)
    const { slug } = await params;
    
    // Obtener usuario usando el sistema de sesiones de la app
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', currentUser.id, currentUser.email);

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya tiene acceso al curso
    const { data: existingPurchase } = await supabase
      .from('course_purchases')
      .select('purchase_id, access_status')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .eq('access_status', 'active')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Ya tienes acceso a este curso', purchase_id: existingPurchase.purchase_id },
        { status: 400 }
      );
    }

    // Convertir precio de string a centavos
    // El precio viene como "MX$3000" o "MX$0"
    let priceInCents = extractPriceInCents(course.price);
    
    // Si el curso es gratuito (price = 0), usar 1 centavo como mínimo
    // para cumplir con el constraint CHECK (amount_cents > 0)
    if (priceInCents === 0) {
      priceInCents = 1; // 1 centavo para cursos gratuitos
    }

    // 0. Crear método de pago temporal (si no existe ya)
    let paymentMethodId: string;
    const { data: existingPaymentMethod } = await supabase
      .from('payment_methods')
      .select('payment_method_id')
      .eq('user_id', currentUser.id)
      .eq('payment_method_type', 'bank_transfer')
      .like('payment_method_name', '%Temporal%')
      .single();

    if (existingPaymentMethod) {
      paymentMethodId = existingPaymentMethod.payment_method_id;
      console.log('📦 Usando método de pago existente:', paymentMethodId);
    } else {
      const { data: tempPaymentMethod, error: paymentMethodError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: currentUser.id,
          payment_method_type: 'bank_transfer', // Tipo válido según constraints
          payment_method_name: 'Pago Temporal (Sin API)',
          encrypted_data: { 
            temporary: true,
            created_for: 'course_purchase',
            note: 'Método temporal para compras sin API de pago',
            created_at: new Date().toISOString()
          },
          is_active: true,
          is_default: false
        })
        .select()
        .single();

      if (paymentMethodError || !tempPaymentMethod) {
        console.error('Error creando método de pago temporal:', paymentMethodError);
        return NextResponse.json(
          { error: 'Error al crear método de pago', details: paymentMethodError },
          { status: 500 }
        );
      }
      paymentMethodId = tempPaymentMethod.payment_method_id;
      console.log('📦 Método de pago temporal creado:', paymentMethodId);
    }

    // 1. Crear transacción (temporal, sin procesador de pago)
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        course_id: course.id,
        amount_cents: priceInCents,
        currency: 'MXN',
        transaction_status: 'completed',
        transaction_type: 'course_purchase',
        payment_method_id: paymentMethodId,
        processor_transaction_id: `TEMP-${Date.now()}`, // ID temporal
        processor_response: { 
          method: 'temporary_purchase',
          note: 'Compra temporal sin procesamiento de pago real'
        },
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Error al crear la transacción', details: transactionError },
        { status: 500 }
      );
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
        currency: 'MXN',
        access_status: 'active',
        purchase_method: 'direct',
        purchase_notes: 'Compra temporal (sin API de pago)',
        metadata: {
          temporary_purchase: true,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error('Error creating purchase:', purchaseError);
      // Intentar eliminar la transacción creada
      await supabase.from('transactions').delete().eq('transaction_id', transaction.transaction_id);
      
      return NextResponse.json(
        { error: 'Error al crear la compra', details: purchaseError },
        { status: 500 }
      );
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
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      // No revertimos la compra, solo lo registramos
      console.warn('Compra creada pero enrollment falló:', enrollmentError);
    }

    // 4. Actualizar el purchase con el enrollment_id si se creó correctamente
    if (enrollment) {
      await supabase
        .from('course_purchases')
        .update({ enrollment_id: enrollment.enrollment_id })
        .eq('purchase_id', purchase.purchase_id);
    }

    // 5. Crear notificación de inscripción en curso
    if (enrollment) {
      try {
        const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service')
        await AutoNotificationsService.notifyCourseEnrolled(
          currentUser.id,
          course.id,
          course.title,
          {
            purchase_id: purchase.purchase_id,
            enrollment_id: enrollment.enrollment_id,
            timestamp: new Date().toISOString()
          }
        )
      } catch (notificationError) {
        // No lanzar error para no afectar el flujo principal
        console.error('Error creando notificación de inscripción en curso:', notificationError)
      }
    }

    // 6. Retornar respuesta exitosa
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
        currency: 'MXN',
        access_status: 'active'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in purchase endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Función auxiliar para extraer el precio en centavos
 * Maneja formatos como "MX$3000" o directamente un número
 */
function extractPriceInCents(price: string | number): number {
  if (typeof price === 'number') {
    return Math.round(price * 100);
  }
  
  // Extraer números del string (ej: "MX$3000" -> 3000)
  const match = price.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const numValue = parseFloat(match[1]);
    return Math.round(numValue * 100);
  }
  
  return 0;
}

