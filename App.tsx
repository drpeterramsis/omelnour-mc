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
interface AuthContextType {
  user: User | null;
  login: (e: string, p: string) => Promise<boolean>;
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
             fetchProfile(session.user.id);
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
      console.log("Fetching profile for:", userId);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
          setUser(data as User);
      } else {
          console.error("Profile not found in 'profiles' table. Ensure SQL seed script ran.", error);
      }
      setLoading(false);
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    console.log("Attempting login for:", email);
    // 1. Try Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
        console.error("Supabase Auth Error (Check Console for Details):", error.message);
        
        // 2. Fallback for Demo (Only if Auth fails)
        console.warn("Attempting Fallback (Unsafe) Login check...");
        const allUsers = await db.users.getAll();
        const mockUser = allUsers.find(u => u.email === email); 
        
        if (mockUser) {
            console.log("User found in profiles table (Fallback). Logging in without password check (Demo Mode).");
            setUser(mockUser);
            return true;
        } else {
            console.error("User NOT found in profiles table either.");
        }
        return false;
    }
    console.log("Supabase Auth Success");
    return true;
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