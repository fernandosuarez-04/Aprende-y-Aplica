-- ==============================================================================
-- TABLA: course_purchases
-- Propósito: Registra las compras de cursos pagados por los usuarios
-- Vincula: users, courses, transactions, coupons
-- ==============================================================================

CREATE TABLE public.course_purchases (
  -- Identificador único
  purchase_id uuid NOT NULL DEFAULT gen_random_uuid(), 
  
  -- Relaciones principales
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  enrollment_id uuid,
  
  -- Información de precio
  original_price_cents integer NOT NULL CHECK (original_price_cents >= 0),
  discounted_price_cents integer NOT NULL CHECK (discounted_price_cents >= 0),
  final_price_cents integer NOT NULL CHECK (final_price_cents >= 0),
  currency character varying NOT NULL DEFAULT 'USD'::character varying,
  
  -- Descuentos y cupones
  coupon_id uuid,
  discount_type character varying CHECK (discount_type IS NULL OR discount_type::text = ANY (ARRAY['percentage'::character varying, 'fixed_amount'::character varying]::text[])),
  discount_value numeric CHECK (discount_value IS NULL OR discount_value >= 0),
  discount_cents integer DEFAULT 0 CHECK (discount_cents >= 0),
  
  -- Estado de acceso
  access_status character varying NOT NULL DEFAULT 'active'::character varying 
    CHECK (access_status::text = ANY (ARRAY['active'::character varying, 'suspended'::character varying, 'expired'::character varying, 'cancelled'::character varying]::text[])),
  
  -- Fechas
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  accessed_at timestamp with time zone,
  access_granted_at timestamp with time zone,
  
  -- Metadatos de la compra
  purchase_method character varying CHECK (purchase_method::text = ANY (ARRAY['direct'::character varying, 'subscription'::character varying, 'gift'::character varying, 'promo'::character varying]::text[])),
  purchase_notes text,
  internal_notes text,
  
  -- Método de pago utilizado
  payment_method_id uuid,
  
  -- Información adicional
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps de auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  
  -- Constraints de clave primaria
  CONSTRAINT course_purchases_pkey PRIMARY KEY (purchase_id),
  
  -- Foreign keys
  CONSTRAINT course_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT course_purchases_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT course_purchases_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON DELETE RESTRICT,
  CONSTRAINT course_purchases_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.user_course_enrollments(enrollment_id) ON DELETE SET NULL,
  CONSTRAINT course_purchases_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id) ON DELETE SET NULL,
  CONSTRAINT course_purchases_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(payment_method_id) ON DELETE SET NULL,
  CONSTRAINT course_purchases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Constraints de integridad
  CONSTRAINT course_purchases_valid_price CHECK (
    discounted_price_cents <= original_price_cents AND 
    final_price_cents <= discounted_price_cents
  ),
  CONSTRAINT course_purchases_unique_purchase UNIQUE(user_id, course_id, transaction_id)
);

-- ==============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==============================================================================

-- Índice para búsquedas por usuario
CREATE INDEX idx_course_purchases_user_id ON public.course_purchases(user_id);

-- Índice para búsquedas por curso
CREATE INDEX idx_course_purchases_course_id ON public.course_purchases(course_id);

-- Índice para búsquedas por transacción
CREATE INDEX idx_course_purchases_transaction_id ON public.course_purchases(transaction_id);

-- Índice para búsquedas por enrollment
CREATE INDEX idx_course_purchases_enrollment_id ON public.course_purchases(enrollment_id) WHERE enrollment_id IS NOT NULL;

-- Índice para búsquedas por estado de acceso
CREATE INDEX idx_course_purchases_access_status ON public.course_purchases(access_status);

-- Índice compuesto para consultas comunes (usuario activo y curso)
CREATE INDEX idx_course_purchases_user_course_active ON public.course_purchases(user_id, course_id, access_status);

-- Índice para búsquedas por fecha de compra
CREATE INDEX idx_course_purchases_purchased_at ON public.course_purchases(purchased_at DESC);

-- Índice para búsquedas por cupón
CREATE INDEX idx_course_purchases_coupon_id ON public.course_purchases(coupon_id) WHERE coupon_id IS NOT NULL;

-- Índice para búsquedas por fecha de expiración
CREATE INDEX idx_course_purchases_expires_at ON public.course_purchases(expires_at) WHERE expires_at IS NOT NULL;

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_course_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_purchases_updated_at
  BEFORE UPDATE ON public.course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_purchases_updated_at();

-- Trigger para incrementar contador de estudiantes en courses cuando se crea una compra exitosa
CREATE OR REPLACE FUNCTION public.increment_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo incrementar si el estado de acceso es 'active' y la transacción fue completada
  IF NEW.access_status = 'active' THEN
    UPDATE public.courses 
    SET student_count = student_count + 1,
        updated_at = now()
    WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_course_student_count
  AFTER INSERT ON public.course_purchases
  FOR EACH ROW
  WHEN (NEW.access_status = 'active')
  EXECUTE FUNCTION public.increment_course_student_count();

-- ==============================================================================
-- COMENTARIOS EN LA TABLA Y COLUMNAS
-- ==============================================================================

COMMENT ON TABLE public.course_purchases IS 'Registra todas las compras de cursos pagados por usuarios. Vincula transacciones de pago con inscripciones a cursos.';
COMMENT ON COLUMN public.course_purchases.purchase_id IS 'Identificador único de la compra';
COMMENT ON COLUMN public.course_purchases.user_id IS 'Usuario que realizó la compra';
COMMENT ON COLUMN public.course_purchases.course_id IS 'Curso adquirido';
COMMENT ON COLUMN public.course_purchases.transaction_id IS 'Transacción de pago asociada';
COMMENT ON COLUMN public.course_purchases.enrollment_id IS 'Inscripción del usuario al curso (puede ser NULL si aún no se ha inscrito)';
COMMENT ON COLUMN public.course_purchases.original_price_cents IS 'Precio original del curso en centavos';
COMMENT ON COLUMN public.course_purchases.discounted_price_cents IS 'Precio después de aplicar descuentos en centavos';
COMMENT ON COLUMN public.course_purchases.final_price_cents IS 'Precio final pagado en centavos';
COMMENT ON COLUMN public.course_purchases.coupon_id IS 'Cupón de descuento aplicado (si existe)';
COMMENT ON COLUMN public.course_purchases.discount_cents IS 'Descuento aplicado en centavos';
COMMENT ON COLUMN public.course_purchases.access_status IS 'Estado del acceso al curso: active, suspended, expired, cancelled';
COMMENT ON COLUMN public.course_purchases.purchased_at IS 'Fecha y hora de la compra';
COMMENT ON COLUMN public.course_purchases.expires_at IS 'Fecha de expiración del acceso (NULL si es permanente)';
COMMENT ON COLUMN public.course_purchases.accessed_at IS 'Primera vez que el usuario accedió al curso';
COMMENT ON COLUMN public.course_purchases.access_granted_at IS 'Fecha en que se otorgó el acceso al curso';
COMMENT ON COLUMN public.course_purchases.purchase_method IS 'Método de compra: direct, subscription, gift, promo';
COMMENT ON COLUMN public.course_purchases.metadata IS 'Datos adicionales en formato JSON';

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security) - Opcional
-- ==============================================================================

-- Descomentar si deseas habilitar RLS
-- ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias compras
-- CREATE POLICY "Users can view own purchases"
--   ON public.course_purchases
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las compras
-- CREATE POLICY "Admins can view all purchases"
--   ON public.course_purchases
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid()
--       AND cargo_rol = 'administrador'
--     )
--   );

-- ==============================================================================
-- NOTAS ADICIONALES
-- ==============================================================================

-- Esta tabla está diseñada para:
-- 1. Registrar todas las compras de cursos (no incluye cursos gratuitos o promociones de inscripción directa)
-- 2. Mantener un historial completo de compras con sus precios originales
-- 3. Soportar descuentos y cupones
-- 4. Vincular la transacción de pago con la inscripción al curso
-- 5. Permitir acceso con expiración para cursos con suscripción temporal
-- 6. Mantener auditoría completa de quién, cuándo y cómo se realizó la compra

-- Uso recomendado:
-- - Al completar una transacción exitosa de tipo 'course_purchase', se crea un registro aquí
-- - Este registro luego se vincula con un enrollment_id cuando se crea la inscripción
-- - Los administradores pueden suspender o cancelar accesos desde esta tabla
-- - Permite manejar refunds y cambios de estado de acceso
