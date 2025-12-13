import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://cqyihsudqnzdzstvanko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeWloc3VkcW56ZHpzdHZhbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDc2NTEsImV4cCI6MjA4MTIyMzY1MX0.ciB_G-KitSBva4_x2e3j0gyTkw0nJwvN3NTUJmpT5aE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * ==========================================
 * 🛠️ SETUP SQL SCRIPT (For New Project) 🛠️
 * ==========================================
 * 
 * Copy and run the following in Supabase SQL Editor:
 * 
 * -- 1. Tables
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   email text,
 *   role text default 'receptionist'
 * );
 * 
 * create table public.doctors (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null,
 *   specialty text not null,
 *   image_url text
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
 * -- 2. Security (RLS)
 * alter table public.profiles enable row level security;
 * alter table public.doctors enable row level security;
 * alter table public.schedules enable row level security;
 * 
 * -- 3. Policies
 * create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
 * create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
 * 
 * -- NEW POLICY: Allow Admins to create profiles for other users
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
 * create policy "Staff can manage doctors." on public.doctors for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'receptionist')));
 * 
 * create policy "Schedules are viewable by everyone." on public.schedules for select using (true);
 * create policy "Staff can manage schedules." on public.schedules for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'receptionist')));
 * 
 * -- 4. Auto-create Profile Trigger (Optional if creating via Admin Panel)
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, email, role)
 *   values (new.id, new.email, 'receptionist');
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 */