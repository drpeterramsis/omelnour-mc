import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole, AppConfig } from '../types';
import { Shield, UserPlus, Save, Trash2, Settings, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Temp client needed to create users without logging out the admin
const SUPABASE_URL = 'https://gzlnedcujumbamkxfojm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bG5lZGN1anVtYmFta3hmb2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzE3ODQsImV4cCI6MjA4MTI0Nzc4NH0.wkg9bjAleTL1grlTXYxNo89S3NKihBmXAxWbFqGUxoA';

const AdminPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  
  // New User Form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [newUserAuthority, setNewUserAuthority] = useState('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Profiles
    const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (profilesData) setProfiles(profilesData as UserProfile[]);

    // Fetch Config
    const { data: configData } = await supabase.from('app_config').select('*').single();
    if (configData) setAppConfig(configData as AppConfig);
    setLoading(false);
  };

  const handleUpdateRole = async (id: string, newRole: UserRole, newAuthority: string) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole, authority: newAuthority })
            .eq('id', id);
        
        if (error) throw error;
        // Optimistic update
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole, authority: newAuthority } : p));
    } catch (err: any) {
        alert("فشل التحديث: " + err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
      if (!window.confirm("هل أنت متأكد؟ سيتم حذف المستخدم وجميع بياناته.")) return;
      // Note: Supabase Auth Admin delete requires Service Role Key usually. 
      // RLS allows deleting the profile row, which might cascade if setup, 
      // but deleting actual Auth User often needs more permission.
      // We will try deleting the profile.
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) alert("خطأ: " + error.message);
      else fetchData();
  };

  const toggleSignup = async () => {
      if (!appConfig) return;
      const newValue = !appConfig.enable_client_signup;
      const { error } = await supabase.from('app_config').update({ enable_client_signup: newValue }).eq('id', 1);
      if (!error) setAppConfig({ ...appConfig, enable_client_signup: newValue });
  };

  const createEmployee = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreatingUser(true);
      setCreateMsg('');

      try {
        // 1. Create Auth User (Using temp client to avoid Admin logout)
        const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
        const { data, error } = await tempClient.auth.signUp({
            email: newUserEmail,
            password: newUserPassword,
        });

        if (error) throw error;
        if (!data.user) throw new Error("No user data returned");

        // 2. The Trigger creates the profile as 'patient'. We must update it to 'employee' immediately.
        // We use the main 'supabase' client which is the ADMIN.
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: newUserRole, authority: newUserAuthority })
            .eq('id', data.user.id);

        if (updateError) throw updateError;

        setCreateMsg("تم إنشاء الموظف بنجاح ✅");
        setNewUserEmail('');
        setNewUserPassword('');
        fetchData();
      } catch (err: any) {
          setCreateMsg("خطأ: " + err.message);
      } finally {
          setCreatingUser(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
            <Shield className="text-medical-red w-10 h-10" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة النظام والصلاحيات</h1>
                <p className="text-gray-500">تحكم كامل في المستخدمين والإعدادات</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Controls */}
            <div className="space-y-6">
                
                {/* 1. App Configuration */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                        <Settings size={20} />
                        إعدادات الموقع
                    </h3>
                    
                    {appConfig ? (
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div>
                                <span className="block font-bold text-gray-900">تسجيل الزوار</span>
                                <span className="text-xs text-gray-500">السماح للعامة بإنشاء حسابات</span>
                            </div>
                            <button onClick={toggleSignup} className={`transition ${appConfig.enable_client_signup ? 'text-green-600' : 'text-gray-400'}`}>
                                {appConfig.enable_client_signup ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                            </button>
                        </div>
                    ) : (
                        <div>جاري تحميل الإعدادات...</div>
                    )}
                </div>

                {/* 2. Create New Employee */}
                <div className="bg-blue-50 p-6 rounded-xl shadow border border-blue-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-900">
                        <UserPlus size={20} />
                        إضافة موظف جديد
                    </h3>
                    <form onSubmit={createEmployee} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1">البريد الإلكتروني</label>
                            <input 
                                type="email" required 
                                className="w-full border rounded p-2 text-sm"
                                value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1">كلمة المرور</label>
                            <input 
                                type="password" required 
                                className="w-full border rounded p-2 text-sm"
                                value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-blue-800 mb-1">الدور (Role)</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm bg-white"
                                    value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}
                                >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 mb-1">الصلاحية</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm bg-white"
                                    value={newUserAuthority} onChange={e => setNewUserAuthority(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="super_user">Super User</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            type="submit" disabled={creatingUser}
                            className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
                        >
                            {creatingUser ? 'جاري الإنشاء...' : 'إضافة المستخدم'}
                        </button>
                        {createMsg && <p className="text-xs font-bold text-center mt-2 text-blue-800">{createMsg}</p>}
                    </form>
                </div>
            </div>

            {/* RIGHT COLUMN: User List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="font-bold text-gray-800">قائمة المستخدمين ({profiles.length})</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-gray-500">جاري تحميل البيانات...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور (Role)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصلاحية (Authority)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">حذف</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {profiles.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{user.email}</div>
                                            <div className="text-xs text-gray-500">{user.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select 
                                                className={`text-sm rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-1
                                                    ${user.role === 'admin' ? 'bg-red-50 text-red-800 font-bold' : 
                                                      user.role === 'employee' ? 'bg-blue-50 text-blue-800 font-bold' : 'bg-gray-50 text-gray-600'}`}
                                                value={user.role}
                                                onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole, user.authority)}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="employee">Employee</option>
                                                <option value="patient">Patient</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <select 
                                                className="text-sm rounded border border-gray-300 p-1 w-full"
                                                value={user.authority}
                                                onChange={(e) => handleUpdateRole(user.id, user.role, e.target.value)}
                                            >
                                                <option value="user">User</option>
                                                <option value="super_user">Super User</option>
                                                <option value="manager">Manager</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-400 hover:text-red-600 transition"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;