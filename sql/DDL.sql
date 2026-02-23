-- ============================================================
-- Health and Fitness Club Management System
-- DDL.sql — Database Schema Definition
-- ============================================================
-- This script is self-contained and can be run on a fresh
-- PostgreSQL instance. It drops existing objects if they exist
-- and recreates everything from scratch.
-- ============================================================

-- Drop existing objects in reverse dependency order
DROP TRIGGER IF EXISTS trg_prevent_room_double_booking_session ON personal_session;
DROP TRIGGER IF EXISTS trg_prevent_room_double_booking_class ON group_class;
DROP FUNCTION IF EXISTS fn_prevent_room_double_booking();

DROP VIEW IF EXISTS member_dashboard_view;

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
    status              VARCHAR(20) DEFAULT 'operational'
                        CHECK (status IN ('operational', 'under_repair', 'out_of_service')),
    purchase_date       DATE,
    last_maintenance_date DATE
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
-- INDEX: speed up health history lookups by member + timestamp
-- ============================================================
CREATE INDEX idx_health_metric_member_recorded
    ON health_metric (member_id, recorded_at DESC);

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
    FROM class_enrollment
    WHERE member_id = m.member_id
) ce ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS upcoming_sessions
    FROM personal_session
    WHERE member_id = m.member_id
      AND status = 'scheduled'
      AND session_date >= CURRENT_DATE
) us ON true;

-- ============================================================
-- TRIGGER FUNCTION: prevent double-booking of rooms
-- Checks both personal_session and group_class tables to
-- ensure no overlapping room bookings on the same date.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_room_double_booking()
RETURNS TRIGGER AS $$
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
