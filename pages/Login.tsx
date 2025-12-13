import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate User
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
              throw new Error("بيانات الدخول غير صحيحة. هل قمت بإنشاء المستخدم في لوحة تحكم Supabase؟");
          }
          throw authError;
      }

      if (data.session) {
        // 2. Check Profile Existence
        // We use maybeSingle to safely check if the row exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (profileError) {
             // If DB error (like table missing)
             console.error("DB Error:", profileError);
             throw new Error("خطأ في قاعدة البيانات (الجداول غير موجودة). يرجى تشغيل كود SQL.");
        }

        if (!profile) {
            // Profile missing but Auth success. 
            // Attempt to auto-fix by inserting profile (fallback if trigger didn't work)
            const { error: insertError } = await supabase.from('profiles').insert([
                { id: data.user.id, email: data.user.email, role: 'receptionist' }
            ]);
            
            if (insertError) {
                 console.error("Insert Error:", insertError);
                 throw new Error("الحساب موجود ولكن لا يوجد ملف تعريف (Profile). تأكد من إعداد قاعدة البيانات.");
            }
        }

        navigate('/schedule-manager');
      }
    } catch (err: any) {
      console.error("Login Flow Error:", err);
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-primary-900 mb-6">تسجيل دخول الموظفين</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 text-sm border-r-4 border-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="admin@omelnour.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-bold hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
            <strong>تعليمات للمسؤول:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
                <li>يجب إنشاء المستخدم أولاً في Supabase Dashboard &gt; Authentication.</li>
                <li>تأكد من تشغيل كود SQL في Supabase Dashboard &gt; SQL Editor.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;