# Tablas de Base de Datos para Carrito de Compras

Este documento describe las tablas de base de datos necesarias para implementar el sistema de carrito de compras, suscripciones y métodos de pago.

## IMPORTANTE

Estas tablas deben ser creadas manualmente en Supabase. Este documento solo las documenta.

---

## Tablas Requeridas

### 1. `shopping_cart_items`

Almacena los items en el carrito de compras de cada usuario.

```sql
CREATE TABLE shopping_cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'course', 'subscription', 'workshop', 'other'
  item_id UUID NOT NULL, -- ID del item específico (curso, suscripción, etc.)
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_shopping_cart_user ON shopping_cart_items(user_id);
CREATE INDEX idx_shopping_cart_item ON shopping_cart_items(item_type, item_id);
```

**Notas:**
- `item_type` y `item_id` forman una clave compuesta única por usuario
- `thumbnail` es opcional para mostrar imágenes en el carrito
- `quantity` permite agregar múltiples unidades del mismo item

---

### 2. `orders` / `purchases`

Almacena las órdenes/compras completadas.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  final_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled', 'refunded'
  payment_method_id UUID REFERENCES payment_methods(id),
  payment_intent_id VARCHAR(255), -- ID del intent de pago (Stripe, PayPal, etc.)
  payment_status VARCHAR(20), -- 'pending', 'succeeded', 'failed', 'refunded'
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Notas:**
- `order_number` debe ser único y puede generarse automáticamente (ej: ORD-2024-0001)
- `status` rastrea el estado de la orden
- `payment_intent_id` se usa para integración con procesadores de pago
- `billing_address` puede ser JSON para almacenar dirección completa

---

### 3. `order_items`

Almacena los items individuales de cada orden.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'course', 'subscription', 'workshop', 'other'
  item_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL, -- Precio al momento de la compra
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL, -- price * quantity
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item ON order_items(item_type, item_id);
```

**Notas:**
- Guarda el precio al momento de la compra (snapshot)
- `subtotal` es calculado: `price * quantity`
- `thumbnail` se guarda para referencia histórica

---

### 4. `subscriptions`

Almacena las suscripciones activas de los usuarios.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id), -- Si existe tabla de planes
  plan_name VARCHAR(255) NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'lifetime'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due', 'paused'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  payment_method_id UUID REFERENCES payment_methods(id),
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';
```

**Notas:**
- `end_date` puede ser NULL para suscripciones de por vida
- `next_billing_date` se usa para suscripciones recurrentes
- `trial_end_date` para períodos de prueba
- `auto_renew` controla si la suscripción se renueva automáticamente

---

### 5. `payment_methods`

Almacena los métodos de pago guardados por los usuarios.

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card', 'paypal', 'bank_transfer', etc.
  provider VARCHAR(50), -- 'stripe', 'paypal', etc.
  provider_payment_method_id VARCHAR(255), -- ID del método en el proveedor
  card_brand VARCHAR(50), -- 'visa', 'mastercard', 'amex', etc.
  last_four_digits VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  holder_name VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  billing_address JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
```

**Notas:**
- `provider_payment_method_id` se usa para procesar pagos con el proveedor externo
- Solo un método puede ser `is_default` por usuario (se puede forzar con trigger)
- `billing_address` almacena la dirección de facturación asociada
- Nunca guardar números de tarjeta completos por seguridad

---

### 6. `subscription_plans` (Opcional)

Si quieres gestionar planes de suscripción en la base de datos.

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'lifetime'
  features JSONB, -- Array de features incluidas
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
```

---

## Triggers Útiles

### Actualizar `updated_at` automáticamente

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_shopping_cart_items_updated_at
  BEFORE UPDATE ON shopping_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Garantizar un solo método de pago por defecto

```sql
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();
```

---

## Políticas RLS (Row Level Security)

Recomendaciones para políticas de seguridad en Supabase:

```sql
-- shopping_cart_items: Los usuarios solo pueden ver/modificar sus propios items
ALTER TABLE shopping_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart items"
  ON shopping_cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON shopping_cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON shopping_cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON shopping_cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- orders: Similar para órdenes
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Aplicar políticas similares para otras tablas...
```

---

## Notas Finales

1. **Seguridad**: Nunca almacenar información sensible como números de tarjeta completos o CVV
2. **Índices**: Ajustar índices según los patrones de consulta reales
3. **Soft Deletes**: Considerar agregar `deleted_at` si necesitas soft deletes
4. **Auditoría**: Considerar tabla de logs de cambios importantes
5. **Migraciones**: Usar migraciones versionadas para gestionar cambios en el esquema

---

**Última actualización**: Diciembre 2024

