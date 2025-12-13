import { PersonalPlan, PersonalPlanId, BillingCycle } from '../types/subscription.types';

/**
 * Servicio para gestionar planes de suscripción personal
 */
export class PersonalSubscriptionService {
  /**
   * Obtiene todos los planes personales disponibles
   */
  static getPersonalPlans(): PersonalPlan[] {
    return [
      {
        id: 'basic',
        name: 'Básico',
        tagline: 'Perfecto para empezar tu aprendizaje',
        priceMonthly: 1000,
        priceYearly: 10000, // Ahorro ~17%
        currency: 'MXN',
        benefits: [
          {
            id: 'free-courses',
            name: 'Cursos gratis',
            description: '1 curso gratis al mes',
          },
          {
            id: 'coupons',
            name: 'Cupones de descuento',
            description: 'Cupones para cursos adicionales',
          },
          {
            id: 'community-points',
            name: 'Puntos en comunidades',
            description: '100 puntos/mes para comunidades',
          },
          {
            id: 'consultations',
            name: 'Asesorías',
            description: '1 asesoría gratis al mes (30 min)',
          },
          {
            id: 'public-communities',
            name: 'Comunidades públicas',
            description: 'Acceso a comunidades públicas',
          },
          {
            id: 'premium-news',
            name: 'Noticias premium',
            description: 'Acceso a noticias premium',
          },
          {
            id: 'certifications',
            name: 'Certificaciones',
            description: 'Certificaciones de cursos completados',
          },
          {
            id: 'email-support',
            name: 'Soporte',
            description: 'Soporte por email (24-48h)',
          },
        ],
        features: [
          '1 curso gratis al mes',
          'Cupones de descuento para cursos adicionales',
          '100 puntos/mes para comunidades',
          '1 asesoría gratis al mes (30 min)',
          'Acceso a comunidades públicas',
          'Noticias premium',
          'Certificaciones de cursos completados',
          'Soporte por email (24-48h)',
        ],
        freeCoursesPerMonth: 1,
        communityPointsPerMonth: 100,
        consultationsPerMonth: 1,
        consultationDurationMinutes: 30,
        hasExclusiveCommunities: false,
        hasVipCommunities: false,
        hasPremiumNews: true,
        hasEarlyAccessNews: false,
        hasExclusiveNews: false,
        hasStandardCertifications: true,
        hasPremiumCertifications: false,
        hasCustomCertifications: false,
        supportType: 'email',
        supportResponseTime: '24-48h',
      },
      {
        id: 'premium',
        name: 'Premium',
        tagline: 'Ideal para aprendizaje avanzado',
        priceMonthly: 1499,
        priceYearly: 14990, // Ahorro ~17%
        currency: 'MXN',
        isPopular: true,
        badge: 'Más Popular',
        benefits: [
          {
            id: 'free-courses',
            name: 'Cursos gratis',
            description: '5 cursos gratis al mes',
          },
          {
            id: 'course-discount',
            name: 'Descuento en cursos',
            description: '75% de descuento en cursos adicionales',
          },
          {
            id: 'community-points',
            name: 'Puntos en comunidades',
            description: '250 puntos/mes para comunidades',
          },
          {
            id: 'consultations',
            name: 'Asesorías',
            description: '2 asesorías gratis al mes (30 min cada una)',
          },
          {
            id: 'exclusive-communities',
            name: 'Comunidades exclusivas',
            description: 'Acceso a comunidades públicas y exclusivas',
          },
          {
            id: 'premium-news',
            name: 'Noticias premium',
            description: 'Noticias premium + acceso anticipado',
          },
          {
            id: 'premium-certifications',
            name: 'Certificaciones premium',
            description: 'Certificaciones premium',
          },
          {
            id: 'priority-access',
            name: 'Acceso prioritario',
            description: 'Prioridad en lista de espera de nuevos cursos',
          },
          {
            id: 'priority-support',
            name: 'Soporte prioritario',
            description: 'Soporte prioritario por email (12-24h)',
          },
          {
            id: 'exclusive-resources',
            name: 'Recursos exclusivos',
            description: 'Acceso a recursos descargables exclusivos',
          },
        ],
        features: [
          '5 cursos gratis al mes',
          '75% de descuento en cursos adicionales',
          '250 puntos/mes para comunidades',
          '2 asesorías gratis al mes (30 min cada una)',
          'Acceso a comunidades públicas y exclusivas',
          'Noticias premium + acceso anticipado',
          'Certificaciones premium',
          'Prioridad en lista de espera de nuevos cursos',
          'Soporte prioritario por email (12-24h)',
          'Acceso a recursos descargables exclusivos',
        ],
        freeCoursesPerMonth: 5,
        courseDiscount: 75,
        communityPointsPerMonth: 250,
        consultationsPerMonth: 2,
        consultationDurationMinutes: 30,
        hasExclusiveCommunities: true,
        hasVipCommunities: false,
        hasPremiumNews: true,
        hasEarlyAccessNews: true,
        hasExclusiveNews: false,
        hasStandardCertifications: false,
        hasPremiumCertifications: true,
        hasCustomCertifications: false,
        supportType: 'priority-email',
        supportResponseTime: '12-24h',
      },
      {
        id: 'pro',
        name: 'Pro',
        tagline: 'Acceso completo a todo el contenido',
        priceMonthly: 2499,
        priceYearly: 24990, // Ahorro ~17%
        currency: 'MXN',
        benefits: [
          {
            id: 'unlimited-courses',
            name: 'Cursos ilimitados',
            description: 'Acceso ilimitado a todos los cursos',
          },
          {
            id: 'course-discount',
            name: 'Descuento en cursos',
            description: '90% de descuento en cursos premium adicionales',
          },
          {
            id: 'community-points',
            name: 'Puntos en comunidades',
            description: '500 puntos/mes para comunidades',
          },
          {
            id: 'consultations',
            name: 'Asesorías',
            description: '4+ asesorías gratis al mes (60 min cada una)',
          },
          {
            id: 'vip-communities',
            name: 'Comunidades VIP',
            description: 'Acceso a todas las comunidades (incluyendo exclusivas VIP)',
          },
          {
            id: 'exclusive-news',
            name: 'Noticias exclusivas',
            description: 'Noticias premium + acceso anticipado + contenido exclusivo',
          },
          {
            id: 'custom-certifications',
            name: 'Certificaciones personalizadas',
            description: 'Certificaciones premium + certificados personalizados',
          },
          {
            id: 'priority-access',
            name: 'Acceso prioritario',
            description: 'Acceso prioritario a nuevos cursos',
          },
          {
            id: '24-7-support',
            name: 'Soporte 24/7',
            description: 'Soporte 24/7 por email y chat',
          },
          {
            id: 'unlimited-resources',
            name: 'Recursos ilimitados',
            description: 'Recursos descargables ilimitados',
          },
          {
            id: 'profile-badge',
            name: 'Badge especial',
            description: 'Badge especial en perfil',
          },
          {
            id: 'exclusive-events',
            name: 'Eventos exclusivos',
            description: 'Invitaciones a eventos exclusivos',
          },
          {
            id: 'beta-access',
            name: 'Acceso beta',
            description: 'Acceso beta a nuevas funcionalidades',
          },
        ],
        features: [
          'Acceso ilimitado a todos los cursos',
          '90% de descuento en cursos premium adicionales',
          '500 puntos/mes para comunidades',
          '4+ asesorías gratis al mes (60 min cada una)',
          'Acceso a todas las comunidades (incluyendo exclusivas VIP)',
          'Noticias premium + acceso anticipado + contenido exclusivo',
          'Certificaciones premium + certificados personalizados',
          'Acceso prioritario a nuevos cursos',
          'Soporte 24/7 por email y chat',
          'Recursos descargables ilimitados',
          'Badge especial en perfil',
          'Invitaciones a eventos exclusivos',
          'Acceso beta a nuevas funcionalidades',
        ],
        freeCoursesPerMonth: undefined, // Ilimitados
        courseDiscount: 90,
        communityPointsPerMonth: 500,
        consultationsPerMonth: 4,
        consultationDurationMinutes: 60,
        hasExclusiveCommunities: true,
        hasVipCommunities: true,
        hasPremiumNews: true,
        hasEarlyAccessNews: true,
        hasExclusiveNews: true,
        hasStandardCertifications: false,
        hasPremiumCertifications: true,
        hasCustomCertifications: true,
        supportType: '24-7',
        supportResponseTime: 'Inmediato',
      },
    ];
  }

  /**
   * Obtiene un plan personal por ID
   */
  static getPlanById(planId: PersonalPlanId): PersonalPlan | undefined {
    return this.getPersonalPlans().find((plan) => plan.id === planId);
  }

  /**
   * Calcula el precio según el ciclo de facturación
   */
  static calculatePrice(plan: PersonalPlan, billingCycle: BillingCycle): number {
    return billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  }

  /**
   * Formatea el precio con formato de moneda
   */
  static formatPrice(amount: number, currency: string = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Calcula el ahorro porcentual al elegir plan anual
   */
  static calculateYearlySavings(plan: PersonalPlan): number {
    const monthlyTotal = plan.priceMonthly * 12;
    const savings = monthlyTotal - plan.priceYearly;
    const percentage = (savings / monthlyTotal) * 100;
    return Math.round(percentage);
  }

  /**
   * Verifica si un plan tiene un beneficio específico
   */
  static hasBenefit(plan: PersonalPlan, benefitId: string): boolean {
    return plan.benefits.some((benefit) => benefit.id === benefitId);
  }
}

