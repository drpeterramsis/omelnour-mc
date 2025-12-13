import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole } from '../types';
import { ShieldAlert, UserPlus, Info, KeyRound, Check, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Re-create a temporary client to handle signups without logging out the admin
// Note: We use the same URL and Key from the main client.
// In a production app, this should be done via Edge Functions.
const SUPABASE_URL = 'https://cqyihsudqnzdzstvanko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeWloc3VkcW56ZHpzdHZhbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDc2NTEsImV4cCI6MjA4MTIyMzY1MX0.ciB_G-KitSBva4_x2e3j0gyTkw0nJwvN3NTUJmpT5aE';

const AdminPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (data) {
        setProfiles(data as UserProfile[]);
    }
    setLoading(false);
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
      // Note: We can only delete the Profile row via RLS. The Auth User remains in Supabase
      // unless we use the Admin API (server-side).
      // However, deleting the profile effectively revokes access to the app due to checks in Layout.tsx
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
                  persistSession: false, // Important: Don't save this session to localStorage
                  autoRefreshToken: false,
              }
          });

          const { data: authData, error: authError } = await tempClient.auth.signUp({
              email: newUserEmail,
              password: newUserPassword,
          });

          if (authError) throw authError;

          if (authData.user) {
              // 2. Insert the profile row using the ADMIN'S connection (which has RLS rights)
              // Note: The 'handle_new_user' trigger might have already created a row with 'receptionist'.
              // We try to upsert to ensure the role is correct.
              const { error: profileError } = await supabase.from('profiles').upsert({
                  id: authData.user.id,
                  email: newUserEmail,
                  role: newUserRole
              });

              if (profileError) {
                  console.error(profileError);
                  throw new Error("تم إنشاء الحساب ولكن فشل إعداد الصلاحيات. تأكد من تحديث كود SQL.");
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
    <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <ShieldAlert className="text-red-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المسؤول</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Create User Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4 text-lg">
                    <UserPlus size={24} />
                    إضافة موظف جديد
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
                            <option value={UserRole.ADMIN}>مدير (Admin)</option>
                        </select>
                    </div>
                    <button 
                        type="submit" 
                        disabled={createUserLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow"
                    >
                        {createUserLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                    </button>
                    {createUserMessage && (
                        <p className={`text-xs font-bold text-center mt-2 ${createUserMessage.includes('نجاح') ? 'text-green-600' : 'text-red-600'}`}>
                            {createUserMessage}
                        </p>
                    )}
                </form>
            </div>

            {/* Change Admin Password Section */}
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
                <div className="mt-4 text-xs text-gray-500 bg-white p-2 rounded border">
                    <p className="font-bold flex items-center gap-1"><Info size={14}/> ملاحظة:</p>
                    ميزة إنشاء المستخدمين تعمل من داخل التطبيق. إذا واجهت مشاكل، تأكد من تحديث سياسات الأمان (SQL) في Supabase.
                </div>
            </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden border">
             <div className="bg-gray-100 px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-800">إدارة المستخدمين والصلاحيات</h3>
             </div>
            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصلاحية الحالية</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تعديل</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {profiles.map(profile => (
                            <tr key={profile.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium" dir="ltr">{profile.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${profile.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                        {profile.role === UserRole.ADMIN ? 'مدير (Admin)' : 'استقبال (Receptionist)'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <select 
                                        className="border rounded p-1 text-sm bg-white focus:ring-2 focus:ring-medical-blue outline-none"
                                        value={profile.role}
                                        onChange={(e) => updateUserRole(profile.id, e.target.value as UserRole)}
                                        disabled={profile.email === 'admin@omelnour.com'} // Prevent changing main admin role easily
                                    >
                                        <option value={UserRole.ADMIN}>مدير</option>
                                        <option value={UserRole.RECEPTIONIST}>استقبال</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button 
                                        onClick={() => deleteUser(profile.id)}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-30"
                                        title="حذف المستخدم"
                                        disabled={profile.email === 'admin@omelnour.com'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
             {profiles.length === 0 && <div className="p-4 text-center text-gray-500">لا يوجد مستخدمين مسجلين حالياً.</div>}
        </div>
    </div>
  );
};

export default AdminPanel;