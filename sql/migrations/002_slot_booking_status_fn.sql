-- ============================================================
-- Migration 002: Add fn_trainer_slot_booking_status for member availability
-- Run on existing DBs that were created before this function existed.
-- Idempotent: CREATE OR REPLACE and GRANT are safe to run multiple times.
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

GRANT EXECUTE ON FUNCTION fn_trainer_slot_booking_status(INTEGER, INTEGER) TO fc_member;
