import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const ClientSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConfig = async () => {
      const { data } = await supabase.from('app_config').select('enable_client_signup').single();
      if (data) {
        setIsEnabled(data.enable_client_signup);
      }
      setCheckingConfig(false);
    };
    checkConfig();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setMessage({ text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", type: 'error' });
        return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Sign up the user. The database trigger `handle_new_user` will handle creating the profile
      // with role 'patient' and the full_name provided in options.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ text: "تم إنشاء الحساب بنجاح! جاري تحويلك...", type: 'success' });
        setTimeout(() => {
            navigate('/');
        }, 2000);
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      setMessage({ text: err.message || 'حدث خطأ أثناء التسجيل', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingConfig) {
      return <div className="p-10 text-center">جاري التحقق...</div>;
  }

  if (!isEnabled) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
              <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center max-w-md shadow-sm">
                  <h2 className="text-2xl font-bold text-red-800 mb-2">التسجيل مغلق حالياً</h2>
                  <p className="text-gray-600 mb-6">عذراً، لا يقبل المركز تسجيل حسابات جديدة في الوقت الحالي.</p>
                  <Link to="/" className="text-medical-blue hover:underline font-bold">العودة للرئيسية</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-medical-blue mb-2">تسجيل حساب مريض جديد</h2>
        <p className="text-center text-gray-500 text-sm mb-6">أنشئ حسابك لمتابعة العروض والمواعيد</p>
        
        {message && (
          <div className={`p-4 rounded-md mb-4 text-sm font-medium border-r-4 ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-green-50 text-green-700 border-green-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالكامل</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none"
              placeholder="الاسم الثلاثي"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none"
              placeholder="yourname@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none"
              placeholder="******"
            />
            <p className="text-xs text-gray-400 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-medical-blue text-white py-2 rounded-md font-bold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
            لديك حساب بالفعل؟ <Link to="/login" className="text-medical-red font-bold hover:underline">تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
};

export default ClientSignup;