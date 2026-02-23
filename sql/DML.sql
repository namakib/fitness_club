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
INSERT INTO admin (name, email, phone, password_hash) VALUES
('Ivy Adams',    'ivy@example.com',   '555-0401',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1'),
('Jack Turner',  'jack@example.com',  '555-0402',
 'pbkdf2:sha256:1000000$MqgHklKGjhz6v5TV$41233e3cfd6a60ecbf611e673c71f89c4f8613b72a118a95bfccb6741c3619c1');

-- ============================================================
-- Fitness Goals
-- ============================================================
INSERT INTO fitness_goal (member_id, goal_type, target_value, start_date, end_date, status) VALUES
-- Alice (member 1) — multiple goals
(1, 'weight_loss',   'Lose 10 lbs',           '2026-01-01', '2026-06-01', 'active'),
(1, 'muscle_gain',   'Bench press 135 lbs',   '2026-01-15', '2026-07-15', 'active'),
(1, 'endurance',     'Run 5K in 28 min',      '2026-02-01', '2026-05-01', 'active'),
(1, 'flexibility',   'Touch toes comfortably', '2026-02-10', '2026-04-30', 'active'),
(1, 'weight_loss',   'Lose 5 lbs (holiday)',   '2025-09-01', '2025-12-31', 'completed'),
(1, 'other',         'Drink 3L water daily',   '2025-10-01', '2025-12-31', 'completed'),
-- Other members
(2, 'endurance',     'Run 5K in under 25 min', '2026-02-01', '2026-05-01', 'active'),
(3, 'flexibility',   'Full splits',            '2025-09-01', '2026-03-01', 'active'),
(3, 'weight_loss',   'Lose 15 lbs',            '2025-06-01', '2025-12-31', 'completed'),
(4, 'muscle_gain',   'Gain 10 lbs muscle',     '2026-01-01', '2026-12-31', 'active'),
(5, 'other',         'Exercise 4x per week',   '2026-01-01', NULL,         'active');

-- ============================================================
-- Health Metrics (append-only history)
-- ============================================================
INSERT INTO health_metric (member_id, weight, body_fat_pct, blood_pressure, heart_rate, recorded_at) VALUES
-- Alice (member 1) — 8 readings across 4 months for richer charts
(1, 170.00, 30.2, '124/82', 76, '2025-10-01 09:00:00'),
(1, 168.50, 29.8, '122/80', 75, '2025-10-15 09:00:00'),
(1, 167.00, 29.3, '121/80', 74, '2025-11-01 09:00:00'),
(1, 166.00, 28.9, '120/80', 73, '2025-11-20 09:00:00'),
(1, 165.00, 28.5, '120/80', 72, '2025-12-05 09:00:00'),
(1, 164.00, 28.1, '119/79', 71, '2026-01-05 09:00:00'),
(1, 163.00, 27.6, '118/78', 70, '2026-01-20 09:00:00'),
(1, 161.50, 27.0, '118/76', 68, '2026-02-05 09:00:00'),
(1, 160.00, 26.5, '116/75', 67, '2026-02-18 09:00:00'),
-- Other members
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
-- Frank Miller (trainer 1) — past sessions for chart data
(1, 1, 4, '2025-09-15', '08:00', '09:00', 'completed'),
(2, 1, 4, '2025-09-22', '10:00', '11:00', 'completed'),
(1, 1, 4, '2025-10-06', '08:00', '09:00', 'completed'),
(4, 1, 4, '2025-10-13', '09:00', '10:00', 'completed'),
(2, 1, 4, '2025-10-20', '10:00', '11:00', 'completed'),
(1, 1, 4, '2025-11-03', '08:00', '09:00', 'completed'),
(4, 1, 4, '2025-11-17', '09:00', '10:00', 'completed'),
(2, 1, 4, '2025-12-01', '10:00', '11:00', 'completed'),
(1, 1, 4, '2025-12-08', '08:00', '09:00', 'completed'),
(4, 1, 4, '2025-12-15', '09:00', '10:00', 'completed'),
(1, 1, 4, '2026-01-05', '08:00', '09:00', 'completed'),
(2, 1, 4, '2026-01-12', '10:00', '11:00', 'completed'),
(4, 1, 4, '2026-01-19', '09:00', '10:00', 'completed'),
(1, 1, 4, '2026-02-02', '08:00', '09:00', 'completed'),
(2, 1, 4, '2026-02-09', '10:00', '11:00', 'completed'),
-- Upcoming sessions
(1, 1, 4, '2026-02-23', '08:00', '09:00', 'scheduled'),
(2, 1, 4, '2026-02-23', '10:00', '11:00', 'scheduled'),
(1, 3, 4, '2026-02-24', '10:00', '11:00', 'scheduled'),
(4, 1, 4, '2026-02-25', '09:00', '10:00', 'scheduled'),
(3, 2, 2, '2026-02-23', '08:00', '09:00', 'scheduled'),
(5, 3, 3, '2026-02-24', '11:00', '12:00', 'scheduled'),
-- More upcoming sessions for Alice
(1, 2, 2, '2026-02-26', '07:00', '08:00', 'scheduled'),
(1, 1, 4, '2026-03-02', '08:00', '09:00', 'scheduled'),
(1, 3, 3, '2026-03-05', '10:00', '11:00', 'scheduled');

-- ============================================================
-- Group Classes
-- ============================================================
INSERT INTO group_class (class_name, trainer_id, room_id, class_date, start_time, end_time, max_participants) VALUES
-- Frank Miller (trainer 1) — classes spread across 6 months for chart data
('Power Lifting 101',  1, 1, '2025-09-10', '10:00', '11:00', 20),
('Strength Basics',    1, 1, '2025-09-24', '14:00', '15:00', 20),
('Power Lifting 101',  1, 1, '2025-10-08', '10:00', '11:00', 20),
('Strength Basics',    1, 1, '2025-10-22', '14:00', '15:00', 20),
('Core Crusher',       1, 1, '2025-10-29', '16:00', '17:00', 15),
('Power Lifting 101',  1, 1, '2025-11-05', '10:00', '11:00', 20),
('Core Crusher',       1, 1, '2025-11-19', '16:00', '17:00', 15),
('Strength Basics',    1, 1, '2025-12-03', '14:00', '15:00', 20),
('Power Lifting 101',  1, 1, '2025-12-17', '10:00', '11:00', 20),
('Core Crusher',       1, 1, '2025-12-22', '16:00', '17:00', 15),
('Power Lifting 101',  1, 1, '2026-01-07', '10:00', '11:00', 20),
('Strength Basics',    1, 1, '2026-01-14', '14:00', '15:00', 20),
('Core Crusher',       1, 1, '2026-01-21', '16:00', '17:00', 15),
('Power Lifting 101',  1, 1, '2026-01-28', '10:00', '11:00', 20),
('Strength Basics',    1, 1, '2026-02-04', '14:00', '15:00', 20),
('Core Crusher',       1, 1, '2026-02-11', '16:00', '17:00', 15),
('Power Lifting 101',  1, 1, '2026-02-18', '10:00', '11:00', 20),
('Strength Basics',    1, 1, '2026-02-24', '14:00', '15:00', 20),
-- Other trainers — past classes for admin booking trend
('Morning Yoga',       2, 2, '2025-10-06', '09:30', '10:30', 15),
('Evening Yoga',       2, 2, '2025-10-20', '17:00', '18:00', 15),
('HIIT Blast',         3, 1, '2025-10-14', '11:00', '12:00', 25),
('Morning Yoga',       2, 2, '2025-11-03', '09:30', '10:30', 15),
('Cardio Kickboxing',  3, 3, '2025-11-11', '13:00', '14:00', 20),
('HIIT Blast',         3, 1, '2025-11-25', '11:00', '12:00', 25),
('Morning Yoga',       2, 2, '2025-12-01', '09:30', '10:30', 15),
('Evening Yoga',       2, 2, '2025-12-15', '17:00', '18:00', 15),
('HIIT Blast',         3, 1, '2025-12-09', '11:00', '12:00', 25),
('Morning Yoga',       2, 2, '2026-01-06', '09:30', '10:30', 15),
('Cardio Kickboxing',  3, 3, '2026-01-13', '13:00', '14:00', 20),
('HIIT Blast',         3, 1, '2026-01-20', '11:00', '12:00', 25),
('Morning Yoga',       2, 2, '2026-02-03', '09:30', '10:30', 15),
('HIIT Blast',         3, 1, '2026-02-10', '11:00', '12:00', 25),
-- Other trainers — upcoming classes
('Morning Yoga',       2, 2, '2026-02-23', '09:30', '10:30', 15),
('HIIT Blast',         3, 1, '2026-02-23', '11:00', '12:00', 25),
('Evening Yoga',       2, 2, '2026-02-25', '17:00', '18:00', 15),
('Cardio Kickboxing',  3, 3, '2026-02-25', '13:00', '14:00', 20),
('Morning Yoga',       2, 2, '2026-02-27', '09:30', '10:30', 15),
('HIIT Blast',         3, 1, '2026-03-02', '11:00', '12:00', 25),
('Cardio Kickboxing',  3, 3, '2026-03-04', '13:00', '14:00', 20);

-- ============================================================
-- Class Enrollments
-- Frank's classes: IDs 1-18
-- Other trainers past: 19-32 (Morning Yoga, Evening Yoga, HIIT, etc.)
-- Other trainers upcoming: 33-39
-- ============================================================
INSERT INTO class_enrollment (class_id, member_id) VALUES
-- Alice in Frank's classes (past + upcoming)
(1, 1), (1, 2),
(3, 1), (3, 4),
(6, 2), (6, 4),
(11, 1), (11, 2), (11, 4),
(15, 1), (15, 2),
(18, 1), (18, 2), (18, 4),
-- Alice in other trainers' past classes
(19, 1), (19, 3),
(21, 1),
(22, 1), (22, 3),
(24, 1),
(25, 1), (25, 2),
(28, 1), (28, 3),
(30, 1),
(31, 1), (31, 3),
-- Alice in upcoming classes
(33, 1), (33, 3), (33, 5),
(34, 1), (34, 2), (34, 4),
(35, 1), (35, 3), (35, 5),
(36, 1), (36, 2), (36, 4),
(37, 1),
(38, 1),
(39, 1),
-- Other members in upcoming classes
(34, 5),
(36, 5);

-- ============================================================
-- Equipment Maintenance Logs
-- ============================================================
INSERT INTO equipment_maintenance (equipment_id, issue_description, reported_date, resolved_date, status) VALUES
(3, 'Pedal resistance mechanism stuck, makes grinding noise',           '2025-11-10', NULL,         'in_progress'),
(6, 'Hydraulic cylinder leaking fluid, unsafe for use',                 '2025-07-20', NULL,         'reported'),
(1, 'Belt slipping at high speeds, replaced belt',                      '2025-11-25', '2025-12-01', 'resolved'),
(4, 'Bench padding torn, reupholstered',                                '2025-09-15', '2025-10-01', 'resolved'),
(6, 'Weight stack cable fraying, needs immediate replacement',          '2026-01-05', NULL,         'in_progress'),
(2, 'Treadmill display flickering intermittently',                      '2026-01-20', '2026-02-05', 'resolved'),
(5, 'Safety catch not locking, potential hazard',                       '2026-02-01', NULL,         'reported'),
(7, 'Seat rail sticking, hard to adjust',                               '2026-02-10', NULL,         'in_progress'),
(8, 'Cable pulley squeaking loudly under load',                         '2025-12-20', '2026-01-10', 'resolved');
