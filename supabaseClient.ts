import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://cqyihsudqnzdzstvanko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeWloc3VkcW56ZHpzdHZhbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDc2NTEsImV4cCI6MjA4MTIyMzY1MX0.ciB_G-KitSBva4_x2e3j0gyTkw0nJwvN3NTUJmpT5aE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * ==========================================
 * 🛠️ FIXED SQL SCRIPT (Safe to Run) 🛠️
 * ==========================================
 * 
 * Copy and run the following in Supabase SQL Editor.
 * This script fixes "relation already exists" errors by checking first.
 * 
 * -- 1. Tables (Create only if they don't exist)
 * create table if not exists public.profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   email text,
 *   role text default 'patient',
 *   full_name text
 * );
 * 
 * create table if not exists public.doctors (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null,
 *   specialty text not null,
 *   image_url text
 * );
 * 
 * create table if not exists public.schedules (
 *   id uuid default gen_random_uuid() primary key,
 *   doctor_id uuid references public.doctors on delete cascade not null,
 *   day_of_week text not null,
 *   start_time text not null,
 *   end_time text not null,
 *   is_cancelled boolean default false,
 *   notes text
 * );
 * 
 * create table if not exists public.app_config (
 *   id int primary key default 1,
 *   enable_client_signup boolean default false
 * );
 * 
 * -- Seed App Config (Ensure row 1 exists)
 * insert into public.app_config (id, enable_client_signup) values (1, false) on conflict(id) do nothing;
 * 
 * -- 2. Enable RLS
 * alter table public.profiles enable row level security;
 * alter table public.doctors enable row level security;
 * alter table public.schedules enable row level security;
 * alter table public.app_config enable row level security;
 * 
 * -- 3. Drop Old Policies
 * drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
 * drop policy if exists "Users can insert their own profile." on public.profiles;
 * drop policy if exists "Admins can insert any profile." on public.profiles;
 * drop policy if exists "Admins and Owners can delete profiles" on public.profiles;
 * drop policy if exists "Admins can update profiles." on public.profiles;
 * 
 * drop policy if exists "Doctors are viewable by everyone." on public.doctors;
 * drop policy if exists "Staff can manage doctors." on public.doctors;
 * 
 * drop policy if exists "Schedules are viewable by everyone." on public.schedules;
 * drop policy if exists "Staff can manage schedules." on public.schedules;
 * 
 * drop policy if exists "Config viewable by everyone" on public.app_config;
 * drop policy if exists "Admins can update config" on public.app_config;
 * 
 * -- 4. Re-create Policies
 * create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
 * create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
 * 
 * create policy "Admins can insert any profile." on public.profiles for insert with check (
 *   exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 * );
 * 
 * create policy "Admins and Owners can delete profiles" on public.profiles for delete using (
 *   (auth.uid() = id) OR 
 *   (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
 * );
 * 
 * create policy "Admins can update profiles." on public.profiles for update using (
 *   exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 * );
 * 
 * create policy "Doctors are viewable by everyone." on public.doctors for select using (true);
 * create policy "Staff can manage doctors." on public.doctors for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'receptionist', 'doctor')));
 * 
 * create policy "Schedules are viewable by everyone." on public.schedules for select using (true);
 * create policy "Staff can manage schedules." on public.schedules for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'receptionist', 'doctor')));
 * 
 * create policy "Config viewable by everyone" on public.app_config for select using (true);
 * create policy "Admins can update config" on public.app_config for update using (
 *   exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 * );
 * 
 * -- 5. Trigger for New Users
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, email, role, full_name)
 *   values (
 *     new.id, 
 *     new.email, 
 *     case 
 *       when new.email in ('admin@omelnour.com', 'drpeterramsis@gmail.com') then 'admin' 
 *       else 'patient' -- DEFAULT IS NOW PATIENT
 *     end,
 *     new.raw_user_meta_data->>'full_name'
 *   )
 *   on conflict (id) do nothing; -- Prevent error if profile exists
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * drop trigger if exists on_auth_user_created on auth.users;
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 */