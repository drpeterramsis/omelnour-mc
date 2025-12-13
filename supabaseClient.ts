import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://vulllioagnrprzqjndfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bGxsaW9hZ25ycHJ6cWpuZGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTY3MjMsImV4cCI6MjA4MDY3MjcyM30.T6aJt1ROKS8_YAX2lvCkRn1IoBMoy7Z0BjBj2a9U6KM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * ==========================================
 * 🛠️ DATABASE SETUP INSTRUCTIONS (SQL) 🛠️
 * ==========================================
 * 
 * Copy and paste the following SQL code into the "SQL Editor" in your Supabase Dashboard
 * to create the necessary tables and fix the login error.
 * 
 * ==========================================
 */

/*
-- 1. Create Profiles Table (For Staff/Admins)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'receptionist'
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Admins can update profiles." on public.profiles for update using (true);

-- 2. Create Doctors Table
create table if not exists public.doctors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  specialty text not null,
  image_url text
);
alter table public.doctors enable row level security;
create policy "Doctors are viewable by everyone." on public.doctors for select using (true);
create policy "Staff can manage doctors." on public.doctors for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'receptionist')));

-- 3. Create Schedules Table
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references public.doctors on delete cascade not null,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  is_cancelled boolean default false,
  notes text
);
alter table public.schedules enable row level security;
create policy "Schedules are viewable by everyone." on public.schedules for select using (true);
create policy "Staff can manage schedules." on public.schedules for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'receptionist')));

-- 4. Seed Data (Optional - Adds Example Doctors)
insert into public.doctors (name, specialty) values 
('د. أحمد (مثال)', 'أسنان 🦷'),
('د. محمد (مثال)', 'علاج طبيعي 🦵'),
('د. علي (مثال)', 'باطن وقلب 🩺'),
('د. سارة (مثال)', 'تغذية 🍏'),
('د. منى (مثال)', 'أطفال 👶'),
('د. خالد (مثال)', 'أنف وأذن وحنجرة 👂'),
('د. حسن (مثال)', 'الجهاز الهضمى والكبد 🩺'),
('د. ليلى (مثال)', 'تخاطب 🔊'),
('د. عمر (مثال)', 'جراحة عامة 🔪'),
('د. يوسف (مثال)', 'جلدية 💅'),
('د. كريم (مثال)', 'رمد 👁️'),
('د. نادية (مثال)', 'سونار 📺'),
('د. هشام (مثال)', 'عظام 🦴'),
('د. سامي (مثال)', 'مخ واعصاب 🧠'),
('د. عادل (مثال)', 'مسالك ⚕️'),
('د. هبة (مثال)', 'نساء وتوليد 🤰');
*/
