-- ============================================================
-- Health and Fitness Club Management System
-- DDL.sql — Database Schema Definition
-- ============================================================
-- This script is self-contained and can be run on a fresh
-- PostgreSQL instance. It drops existing objects if they exist
-- and recreates everything from scratch.
-- ============================================================

-- Drop existing objects in reverse dependency order
DROP TRIGGER IF EXISTS trg_prevent_member_overlapping_sessions ON personal_session;
DROP TRIGGER IF EXISTS trg_prevent_full_class_enrollment ON class_enrollment;
DROP FUNCTION IF EXISTS fn_prevent_member_overlapping_sessions();
DROP FUNCTION IF EXISTS fn_prevent_full_class_enrollment();

DROP TRIGGER IF EXISTS trg_prevent_room_double_booking_session ON personal_session;
DROP TRIGGER IF EXISTS trg_prevent_room_double_booking_class ON group_class;
DROP FUNCTION IF EXISTS fn_prevent_room_double_booking();

DROP TRIGGER IF EXISTS trg_prevent_trainer_double_booking_session ON personal_session;
DROP TRIGGER IF EXISTS trg_prevent_trainer_double_booking_class ON group_class;
DROP FUNCTION IF EXISTS fn_prevent_trainer_double_booking();

DROP TRIGGER IF EXISTS trg_health_metric_no_update ON health_metric;
DROP TRIGGER IF EXISTS trg_health_metric_no_delete ON health_metric;
DROP FUNCTION IF EXISTS fn_health_metric_immutable();

DROP TRIGGER IF EXISTS trg_prevent_trainer_availability_overlap ON trainer_availability;
DROP FUNCTION IF EXISTS fn_prevent_trainer_availability_overlap();

DROP TRIGGER IF EXISTS trg_verify_trainer_availability ON personal_session;
DROP FUNCTION IF EXISTS fn_verify_trainer_availability();

DROP FUNCTION IF EXISTS fn_check_booking_conflicts(INTEGER, INTEGER, INTEGER, DATE, TIME, TIME);

DROP VIEW IF EXISTS member_dashboard_view;

DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS equipment_maintenance CASCADE;
DROP TABLE IF EXISTS class_enrollment CASCADE;
DROP TABLE IF EXISTS group_class CASCADE;
DROP TABLE IF EXISTS personal_session CASCADE;
DROP TABLE IF EXISTS trainer_availability CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS health_metric CASCADE;
DROP TABLE IF EXISTS fitness_goal CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS trainer CASCADE;
DROP TABLE IF EXISTS member CASCADE;

-- ============================================================
-- TABLE: member
-- ============================================================
CREATE TABLE member (
    member_id    SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    dob          DATE NOT NULL,
    gender       VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    phone        VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: trainer
-- ============================================================
CREATE TABLE trainer (
    trainer_id    SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    specialization VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL
);

-- ============================================================
-- TABLE: admin
-- ============================================================
CREATE TABLE admin (
    admin_id      SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL
);

-- ============================================================
-- TABLE: fitness_goal
-- ============================================================
CREATE TABLE fitness_goal (
    goal_id      SERIAL PRIMARY KEY,
    member_id    INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    goal_type    VARCHAR(50) NOT NULL,
    target_value VARCHAR(100) NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE,
    status       VARCHAR(20) DEFAULT 'active'
                 CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- ============================================================
-- TABLE: health_metric
-- Append-only: members insert new records, never update/delete.
-- ============================================================
CREATE TABLE health_metric (
    metric_id      SERIAL PRIMARY KEY,
    member_id      INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    weight         DECIMAL(5,2),
    body_fat_pct   DECIMAL(5,2),
    blood_pressure VARCHAR(20),
    heart_rate     INTEGER,
    recorded_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: trainer_availability
-- ============================================================
CREATE TABLE trainer_availability (
    availability_id SERIAL PRIMARY KEY,
    trainer_id      INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE CASCADE,
    available_date  DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    CHECK (end_time > start_time)
);

-- ============================================================
-- TABLE: room
-- ============================================================
CREATE TABLE room (
    room_id   SERIAL PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL UNIQUE,
    capacity  INTEGER NOT NULL CHECK (capacity > 0)
);

-- ============================================================
-- TABLE: equipment
-- ============================================================
CREATE TABLE equipment (
    equipment_id        SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    type                VARCHAR(50) NOT NULL,
    room_id             INTEGER NOT NULL REFERENCES room(room_id) ON DELETE RESTRICT,
    status              VARCHAR(20) DEFAULT 'operational'
                        CHECK (status IN ('operational', 'under_repair', 'out_of_service')),
    purchase_date       DATE
);

-- ============================================================
-- TABLE: personal_session
-- ============================================================
CREATE TABLE personal_session (
    session_id  SERIAL PRIMARY KEY,
    member_id   INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    trainer_id  INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE CASCADE,
    room_id     INTEGER NOT NULL REFERENCES room(room_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    status      VARCHAR(20) DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    CHECK (end_time > start_time)
);

-- ============================================================
-- TABLE: group_class
-- ============================================================
CREATE TABLE group_class (
    class_id         SERIAL PRIMARY KEY,
    class_name       VARCHAR(100) NOT NULL,
    trainer_id       INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE CASCADE,
    room_id          INTEGER NOT NULL REFERENCES room(room_id) ON DELETE CASCADE,
    class_date       DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    CHECK (end_time > start_time)
);

-- ============================================================
-- TABLE: class_enrollment
-- A member can enroll in a class only once.
-- ============================================================
CREATE TABLE class_enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    class_id      INTEGER NOT NULL REFERENCES group_class(class_id) ON DELETE CASCADE,
    member_id     INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    enrolled_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (class_id, member_id)
);

-- ============================================================
-- TABLE: equipment_maintenance
-- ============================================================
CREATE TABLE equipment_maintenance (
    log_id            SERIAL PRIMARY KEY,
    equipment_id      INTEGER NOT NULL REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    reported_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    resolved_date     DATE,
    status            VARCHAR(20) DEFAULT 'reported'
                      CHECK (status IN ('reported', 'in_progress', 'resolved'))
);

-- ============================================================
-- TABLE: payment
-- Simulated billing: amount, status, date, payment method.
-- ============================================================
CREATE TABLE payment (
    payment_id     SERIAL PRIMARY KEY,
    member_id      INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    amount         DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending'
                   CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20)
                   CHECK (payment_method IS NULL OR payment_method IN ('credit_card', 'debit', 'bank_transfer', 'cash'))
);

-- ============================================================
-- INDEX: speed up health history lookups by member + timestamp
-- ============================================================
CREATE INDEX idx_health_metric_member_recorded
    ON health_metric (member_id, recorded_at DESC);

-- ============================================================
-- INDEXES: common query patterns
-- ============================================================
CREATE INDEX idx_personal_session_trainer ON personal_session (trainer_id, session_date);
CREATE INDEX idx_personal_session_member ON personal_session (member_id, session_date);
CREATE INDEX idx_group_class_trainer ON group_class (trainer_id, class_date);
CREATE INDEX idx_group_class_room ON group_class (room_id, class_date);
CREATE INDEX idx_class_enrollment_class ON class_enrollment (class_id);
CREATE INDEX idx_class_enrollment_member ON class_enrollment (member_id);
CREATE INDEX idx_payment_member ON payment (member_id, payment_date DESC);
CREATE INDEX idx_trainer_availability ON trainer_availability (trainer_id, available_date);

-- ============================================================
-- VIEW: member_dashboard_view
-- Aggregates key dashboard data for each member: latest health
-- metric, count of active goals, total classes attended, and
-- count of upcoming personal sessions.
-- ============================================================
CREATE VIEW member_dashboard_view AS
SELECT
    m.member_id,
    m.name,
    m.email,
    -- Latest health metric
    lh.weight         AS latest_weight,
    lh.body_fat_pct   AS latest_body_fat_pct,
    lh.blood_pressure AS latest_blood_pressure,
    lh.heart_rate     AS latest_heart_rate,
    lh.recorded_at    AS latest_metric_date,
    -- Active goals count
    COALESCE(ag.active_goals, 0)     AS active_goals,
    -- Total classes attended
    COALESCE(ce.classes_attended, 0) AS classes_attended,
    -- Upcoming personal sessions count
    COALESCE(us.upcoming_sessions, 0) AS upcoming_sessions
FROM member m
LEFT JOIN LATERAL (
    SELECT weight, body_fat_pct, blood_pressure, heart_rate, recorded_at
    FROM health_metric
    WHERE member_id = m.member_id
    ORDER BY recorded_at DESC
    LIMIT 1
) lh ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS active_goals
    FROM fitness_goal
    WHERE member_id = m.member_id AND status = 'active'
) ag ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS classes_attended
    FROM class_enrollment ce_inner
    JOIN group_class gc ON gc.class_id = ce_inner.class_id
    WHERE ce_inner.member_id = m.member_id
      AND gc.class_date < CURRENT_DATE
) ce ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS upcoming_sessions
    FROM personal_session
    WHERE member_id = m.member_id
      AND status = 'scheduled'
      AND (session_date > CURRENT_DATE
           OR (session_date = CURRENT_DATE AND end_time > LOCALTIME))
) us ON true;

-- ============================================================
-- TRIGGER FUNCTION: prevent double-booking of rooms
-- Checks both personal_session and group_class tables to
-- ensure no overlapping room bookings on the same date.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_room_double_booking()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    v_date DATE;
    v_id   INTEGER;
BEGIN
    -- Determine the event date and row id based on which table fired
    IF TG_TABLE_NAME = 'personal_session' THEN
        v_date := NEW.session_date;
        v_id   := NEW.session_id;
    ELSE
        v_date := NEW.class_date;
        v_id   := NEW.class_id;
    END IF;

    -- Check for conflicts in personal_session
    IF EXISTS (
        SELECT 1 FROM personal_session
        WHERE room_id = NEW.room_id
          AND session_date = v_date
          AND status != 'cancelled'
          AND start_time < NEW.end_time
          AND end_time > NEW.start_time
          AND (TG_TABLE_NAME != 'personal_session' OR session_id != v_id)
    ) THEN
        RAISE EXCEPTION 'Room % is already booked for an overlapping time slot on %',
            NEW.room_id, v_date;
    END IF;

    -- Check for conflicts in group_class
    IF EXISTS (
        SELECT 1 FROM group_class
        WHERE room_id = NEW.room_id
          AND class_date = v_date
          AND start_time < NEW.end_time
          AND end_time > NEW.start_time
          AND (TG_TABLE_NAME != 'group_class' OR class_id != v_id)
    ) THEN
        RAISE EXCEPTION 'Room % is already booked for an overlapping time slot on %',
            NEW.room_id, v_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to personal_session
CREATE TRIGGER trg_prevent_room_double_booking_session
    BEFORE INSERT OR UPDATE ON personal_session
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_room_double_booking();

-- Apply the trigger to group_class
CREATE TRIGGER trg_prevent_room_double_booking_class
    BEFORE INSERT OR UPDATE ON group_class
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_room_double_booking();

-- ============================================================
-- TRIGGER FUNCTION: prevent member overlapping sessions
-- A member cannot have overlapping personal session bookings.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_member_overlapping_sessions()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    v_conflict RECORD;
BEGIN
    SELECT session_date, start_time, end_time INTO v_conflict
    FROM personal_session
    WHERE member_id = NEW.member_id
      AND status != 'cancelled'
      AND session_date = NEW.session_date
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
      AND (TG_OP = 'INSERT' OR session_id != NEW.session_id)
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'You already have a session on % from % to %. Please choose a different time or cancel that session first.',
            v_conflict.session_date, v_conflict.start_time, v_conflict.end_time;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_member_overlapping_sessions
    BEFORE INSERT OR UPDATE ON personal_session
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_member_overlapping_sessions();

-- ============================================================
-- TRIGGER FUNCTION: prevent full-class enrollment
-- A member cannot register for a class that is already full.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_full_class_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_current INTEGER;
    v_max     INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_current FROM class_enrollment WHERE class_id = NEW.class_id;
    SELECT max_participants INTO v_max FROM group_class WHERE class_id = NEW.class_id;
    IF v_current >= v_max THEN
        RAISE EXCEPTION 'Class % is full', NEW.class_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_full_class_enrollment
    BEFORE INSERT ON class_enrollment
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_full_class_enrollment();

-- ============================================================
-- TRIGGER FUNCTION: prevent trainer double-booking
-- A trainer cannot be assigned to overlapping sessions/classes.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_trainer_double_booking()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    v_date DATE;
    v_id   INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'personal_session' THEN
        v_date := NEW.session_date;
        v_id   := NEW.session_id;
    ELSE
        v_date := NEW.class_date;
        v_id   := NEW.class_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM personal_session
        WHERE trainer_id = NEW.trainer_id
          AND session_date = v_date
          AND status != 'cancelled'
          AND start_time < NEW.end_time
          AND end_time > NEW.start_time
          AND (TG_TABLE_NAME != 'personal_session' OR session_id != v_id)
    ) THEN
        RAISE EXCEPTION 'Trainer % is already booked for an overlapping session on %',
            NEW.trainer_id, v_date;
    END IF;

    IF EXISTS (
        SELECT 1 FROM group_class
        WHERE trainer_id = NEW.trainer_id
          AND class_date = v_date
          AND start_time < NEW.end_time
          AND end_time > NEW.start_time
          AND (TG_TABLE_NAME != 'group_class' OR class_id != v_id)
    ) THEN
        RAISE EXCEPTION 'Trainer % is already booked for an overlapping class on %',
            NEW.trainer_id, v_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_trainer_double_booking_session
    BEFORE INSERT OR UPDATE ON personal_session
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_trainer_double_booking();

CREATE TRIGGER trg_prevent_trainer_double_booking_class
    BEFORE INSERT OR UPDATE ON group_class
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_trainer_double_booking();

-- ============================================================
-- TRIGGER FUNCTION: prevent health_metric updates/deletes
-- Health metrics are append-only (historical records).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_health_metric_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'health_metric records are immutable: % is not allowed', TG_OP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_health_metric_no_update
    BEFORE UPDATE ON health_metric
    FOR EACH ROW
    EXECUTE FUNCTION fn_health_metric_immutable();

CREATE TRIGGER trg_health_metric_no_delete
    BEFORE DELETE ON health_metric
    FOR EACH ROW
    EXECUTE FUNCTION fn_health_metric_immutable();

-- ============================================================
-- TRIGGER FUNCTION: prevent overlapping trainer availability
-- A trainer cannot have overlapping availability slots.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_trainer_availability_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM trainer_availability
        WHERE trainer_id = NEW.trainer_id
          AND available_date = NEW.available_date
          AND start_time < NEW.end_time
          AND end_time > NEW.start_time
          AND (TG_OP = 'INSERT' OR availability_id != NEW.availability_id)
    ) THEN
        RAISE EXCEPTION 'Trainer % already has an overlapping availability slot on %',
            NEW.trainer_id, NEW.available_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_trainer_availability_overlap
    BEFORE INSERT OR UPDATE ON trainer_availability
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_trainer_availability_overlap();

-- ============================================================
-- TRIGGER FUNCTION: verify trainer availability on session insert
-- A personal session can only be booked when trainer is available.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_verify_trainer_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'cancelled') THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM trainer_availability
        WHERE trainer_id = NEW.trainer_id
          AND available_date = NEW.session_date
          AND start_time <= NEW.start_time
          AND end_time >= NEW.end_time
    ) THEN
        RAISE EXCEPTION 'Trainer % is not available on % from % to %',
            NEW.trainer_id, NEW.session_date, NEW.start_time, NEW.end_time;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verify_trainer_availability
    BEFORE INSERT ON personal_session
    FOR EACH ROW
    EXECUTE FUNCTION fn_verify_trainer_availability();

-- ============================================================
-- FUNCTION: trainer slot booking status (for member availability view)
-- Returns availability slots with is_booked / booked_by_me flags.
-- SECURITY DEFINER needed because fc_member cannot see other members' sessions.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_trainer_slot_booking_status(
    p_trainer_id INTEGER,
    p_member_id  INTEGER
)
RETURNS TABLE (
    availability_id INTEGER,
    available_date  DATE,
    start_time      TIME,
    end_time        TIME,
    is_booked       BOOLEAN,
    booked_by_me    BOOLEAN
) SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ta.availability_id,
        ta.available_date,
        ta.start_time,
        ta.end_time,
        EXISTS (
            SELECT 1 FROM personal_session ps
            WHERE ps.trainer_id  = p_trainer_id
              AND ps.session_date = ta.available_date
              AND ps.status      != 'cancelled'
              AND ps.start_time  <  ta.end_time
              AND ps.end_time    >  ta.start_time
        ) AS is_booked,
        EXISTS (
            SELECT 1 FROM personal_session ps
            WHERE ps.trainer_id  = p_trainer_id
              AND ps.member_id   = p_member_id
              AND ps.session_date = ta.available_date
              AND ps.status      != 'cancelled'
              AND ps.start_time  <  ta.end_time
              AND ps.end_time    >  ta.start_time
        ) AS booked_by_me
    FROM trainer_availability ta
    WHERE ta.trainer_id    = p_trainer_id
      AND ta.available_date >= CURRENT_DATE
    ORDER BY ta.available_date, ta.start_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: check all booking conflicts before inserting a session.
-- SECURITY DEFINER bypasses RLS so it can see ALL members' sessions.
-- Returns one row per conflict category found (member, trainer, room).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_booking_conflicts(
    p_member_id   INTEGER,
    p_trainer_id  INTEGER,
    p_room_id     INTEGER,
    p_date        DATE,
    p_start_time  TIME,
    p_end_time    TIME
)
RETURNS TABLE (conflict_type TEXT, detail TEXT)
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Member already has an overlapping session
    RETURN QUERY
    SELECT 'member'::TEXT,
           ('from ' || ps.start_time::TEXT || ' to ' || ps.end_time::TEXT)
    FROM personal_session ps
    WHERE ps.member_id = p_member_id
      AND ps.session_date = p_date
      AND ps.status != 'cancelled'
      AND ps.start_time < p_end_time
      AND ps.end_time > p_start_time
    LIMIT 1;

    -- 2. Trainer has an overlapping personal session
    RETURN QUERY
    SELECT 'trainer'::TEXT,
           ('from ' || ps.start_time::TEXT || ' to ' || ps.end_time::TEXT)
    FROM personal_session ps
    WHERE ps.trainer_id = p_trainer_id
      AND ps.session_date = p_date
      AND ps.status != 'cancelled'
      AND ps.start_time < p_end_time
      AND ps.end_time > p_start_time
    LIMIT 1;

    -- 3. Trainer has an overlapping group class
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'trainer'::TEXT,
               ('from ' || gc.start_time::TEXT || ' to ' || gc.end_time::TEXT)
        FROM group_class gc
        WHERE gc.trainer_id = p_trainer_id
          AND gc.class_date = p_date
          AND gc.start_time < p_end_time
          AND gc.end_time > p_start_time
        LIMIT 1;
    END IF;

    -- 4. Room is already booked (session)
    RETURN QUERY
    SELECT 'room'::TEXT,
           ('from ' || ps.start_time::TEXT || ' to ' || ps.end_time::TEXT)
    FROM personal_session ps
    WHERE ps.room_id = p_room_id
      AND ps.session_date = p_date
      AND ps.status != 'cancelled'
      AND ps.start_time < p_end_time
      AND ps.end_time > p_start_time
    LIMIT 1;

    -- 5. Room is already booked (class)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'room'::TEXT,
               ('from ' || gc.start_time::TEXT || ' to ' || gc.end_time::TEXT)
        FROM group_class gc
        WHERE gc.room_id = p_room_id
          AND gc.class_date = p_date
          AND gc.start_time < p_end_time
          AND gc.end_time > p_start_time
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;
