-- ============================================================================
-- ServiceCore Complete Normalized Database Schema (3NF/4NF)
-- ============================================================================
-- This schema covers ALL entities needed for a full employee time tracking
-- and payroll system for portable sanitation / field service companies.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ORGANIZATIONS (multi-tenant root)
-- ============================================================================
CREATE TABLE organizations (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            text NOT NULL,
    slug            text UNIQUE NOT NULL,                    -- URL-friendly identifier
    industry        text DEFAULT 'portable_sanitation',      -- industry classification
    timezone        text DEFAULT 'America/Denver',
    logo_url        text,
    address_line1   text,
    address_line2   text,
    city            text,
    state           text,
    zip             text,
    phone           text,
    email           text,
    website         text,
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. DEPARTMENTS (normalized from hardcoded enum)
-- ============================================================================
CREATE TABLE departments (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,                           -- 'Drivers', 'Service Crew', 'Office'
    description     text,
    manager_id      uuid,                                    -- FK to employees (added after employees table)
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    UNIQUE(org_id, name)
);

-- ============================================================================
-- 3. CUSTOMERS / CLIENTS (normalized from project.client string)
-- ============================================================================
CREATE TABLE customers (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,                           -- 'Hensel Phelps Construction'
    contact_name    text,                                    -- Primary contact person
    contact_email   text,
    contact_phone   text,
    address_line1   text,
    address_line2   text,
    city            text,
    state           text,
    zip             text,
    billing_email   text,
    payment_terms   text DEFAULT 'net_30',                   -- net_30, net_60, due_on_receipt
    tax_id          text,                                    -- For invoicing
    notes           text,
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. LOCATIONS / SITES (normalized from string fields)
-- ============================================================================
CREATE TABLE locations (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,                           -- 'Denver Central Logistics Hub'
    address         text,
    city            text,
    state           text,
    zip             text,
    latitude        numeric(10, 7),                          -- GPS coordinates
    longitude       numeric(10, 7),
    geofence_radius_meters integer DEFAULT 200,              -- Geofence boundary
    location_type   text DEFAULT 'job_site',                 -- job_site, office, warehouse, yard
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. EMPLOYEES (expanded with proper relationships)
-- ============================================================================
CREATE TABLE employees (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id   uuid REFERENCES departments(id) ON DELETE SET NULL,
    manager_id      uuid REFERENCES employees(id) ON DELETE SET NULL,  -- Self-referencing FK
    home_location_id uuid REFERENCES locations(id) ON DELETE SET NULL, -- Default work location

    -- Personal info
    first_name      text NOT NULL,
    last_name       text NOT NULL,
    email           text UNIQUE NOT NULL,
    phone           text,
    avatar_color    text DEFAULT '#f59e0b',
    photo_url       text,

    -- Employment info
    employee_number text,                                    -- Internal employee ID (e.g., 'EMP-001')
    role            text NOT NULL,                           -- Current job title
    employment_type text DEFAULT 'full_time',                -- full_time, part_time, contractor, seasonal
    hire_date       date NOT NULL,
    termination_date date,                                   -- NULL if still employed

    -- Emergency contact
    emergency_contact_name  text,
    emergency_contact_phone text,

    -- System fields
    auth_user_id    uuid,                                    -- FK to Supabase auth.users
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Add deferred FK for department manager
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. PAY RATES (normalized - tracks history of rate changes)
-- ============================================================================
CREATE TABLE pay_rates (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    effective_date  date NOT NULL,                           -- When this rate takes effect
    end_date        date,                                    -- NULL = current rate
    hourly_rate     numeric(10, 2) NOT NULL,                 -- Base rate
    overtime_rate   numeric(10, 2) NOT NULL,                 -- 1.5x rate
    double_time_rate numeric(10, 2) NOT NULL,                -- 2x rate
    pay_type        text DEFAULT 'hourly',                   -- hourly, salary, piece_rate
    notes           text,                                    -- 'Annual raise', 'Promotion to lead'
    created_at      timestamptz DEFAULT now(),
    UNIQUE(employee_id, effective_date)
);

-- ============================================================================
-- 7. POSITION HISTORY (tracks role changes, promotions, transfers)
-- ============================================================================
CREATE TABLE position_history (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    department_id   uuid REFERENCES departments(id) ON DELETE SET NULL,
    role            text NOT NULL,                           -- Job title at the time
    start_date      date NOT NULL,
    end_date        date,                                    -- NULL = current position
    change_reason   text,                                    -- 'Promotion', 'Transfer', 'Hire'
    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 8. PROJECTS (expanded with proper FKs)
-- ============================================================================
CREATE TABLE projects (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id     uuid REFERENCES customers(id) ON DELETE SET NULL,  -- Proper FK instead of string
    location_id     uuid REFERENCES locations(id) ON DELETE SET NULL,

    name            text NOT NULL,
    description     text,
    project_number  text,                                    -- Internal project code (e.g., 'PRJ-2026-001')
    project_type    text DEFAULT 'service',                  -- service, rental, event, construction, municipal
    status          text DEFAULT 'active',                   -- active, completed, on_hold, cancelled

    budget          numeric(12, 2) DEFAULT 0,
    start_date      date NOT NULL,
    end_date        date,                                    -- NULL for ongoing

    -- Unit counts for portable sanitation
    units_deployed  integer DEFAULT 0,                       -- Number of portable units on site
    service_frequency text DEFAULT 'weekly',                 -- daily, weekly, bi-weekly, monthly, event

    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 9. PROJECT TASKS (sub-items within projects)
-- ============================================================================
CREATE TABLE project_tasks (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            text NOT NULL,                           -- 'Delivery', 'Servicing', 'Pickup'
    description     text,
    estimated_hours numeric(8, 2),
    actual_hours    numeric(8, 2) DEFAULT 0,
    status          text DEFAULT 'open',                     -- open, in_progress, completed
    sort_order      integer DEFAULT 0,
    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 10. VEHICLES (for mileage and fleet tracking)
-- ============================================================================
CREATE TABLE vehicles (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,                           -- 'Truck #5', 'Service Van A'
    make            text,
    model           text,
    year            integer,
    vin             text,
    license_plate   text,
    vehicle_type    text DEFAULT 'truck',                    -- truck, van, trailer, car
    odometer        numeric(10, 1),                          -- Current odometer reading
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 11. TIMESHEETS (batch/period submissions - the "timesheet" concept)
-- ============================================================================
CREATE TABLE timesheets (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start date NOT NULL,
    pay_period_end  date NOT NULL,
    status          text DEFAULT 'draft',                    -- draft, submitted, approved, rejected, processed
    submitted_at    timestamptz,
    approved_at     timestamptz,
    approved_by     uuid REFERENCES employees(id),           -- Manager who approved
    rejected_at     timestamptz,
    rejection_reason text,

    -- Computed totals (cached for performance)
    total_regular_hours   numeric(8, 2) DEFAULT 0,
    total_overtime_hours  numeric(8, 2) DEFAULT 0,
    total_double_time_hours numeric(8, 2) DEFAULT 0,
    total_break_minutes   integer DEFAULT 0,
    total_mileage        numeric(8, 1) DEFAULT 0,
    gross_pay            numeric(10, 2) DEFAULT 0,

    notes           text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE(employee_id, pay_period_start, pay_period_end)
);

-- ============================================================================
-- 12. TIME ENTRIES (individual clock in/out records within a timesheet)
-- ============================================================================
CREATE TABLE time_entries (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    timesheet_id    uuid REFERENCES timesheets(id) ON DELETE SET NULL,  -- Which timesheet period
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
    task_id         uuid REFERENCES project_tasks(id) ON DELETE SET NULL,
    vehicle_id      uuid REFERENCES vehicles(id) ON DELETE SET NULL,
    location_id     uuid REFERENCES locations(id) ON DELETE SET NULL,

    clock_in        timestamptz NOT NULL,
    clock_out       timestamptz,                             -- NULL = shift still open

    -- Derived/cached
    regular_hours   numeric(6, 2),
    overtime_hours  numeric(6, 2),
    double_time_hours numeric(6, 2),

    -- Metadata
    location_text   text DEFAULT '',                         -- Human-readable location
    gps_clock_in    point,                                   -- PostGIS point for clock-in GPS
    gps_clock_out   point,                                   -- PostGIS point for clock-out GPS
    mileage         numeric(8, 1),
    notes           text DEFAULT '',

    -- Status & flags
    status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    flags           text[] DEFAULT '{}',                     -- overtime, manual_edit, late_arrival, etc.
    is_manual_edit  boolean DEFAULT false,

    -- Import tracking
    import_source   text,                                    -- 'manual', 'kronos', 'excel', 'ocr', 'api'
    import_batch_id uuid,                                    -- Links entries from same import

    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_clock_in ON time_entries(clock_in);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_timesheet ON time_entries(timesheet_id);

-- ============================================================================
-- 13. BREAKS (normalized from JSONB array into proper table)
-- ============================================================================
CREATE TABLE breaks (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id   uuid NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    break_type      text NOT NULL DEFAULT 'lunch'
                    CHECK (break_type IN ('lunch', 'rest', 'other')),
    start_time      timestamptz NOT NULL,
    end_time        timestamptz,                             -- NULL = break still active
    duration_minutes integer,                                -- Cached/computed
    is_paid         boolean DEFAULT false,                   -- Paid vs unpaid break
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_breaks_time_entry ON breaks(time_entry_id);

-- ============================================================================
-- 14. MILEAGE LOGS (separate from time entries for detailed tracking)
-- ============================================================================
CREATE TABLE mileage_logs (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    vehicle_id      uuid REFERENCES vehicles(id) ON DELETE SET NULL,
    time_entry_id   uuid REFERENCES time_entries(id) ON DELETE SET NULL,

    date            date NOT NULL,
    start_odometer  numeric(10, 1),
    end_odometer    numeric(10, 1),
    total_miles     numeric(8, 1) NOT NULL,
    purpose         text,                                    -- 'Route delivery', 'Site visit'
    route_from      text,
    route_to        text,
    reimbursement_rate numeric(5, 3) DEFAULT 0.67,           -- IRS mileage rate
    reimbursement_amount numeric(8, 2),

    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 15. NOTIFICATIONS (making the bell icon functional)
-- ============================================================================
CREATE TABLE notifications (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_id    uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    type            text NOT NULL,                           -- timesheet_reminder, approval_needed,
                                                             -- timesheet_approved, timesheet_rejected,
                                                             -- overtime_alert, missing_clockout,
                                                             -- schedule_change, system_announcement
    title           text NOT NULL,
    message         text NOT NULL,

    -- Link to related entity
    related_type    text,                                    -- 'time_entry', 'timesheet', 'project'
    related_id      uuid,

    is_read         boolean DEFAULT false,
    read_at         timestamptz,
    action_url      text,                                    -- Deep link (e.g., '/app?tab=approvals')

    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

-- ============================================================================
-- 16. PAY PERIODS (actual pay period date tracking)
-- ============================================================================
CREATE TABLE pay_periods (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_type     text NOT NULL DEFAULT 'bi-weekly'
                    CHECK (period_type IN ('weekly', 'bi-weekly', 'semi-monthly')),
    start_date      date NOT NULL,
    end_date        date NOT NULL,
    pay_date        date,                                    -- When paychecks are issued
    status          text DEFAULT 'open',                     -- open, closed, processed
    created_at      timestamptz DEFAULT now(),
    UNIQUE(org_id, start_date, end_date)
);

-- ============================================================================
-- 17. IMPORT BATCHES (track bulk imports from Kronos, Excel, OCR)
-- ============================================================================
CREATE TABLE import_batches (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    imported_by     uuid REFERENCES employees(id),

    source          text NOT NULL,                           -- 'kronos', 'excel', 'csv', 'ocr', 'api'
    source_filename text,                                    -- Original filename
    source_format   text,                                    -- 'kronos_wfc', 'ukg_pro', 'generic_csv', 'xlsx'

    total_rows      integer DEFAULT 0,
    imported_rows   integer DEFAULT 0,
    skipped_rows    integer DEFAULT 0,
    error_rows      integer DEFAULT 0,

    status          text DEFAULT 'pending',                  -- pending, processing, completed, failed
    error_log       jsonb DEFAULT '[]',                      -- Array of {row, field, error}

    started_at      timestamptz DEFAULT now(),
    completed_at    timestamptz,
    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 18. APP SETTINGS (expanded)
-- ============================================================================
CREATE TABLE app_settings (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

    -- Pay rules
    pay_period_type text DEFAULT 'bi-weekly',
    overtime_rules  jsonb DEFAULT '{"dailyThreshold": 8, "weeklyThreshold": 40, "overtimeMultiplier": 1.5, "doubleTimeMultiplier": 2}',
    break_rules     jsonb DEFAULT '{"autoDeductMinutes": 30, "afterHoursThreshold": 6}',

    -- Geofence
    geofence_enabled boolean DEFAULT true,
    geofence_default_radius integer DEFAULT 200,

    -- Reminders
    reminder_enabled boolean DEFAULT true,
    reminder_day    text DEFAULT 'friday',
    reminder_time   text DEFAULT '15:00',

    -- Mileage
    mileage_reimbursement_rate numeric(5, 3) DEFAULT 0.670,

    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- 19. ACTIVITY LOG (expanded event tracking)
-- ============================================================================
CREATE TABLE activity_events (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type            text NOT NULL
                    CHECK (type IN ('clock_in', 'clock_out', 'break_start', 'break_end',
                                    'note', 'approval', 'rejection', 'import', 'edit')),
    timestamp       timestamptz NOT NULL DEFAULT now(),
    location        text DEFAULT '',
    details         text,
    related_type    text,                                    -- 'time_entry', 'timesheet', 'import_batch'
    related_id      uuid,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_events_employee ON activity_events(employee_id);
CREATE INDEX idx_activity_events_timestamp ON activity_events(timestamp);

-- ============================================================================
-- SUMMARY: ENTITY RELATIONSHIP DIAGRAM
-- ============================================================================
--
-- organizations (1)
--   ├── (M) departments
--   ├── (M) customers
--   ├── (M) locations
--   ├── (M) employees
--   │     ├── (M) pay_rates          [rate history]
--   │     ├── (M) position_history   [role changes]
--   │     ├── (M) timesheets         [period submissions]
--   │     │     └── (M) time_entries  [individual clock records]
--   │     │           ├── (M) breaks  [normalized break records]
--   │     │           └── (1) mileage_logs
--   │     ├── (M) mileage_logs
--   │     └── (M) notifications
--   ├── (M) projects
--   │     ├── (1) customer           [FK]
--   │     ├── (1) location           [FK]
--   │     └── (M) project_tasks
--   ├── (M) vehicles
--   ├── (M) pay_periods
--   ├── (M) import_batches
--   └── (1) app_settings
--
-- employees (self-referencing)
--   └── manager_id → employees.id
--
