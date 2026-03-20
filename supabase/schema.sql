-- =============================================================
-- TAKILLA — Schema inicial
-- Ejecutar en Supabase SQL Editor (en orden)
-- =============================================================


-- =============================================================
-- 1. TIPOS ENUM
-- =============================================================

CREATE TYPE user_role    AS ENUM ('customer', 'organizer', 'admin');
CREATE TYPE app_status   AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE venue_type   AS ENUM ('fixed_seating', 'open_area', 'hybrid');


-- =============================================================
-- 2. TABLAS
-- =============================================================

CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  email      text,
  role       user_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organizer_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  tax_id        text NOT NULL,
  status        app_status NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE venues (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name     text NOT NULL,
  address  text NOT NULL,
  city     text NOT NULL,
  capacity int  NOT NULL CHECK (capacity > 0),
  type     venue_type NOT NULL DEFAULT 'open_area'
);

CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id     uuid REFERENCES venues(id) ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  event_date   timestamptz NOT NULL,
  image_url    text,
  status       text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ticket_tiers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name              text NOT NULL,
  price             numeric(10, 2) NOT NULL CHECK (price >= 0),
  total_capacity    int  NOT NULL CHECK (total_capacity > 0),
  available_tickets int  NOT NULL CHECK (available_tickets >= 0),
  CONSTRAINT available_lte_total CHECK (available_tickets <= total_capacity)
);

CREATE TABLE orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  status       order_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tier_id  uuid NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  qr_hash  text NOT NULL UNIQUE,
  is_used  boolean NOT NULL DEFAULT false,
  used_at  timestamptz
);


-- =============================================================
-- 3. TRIGGER — auto-crear profile al registrarse
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    'customer'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =============================================================
-- 4. FUNCIÓN HELPER — obtener rol del usuario actual
-- =============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;


-- =============================================================
-- 5. RLS — habilitar en todas las tablas
-- =============================================================

ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets                ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- 6. POLÍTICAS RLS
-- =============================================================

-- ---- profiles -----------------------------------------------
-- Cada usuario ve/edita su propio perfil; admin ve todos
CREATE POLICY "profiles: ver propio"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "profiles: editar propio"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- El trigger inserta el perfil como SECURITY DEFINER (bypass RLS)
-- No se necesita política INSERT pública aquí.

-- ---- organizer_applications ---------------------------------
CREATE POLICY "apps: usuario crea la suya"
  ON organizer_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apps: usuario ve la suya / admin ve todas"
  ON organizer_applications FOR SELECT
  USING (auth.uid() = user_id OR get_my_role() = 'admin');

CREATE POLICY "apps: solo admin actualiza"
  ON organizer_applications FOR UPDATE
  USING (get_my_role() = 'admin');

-- ---- venues -------------------------------------------------
CREATE POLICY "venues: lectura pública"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "venues: solo admin escribe"
  ON venues FOR ALL
  USING (get_my_role() = 'admin');

-- ---- events -------------------------------------------------
CREATE POLICY "events: lectura pública de publicados"
  ON events FOR SELECT
  USING (status = 'published' OR auth.uid() = organizer_id OR get_my_role() = 'admin');

CREATE POLICY "events: organizador crea los suyos"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id AND get_my_role() = 'organizer');

CREATE POLICY "events: organizador/admin edita"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id OR get_my_role() = 'admin');

CREATE POLICY "events: organizador/admin elimina"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id OR get_my_role() = 'admin');

-- ---- ticket_tiers -------------------------------------------
CREATE POLICY "tiers: lectura pública"
  ON ticket_tiers FOR SELECT
  USING (true);

CREATE POLICY "tiers: organizador del evento escribe"
  ON ticket_tiers FOR ALL
  USING (
    get_my_role() = 'admin' OR
    auth.uid() = (SELECT organizer_id FROM events WHERE id = event_id)
  );

-- ---- orders -------------------------------------------------
CREATE POLICY "orders: usuario ve las suyas"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    get_my_role() = 'admin' OR
    auth.uid() = (SELECT organizer_id FROM events WHERE id = event_id)
  );

CREATE POLICY "orders: usuario crea la suya"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---- tickets ------------------------------------------------
CREATE POLICY "tickets: dueño ve los suyos"
  ON tickets FOR SELECT
  USING (
    auth.uid() = owner_id OR
    get_my_role() = 'admin' OR
    auth.uid() = (SELECT organizer_id FROM events WHERE id = event_id)
  );

-- Los tickets se crean desde server-side (service role), no desde cliente.


-- =============================================================
-- 7. RPC — validate_ticket (atómica, para Staff App)
-- =============================================================

CREATE OR REPLACE FUNCTION validate_ticket(hash_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  t tickets%ROWTYPE;
BEGIN
  -- Bloqueo a nivel de fila para evitar doble validación concurrente
  SELECT * INTO t
  FROM tickets
  WHERE qr_hash = hash_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Boleto no encontrado'
    );
  END IF;

  IF t.is_used THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Boleto ya utilizado',
      'used_at', t.used_at
    );
  END IF;

  UPDATE tickets
  SET is_used = true, used_at = now()
  WHERE id = t.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Boleto válido',
    'ticket_id', t.id,
    'event_id', t.event_id
  );
END;
$$;


-- =============================================================
-- 8. RPC — approve_organizer (solo admin)
-- Aprueba la solicitud Y cambia el rol del usuario en profiles
-- =============================================================

CREATE OR REPLACE FUNCTION approve_organizer(application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  app organizer_applications%ROWTYPE;
BEGIN
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar solicitudes';
  END IF;

  SELECT * INTO app FROM organizer_applications WHERE id = application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  UPDATE organizer_applications
  SET status = 'approved'
  WHERE id = application_id;

  UPDATE profiles
  SET role = 'organizer'
  WHERE id = app.user_id;
END;
$$;
