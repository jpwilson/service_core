-- ServiceCore Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Employees table
create table employees (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  department text not null check (department in ('Drivers', 'Service Crew', 'Office')),
  role text not null,
  hourly_rate numeric(10,2) not null,
  overtime_rate numeric(10,2) not null,
  double_time_rate numeric(10,2) not null,
  hire_date date not null,
  is_active boolean default true,
  avatar_color text default '#f59e0b',
  organization_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects table
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client text not null,
  location text not null,
  is_active boolean default true,
  budget numeric(12,2) default 0,
  start_date date not null,
  end_date date,
  organization_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Time entries table
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  breaks jsonb default '[]',
  notes text default '',
  location text default '',
  mileage numeric(8,1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  flags text[] default '{}',
  is_manual_edit boolean default false,
  organization_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity events table
create table activity_events (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null check (type in ('clock_in', 'clock_out', 'break_start', 'break_end', 'note')),
  timestamp timestamptz not null default now(),
  location text default '',
  details text,
  organization_id uuid,
  created_at timestamptz default now()
);

-- App settings table (per organization)
create table app_settings (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid unique,
  pay_period_type text default 'bi-weekly',
  overtime_rules jsonb default '{"dailyThreshold": 8, "weeklyThreshold": 40, "overtimeMultiplier": 1.5, "doubleTimeMultiplier": 2}',
  break_rules jsonb default '{"autoDeductMinutes": 30, "afterHoursThreshold": 6}',
  geofence_enabled boolean default true,
  reminder_enabled boolean default true,
  reminder_day text default 'friday',
  reminder_time text default '15:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index idx_time_entries_employee on time_entries(employee_id);
create index idx_time_entries_project on time_entries(project_id);
create index idx_time_entries_clock_in on time_entries(clock_in);
create index idx_time_entries_status on time_entries(status);
create index idx_activity_events_employee on activity_events(employee_id);
create index idx_activity_events_timestamp on activity_events(timestamp);

-- Row Level Security
alter table employees enable row level security;
alter table projects enable row level security;
alter table time_entries enable row level security;
alter table activity_events enable row level security;
alter table app_settings enable row level security;

-- RLS policies (allow authenticated users to read/write their organization's data)
create policy "Users can view employees" on employees for select using (true);
create policy "Users can insert employees" on employees for insert with check (true);
create policy "Users can update employees" on employees for update using (true);

create policy "Users can view projects" on projects for select using (true);
create policy "Users can manage projects" on projects for all using (true);

create policy "Users can view time entries" on time_entries for select using (true);
create policy "Users can manage time entries" on time_entries for all using (true);

create policy "Users can view activity events" on activity_events for select using (true);
create policy "Users can insert activity events" on activity_events for insert with check (true);

create policy "Users can manage settings" on app_settings for all using (true);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger employees_updated_at before update on employees for each row execute function update_updated_at();
create trigger projects_updated_at before update on projects for each row execute function update_updated_at();
create trigger time_entries_updated_at before update on time_entries for each row execute function update_updated_at();
create trigger app_settings_updated_at before update on app_settings for each row execute function update_updated_at();
