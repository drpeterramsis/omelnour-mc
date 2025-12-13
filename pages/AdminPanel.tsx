import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole } from '../types';
import { ShieldAlert } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-red-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المسؤول</h1>
        </div>
        <p className="mb-8 text-gray-600">إدارة صلاحيات المستخدمين (الاستقبال / المسؤولين).</p>

        {loading ? (
            <div>جاري التحميل...</div>
        ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
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
                            <tr key={profile.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${profile.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {profile.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <select 
                                        className="border rounded p-1 text-sm"
                                        value={profile.role}
                                        onChange={(e) => updateUserRole(profile.id, e.target.value as UserRole)}
                                    >
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        <option value={UserRole.RECEPTIONIST}>Receptionist</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {profiles.length === 0 && <div className="p-4 text-center">لا يوجد مستخدمين</div>}
            </div>
        )}
    </div>
  );
};

export default AdminPanel;