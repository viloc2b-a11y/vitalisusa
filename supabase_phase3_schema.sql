-- VITALIS - Para Investigadores - Phase 3 schema support
-- Apply in Supabase SQL editor if tables do not exist yet.
-- TODO: Add RLS policies according to your auth model before production.

create table if not exists studies (
  id text primary key,
  slug text not null unique,
  name text not null,
  condition text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sites (
  id text primary key,
  name text not null,
  city text not null,
  state text not null,
  contact_name text,
  contact_email text,
  calendar_link text,
  languages jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  performance_score numeric not null default 0,
  avg_time_to_contact numeric not null default 0,
  screen_rate numeric not null default 0,
  randomization_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patients (
  id text primary key,
  first_name text not null,
  last_name text not null,
  age int,
  gender text,
  ethnicity text,
  language text,
  zip_code text,
  phone text,
  email text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists referrals (
  id text primary key,
  patient_id text references patients(id) on delete cascade,
  study_id text references studies(id),
  site_id text references sites(id),
  referred_at timestamptz,
  distance_miles numeric,
  status text not null check (status in (
    'new_referral','contacted','scheduled','screened',
    'randomized','ineligible','unreachable','no_show'
  )),
  qualification_score numeric,
  qualification_level text,
  flags jsonb not null default '[]'::jsonb,
  diagnosis_confirmed boolean,
  severity_label text,
  duration_label text,
  prior_treatments_failed boolean,
  bmi numeric,
  exclusion_flags jsonb not null default '[]'::jsonb,
  ready_this_week boolean default false,
  preferred_time text,
  next_available_slot text,
  calendar_synced boolean default false,
  notes jsonb not null default '[]'::jsonb,
  prescreener_data jsonb,
  routing_score numeric not null default 0,
  estimated_value numeric not null default 0,
  billing_status text not null default 'pending' check (billing_status in ('pending','billed','paid')),
  first_contact_at timestamptz,
  scheduled_at timestamptz,
  screened_at timestamptz,
  randomized_at timestamptz,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists investigator_inquiries (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  contact_name text not null,
  email text not null,
  study_interest text not null,
  monthly_enrollment_goal int not null,
  therapeutic_area text not null,
  preferred_contact_method text not null,
  source_page text not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_referrals_status on referrals(status);
create index if not exists idx_referrals_patient_id on referrals(patient_id);
create index if not exists idx_referrals_last_updated on referrals(last_updated);
create index if not exists idx_referrals_referred_at on referrals(referred_at);
create index if not exists idx_investigator_inquiries_submitted_at on investigator_inquiries(submitted_at);

-- Alignment patch for existing DBs (safe if columns already moved)
alter table if exists referrals add column if not exists referred_at timestamptz;
alter table if exists referrals add column if not exists distance_miles numeric;
alter table if exists referrals add column if not exists notes jsonb not null default '[]'::jsonb;

-- Migrate data ownership from patients -> referrals where possible
update referrals r
set
  referred_at = coalesce(r.referred_at, p.referred_at),
  distance_miles = coalesce(r.distance_miles, p.distance_miles),
  notes = case
    when coalesce(jsonb_array_length(r.notes), 0) = 0 and p.notes is not null then p.notes
    else r.notes
  end
from patients p
where p.id = r.patient_id;

alter table if exists patients drop column if exists referred_at;
alter table if exists patients drop column if exists distance_miles;
alter table if exists patients drop column if exists notes;

-- Intake pipeline: prescreener_data, billing fields
alter table if exists referrals add column if not exists prescreener_data jsonb;
alter table if exists referrals add column if not exists routing_score numeric not null default 0;
alter table if exists referrals add column if not exists estimated_value numeric not null default 0;
alter table if exists referrals add column if not exists billing_status text not null default 'pending';

-- Site performance columns
alter table if exists sites add column if not exists performance_score numeric not null default 0;
alter table if exists sites add column if not exists avg_time_to_contact numeric not null default 0;
alter table if exists sites add column if not exists screen_rate numeric not null default 0;
alter table if exists sites add column if not exists randomization_rate numeric not null default 0;

create index if not exists idx_referrals_qualification_score on referrals(qualification_score desc);
create index if not exists idx_referrals_study_id on referrals(study_id);
create index if not exists idx_referrals_billing_status on referrals(billing_status);
create index if not exists idx_referrals_site_id on referrals(site_id);
create index if not exists idx_referrals_routing_score on referrals(routing_score desc);
create index if not exists idx_sites_performance_score on sites(performance_score desc);

-- Backfill estimated_value for any existing rows that have score but no value
update referrals
set estimated_value = case
  when qualification_score >= 8 then 120
  when qualification_score >= 5 then 70
  else 30
end
where estimated_value = 0 and qualification_score is not null;

-- Minimal seed example (aligned ownership)
insert into studies (id, slug, name, condition, status)
values ('study_hope4oa_001', 'hope4oa', 'Trial Stride - A HOPE4OA Study', 'Osteoartritis', 'active')
on conflict (id) do nothing;

insert into sites (id, name, city, state, contact_name, contact_email, calendar_link, languages, active, performance_score, avg_time_to_contact, screen_rate, randomization_rate)
values (
  'site_vilo_hou_30',
  'Vilo Research Group',
  'Houston',
  'TX',
  'Dr. Jorge Mendes',
  'investigators@vitalisportal.com',
  'https://example.com/site-calendar',
  '["es","en"]'::jsonb,
  true,
  82,
  16,
  46,
  22
)
on conflict (id) do nothing;

insert into patients (id, first_name, last_name, age, gender, ethnicity, language, zip_code, phone, email, source)
values (
  'pat_2048',
  'Matilde',
  'Peña',
  75,
  'F',
  'Hispana',
  'Español',
  '77008',
  '+1 346 876 1439',
  'matilde.pena@example.com',
  'Landing OA'
)
on conflict (id) do nothing;

insert into referrals (
  id, patient_id, study_id, site_id, referred_at, distance_miles, status,
  qualification_score, qualification_level, flags, diagnosis_confirmed,
  severity_label, duration_label, prior_treatments_failed, bmi, exclusion_flags,
  ready_this_week, preferred_time, next_available_slot, calendar_synced, notes, routing_score, last_updated
)
values (
  'ref_2048',
  'pat_2048',
  'study_hope4oa_001',
  'site_vilo_hou_30',
  now() - interval '1 day',
  3,
  'new_referral',
  9.2,
  'high',
  '["follow_up_required"]'::jsonb,
  true,
  'Severo (8/10)',
  '7 años',
  true,
  29.4,
  '[]'::jsonb,
  true,
  'Tarde (2:00 PM - 5:00 PM)',
  'Lun 10:30 AM',
  false,
  '["Pendiente de primer contacto","Prefiere llamada por la tarde"]'::jsonb,
  90,
  now()
)
on conflict (id) do nothing;
