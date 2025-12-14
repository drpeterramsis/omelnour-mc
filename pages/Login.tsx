import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

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
              throw new Error("بيانات الدخول غير صحيحة.");
          }
          throw authError;
      }

      if (data.session) {
        // 2. Check Profile Existence
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (profileError) {
             console.error("DB Error:", profileError);
             throw new Error("خطأ في قاعدة البيانات (الجداول غير موجودة).");
        }

        if (!profile) {
            // Self-repair: Create profile if missing
            const adminEmails = ['admin@omelnour.com', 'drpeterramsis@gmail.com'];
            const assignedRole = adminEmails.includes(data.user.email || '') ? 'admin' : 'patient';

            const { error: insertError } = await supabase.from('profiles').insert([
                { id: data.user.id, email: data.user.email, role: assignedRole }
            ]);
            
            if (insertError) {
                 console.error("Insert Error:", insertError);
                 throw new Error("فشل إنشاء ملف المستخدم.");
            }
        }

        // Navigate based on role (refetch to be sure)
        const { data: finalProfile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (finalProfile?.role === 'admin' || finalProfile?.role === 'receptionist') {
            navigate('/schedule-manager');
        } else {
            navigate('/'); // Patients go home
        }
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
        <h2 className="text-2xl font-bold text-center text-primary-900 mb-6">تسجيل الدخول</h2>
        
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
              placeholder="name@example.com"
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
        
        <div className="mt-6 text-center text-xs text-gray-500">
             إذا كنت تواجه مشاكل في الدخول، يرجى مراجعة إدارة المركز.
        </div>
      </div>
    </div>
  );
};

export default Login;