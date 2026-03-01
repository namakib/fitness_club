-- ============================================================
-- Health and Fitness Club Management System
-- test_triggers.sql — Trigger Validation Tests
-- ============================================================
-- Run AFTER DDL.sql and DML.sql. Each test uses a transaction
-- that rolls back, leaving the database unchanged.
-- Execute as: psql -d fitness_club -f sql/test_triggers.sql
-- ============================================================

\set ON_ERROR_STOP on

-- ============================================================
-- Test 1: Trainer double-booking (fn_prevent_trainer_double_booking)
-- ============================================================
DO $$
BEGIN
    -- Add availability for trainer 1 on 2026-04-01 (required by fn_verify_trainer_availability)
    INSERT INTO trainer_availability (trainer_id, available_date, start_time, end_time)
    VALUES (1, '2026-04-01', '09:00', '12:00');

    -- Insert first session for trainer 1 on 2026-04-01 10:00-11:00
    INSERT INTO personal_session (member_id, trainer_id, room_id, session_date, start_time, end_time)
    VALUES (1, 1, 4, '2026-04-01', '10:00', '11:00');

    -- This should FAIL: same trainer, overlapping time, different room
    INSERT INTO group_class (class_name, trainer_id, room_id, class_date, start_time, end_time, max_participants)
    VALUES ('Overlap Test', 1, 1, '2026-04-01', '10:30', '11:30', 20);

    RAISE EXCEPTION 'TEST FAILED: Expected trainer double-booking trigger to raise';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%already booked%' OR SQLERRM LIKE '%Trainer%overlapping%' THEN
            RAISE NOTICE 'PASS 1: Trainer double-booking prevented';
        ELSE
            RAISE;
        END IF;
END;
$$;

-- Cleanup: remove test data
DELETE FROM personal_session WHERE session_date = '2026-04-01' AND trainer_id = 1 AND member_id = 1;
DELETE FROM trainer_availability WHERE trainer_id = 1 AND available_date = '2026-04-01';

-- ============================================================
-- Test 2: Health metric immutability (fn_health_metric_immutable)
-- ============================================================
DO $$
DECLARE
    v_metric_id int;
BEGIN
    -- Insert a metric
    INSERT INTO health_metric (member_id, weight, heart_rate) VALUES (1, 155.0, 70)
    RETURNING metric_id INTO v_metric_id;

    -- UPDATE should FAIL
    BEGIN
        UPDATE health_metric SET weight = 999.0 WHERE metric_id = v_metric_id;
        RAISE EXCEPTION 'TEST FAILED: Expected health_metric UPDATE to be blocked';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%immutable%' OR SQLERRM LIKE '%not allowed%' THEN
                RAISE NOTICE 'PASS 2a: health_metric UPDATE blocked';
            ELSE
                RAISE;
            END IF;
    END;

    -- DELETE should FAIL
    BEGIN
        DELETE FROM health_metric WHERE metric_id = v_metric_id;
        RAISE EXCEPTION 'TEST FAILED: Expected health_metric DELETE to be blocked';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%immutable%' OR SQLERRM LIKE '%not allowed%' THEN
                RAISE NOTICE 'PASS 2b: health_metric DELETE blocked';
            ELSE
                RAISE;
            END IF;
    END;

    -- Cleanup: disable trigger temporarily to remove test row
    ALTER TABLE health_metric DISABLE TRIGGER trg_health_metric_no_delete;
    DELETE FROM health_metric WHERE metric_id = v_metric_id;
    ALTER TABLE health_metric ENABLE TRIGGER trg_health_metric_no_delete;
END;
$$;

-- ============================================================
-- Test 3: Trainer availability overlap (fn_prevent_trainer_availability_overlap)
-- Trainer 1 has 08:00-12:00 on 2026-02-23 from seed data
-- ============================================================
DO $$
BEGIN
    -- This should FAIL: overlaps with 08:00-12:00
    INSERT INTO trainer_availability (trainer_id, available_date, start_time, end_time)
    VALUES (1, '2026-02-23', '11:00', '14:00');

    RAISE EXCEPTION 'TEST FAILED: Expected trainer availability overlap to raise';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%overlapping%' OR SQLERRM LIKE '%already has%' THEN
            RAISE NOTICE 'PASS 3: Trainer availability overlap prevented';
        ELSE
            RAISE;
        END IF;
END;
$$;

-- ============================================================
-- Test 4: Trainer availability verification (fn_verify_trainer_availability)
-- Trainer 1 is NOT available on 2026-05-01
-- ============================================================
DO $$
BEGIN
    -- This should FAIL: no availability for trainer 1 on 2026-05-01
    INSERT INTO personal_session (member_id, trainer_id, room_id, session_date, start_time, end_time)
    VALUES (1, 1, 4, '2026-05-01', '10:00', '11:00');

    RAISE EXCEPTION 'TEST FAILED: Expected trainer availability verification to raise';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%not available%' THEN
            RAISE NOTICE 'PASS 4: Trainer availability verification enforced';
        ELSE
            RAISE;
        END IF;
END;
$$;

-- ============================================================
-- Test 5: Room double-booking (fn_prevent_room_double_booking)
-- Room 4 has a session on 2026-02-23 08:00-09:00 (from seed)
-- ============================================================
DO $$
BEGIN
    -- This should FAIL: room 4 already has session 08:00-09:00 on 2026-02-23
    INSERT INTO personal_session (member_id, trainer_id, room_id, session_date, start_time, end_time)
    VALUES (2, 2, 4, '2026-02-23', '08:30', '09:30');

    RAISE EXCEPTION 'TEST FAILED: Expected room double-booking to raise';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%already booked%' OR SQLERRM LIKE '%Room%' THEN
            RAISE NOTICE 'PASS 5: Room double-booking prevented';
        ELSE
            RAISE;
        END IF;
END;
$$;

-- ============================================================
-- Test 6: Member overlapping sessions (fn_prevent_member_overlapping_sessions)
-- Member 1 has session 2026-02-23 08:00-09:00 (from seed)
-- ============================================================
DO $$
BEGIN
    -- This should FAIL: member 1 already has 08:00-09:00 on 2026-02-23
    INSERT INTO personal_session (member_id, trainer_id, room_id, session_date, start_time, end_time)
    VALUES (1, 2, 2, '2026-02-23', '08:30', '09:30');

    RAISE EXCEPTION 'TEST FAILED: Expected member overlapping sessions to raise';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%overlapping%' OR SQLERRM LIKE '%Member already%' THEN
            RAISE NOTICE 'PASS 6: Member overlapping sessions prevented';
        ELSE
            RAISE;
        END IF;
END;
$$;

-- ============================================================
-- Test 7: Full class enrollment (fn_prevent_full_class_enrollment)
-- ============================================================
DO $$
DECLARE
    v_class_id int;
BEGIN
    -- Create a class with max_participants = 1
    INSERT INTO group_class (class_name, trainer_id, room_id, class_date, start_time, end_time, max_participants)
    VALUES ('Tiny Class', 2, 2, '2026-06-01', '09:00', '10:00', 1)
    RETURNING class_id INTO v_class_id;

    -- Enroll first member — should succeed
    INSERT INTO class_enrollment (class_id, member_id) VALUES (v_class_id, 1);

    -- Enroll second member — should FAIL
    BEGIN
        INSERT INTO class_enrollment (class_id, member_id) VALUES (v_class_id, 2);
        RAISE EXCEPTION 'TEST FAILED: Expected full class enrollment to raise';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%full%' OR SQLERRM LIKE '%Class%' THEN
                RAISE NOTICE 'PASS 7: Full class enrollment prevented';
            ELSE
                RAISE;
            END IF;
    END;

    -- Cleanup
    DELETE FROM class_enrollment WHERE class_id = v_class_id;
    DELETE FROM group_class WHERE class_id = v_class_id;
END;
$$;

-- ============================================================
-- Summary
-- ============================================================
\echo ''
\echo 'All 7 trigger tests completed successfully.'
