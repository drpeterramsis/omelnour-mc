import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DEFAULT_PERMISSIONS } from './types';
import { db } from './services/db';
import { supabase } from './services/supabaseClient';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { PublicPortal } from './pages/PublicPortal';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { Doctors } from './pages/Doctors';
import { Admin } from './pages/Admin';
import { translations, Language } from './utils/i18n';

// --- Language Context ---
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.ar;
  dir: 'rtl' | 'ltr';
}
const LanguageContext = createContext<LanguageContextType>(null!);
export const useLanguage = () => useContext(LanguageContext);

// --- Auth Context ---
interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (e: string, p: string) => Promise<LoginResult>;
  logout: () => void;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

// --- Router ---
const Router = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  // Public Routes
  if (route === '#/' || route === '') {
    return (
        <Layout>
            <PublicPortal />
        </Layout>
    );
  }

  if (route === '#/login') {
      if (user) {
          window.location.hash = '#/dashboard';
          return null;
      }
      return <Login />;
  }

  // Protected Routes
  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  // Protected Components
  let Component = Dashboard;
  
  if (route.startsWith('#/appointments')) Component = Appointments;
  else if (route.startsWith('#/doctors')) Component = Doctors;
  else if (route.startsWith('#/admin')) Component = Admin;
  else if (route.startsWith('#/schedule')) Component = () => <div className="p-8 text-center text-gray-500">{t.schedule}</div>;
  else if (route.startsWith('#/clinics')) Component = () => <div className="p-8 text-center text-gray-500">{t.clinics}</div>;
  else if (route.startsWith('#/dashboard')) Component = Dashboard;

  return (
    <Layout>
      <Component />
    </Layout>
  );
};

// --- App Root ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
             // We don't fetch automatically here to avoid race conditions with manual login flow
             // Manual login calls fetchProfile explicitly
             if (!user) fetchProfile(session.user.id);
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string): Promise<User | null> => {
      console.log("Fetching profile for:", userId);
      // We check for the profile. If this fails due to RLS or missing data, we handle it.
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (error) {
          console.error("Profile Fetch Error:", error.message);
      }

      if (data) {
          const u = data as User;
          setUser(u);
          setLoading(false);
          return u;
      } else {
          console.error("Profile not found in 'profiles' table. Ensure SQL seed script ran.");
          setUser(null);
          setLoading(false);
          return null;
      }
  };

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    console.log("Attempting login for:", email);
    
    // 1. Try Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
        console.error("Supabase Auth Error:", error.message);
        return { success: false, error: error.message };
    }

    // 2. If Auth successful, ensure Profile exists
    if (data.session?.user) {
        const userProfile = await fetchProfile(data.session.user.id);
        
        if (userProfile) {
            return { success: true };
        } else {
            // Auth worked but no profile? Sign out immediately to avoid stuck state
            await supabase.auth.signOut();
            return { success: false, error: "Access Denied: User profile missing. Please contact Admin to run Database Setup." };
        }
    }

    return { success: false, error: "Session creation failed." };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.hash = '#/';
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], dir }}>
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        <Router />
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;