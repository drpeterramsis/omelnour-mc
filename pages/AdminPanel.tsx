import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole } from '../types';
import { ShieldAlert, UserPlus, Info, KeyRound, Check } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <ShieldAlert className="text-red-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المسؤول</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Instructions Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                    <UserPlus size={20} />
                    كيفية إضافة موظف جديد؟
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                    لأسباب أمنية، يتم إنشاء حسابات الموظفين (Users) من خلال لوحة تحكم Supabase فقط.
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>اذهب إلى <strong>Supabase Dashboard</strong>.</li>
                    <li>اختر <strong>Authentication</strong>.</li>
                    <li>اضغط <strong>Add User</strong>.</li>
                    <li>بعد الإنشاء، سيظهر هنا بصلاحية "استقبال".</li>
                </ol>
            </div>

            {/* Change Password Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <KeyRound size={20} />
                    تغيير كلمة المرور الخاصة بي
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-3">
                    <input 
                        type="password" 
                        placeholder="كلمة المرور الجديدة" 
                        className="w-full border rounded p-2 text-sm"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={passwordLoading}
                        className="w-full bg-medical-blue text-white py-1.5 rounded text-sm hover:bg-blue-800 disabled:opacity-50"
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

        <p className="mb-4 text-gray-600 font-bold">المستخدمون الحاليون وصلاحياتهم:</p>

        {loading ? (
            <div className="text-center py-10">جاري التحميل...</div>
        ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصلاحية الحالية</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تغيير الصلاحية</th>
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
                                    >
                                        <option value={UserRole.ADMIN}>مدير</option>
                                        <option value={UserRole.RECEPTIONIST}>استقبال</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {profiles.length === 0 && <div className="p-4 text-center text-gray-500">لا يوجد مستخدمين مسجلين حالياً.</div>}
            </div>
        )}
    </div>
  );
};

export default AdminPanel;