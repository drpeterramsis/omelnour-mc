import React, { useState } from 'react';
import { useAuth, useLanguage } from '../App';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError(t.authError);
      setLoading(false);
    } else {
        window.location.hash = '#/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans" dir={dir}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-primary p-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{t.appTitle}</h1>
            <p className="text-blue-100">{t.staffLogin}</p>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">{t.signIn}</h2>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="admin"
                required
              />
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
              <p className="text-xs text-gray-400">{t.secureSystem}</p>
              <a href="#/" className="block text-sm text-primary hover:underline">← {t.backToHome}</a>
          </div>
        </div>
      </div>
    </div>
  );
};