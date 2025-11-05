import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { PersonalSubscriptionService } from '@/features/subscriptions/services/personal-subscription.service';
import { NotificationService } from '@/features/notifications/services/notification.service';
import type { CartItem } from '@/core/stores/shoppingCartStore';

/**
 * POST /api/cart/checkout
 * Procesa el checkout del carrito de compras
 * Simula el pago y agrega los cursos y suscripciones a la cuenta del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const currentUser = await SessionService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items }: { items: CartItem[] } = body;

    console.log('📦 Procesando checkout con items:', items.length);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    const results = {
      courses: [] as any[],
      subscriptions: [] as any[],
      errors: [] as string[],
    };

    // Procesar cada item del carrito
    for (const item of items) {
      try {
        console.log(`🔄 Procesando item: ${item.title} (${item.itemType})`);
        
        if (item.itemType === 'course') {
          // Procesar curso
          const courseResult = await processCoursePurchase(
            supabase,
            currentUser.id,
            item.itemId,
            item.price * item.quantity
          );
          
          if (courseResult.success) {
            console.log(`✅ Curso procesado: ${item.title}`);
            results.courses.push(courseResult.data);
          } else {
            console.error(`❌ Error procesando curso ${item.title}:`, courseResult.error);
            results.errors.push(`Error procesando curso ${item.title}: ${courseResult.error}`);
          }
        } else if (item.itemType === 'subscription') {
          // Procesar suscripción
          const subscriptionResult = await processSubscriptionPurchase(
            supabase,
            currentUser.id,
            item.itemId,
            item.title,
            item.price * item.quantity
          );
          
          if (subscriptionResult.success) {
            console.log(`✅ Suscripción procesada: ${item.title}`);
            results.subscriptions.push(subscriptionResult.data);
          } else {
            console.error(`❌ Error procesando suscripción ${item.title}:`, subscriptionResult.error);
            results.errors.push(`Error procesando suscripción ${item.title}: ${subscriptionResult.error}`);
          }
        } else {
          console.warn(`⚠️ Tipo de item desconocido: ${item.itemType}`);
          results.errors.push(`Tipo de item desconocido: ${item.itemType}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Excepción procesando ${item.title}:`, errorMessage);
        results.errors.push(`Error procesando ${item.title}: ${errorMessage}`);
      }
    }

    console.log(`📊 Resultados: ${results.courses.length} cursos, ${results.subscriptions.length} suscripciones, ${results.errors.length} errores`);

    // Si hay errores pero al menos una compra exitosa, retornar éxito parcial
    if (results.errors.length > 0 && results.courses.length === 0 && results.subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo procesar ningún item del carrito',
          details: results.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Compra procesada exitosamente',
      results: {
        coursesProcessed: results.courses.length,
        subscriptionsProcessed: results.subscriptions.length,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el checkout',
      },
      { status: 500 }
    );
  }
}

/**
 * Procesa la compra de un curso
 */
async function processCoursePurchase(
  supabase: any,
  userId: string,
  courseId: string,
  totalPrice: number
) {
  try {
    // Obtener el curso por ID o slug
    let { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, slug')
      .eq('id', courseId)
      .single();

    // Si no se encuentra por ID, intentar buscar por slug
    if (courseError || !course) {
      console.log(`⚠️ Curso no encontrado por ID "${courseId}", intentando por slug...`);
      const { data: courseBySlug, error: slugError } = await supabase
        .from('courses')
        .select('id, title, price, slug')
        .eq('slug', courseId)
        .single();
      
      if (!slugError && courseBySlug) {
        course = courseBySlug;
        courseError = null;
        console.log(`✅ Curso encontrado por slug: ${course.title}`);
      } else {
        console.error('❌ Error obteniendo curso:', courseError || slugError);
        return { success: false, error: `Curso no encontrado: ${(courseError || slugError)?.message || 'Curso no existe'}` };
      }
    }

    // Verificar si el usuario ya tiene acceso al curso
    const { data: existingPurchase } = await supabase
      .from('course_purchases')
      .select('purchase_id, access_status')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .eq('access_status', 'active')
      .maybeSingle();

    if (existingPurchase) {
      return { success: false, error: 'Ya tienes acceso a este curso' };
    }

    // Convertir precio a centavos
    const priceInCents = Math.round(totalPrice * 100);
    const finalPriceInCents = priceInCents > 0 ? priceInCents : 1;

    // Obtener o crear método de pago temporal
    let paymentMethodId: string;
    const { data: existingPaymentMethod } = await supabase
      .from('payment_methods')
      .select('payment_method_id')
      .eq('user_id', userId)
      .eq('payment_method_type', 'bank_transfer')
      .like('payment_method_name', '%Temporal%')
      .maybeSingle();

    if (existingPaymentMethod) {
      paymentMethodId = existingPaymentMethod.payment_method_id;
    } else {
      const { data: tempPaymentMethod, error: paymentMethodError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          payment_method_type: 'bank_transfer',
          payment_method_name: 'Pago Temporal (Sin API)',
          encrypted_data: {
            temporary: true,
            created_for: 'cart_checkout',
            created_at: new Date().toISOString(),
          },
        })
        .select('payment_method_id')
        .single();

      if (paymentMethodError || !tempPaymentMethod) {
        return { success: false, error: 'Error al crear método de pago' };
      }

      paymentMethodId = tempPaymentMethod.payment_method_id;
    }

    // Crear transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        course_id: course.id,
        amount_cents: finalPriceInCents,
        currency: 'MXN',
        transaction_status: 'completed',
        transaction_type: 'course_purchase',
        payment_method_id: paymentMethodId,
        processor_transaction_id: `CART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        processor_response: {
          method: 'temporary_purchase',
          note: 'Compra desde carrito (simulación)',
          from_cart: true,
        },
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error('❌ Error creando transacción:', transactionError);
      return { success: false, error: `Error al crear la transacción: ${transactionError?.message || 'Error desconocido'}` };
    }

    // Crear purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('course_purchases')
      .insert({
        user_id: userId,
        course_id: course.id,
        transaction_id: transaction.transaction_id,
        original_price_cents: finalPriceInCents,
        discounted_price_cents: finalPriceInCents,
        final_price_cents: finalPriceInCents,
        currency: 'MXN',
        access_status: 'active',
        purchase_method: 'direct',
        purchase_notes: 'Compra desde carrito (simulación)',
        metadata: {
          from_cart: true,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error('❌ Error creando purchase:', purchaseError);
      // Limpiar transacción si falla
      await supabase.from('transactions').delete().eq('transaction_id', transaction.transaction_id);
      return { success: false, error: `Error al crear la compra: ${purchaseError?.message || 'Error desconocido'}` };
    }

    // Crear enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .insert({
        user_id: userId,
        course_id: course.id,
        enrollment_status: 'active',
        overall_progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment (no crítico):', enrollmentError);
      // No fallar si el enrollment falla, ya que el purchase está creado
    }

    // Crear notificación para el usuario
    try {
      await NotificationService.createNotification({
        userId: userId,
        notificationType: 'course_purchased',
        title: 'Curso adquirido',
        message: `Has adquirido el curso "${course.title}". ¡Comienza tu aprendizaje ahora!`,
        priority: 'medium',
        metadata: {
          courseId: course.id,
          courseSlug: course.slug,
          courseTitle: course.title,
          purchaseId: purchase.purchase_id,
          actionUrl: `/courses/${course.slug}`,
        },
      });
      console.log(`✅ Notificación creada para curso: ${course.title}`);
    } catch (notifError) {
      console.error('Error creando notificación (no crítico):', notifError);
      // No fallar si la notificación falla
    }

    return {
      success: true,
      data: {
        courseId: course.id,
        courseTitle: course.title,
        purchaseId: purchase.purchase_id,
      },
    };
  } catch (error) {
    console.error('Error in processCoursePurchase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Procesa la compra de una suscripción
 */
async function processSubscriptionPurchase(
  supabase: any,
  userId: string,
  planId: string,
  title: string,
  totalPrice: number
) {
  try {
    // Extraer billing cycle del título
    const isMonthly = title.toLowerCase().includes('mensual') || title.toLowerCase().includes('mes');
    const billingCycle = isMonthly ? 'monthly' : 'yearly';

    // Validar que el plan existe
    const plan = PersonalSubscriptionService.getPlanById(planId as any);
    if (!plan) {
      return { success: false, error: 'Plan no encontrado' };
    }

    // Verificar si ya tiene una suscripción activa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('user_id', userId)
      .is('course_id', null)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return { success: false, error: 'Ya tienes una suscripción activa' };
    }

    // Calcular fechas
    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Crear suscripción
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        subscription_type: billingCycle === 'monthly' ? 'monthly' : 'yearly',
        subscription_status: 'active',
        price_cents: Math.round(totalPrice * 100),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_billing_date: endDate.toISOString(),
        course_id: null, // NULL para suscripciones personales
      })
      .select()
      .single();

    if (subscriptionError || !subscription) {
      console.error('❌ Error creando suscripción:', subscriptionError);
      return { success: false, error: `Error al crear la suscripción: ${subscriptionError?.message || 'Error desconocido'}` };
    }

    // Crear notificación para el usuario
    try {
      await NotificationService.createNotification({
        userId: userId,
        notificationType: 'subscription_activated',
        title: 'Suscripción activada',
        message: `Tu suscripción "${plan.name}" (${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}) ha sido activada exitosamente.`,
        priority: 'medium',
        metadata: {
          subscriptionId: subscription.subscription_id,
          planId: planId,
          planName: plan.name,
          billingCycle: billingCycle,
          actionUrl: '/subscriptions',
        },
      });
      console.log(`✅ Notificación creada para suscripción: ${plan.name}`);
    } catch (notifError) {
      console.error('Error creando notificación (no crítico):', notifError);
      // No fallar si la notificación falla
    }

    return {
      success: true,
      data: {
        subscriptionId: subscription.subscription_id,
        planId: planId,
        billingCycle: billingCycle,
      },
    };
  } catch (error) {
    console.error('Error in processSubscriptionPurchase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

