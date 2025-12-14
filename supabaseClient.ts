import { createClient } from '@supabase/supabase-js';

// NEW CREDENTIALS PROVIDED
const SUPABASE_URL = 'https://gzlnedcujumbamkxfojm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bG5lZGN1anVtYmFta3hmb2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzE3ODQsImV4cCI6MjA4MTI0Nzc4NH0.wkg9bjAleTL1grlTXYxNo89S3NKihBmXAxWbFqGUxoA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * ==========================================
 * ⚡️ NEW DATABASE SETUP (Run in SQL Editor) ⚡️
 * ==========================================
 * 
 * -- 1. CLEANUP
 * drop trigger if exists on_auth_user_created on auth.users;
 * drop function if exists public.handle_new_user;
 * drop table if exists public.schedules;
 * drop table if exists public.doctors;
 * drop table if exists public.app_config;
 * drop table if exists public.profiles;
 * drop type if exists user_role;
 * 
 * -- 2. ENUMS & TABLES
 * create type user_role as enum ('admin', 'employee', 'patient');
 * 
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   email text not null,
 *   full_name text,
 *   role user_role default 'patient',
 *   authority text default 'user', 
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * create table public.app_config (
 *   id int primary key default 1,
 *   enable_client_signup boolean default false
 * );
 * 
 * create table public.doctors (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null,
 *   specialty text not null,
 *   image_url text,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * create table public.schedules (
 *   id uuid default gen_random_uuid() primary key,
 *   doctor_id uuid references public.doctors on delete cascade not null,
 *   day_of_week text not null,
 *   start_time text not null,
 *   end_time text not null,
 *   is_cancelled boolean default false,
 *   notes text
 * );
 * 
 * -- 3. SEED DATA
 * insert into public.app_config (id, enable_client_signup) values (1, true);
 * 
 * -- 4. RLS
 * alter table public.profiles enable row level security;
 * alter table public.app_config enable row level security;
 * alter table public.doctors enable row level security;
 * alter table public.schedules enable row level security;
 * 
 * create policy "Admins can manage all profiles" on public.profiles for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
 * create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
 * create policy "Users can update own basic info" on public.profiles for update using (auth.uid() = id);
 * 
 * create policy "Public read config" on public.app_config for select using (true);
 * create policy "Admins update config" on public.app_config for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
 * 
 * create policy "Public read doctors" on public.doctors for select using (true);
 * create policy "Employees and Admins manage doctors" on public.doctors for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'employee')));
 * 
 * create policy "Public read schedules" on public.schedules for select using (true);
 * create policy "Employees and Admins manage schedules" on public.schedules for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'employee')));
 * 
 * -- 5. TRIGGER
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * declare
 *   is_first_user boolean;
 * begin
 *   select count(*) = 0 into is_first_user from public.profiles;
 *   insert into public.profiles (id, email, full_name, role, authority)
 *   values (
 *     new.id, new.email, new.raw_user_meta_data->>'full_name',
 *     case when is_first_user then 'admin'::user_role else 'patient'::user_role end,
 *     'user'
 *   );
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
 */