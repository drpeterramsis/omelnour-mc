import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole, AppConfig } from '../types';
import { ShieldAlert, UserPlus, Info, KeyRound, Check, Trash2, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Re-create a temporary client to handle signups without logging out the admin
const SUPABASE_URL = 'https://cqyihsudqnzdzstvanko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeWloc3VkcW56ZHpzdHZhbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDc2NTEsImV4cCI6MjA4MTIyMzY1MX0.ciB_G-KitSBva4_x2e3j0gyTkw0nJwvN3NTUJmpT5aE';

const AdminPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<AppConfig>({ id: 1, enable_client_signup: false });
  const [configLoading, setConfigLoading] = useState(true);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // New User Creation State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.RECEPTIONIST);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');

  useEffect(() => {
    fetchProfiles();
    fetchConfig();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (data) {
        setProfiles(data as UserProfile[]);
    }
    setLoading(false);
  };

  const fetchConfig = async () => {
      setConfigLoading(true);
      const { data } = await supabase.from('app_config').select('*').single();
      if (data) {
          setAppConfig(data as AppConfig);
      } else {
          // If no row exists, try to insert default (fallback)
          await supabase.from('app_config').insert([{ id: 1, enable_client_signup: false }]);
      }
      setConfigLoading(false);
  };

  const toggleClientSignup = async () => {
      const newValue = !appConfig.enable_client_signup;
      const { error } = await supabase
        .from('app_config')
        .update({ enable_client_signup: newValue })
        .eq('id', 1); // Assuming single row config
      
      if (!error) {
          setAppConfig({ ...appConfig, enable_client_signup: newValue });
      } else {
          alert("حدث خطأ أثناء تحديث الإعدادات: " + error.message);
      }
  };

  const updateUserRole = async (id: string, newRole: UserRole) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', id);
        
        if (error) throw error;
        fetchProfiles();
    } catch (err: any) {
        alert('فشل تحديث الصلاحية: ' + err.message);
    }
  };

  const deleteUser = async (id: string) => {
      if(window.confirm("تحذير: هذا سيحذف ملف المستخدم وصلاحياته من التطبيق. لا يمكن التراجع.")) {
          try {
              const { error } = await supabase.from('profiles').delete().eq('id', id);
              if (error) throw error;
              fetchProfiles();
          } catch(err: any) {
              alert("خطأ في الحذف: " + err.message);
          }
      }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword.length < 6) {
          setPasswordMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          return;
      }
      
      setPasswordLoading(true);
      setPasswordMessage('');

      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          setPasswordMessage('تم تغيير كلمة المرور بنجاح ✅');
          setNewPassword('');
      } catch (err: any) {
          setPasswordMessage('حدث خطأ: ' + err.message);
      } finally {
          setPasswordLoading(false);
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newUserPassword.length < 6) {
          setCreateUserMessage("كلمة المرور ضعيفة جداً");
          return;
      }

      setCreateUserLoading(true);
      setCreateUserMessage('');

      try {
          // 1. Use a temporary client to sign up the user so we don't log out the Admin
          const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              auth: {
                  persistSession: false,
                  autoRefreshToken: false,
              }
          });

          const { data: authData, error: authError } = await tempClient.auth.signUp({
              email: newUserEmail,
              password: newUserPassword,
          });

          if (authError) throw authError;

          if (authData.user) {
              // 2. Insert/Update the profile row using the ADMIN'S connection
              const { error: profileError } = await supabase.from('profiles').upsert({
                  id: authData.user.id,
                  email: newUserEmail,
                  role: newUserRole
                  // No full_name for staff for now, can be added later
              });

              if (profileError) {
                  console.error(profileError);
                  throw new Error("تم إنشاء الحساب ولكن فشل إعداد الصلاحيات.");
              }

              setCreateUserMessage("تم إنشاء المستخدم بنجاح! ✅");
              setNewUserEmail('');
              setNewUserPassword('');
              fetchProfiles();
          }

      } catch (err: any) {
          console.error(err);
          setCreateUserMessage("خطأ: " + (err.message || 'فشل إنشاء المستخدم'));
      } finally {
          setCreateUserLoading(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <ShieldAlert className="text-red-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المسؤول</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* 1. Control Room (New Feature) */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm h-fit">
                <h3 className="font-bold text-purple-900 flex items-center gap-2 mb-4 text-lg">
                    <Settings size={24} />
                    غرفة التحكم بالموقع
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-3 rounded border border-purple-100">
                        <div>
                            <span className="block font-bold text-gray-800 text-sm">تسجيل المرضى (Clients)</span>
                            <span className="text-xs text-gray-500">السماح للزوار بإنشاء حسابات جديدة</span>
                        </div>
                        <button 
                            onClick={toggleClientSignup}
                            disabled={configLoading}
                            className={`transition-colors duration-200 ${appConfig.enable_client_signup ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {appConfig.enable_client_signup ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                    {/* Placeholder for future toggles */}
                    <div className="text-xs text-center text-purple-800 opacity-70 mt-2">
                        * سيتم إضافة المزيد من إعدادات التحكم هنا.
                    </div>
                </div>
            </div>

            {/* 2. Create User Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4 text-lg">
                    <UserPlus size={24} />
                    إضافة موظف / طبيب
                </h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">البريد الإلكتروني</label>
                        <input 
                            type="email" 
                            required
                            className="w-full border rounded p-2 text-sm"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="user@omelnour.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">كلمة المرور</label>
                        <input 
                            type="password" 
                            required
                            className="w-full border rounded p-2 text-sm"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="******"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">الصلاحية</label>
                        <select 
                            className="w-full border rounded p-2 text-sm bg-white"
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        >
                            <option value={UserRole.RECEPTIONIST}>استقبال (Receptionist)</option>
                            <option value={UserRole.DOCTOR}>طبيب (Doctor)</option>
                            <option value={UserRole.ADMIN}>مدير (Admin)</option>
                            <option value={UserRole.PATIENT}>مريض (Client)</option>
                        </select>
                    </div>
                    <button 
                        type="submit" 
                        disabled={createUserLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow"
                    >
                        {createUserLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                    </button>
                    {createUserMessage && (
                        <p className={`text-xs font-bold text-center mt-2 ${createUserMessage.includes('نجاح') ? 'text-green-600' : 'text-red-600'}`}>
                            {createUserMessage}
                        </p>
                    )}
                </form>
            </div>

            {/* 3. Change Password Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm h-fit">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-lg">
                    <KeyRound size={24} />
                    تغيير كلمة مروري
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-3">
                    <input 
                        type="password" 
                        placeholder="كلمة المرور الجديدة للمدير" 
                        className="w-full border rounded p-2 text-sm"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={passwordLoading}
                        className="w-full bg-gray-800 text-white py-2 rounded font-bold hover:bg-gray-900 disabled:opacity-50 transition shadow"
                    >
                        {passwordLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                    </button>
                    {passwordMessage && (
                        <p className={`text-xs font-bold text-center ${passwordMessage.includes('نجاح') ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordMessage}
                        </p>
                    )}
                </form>
            </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border">
             <div className="bg-gray-100 px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-800">إدارة المستخدمين والصلاحيات</h3>
             </div>
            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصلاحية الحالية</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تعديل</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {profiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                                        <div className="font-bold">{profile.email}</div>
                                        {profile.full_name && <div className="text-xs text-gray-500">{profile.full_name}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border 
                                            ${profile.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' : 
                                              profile.role === UserRole.DOCTOR ? 'bg-green-100 text-green-800 border-green-200' : 
                                              profile.role === UserRole.RECEPTIONIST ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                              'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {profile.role === UserRole.ADMIN ? 'مدير (Admin)' : 
                                             profile.role === UserRole.DOCTOR ? 'طبيب (Doctor)' : 
                                             profile.role === UserRole.RECEPTIONIST ? 'استقبال (Employee)' : 'مريض (Client)'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select 
                                            className="border rounded p-1 text-sm bg-white focus:ring-2 focus:ring-medical-blue outline-none"
                                            value={profile.role}
                                            onChange={(e) => updateUserRole(profile.id, e.target.value as UserRole)}
                                            disabled={profile.email === 'admin@omelnour.com' || profile.email === 'drpeterramsis@gmail.com'} 
                                        >
                                            <option value={UserRole.ADMIN}>مدير</option>
                                            <option value={UserRole.DOCTOR}>طبيب</option>
                                            <option value={UserRole.RECEPTIONIST}>استقبال</option>
                                            <option value={UserRole.PATIENT}>مريض</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button 
                                            onClick={() => deleteUser(profile.id)}
                                            className="text-red-500 hover:text-red-700 disabled:opacity-30"
                                            title="حذف المستخدم"
                                            disabled={profile.email === 'admin@omelnour.com' || profile.email === 'drpeterramsis@gmail.com'}
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
             {profiles.length === 0 && <div className="p-4 text-center text-gray-500">لا يوجد مستخدمين مسجلين حالياً.</div>}
        </div>
    </div>
  );
};

export default AdminPanel;