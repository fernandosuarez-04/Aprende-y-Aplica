# Tablas de Base de Datos: Suscripciones Personales

Este documento describe la estructura de las tablas necesarias para gestionar suscripciones personales en el sistema.

## Tabla: subscription_plans_personal

Almacena los planes de suscripción personal disponibles.

```sql
CREATE TABLE subscription_plans_personal (
  plan_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tagline TEXT,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  badge_text VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_personal_active ON subscription_plans_personal(is_active);
```

## Tabla: subscription_benefits_personal

Almacena los beneficios de cada plan personal.

```sql
CREATE TABLE subscription_benefits_personal (
  benefit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans_personal(plan_id) ON DELETE CASCADE,
  benefit_key VARCHAR(100) NOT NULL,
  benefit_value JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(plan_id, benefit_key)
);

CREATE INDEX idx_subscription_benefits_personal_plan ON subscription_benefits_personal(plan_id);
```

## Tabla: subscriptions (Actualización)

La tabla `subscriptions` ya existe para suscripciones business. Necesitamos asegurarnos de que soporte también suscripciones personales.

### Campos necesarios:

```sql
-- Verificar que la tabla tenga estos campos:
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'business' CHECK (subscription_type IN ('personal', 'business')),
  ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

CREATE INDEX idx_subscriptions_user_type ON subscriptions(user_id, subscription_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(subscription_status);
```

### Estructura completa esperada:

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_type VARCHAR(20) NOT NULL DEFAULT 'business' CHECK (subscription_type IN ('personal', 'business')),
  plan_id VARCHAR(50) NOT NULL,
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'cancelled', 'expired', 'suspended')),
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  next_billing_date TIMESTAMP,
  cancelled_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_type ON subscriptions(subscription_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(subscription_status);
CREATE INDEX idx_subscriptions_user_type ON subscriptions(user_id, subscription_type);
```

## Datos iniciales: Planes Personales

```sql
-- Insertar planes personales
INSERT INTO subscription_plans_personal (plan_id, name, tagline, price_monthly_cents, price_yearly_cents, currency, is_active, is_popular, badge_text) VALUES
('basic', 'Básico', 'Perfecto para empezar tu aprendizaje', 100000, 1000000, 'MXN', TRUE, FALSE, NULL),
('premium', 'Premium', 'Ideal para aprendizaje avanzado', 59900, 599000, 'MXN', TRUE, TRUE, 'Más Popular'),
('pro', 'Pro', 'Acceso completo a todo el contenido', 99900, 999000, 'MXN', TRUE, FALSE, NULL);

-- Insertar beneficios para cada plan
-- Plan Básico
INSERT INTO subscription_benefits_personal (plan_id, benefit_key, benefit_value, display_order) VALUES
('basic', 'free_courses_per_month', '1', 1),
('basic', 'community_points_per_month', '100', 2),
('basic', 'consultations_per_month', '1', 3),
('basic', 'consultation_duration_minutes', '30', 4),
('basic', 'has_exclusive_communities', 'false', 5),
('basic', 'has_vip_communities', 'false', 6),
('basic', 'has_premium_news', 'true', 7),
('basic', 'has_early_access_news', 'false', 8),
('basic', 'has_exclusive_news', 'false', 9),
('basic', 'has_standard_certifications', 'true', 10),
('basic', 'has_premium_certifications', 'false', 11),
('basic', 'has_custom_certifications', 'false', 12),
('basic', 'support_type', 'email', 13),
('basic', 'support_response_time', '24-48h', 14);

-- Plan Premium
INSERT INTO subscription_benefits_personal (plan_id, benefit_key, benefit_value, display_order) VALUES
('premium', 'free_courses_per_month', '5', 1),
('premium', 'course_discount', '75', 2),
('premium', 'community_points_per_month', '250', 3),
('premium', 'consultations_per_month', '2', 4),
('premium', 'consultation_duration_minutes', '30', 5),
('premium', 'has_exclusive_communities', 'true', 6),
('premium', 'has_vip_communities', 'false', 7),
('premium', 'has_premium_news', 'true', 8),
('premium', 'has_early_access_news', 'true', 9),
('premium', 'has_exclusive_news', 'false', 10),
('premium', 'has_standard_certifications', 'false', 11),
('premium', 'has_premium_certifications', 'true', 12),
('premium', 'has_custom_certifications', 'false', 13),
('premium', 'support_type', 'priority-email', 14),
('premium', 'support_response_time', '12-24h', 15);

-- Plan Pro
INSERT INTO subscription_benefits_personal (plan_id, benefit_key, benefit_value, display_order) VALUES
('pro', 'unlimited_courses', 'true', 1),
('pro', 'course_discount', '90', 2),
('pro', 'community_points_per_month', '500', 3),
('pro', 'consultations_per_month', '4', 4),
('pro', 'consultation_duration_minutes', '60', 5),
('pro', 'has_exclusive_communities', 'true', 6),
('pro', 'has_vip_communities', 'true', 7),
('pro', 'has_premium_news', 'true', 8),
('pro', 'has_early_access_news', 'true', 9),
('pro', 'has_exclusive_news', 'true', 10),
('pro', 'has_standard_certifications', 'false', 11),
('pro', 'has_premium_certifications', 'true', 12),
('pro', 'has_custom_certifications', 'true', 13),
('pro', 'support_type', '24-7', 14),
('pro', 'support_response_time', 'Inmediato', 15);
```

## Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_benefits_personal ENABLE ROW LEVEL SECURITY;

-- Política para subscriptions: usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para subscription_plans_personal: todos pueden ver planes activos
CREATE POLICY "Anyone can view active plans" ON subscription_plans_personal
  FOR SELECT
  USING (is_active = TRUE);

-- Política para subscription_benefits_personal: todos pueden ver beneficios de planes activos
CREATE POLICY "Anyone can view benefits of active plans" ON subscription_benefits_personal
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM subscription_plans_personal 
    WHERE subscription_plans_personal.plan_id = subscription_benefits_personal.plan_id 
    AND subscription_plans_personal.is_active = TRUE
  ));
```

## Notas

1. Los precios se almacenan en centavos para evitar problemas de precisión con decimales.
2. La tabla `subscriptions` se usa tanto para suscripciones personales como business, diferenciadas por el campo `subscription_type`.
3. Los beneficios se almacenan como JSONB para flexibilidad, pero se recomienda mantener estructura consistente.
4. El sistema debe validar que no haya suscripciones duplicadas activas para el mismo usuario y tipo.
5. Los planes se pueden desactivar sin eliminar registros históricos cambiando `is_active` a FALSE.

