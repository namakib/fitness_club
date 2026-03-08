# Project Report — Health and Fitness Club Management System

**Course**: EGEN5208W — Database Management Systems
**Term**: Winter 2026

---

## 1. Introduction

This report documents the design and implementation of a Health and Fitness Club Management System. The system enables members to register, track health metrics and fitness goals; trainers to manage availability and view schedules; and administrators to manage room bookings and equipment maintenance.

The system is backed by PostgreSQL and accessed through a Python Flask web application with a React (Vite) frontend and Tailwind CSS for the user interface.

---

## 2. Design Decisions

### 2.1 Separate User Tables

Three separate tables (`member`, `trainer`, `admin`) were used instead of a single `user` table with a role column. This decision was made because:

- Each role has distinct attributes (e.g., trainers have `specialization`, members have `dob` and `gender`)
- It avoids NULL columns that would be irrelevant to certain roles
- Foreign key references are clearer (e.g., `personal_session.trainer_id` references `trainer`, not a generic user table)

### 2.2 Append-Only Health Metrics

The `health_metric` table is designed as append-only. Members insert new records but never update or delete existing ones. This preserves a complete history of measurements and supports trend analysis on the dashboard.

### 2.3 Equipment Maintenance Separation

Equipment maintenance logs are stored in a separate `equipment_maintenance` table rather than as a status history column. This allows:

- Multiple maintenance issues per equipment item
- Tracking of issue lifecycle (reported → in progress → resolved)
- The `equipment.status` field reflects current operational status independently of historical maintenance records

### 2.4 Room Booking via Trigger

Room double-booking prevention is implemented as a PostgreSQL trigger (`fn_prevent_room_double_booking`) rather than application-level validation. This ensures data integrity regardless of how data is inserted — whether through the application, direct SQL, or future integrations.

### 2.5 Dashboard View

A PostgreSQL view (`member_dashboard_view`) aggregates data from multiple tables using LATERAL joins to power the member dashboard. This keeps complex aggregation logic in the database layer where it performs best.

---

## 3. Normalization to Third Normal Form (3NF)

### 3.1 First Normal Form (1NF)

All tables satisfy 1NF:
- Every attribute contains only atomic (indivisible) values
- No repeating groups or arrays
- Each table has a defined primary key

### 3.2 Second Normal Form (2NF)

All tables satisfy 2NF:
- All non-key attributes are fully functionally dependent on the entire primary key
- Since all tables use single-column surrogate primary keys (SERIAL), partial dependencies are impossible
- The composite candidate key `(class_id, member_id)` in `class_enrollment` is enforced via a UNIQUE constraint; the surrogate `enrollment_id` is the primary key

### 3.3 Third Normal Form (3NF)

All tables satisfy 3NF — no transitive dependencies exist:

| Table | Non-Key Attributes | Justification |
|-------|-------------------|---------------|
| `member` | name, email, dob, gender, phone, password_hash, created_at | All depend directly on member_id |
| `trainer` | name, email, phone, specialization, password_hash | All depend directly on trainer_id |
| `admin` | name, email, password_hash | All depend directly on admin_id |
| `fitness_goal` | member_id, goal_type, target_value, start_date, end_date, status | All depend on goal_id; member_id is a FK, not a transitive dependency |
| `health_metric` | member_id, weight, body_fat_pct, blood_pressure, heart_rate, recorded_at | All depend on metric_id |
| `trainer_availability` | trainer_id, available_date, start_time, end_time | All depend on availability_id |
| `room` | room_name, capacity | All depend on room_id |
| `equipment` | name, type, room_id, status, purchase_date | All depend on equipment_id; room_id is a FK; `status` is the current status, not derived from maintenance logs |
| `personal_session` | member_id, trainer_id, room_id, session_date, start_time, end_time, status | All depend on session_id |
| `group_class` | class_name, trainer_id, room_id, class_date, start_time, end_time, max_participants | All depend on class_id |
| `class_enrollment` | class_id, member_id, enrolled_at | All depend on enrollment_id |
| `equipment_maintenance` | equipment_id, issue_description, reported_date, resolved_date, status | All depend on log_id |
| `payment` | member_id, amount, payment_status, payment_date, payment_method | All depend on payment_id; member_id is a FK, not a transitive dependency |

### 3.4 No Derived Attributes

No computed or derived attributes are stored:
- **Age** is computed from `dob` at query time, not stored
- **Total classes attended** is computed via `COUNT(*)` on `class_enrollment` joined with `group_class` where `class_date < CURRENT_DATE`
- **Upcoming sessions count** is computed via query on `personal_session`

**Health metric design**: The `health_metric` table uses a wide-table design (columns for weight, body_fat_pct, blood_pressure, heart_rate) rather than an EAV pattern (metric_type + metric_value). This was chosen because: (1) the set of metric types is fixed and known; (2) each record naturally captures multiple measurements at one timestamp; (3) it simplifies queries for dashboard aggregation and avoids repeated self-joins.

---

## 4. Advanced SQL Features

### 4.1 View: `member_dashboard_view`

Combines data from `member`, `health_metric`, `fitness_goal`, `class_enrollment`, and `personal_session` using LATERAL joins to provide:
- Latest health metric per member
- Count of active fitness goals
- Total classes attended (past classes only)
- Count of upcoming scheduled sessions

### 4.2 Trigger: `fn_prevent_room_double_booking`

A `BEFORE INSERT OR UPDATE` trigger on both `personal_session` and `group_class` tables. It checks for time overlaps in the same room on the same date across both tables, raising an exception if a conflict is found.

### 4.3 Index: `idx_health_metric_member_recorded`

A composite index on `health_metric(member_id, recorded_at DESC)` to optimize the health history query, which sorts by `recorded_at DESC` and filters by `member_id`. This is the most frequent query pattern for health data.

---

## 5. Implementation

### 5.1 Architecture

The application follows a standard Flask blueprint architecture:
- `backend/__init__.py` — application factory
- `backend/db.py` — database connection management using psycopg2
- `backend/routes/auth.py` — authentication, login, registration, role decorators
- `backend/routes/member.py` — member operations (1-4)
- `backend/routes/trainer.py` — trainer operations (5-6)
- `backend/routes/admin.py` — admin operations (7-8)

### 5.2 Role-Based Access Control

- Authentication uses Flask sessions with werkzeug's `pbkdf2:sha256` password hashing
- A `role_required(role)` decorator checks both authentication and role authorization
- The `load_logged_in_user` function runs before every request to load the current user from the database

### 5.3 Error Handling

- All database operations are wrapped in try/except blocks
- Transactions are committed on success, rolled back on failure
- User-friendly error messages are shown via Flask flash messages
- Unique constraint violations (e.g., duplicate email) produce specific error messages

### 5.4 SQL Interaction

All database interactions use parameterized SQL queries via psycopg2 (no ORM). This satisfies the requirement for direct SQL usage and prevents SQL injection.

---

## 6. Operations Summary

| # | Operation | SQL Statements Used |
|---|-----------|-------------------|
| 1 | User Registration | INSERT INTO member |
| 2 | Profile Management | UPDATE member; INSERT INTO fitness_goal; UPDATE fitness_goal; INSERT INTO health_metric |
| 3 | Health History | SELECT FROM health_metric ORDER BY recorded_at DESC |
| 4 | Dashboard | SELECT FROM member_dashboard_view; SELECT FROM fitness_goal; SELECT joins across personal_session, group_class, class_enrollment |
| 5 | Set Availability | INSERT INTO trainer_availability; SELECT for overlap check; DELETE |
| 6 | Schedule View | SELECT joins: personal_session + member + room; group_class + room + class_enrollment; LATERAL join for member health data |
| 7 | Room Booking | INSERT INTO personal_session; INSERT INTO group_class (trigger enforces no overlap); SELECT union of sessions and classes |
| 8 | Equipment Maintenance | INSERT INTO equipment_maintenance; UPDATE equipment; UPDATE equipment_maintenance; SELECT with status filter |

---

## 7. Video Demonstration

<!-- TODO: Replace this placeholder with your actual video link -->
_Link to be added here._

---

## 8. Conclusion

The system meets all specified requirements: 13 entities in 3NF, 13 relationships, 8 fully functional operations, role-based access control, database-level constraint enforcement, and a clean web interface. All SQL is parameterized and executed directly against PostgreSQL without an ORM.
