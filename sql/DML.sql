-- ============================================================
-- Health and Fitness Club Management System
-- DML.sql — Sample Data
-- ============================================================
-- Run this after DDL.sql. All passwords are hashed with
-- werkzeug's generate_password_hash (pbkdf2:sha256).
-- Plain-text password for all sample users: "password123"
-- ============================================================

-- ============================================================
-- Members (5)
-- Password hash for "password123" generated via werkzeug
-- ============================================================
INSERT INTO member (name, email, dob, gender, phone, password_hash) VALUES
('Alice Johnson',  'alice@example.com',  '1995-03-15', 'female', '613-555-0101',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Bob Smith',      'bob@example.com',    '1990-07-22', 'male',   '613-555-0102',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Carol Davis',    'carol@example.com',  '1988-11-08', 'female', '613-555-0103',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('David Lee',      'david@example.com',  '2000-01-30', 'male',   '613-555-0104',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Emma Wilson',    'emma@example.com',   '1997-06-12', 'female', '613-555-0105',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1');

-- ============================================================
-- Trainers (3)
-- ============================================================
INSERT INTO trainer (name, email, phone, specialization, password_hash) VALUES
('Frank Miller',  'frank@example.com',  '613-555-0201', 'Strength Training',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Grace Chen',    'grace@example.com',  '613-555-0202', 'Yoga & Flexibility',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Henry Brown',   'henry@example.com',  '613-555-0203', 'Cardio & HIIT',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1');

-- ============================================================
-- Admins (2)
-- ============================================================
INSERT INTO admin (name, email, password_hash) VALUES
('Ivy Adams',    'ivy@example.com',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Jack Turner',  'jack@example.com',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1');

-- ============================================================
-- Fitness Goals
-- ============================================================
INSERT INTO fitness_goal (member_id, goal_type, target_value, start_date, end_date, status) VALUES
(1, 'Weight Loss',       'Lose 10 lbs',           '2026-01-01', '2026-06-01', 'active'),
(1, 'Strength',          'Bench press 135 lbs',   '2026-01-15', '2026-07-15', 'active'),
(2, 'Cardio Endurance',  'Run 5K in under 25 min','2026-02-01', '2026-05-01', 'active'),
(3, 'Flexibility',       'Full splits',           '2025-09-01', '2026-03-01', 'active'),
(3, 'Weight Loss',       'Lose 15 lbs',           '2025-06-01', '2025-12-31', 'completed'),
(4, 'Muscle Gain',       'Gain 10 lbs muscle',    '2026-01-01', '2026-12-31', 'active'),
(5, 'General Fitness',   'Exercise 4x per week',  '2026-01-01', NULL,         'active');

-- ============================================================
-- Health Metrics (append-only history)
-- ============================================================
INSERT INTO health_metric (member_id, weight, body_fat_pct, blood_pressure, heart_rate, recorded_at) VALUES
(1, 165.00, 28.5, '120/80', 72, '2026-01-05 09:00:00'),
(1, 163.50, 27.8, '118/78', 70, '2026-01-20 09:00:00'),
(1, 161.00, 27.0, '118/76', 68, '2026-02-05 09:00:00'),
(2, 185.00, 22.0, '125/82', 75, '2026-01-10 10:00:00'),
(2, 183.00, 21.5, '122/80', 73, '2026-02-10 10:00:00'),
(3, 150.00, 30.0, '115/75', 68, '2025-10-01 08:00:00'),
(3, 145.00, 28.0, '112/72', 65, '2026-01-01 08:00:00'),
(3, 143.00, 27.2, '110/70', 64, '2026-02-01 08:00:00'),
(4, 170.00, 18.0, '120/78', 65, '2026-01-15 11:00:00'),
(4, 172.00, 17.5, '118/76', 63, '2026-02-15 11:00:00'),
(5, 140.00, 25.0, '110/70', 70, '2026-01-08 07:30:00'),
(5, 139.00, 24.5, '108/68', 68, '2026-02-08 07:30:00');

-- ============================================================
-- Rooms (4)
-- ============================================================
INSERT INTO room (room_name, capacity) VALUES
('Main Gym Floor',    50),
('Yoga Studio',       20),
('Cardio Room',       30),
('Private Training Room', 5);

-- ============================================================
-- Equipment (8)
-- ============================================================
INSERT INTO equipment (name, type, status, purchase_date, last_maintenance_date) VALUES
('Treadmill #1',       'Cardio',    'operational',     '2023-06-15', '2025-12-01'),
('Treadmill #2',       'Cardio',    'operational',     '2023-06-15', '2025-12-01'),
('Stationary Bike #1', 'Cardio',    'under_repair',    '2022-03-10', '2025-11-15'),
('Bench Press',        'Strength',  'operational',     '2021-01-20', '2025-10-01'),
('Squat Rack',         'Strength',  'operational',     '2021-01-20', '2025-10-01'),
('Leg Press Machine',  'Strength',  'out_of_service',  '2020-08-05', '2025-08-01'),
('Rowing Machine',     'Cardio',    'operational',     '2024-02-14', '2026-01-15'),
('Cable Machine',      'Strength',  'operational',     '2022-11-01', '2025-09-20');

-- ============================================================
-- Trainer Availability
-- ============================================================
INSERT INTO trainer_availability (trainer_id, available_date, start_time, end_time) VALUES
(1, '2026-02-23', '08:00', '12:00'),
(1, '2026-02-23', '14:00', '18:00'),
(1, '2026-02-24', '09:00', '13:00'),
(1, '2026-02-25', '08:00', '16:00'),
(2, '2026-02-23', '07:00', '11:00'),
(2, '2026-02-24', '07:00', '11:00'),
(2, '2026-02-25', '13:00', '17:00'),
(3, '2026-02-23', '10:00', '14:00'),
(3, '2026-02-24', '10:00', '14:00'),
(3, '2026-02-25', '08:00', '12:00');

-- ============================================================
-- Personal Sessions
-- ============================================================
INSERT INTO personal_session (member_id, trainer_id, room_id, session_date, start_time, end_time, status) VALUES
(1, 1, 4, '2026-02-23', '08:00', '09:00', 'scheduled'),
(2, 1, 4, '2026-02-23', '10:00', '11:00', 'scheduled'),
(1, 3, 4, '2026-02-24', '10:00', '11:00', 'scheduled'),
(4, 1, 4, '2026-02-25', '09:00', '10:00', 'scheduled'),
(3, 2, 2, '2026-02-23', '08:00', '09:00', 'scheduled'),
(5, 3, 3, '2026-02-24', '11:00', '12:00', 'scheduled');

-- ============================================================
-- Group Classes
-- ============================================================
INSERT INTO group_class (class_name, trainer_id, room_id, class_date, start_time, end_time, max_participants) VALUES
('Morning Yoga',       2, 2, '2026-02-23', '09:30', '10:30', 15),
('HIIT Blast',         3, 1, '2026-02-23', '11:00', '12:00', 25),
('Strength Basics',    1, 1, '2026-02-24', '14:00', '15:00', 20),
('Evening Yoga',       2, 2, '2026-02-25', '17:00', '18:00', 15),
('Cardio Kickboxing',  3, 3, '2026-02-25', '13:00', '14:00', 20);

-- ============================================================
-- Class Enrollments
-- ============================================================
INSERT INTO class_enrollment (class_id, member_id) VALUES
(1, 1),
(1, 3),
(1, 5),
(2, 2),
(2, 4),
(3, 1),
(3, 2),
(3, 4),
(4, 3),
(4, 5),
(5, 2),
(5, 4);

-- ============================================================
-- Equipment Maintenance Logs
-- ============================================================
INSERT INTO equipment_maintenance (equipment_id, issue_description, reported_date, resolved_date, status) VALUES
(3, 'Pedal resistance mechanism stuck, makes grinding noise',           '2025-11-10', NULL,         'in_progress'),
(6, 'Hydraulic cylinder leaking fluid, unsafe for use',                 '2025-07-20', NULL,         'reported'),
(1, 'Belt slipping at high speeds, replaced belt',                      '2025-11-25', '2025-12-01', 'resolved'),
(4, 'Bench padding torn, reupholstered',                                '2025-09-15', '2025-10-01', 'resolved'),
(6, 'Weight stack cable fraying, needs immediate replacement',          '2026-01-05', NULL,         'in_progress');
