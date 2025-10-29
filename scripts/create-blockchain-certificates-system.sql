-- Requisitos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Función IMMUTABLE para calcular el hash
CREATE OR REPLACE FUNCTION certificate_hash_immutable(
  p_user_id uuid,
  p_course_id uuid,
  p_enrollment_id uuid,
  p_certificate_id uuid,
  p_issued_at timestamptz,
  p_certificate_url text
) RETURNS char(64)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(
           digest(
             convert_to(
               coalesce(p_user_id::text,'') || '|' ||
               coalesce(p_course_id::text,'') || '|' ||
               coalesce(p_enrollment_id::text,'') || '|' ||
               coalesce(p_certificate_id::text,'') || '|' ||
               coalesce(p_issued_at::text,'') || '|' ||
               coalesce(p_certificate_url,''),
               'UTF8'
             ),
             'sha256'
           ),
           'hex'
         )::char(64);
$$;

-- 2) Tabla con columna generada que usa la función IMMUTABLE
CREATE TABLE IF NOT EXISTS user_course_certificates (
  certificate_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  -- 👇 CORREGIDO: referenciar la PK real de user_course_enrollments
  enrollment_id   uuid NOT NULL REFERENCES public.user_course_enrollments(enrollment_id) ON DELETE CASCADE,

  certificate_url text NOT NULL CHECK (length(btrim(certificate_url)) > 0),
  issued_at       timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,

  certificate_hash char(64) GENERATED ALWAYS AS (
    certificate_hash_immutable(
      user_id, course_id, enrollment_id, certificate_id, issued_at, certificate_url
    )
  ) STORED UNIQUE,

  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cert_user   ON user_course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_course ON user_course_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_cert_enroll ON user_course_certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cert_issued ON user_course_certificates(issued_at);

-- Necesitamos pgcrypto para digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2.1) Función IMMUTABLE para calcular el hash de cada bloque del ledger
CREATE OR REPLACE FUNCTION ledger_block_hash_immutable(
  p_prev_hash   char(64),
  p_cert_id     uuid,
  p_op          text,
  p_payload     jsonb,
  p_created_at  timestamptz
) RETURNS char(64)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(
           digest(
             convert_to(
               coalesce(p_prev_hash,'') || '|' ||
               coalesce(p_cert_id::text,'') || '|' ||
               coalesce(p_op,'') || '|' ||
               coalesce(p_payload::text,'') || '|' ||
               coalesce(p_created_at::text,''),
               'UTF8'
             ),
             'sha256'
           ),
           'hex'
         )::char(64);
$$;

-- 2.2) Ledger encadenado por certificado (append-only)
CREATE TABLE IF NOT EXISTS certificate_ledger (
  block_id    bigserial PRIMARY KEY,
  cert_id     uuid NOT NULL REFERENCES public.user_course_certificates(certificate_id) ON DELETE CASCADE,
  op          text NOT NULL CHECK (op IN ('ISSUE','REVOKE','EXPIRE')),
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash   char(64),
  block_hash  char(64) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_cert   ON certificate_ledger(cert_id);
CREATE INDEX IF NOT EXISTS idx_ledger_hash   ON certificate_ledger(block_hash);

-- 2.3) BEFORE INSERT: encadenar prev_hash y calcular block_hash
CREATE OR REPLACE FUNCTION ledger_before_insert()
RETURNS trigger AS $$
DECLARE
  v_prev char(64);
BEGIN
  SELECT block_hash INTO v_prev
  FROM certificate_ledger
  WHERE cert_id = NEW.cert_id
  ORDER BY block_id DESC
  LIMIT 1;

  NEW.prev_hash := v_prev;
  NEW.block_hash := ledger_block_hash_immutable(
    NEW.prev_hash,
    NEW.cert_id,
    NEW.op,
    NEW.payload,
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_before_insert ON certificate_ledger;
CREATE TRIGGER trg_ledger_before_insert
BEFORE INSERT ON certificate_ledger
FOR EACH ROW EXECUTE FUNCTION ledger_before_insert();

-- 2.4) Ledger es append-only (prohibir UPDATE/DELETE)
CREATE OR REPLACE FUNCTION forbid_ledger_changes()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'certificate_ledger es append-only; solo INSERT permitido';
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_no_update ON certificate_ledger;
DROP TRIGGER IF EXISTS trg_ledger_no_delete ON certificate_ledger;
CREATE TRIGGER trg_ledger_no_update BEFORE UPDATE ON certificate_ledger
FOR EACH ROW EXECUTE FUNCTION forbid_ledger_changes();
CREATE TRIGGER trg_ledger_no_delete BEFORE DELETE ON certificate_ledger
FOR EACH ROW EXECUTE FUNCTION forbid_ledger_changes();

-- 2.5) AFTER INSERT en certificados: registrar bloque ISSUE automáticamente
CREATE OR REPLACE FUNCTION add_issue_block()
RETURNS trigger AS $$
BEGIN
  INSERT INTO certificate_ledger (cert_id, op, payload)
  VALUES (
    NEW.certificate_id,
    'ISSUE',
    jsonb_build_object(
      'user_id', NEW.user_id,
      'course_id', NEW.course_id,
      'certificate_hash', NEW.certificate_hash,
      'certificate_url', NEW.certificate_url
    )
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cert_issue_block ON public.user_course_certificates;
CREATE TRIGGER trg_cert_issue_block
AFTER INSERT ON public.user_course_certificates
FOR EACH ROW EXECUTE FUNCTION add_issue_block();

-- 2.6) Helpers para revocar / expirar (agregan bloques, no mutan certificado)
CREATE OR REPLACE FUNCTION revoke_certificate(p_cert_id uuid, p_reason text)
RETURNS void AS $$
BEGIN
  INSERT INTO certificate_ledger (cert_id, op, payload)
  VALUES (p_cert_id, 'REVOKE', jsonb_build_object('reason', p_reason, 'revoked_at', now()));
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION expire_certificate(p_cert_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO certificate_ledger (cert_id, op, payload)
  VALUES (p_cert_id, 'EXPIRE', jsonb_build_object('expired_at', now()));
END; $$ LANGUAGE plpgsql;

-- Verificación estricta con recálculo de la cadena
CREATE OR REPLACE FUNCTION validate_certificate(p_hash char(64))
RETURNS TABLE (
  certificate_id uuid,
  user_id uuid,
  course_title text,
  issued_at timestamptz,
  is_valid boolean,
  is_expired boolean,
  chain_ok boolean,
  last_op text,
  last_block_at timestamptz
) AS $$
DECLARE
  v_cert record;
  v_prev char(64);
  v_ok boolean := true;
  r record;
BEGIN
  -- 1) Ubicar el certificado por hash
  SELECT c.certificate_id, c.user_id, c.issued_at, co.title AS course_title,
         c.expires_at
  INTO v_cert
  FROM public.user_course_certificates c
  JOIN public.courses co ON co.id = c.course_id
  WHERE c.certificate_hash = p_hash;

  IF NOT FOUND THEN
    -- No existe ese hash
    RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::text, NULL::timestamptz,
                        false, false, false, NULL::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- 2) Recorrer el ledger y recalcular hashes
  v_prev := NULL;
  last_op := NULL;
  last_block_at := NULL;

  FOR r IN
    SELECT prev_hash, block_hash, op, payload, created_at
    FROM certificate_ledger
    WHERE cert_id = v_cert.certificate_id
    ORDER BY block_id ASC
  LOOP
    -- Verificar enlace de prev_hash
    IF r.prev_hash IS DISTINCT FROM v_prev THEN
      v_ok := false;
      EXIT;
    END IF;

    -- Recalcular el hash esperado del bloque
    IF r.block_hash <> ledger_block_hash_immutable(r.prev_hash, v_cert.certificate_id, r.op, r.payload, r.created_at) THEN
      v_ok := false;
      EXIT;
    END IF;

    v_prev := r.block_hash;
    last_op := r.op;
    last_block_at := r.created_at;
  END LOOP;

  -- 3) Evaluar estado
  chain_ok  := v_ok;
  is_expired := COALESCE(v_cert.expires_at < now(), false);
  is_valid   := (chain_ok AND (last_op IS DISTINCT FROM 'REVOKE'));

  RETURN QUERY
  SELECT v_cert.certificate_id,
         v_cert.user_id,
         v_cert.course_title,
         v_cert.issued_at,
         is_valid,
         is_expired,
         chain_ok,
         last_op,
         last_block_at;
END; $$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_certificate IS
'Valida un certificado por su certificate_hash: existencia, expiración, no revocación y consistencia del encadenamiento (prev_hash → block_hash).';
