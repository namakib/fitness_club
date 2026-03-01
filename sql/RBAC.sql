-- ============================================================
-- Health and Fitness Club Management System
-- RBAC.sql — Roles, Grants, Row-Level Security
-- ============================================================
-- Run this AFTER DDL.sql and BEFORE DML.sql.
-- Must be executed as a superuser or table owner.
-- ============================================================

-- Drop existing roles (run as superuser)
DROP ROLE IF EXISTS fc_app;
DROP ROLE IF EXISTS fc_member;
DROP ROLE IF EXISTS fc_trainer;
DROP ROLE IF EXISTS fc_admin;

-- Create roles
CREATE ROLE fc_app LOGIN PASSWORD 'fc_app_dev' BYPASSRLS;
CREATE ROLE fc_member NOLOGIN;
CREATE ROLE fc_trainer NOLOGIN;
CREATE ROLE fc_admin NOLOGIN;

-- fc_app can assume sub-roles
GRANT fc_member TO fc_app;
GRANT fc_trainer TO fc_app;
GRANT fc_admin TO fc_app;

-- fc_app direct grants (for login/register before SET ROLE)
GRANT SELECT ON member, trainer, admin TO fc_app;
GRANT INSERT ON member TO fc_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fc_app;

-- ============================================================
-- fc_member grants
-- ============================================================
GRANT SELECT, UPDATE ON member TO fc_member;
GRANT SELECT, INSERT, UPDATE ON fitness_goal TO fc_member;
GRANT SELECT, INSERT ON health_metric TO fc_member;
GRANT SELECT ON trainer, room, group_class TO fc_member;
GRANT SELECT, INSERT, DELETE ON class_enrollment TO fc_member;
GRANT SELECT, INSERT ON personal_session TO fc_member;
GRANT UPDATE (status) ON personal_session TO fc_member;
GRANT SELECT ON trainer_availability TO fc_member;
GRANT SELECT ON member_dashboard_view TO fc_member;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fc_member;
GRANT EXECUTE ON FUNCTION fn_trainer_slot_booking_status(INTEGER, INTEGER) TO fc_member;

-- ============================================================
-- fc_trainer grants
-- ============================================================
GRANT SELECT (member_id, name, email) ON member TO fc_trainer;
GRANT SELECT ON health_metric TO fc_trainer;
GRANT SELECT, UPDATE ON trainer TO fc_trainer;
GRANT SELECT, INSERT, DELETE ON trainer_availability TO fc_trainer;
GRANT SELECT ON room, class_enrollment TO fc_trainer;
GRANT SELECT, UPDATE, DELETE ON personal_session TO fc_trainer;
GRANT SELECT, UPDATE, DELETE ON group_class TO fc_trainer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fc_trainer;

-- ============================================================
-- fc_admin grants
-- ============================================================
GRANT SELECT, UPDATE ON admin TO fc_admin;
GRANT SELECT ON member, trainer TO fc_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON group_class, personal_session TO fc_admin;
GRANT SELECT, INSERT, UPDATE ON equipment, equipment_maintenance, payment TO fc_admin;
GRANT SELECT ON room, trainer_availability, class_enrollment TO fc_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fc_admin;

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE member ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metric ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS member_self ON member;
DROP POLICY IF EXISTS goal_owner ON fitness_goal;
DROP POLICY IF EXISTS metric_owner ON health_metric;
DROP POLICY IF EXISTS metric_insert_owner ON health_metric;
DROP POLICY IF EXISTS session_member ON personal_session;
DROP POLICY IF EXISTS enrollment_member ON personal_session;
DROP POLICY IF EXISTS availability_trainer ON trainer_availability;
DROP POLICY IF EXISTS member_availability_select ON trainer_availability;
DROP POLICY IF EXISTS trainer_self ON trainer;
DROP POLICY IF EXISTS admin_self ON admin;
DROP POLICY IF EXISTS payment_admin ON payment;
DROP POLICY IF EXISTS metric_trainer_read ON health_metric;
DROP POLICY IF EXISTS session_trainer ON personal_session;
DROP POLICY IF EXISTS class_trainer ON group_class;
DROP POLICY IF EXISTS member_trainer_read ON member;
DROP POLICY IF EXISTS admin_member_read ON member;
DROP POLICY IF EXISTS member_trainer_select ON trainer;
DROP POLICY IF EXISTS admin_trainer_read ON trainer;
DROP POLICY IF EXISTS admin_class_all ON group_class;
DROP POLICY IF EXISTS admin_session_all ON personal_session;
DROP POLICY IF EXISTS admin_equipment_all ON equipment;
DROP POLICY IF EXISTS admin_maintenance_all ON equipment_maintenance;
DROP POLICY IF EXISTS admin_payment_all ON payment;

-- fc_member policies (use app.current_user_id = member_id)
CREATE POLICY member_self ON member
    FOR ALL TO fc_member
    USING (member_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (member_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY goal_owner ON fitness_goal
    FOR ALL TO fc_member
    USING (member_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (member_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY metric_owner ON health_metric
    FOR SELECT TO fc_member
    USING (member_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY metric_insert_owner ON health_metric
    FOR INSERT TO fc_member
    WITH CHECK (member_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY session_member ON personal_session
    FOR ALL TO fc_member
    USING (member_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (member_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY enrollment_member ON class_enrollment
    FOR ALL TO fc_member
    USING (member_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (member_id = current_setting('app.current_user_id', true)::int);

-- fc_trainer policies (use app.current_user_id = trainer_id)
CREATE POLICY trainer_self ON trainer
    FOR ALL TO fc_trainer
    USING (trainer_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (trainer_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY availability_trainer ON trainer_availability
    FOR ALL TO fc_trainer
    USING (trainer_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (trainer_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY member_availability_select ON trainer_availability
    FOR SELECT TO fc_member USING (true);

CREATE POLICY metric_trainer_read ON health_metric
    FOR SELECT TO fc_trainer
    USING (member_id IN (
        SELECT DISTINCT ps.member_id FROM personal_session ps
        WHERE ps.trainer_id = current_setting('app.current_user_id', true)::int
    ));

CREATE POLICY session_trainer ON personal_session
    FOR ALL TO fc_trainer
    USING (trainer_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (trainer_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY class_trainer ON group_class
    FOR ALL TO fc_trainer
    USING (trainer_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (trainer_id = current_setting('app.current_user_id', true)::int);

-- fc_admin policies (full access to managed tables)
CREATE POLICY member_trainer_read ON member
    FOR SELECT TO fc_trainer
    USING (member_id IN (
        SELECT DISTINCT ps.member_id FROM personal_session ps
        WHERE ps.trainer_id = current_setting('app.current_user_id', true)::int
    ));

CREATE POLICY admin_self ON admin
    FOR ALL TO fc_admin
    USING (admin_id = current_setting('app.current_user_id', true)::int)
    WITH CHECK (admin_id = current_setting('app.current_user_id', true)::int);

CREATE POLICY admin_member_read ON member
    FOR SELECT TO fc_admin USING (true);

-- Members need to see all trainers for the booking dropdown
CREATE POLICY member_trainer_select ON trainer
    FOR SELECT TO fc_member USING (true);

CREATE POLICY admin_trainer_read ON trainer
    FOR SELECT TO fc_admin USING (true);

CREATE POLICY admin_class_all ON group_class
    FOR ALL TO fc_admin USING (true) WITH CHECK (true);

CREATE POLICY admin_session_all ON personal_session
    FOR ALL TO fc_admin USING (true) WITH CHECK (true);

CREATE POLICY admin_equipment_all ON equipment
    FOR ALL TO fc_admin USING (true) WITH CHECK (true);

CREATE POLICY admin_maintenance_all ON equipment_maintenance
    FOR ALL TO fc_admin USING (true) WITH CHECK (true);

CREATE POLICY admin_payment_all ON payment
    FOR ALL TO fc_admin USING (true) WITH CHECK (true);
