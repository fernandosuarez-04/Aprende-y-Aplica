/**
 * Tipos e interfaces para suscripciones personales y business
 */

export type SubscriptionType = 'personal' | 'business';

export type BillingCycle = 'monthly' | 'yearly';

export type PersonalPlanId = 'basic' | 'premium' | 'pro';

export type BusinessPlanId = 'team' | 'business' | 'enterprise';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';

export interface SubscriptionBenefit {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface PersonalPlan {
  id: PersonalPlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  benefits: SubscriptionBenefit[];
  features: string[];
  isPopular?: boolean;
  badge?: string;
  // Beneficios específicos
  freeCoursesPerMonth?: number;
  courseDiscount?: number;
  communityPointsPerMonth?: number;
  consultationsPerMonth?: number;
  consultationDurationMinutes?: number;
  hasExclusiveCommunities?: boolean;
  hasVipCommunities?: boolean;
  hasPremiumNews?: boolean;
  hasEarlyAccessNews?: boolean;
  hasExclusiveNews?: boolean;
  hasStandardCertifications?: boolean;
  hasPremiumCertifications?: boolean;
  hasCustomCertifications?: boolean;
  supportType?: 'email' | 'priority-email' | '24-7';
  supportResponseTime?: string;
}

export interface BusinessPlan {
  id: BusinessPlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  isPopular?: boolean;
  badge?: string;
  maxUsers?: number;
  isCustom?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  subscriptionType: SubscriptionType;
  planId: PersonalPlanId | BusinessPlanId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  price: number;
  currency: string;
  paymentMethodId?: string;
  autoRenew?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeature {
  name: string;
  description: string;
  basic?: boolean;
  premium?: boolean;
  pro?: boolean;
  team?: boolean;
  business?: boolean;
  enterprise?: boolean;
}

