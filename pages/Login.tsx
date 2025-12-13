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

      if (authError) throw authError;

      if (data.session) {
        // 2. Check Profile Existence Safely
        // specific try/catch for DB operations to separate Auth success from DB failure
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle(); // Use maybeSingle to avoid 406 Not Acceptable if no rows

            if (profileError) {
                console.error("Profile Query Error:", profileError);
                // Detect missing table error
                if (profileError.message.includes('does not exist') || profileError.code === '42P01') {
                     throw new Error("الجداول غير موجودة في قاعدة البيانات. يرجى تشغيل كود SQL في Supabase.");
                }
            }

            // 3. Create Profile if missing (First time login for existing Auth user)
            if (!profile) {
                const { error: insertError } = await supabase.from('profiles').insert([
                    { id: data.user.id, email: data.user.email, role: 'receptionist' }
                ]);
                
                if (insertError) {
                    console.error("Profile Creation Error:", insertError);
                     if (insertError.message.includes('does not exist') || insertError.code === '42P01') {
                         throw new Error("الجداول غير موجودة. يرجى تشغيل كود SQL.");
                    }
                }
            }
        } catch (dbErr: any) {
            // If DB fails but Auth succeeded, warn the user but let them try to proceed (or stop them)
            // We stop them if it's a critical missing table error
            if (dbErr.message.includes("SQL")) {
                throw dbErr;
            }
            console.warn("Non-critical DB warning:", dbErr);
        }

        navigate('/schedule-manager');
      }
    } catch (err: any) {
      console.error("Login Flow Error:", err);
      let msg = 'حدث خطأ أثناء تسجيل الدخول';
      if (err.message.includes('Invalid login credentials')) msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      if (err.message.includes('SQL')) msg = err.message; // Show our custom DB error
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-primary-900 mb-6">تسجيل دخول الموظفين</h2>
        
        {error && (
          <div className={`p-3 rounded-md mb-4 text-sm font-bold ${error.includes('SQL') ? 'bg-red-100 text-red-800 border-r-4 border-red-600' : 'bg-red-50 text-red-600'}`}>
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
              placeholder="example@omelnour.com"
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
        
        <div className="mt-4 text-center text-xs text-gray-500">
            ملاحظة: إذا لم يكن لديك حساب، يرجى التواصل مع المسؤول التقني لإنشاء حساب لك في لوحة التحكم.
        </div>
      </div>
    </div>
  );
};

export default Login;