import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DEFAULT_PERMISSIONS } from './types';
import { db, enableMockMode } from './services/db';
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
  loginDemo: () => Promise<void>;
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
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
             // If we have a user but no profile in state, fetch it
             if (!user) {
                await fetchProfile(session.user.id);
             }
        } else {
            // Only clear user if we are NOT in demo mode (demo mode doesn't have a session)
            // But for simplicity, we rely on manual logout for demo
            if (user?.id !== 'demo-admin') {
                setUser(null);
            }
            setLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string): Promise<User | null> => {
      // console.log("Fetching profile for:", userId);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (error) {
          console.error("Profile Fetch Error:", error.message);
          setLoading(false);
          return null;
      }

      if (data) {
          const u = data as User;
          setUser(u);
          setLoading(false);
          return u;
      } else {
          setUser(null);
          setLoading(false);
          return null;
      }
  };

  const login = async (email: string, pass: string): Promise<LoginResult> => {
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
            await supabase.auth.signOut();
            return { success: false, error: "Access Denied: User profile missing. Please contact Admin." };
        }
    }

    return { success: false, error: "Session creation failed." };
  };

  const loginDemo = async () => {
      enableMockMode();
      setUser({
          id: 'demo-admin',
          name: 'Demo Admin',
          email: 'demo@omelnour.com',
          role: UserRole.ADMIN,
          is_active: true,
          permissions: DEFAULT_PERMISSIONS.ADMIN
      });
      window.location.hash = '#/dashboard';
  };

  const logout = async () => {
    if (user?.id !== 'demo-admin') {
        await supabase.auth.signOut();
    }
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
      <AuthContext.Provider value={{ user, login, loginDemo, logout, loading }}>
        <Router />
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;