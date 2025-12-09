import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { User, Permissions, UserRole, DEFAULT_PERMISSIONS } from '../types';
import { useLanguage, useAuth } from '../App';

// SQL Script for user to fix missing RPCs and Tables
// This has been updated to be the "Ultimate Fix" script
export const SQL_FIX_SCRIPT = `-- ==========================================
-- ULTIMATE DATABASE REPAIR SCRIPT v2.0
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==========================================

-- 1. NUCLEAR CLEANUP (Removes ALL blockers)
-- We drop every possible bad trigger that causes "Database error querying schema"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_sign_up ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_for_user ON auth.users;
DROP TRIGGER IF EXISTS profile_on_signup ON auth.users;

-- Drop associated functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. TABLES (Create if Not Exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text default 'RECEPTION',
  permissions jsonb default '{}'::jsonb,
  is_active boolean default true
);

CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid default gen_random_uuid() primary key,
  title text not null
);

CREATE TABLE IF NOT EXISTS public.clinics (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text not null
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  name text not null,
  specialty_id uuid references public.specialties(id),
  start_date date,
  is_active boolean default true
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references public.doctors(id),
  clinic_id uuid references public.clinics(id),
  day_of_week int not null,
  start_time text not null,
  end_time text not null
);

CREATE TABLE IF NOT EXISTS public.doctor_exceptions (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references public.doctors(id),
  date text not null,
  reason text
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references public.doctors(id),
  clinic_id uuid references public.clinics(id),
  patient_name text not null,
  patient_phone text not null,
  date text not null,
  time text not null,
  status text default 'PENDING',
  notes text,
  created_at timestamp with time zone default now()
);

-- 4. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_exceptions ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Reset to Permissive Mode)
-- Profiles
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Update Own Profile" ON profiles;
CREATE POLICY "Users Update Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON profiles;
CREATE POLICY "Admin Full Access Profiles" ON profiles FOR ALL USING (true);

-- Other Tables Loop
DO $$ 
DECLARE 
  tbl text; 
BEGIN
  FOREACH tbl IN ARRAY ARRAY['doctors', 'clinics', 'specialties', 'schedules', 'doctor_exceptions', 'appointments'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Read All %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public Read All %I" ON %I FOR SELECT USING (true)', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "Staff Full Access %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Staff Full Access %I" ON %I FOR ALL USING (auth.role() = ''authenticated'')', tbl, tbl);
  END LOOP;
END $$;

-- 6. FUNCTIONS (Password Reset)
CREATE OR REPLACE FUNCTION admin_reset_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reset_all_passwords(new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'));
END;
$$;

-- 7. GRANT PERMISSIONS (Fixes Access Denied)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 8. SEED ADMIN USER
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@omelnour.com';
  
  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
      'admin@omelnour.com', crypt('123456', gen_salt('bf')), now(), 
      '{"provider":"email","providers":["email"]}', '{"name":"System Admin"}', now(), now()
    );
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')), email_confirmed_at = now() WHERE id = admin_uid;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, permissions, is_active)
  VALUES (admin_uid, 'admin@omelnour.com', 'General Manager', 'ADMIN', 
    '{"can_manage_doctors": true, "can_manage_schedules": true, "can_manage_appointments": true, "can_manage_exceptions": true, "can_manage_clinics": true, "can_view_admin_panel": true}', true)
  ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', is_active = true;
  
  -- Seed Specialty
  IF NOT EXISTS (SELECT 1 FROM specialties) THEN
    INSERT INTO specialties (title) VALUES ('General Medicine'), ('Cardiology'), ('Pediatrics');
  END IF;
END $$;

-- 9. CRITICAL: RELOAD SCHEMA CACHE
-- This fixes the persistent "Database error querying schema" by forcing Supabase to refresh its API.
NOTIFY pgrst, 'reload config';`;

export const Admin: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Password Management State
  const [newPassword, setNewPassword] = useState('');
  const [isBulkResetOpen, setIsBulkResetOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [bulkPassword, setBulkPassword] = useState('');
  
  // SQL Help Modal
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const loadUsers = async () => {
      const data = await db.users.getAll();
      setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
        // 1. Update Profile (Name, Role, Permissions)
        await db.users.update(editingUser);
        let passwordMsg = '';

        // 2. Update Password if provided
        if (newPassword.trim()) {
            let passwordUpdated = false;

            // Attempt 1: Standard Auth Update (Only works for Self + Active Session)
            if (currentUser?.id === editingUser.id) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) throw error;
                    passwordUpdated = true;
                    passwordMsg = 'Password updated via Auth Session.';
                } else {
                    console.warn("No active Supabase session. Attempting RPC fallback...");
                }
            }

            // Attempt 2: RPC Update (Works for Others OR Self)
            if (!passwordUpdated) {
                try {
                   await db.users.resetPassword(editingUser.id, newPassword);
                   passwordUpdated = true;
                   passwordMsg = 'Password updated via Admin RPC.';
                } catch (rpcError: any) {
                    console.error("RPC Error:", rpcError);
                    if (rpcError.message?.includes('function') || rpcError.message?.includes('found') || rpcError.code === 'PGRST202') {
                        setShowSqlHelp(true); // Auto-show help if functions missing
                        throw new Error(`Backend RPC missing. Please run the SQL setup.`);
                    }
                    throw rpcError;
                }
            }
            
            setResetMessage(`Profile & ${passwordMsg} Success!`);
        } else {
            setResetMessage('Profile updated successfully!');
        }

        setNewPassword('');
        await loadUsers();
        
        // Close modal after short delay if success
        setTimeout(() => {
            if(!newPassword) setEditingUser(null); 
        }, 1500);

    } catch (error: any) {
        console.error(error);
        if (error.message.includes('RPC missing')) {
            setResetMessage('Error: Backend functions missing. Click "Database Setup" above.');
        } else {
            setResetMessage(`Profile updated, but Password failed: ${error.message}`);
        }
    }
  };

  const handleBulkReset = async () => {
      if (!bulkPassword.trim() || !window.confirm("Are you sure? This will change the password for ALL users.")) return;
      try {
          await db.users.resetAllPasswords(bulkPassword);
          alert("Success! All user passwords have been reset.");
          setIsBulkResetOpen(false);
          setBulkPassword('');
      } catch (error: any) {
          console.error(error);
          setShowSqlHelp(true); // Auto-show help if fails
          alert("Failed: " + error.message + " (Check Database Setup)");
      }
  };

  const togglePermission = async (user: User, key: keyof Permissions) => {
    const updatedUser = {
      ...user,
      permissions: {
        ...user.permissions,
        [key]: !user.permissions[key]
      }
    };
    await db.users.update(updatedUser);
    await loadUsers();
  };

  const handleRoleChange = (role: UserRole) => {
      if (!editingUser) return;
      setEditingUser({
          ...editingUser,
          role: role,
          permissions: DEFAULT_PERMISSIONS[role] // Reset permissions to default for that role
      });
  };

  const getPermissionLabel = (key: keyof Permissions) => {
      switch(key) {
          case 'can_manage_doctors': return t.permissions.manageDoctors;
          case 'can_manage_schedules': return t.permissions.manageSchedules;
          case 'can_manage_appointments': return t.permissions.manageAppointments;
          case 'can_manage_exceptions': return t.permissions.manageExceptions;
          case 'can_manage_clinics': return t.permissions.manageClinics;
          case 'can_view_admin_panel': return t.permissions.viewAdmin;
          default: return key;
      }
  };

  const permissionKeys: Array<keyof Permissions> = [
      'can_manage_doctors', 'can_manage_schedules', 'can_manage_appointments', 
      'can_manage_exceptions', 'can_manage_clinics', 'can_view_admin_panel'
  ];

  const getMessageColor = (msg: string) => {
      const lower = msg.toLowerCase();
      if (lower.includes('failed') || lower.includes('error') || lower.includes('missing')) return 'bg-red-100 text-red-800';
      if (lower.includes('skipped') || lower.includes('demo')) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6 font-sans">
       <div className="flex justify-between items-center border-b pb-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">{t.adminControl}</h2>
                <p className="text-gray-500 mt-1">{t.adminDesc}</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowSqlHelp(true)}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition flex items-center gap-2"
                >
                    🛠️ Database Setup
                </button>
                <button 
                    onClick={() => setIsBulkResetOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition"
                >
                    ⚠️ {t.resetAllPasswords || "Reset All Passwords"}
                </button>
            </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase">{t.user}</th>
               <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase">{t.role}</th>
               <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase">{t.actions}</th>
               {permissionKeys.map(key => (
                 <th key={key} className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-normal">
                    <span className="block w-20 mx-auto" title={getPermissionLabel(key)}>{getPermissionLabel(key)}</span>
                 </th>
               ))}
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {users.map(user => (
               <tr key={user.id} className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-50 bg-gray-100' : ''}`}>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-bold text-gray-900">{user.name}</div>
                   <div className="text-xs text-gray-500">{user.email}</div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                    </span>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                        onClick={() => { setEditingUser(user); setResetMessage(''); setNewPassword(''); }} 
                        className="text-primary hover:text-blue-900 font-medium"
                    >
                        {t.activate} / {t.role} / PWD
                    </button>
                 </td>
                 {permissionKeys.map(key => (
                   <td key={key} className="px-2 py-4 text-center">
                     <input 
                        type="checkbox" 
                        checked={user.permissions[key]} 
                        onChange={() => togglePermission(user, key)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                        disabled={user.role === 'ADMIN' && key === 'can_view_admin_panel'} // Prevent admin lockout
                     />
                   </td>
                 ))}
               </tr>
             ))}
           </tbody>
         </table>
       </div>

       {/* Edit User Modal */}
       {editingUser && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
             <h3 className="text-2xl font-bold mb-6 text-gray-800">Edit User: {editingUser.email}</h3>
             
             {resetMessage && (
                 <div className={`mb-4 p-3 rounded text-sm ${getMessageColor(resetMessage)} border`}>
                     {resetMessage}
                 </div>
             )}

             <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.patientName}</label>
                  <input 
                    type="text" 
                    value={editingUser.name} 
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.role}</label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-primary outline-none"
                  >
                    {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                {/* Password Reset Section */}
                <div className="p-4 bg-yellow-50 rounded border border-yellow-100">
                    <label className="block text-sm font-bold text-yellow-800 mb-1">Reset Password</label>
                    <input 
                        type="text" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Type new password here..."
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                    />
                    <p className="text-xs text-yellow-600 mt-1">Leave empty to keep current password.</p>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={editingUser.is_active}
                    onChange={e => setEditingUser({...editingUser, is_active: e.target.checked})}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">{t.active} Account</label>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t.cancelBtn}</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 font-bold">{t.create}</button>
                </div>
             </form>
           </div>
         </div>
       )}

       {/* Bulk Reset Modal */}
       {isBulkResetOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
               <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-down border-t-8 border-red-600">
                   <h3 className="text-2xl font-bold mb-4 text-red-700">⚠️ Bulk Password Reset</h3>
                   <p className="text-gray-600 mb-6 text-sm">
                       This will set the same password for <b>ALL users</b> in the system (Doctors, Reception, etc.). 
                       <br/><br/>
                       Use this only for initial setup or emergency resets.
                   </p>
                   <input 
                        type="text"
                        value={bulkPassword}
                        onChange={e => setBulkPassword(e.target.value)}
                        placeholder="Enter global password..."
                        className="w-full border p-3 rounded mb-6 focus:ring-2 focus:ring-red-500 outline-none"
                   />
                   <div className="flex justify-end gap-3">
                       <button onClick={() => setIsBulkResetOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                       <button onClick={handleBulkReset} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-800">Reset All</button>
                   </div>
               </div>
           </div>
       )}

       {/* SQL Help Modal */}
       {showSqlHelp && (
           <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
               <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-xl font-bold text-gray-800">🛠️ Database Setup (SQL)</h3>
                       <button onClick={() => setShowSqlHelp(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                   </div>
                   <p className="text-sm text-gray-600 mb-4">
                       Copy and run this in your <b>Supabase SQL Editor</b> to fix login issues and tables.
                   </p>
                   <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto flex-1 font-mono text-xs border border-gray-700">
                       <pre>{SQL_FIX_SCRIPT}</pre>
                   </div>
                   <div className="flex justify-end gap-3 mt-4">
                       <button onClick={() => navigator.clipboard.writeText(SQL_FIX_SCRIPT).then(() => alert('Copied to clipboard!'))} className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-bold">Copy SQL</button>
                       <button onClick={() => setShowSqlHelp(false)} className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded font-bold">Close</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};