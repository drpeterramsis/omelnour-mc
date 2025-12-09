import React, { useState } from 'react';
import { useAuth, useLanguage } from '../App';
import { SQL_FIX_SCRIPT } from './Admin'; // Import the SQL fix script

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRepair, setShowRepair] = useState(false);
  
  const { login } = useAuth();
  const { t, dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Login now returns an object { success, error }
    const result = await login(email, password);
    
    if (!result.success) {
      const err = result.error || t.authError;
      setError(err);
      setLoading(false);

      // Automatically show repair modal for critical schema/database errors
      if (err.toLowerCase().includes('database') || err.toLowerCase().includes('schema') || err.toLowerCase().includes('function')) {
          setShowRepair(true);
      }
    } else {
        window.location.hash = '#/dashboard';
    }
  };

  const isDatabaseError = error.toLowerCase().includes('database') || error.toLowerCase().includes('schema') || error.toLowerCase().includes('function');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans" dir={dir}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-primary p-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{t.appTitle}</h1>
            <p className="text-blue-100">{t.staffLogin}</p>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">{t.signIn}</h2>
          
          {error && (
             <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm font-medium border border-red-200">
               {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="admin@omelnour.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="******"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 px-3 flex items-center text-gray-500 hover:text-primary focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded transition duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? t.thinking : t.loginBtn}
            </button>
          </form>
          <div className="mt-6 text-center space-y-2">
              <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-200">
                  <b>Demo Credentials:</b><br/>
                  admin@omelnour.com / 123456
              </div>
              <p className="text-xs text-gray-400 mt-2">{t.secureSystem}</p>
              
              {isDatabaseError && (
                 <button 
                    onClick={() => setShowRepair(true)} 
                    className="block w-full text-center text-red-600 hover:underline text-xs mt-4 font-bold animate-pulse"
                 >
                    🛠️ Database Error Detected! Click here to fix.
                 </button>
              )}

              <a href="#/" className="block text-sm text-primary hover:underline mt-2">← {t.backToHome}</a>
          </div>
        </div>
      </div>

       {/* Repair Modal */}
       {showRepair && (
           <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="ltr">
               <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-xl font-bold text-gray-800">🛠️ System Repair (SQL)</h3>
                       <button onClick={() => setShowRepair(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                   </div>
                   <div className="mb-4 text-sm text-gray-600 space-y-2">
                       <div className="bg-red-100 text-red-800 p-3 rounded font-bold">
                           ⚠️ CRITICAL: The database is blocking your login.
                       </div>
                       <p>You must run this script in your Supabase Dashboard to remove the block.</p>
                       <ol className="list-decimal list-inside space-y-1 ml-2 font-medium">
                           <li>Copy the SQL code below.</li>
                           <li>Go to <b>Supabase Dashboard</b> {'>'} <b>SQL Editor</b>.</li>
                           <li>Paste the code and click <b>Run</b>.</li>
                           <li>Come back here and try logging in again.</li>
                       </ol>
                   </div>
                   <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto flex-1 font-mono text-xs border border-gray-700">
                       <pre>{SQL_FIX_SCRIPT}</pre>
                   </div>
                   <div className="flex justify-end gap-3 mt-4">
                       <button onClick={() => navigator.clipboard.writeText(SQL_FIX_SCRIPT).then(() => alert('Copied to clipboard!'))} className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-bold">Copy Code</button>
                       <button onClick={() => setShowRepair(false)} className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded font-bold">Close</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};