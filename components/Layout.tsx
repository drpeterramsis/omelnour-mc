import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole } from '../types';
import { Menu, X, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
            setProfile(data as UserProfile);
        } else {
            setProfile({ id: session.user.id, email: session.user.email!, role: UserRole.RECEPTIONIST });
        }
      } else {
        setProfile(null);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
             const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
             if (data) setProfile(data as UserProfile);
        } else {
            setProfile(null);
        }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation - Admin/Staff links only visible if logged in, or simplified for public */}
      <nav className="bg-medical-red text-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center font-bold text-lg">
                <span className="text-xl ml-2">🏥</span>
                مركز أم النور الطبي
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-8 md:space-x-reverse">
              <Link to="/" className="hover:bg-medical-redHover px-3 py-1 rounded transition">الرئيسية</Link>
              
              {!profile && (
                 <Link to="/login" className="hover:bg-medical-redHover px-3 py-1 rounded transition">
                   دخول الموظفين
                 </Link>
              )}

              {profile && (
                <>
                  <Link to="/schedule-manager" className="hover:bg-medical-redHover px-3 py-1 rounded transition">
                    إدارة الجداول
                  </Link>
                  {profile.role === UserRole.ADMIN && (
                    <Link to="/admin" className="hover:bg-medical-redHover px-3 py-1 rounded transition">
                      لوحة التحكم
                    </Link>
                  )}
                  <div className="flex items-center space-x-4 space-x-reverse border-r border-red-800 pr-4 mr-4">
                     <span className="text-sm text-red-100 flex items-center">
                        <User className="w-4 h-4 ml-1" />
                        {profile.role === UserRole.ADMIN ? 'مدير' : 'استقبال'}
                     </span>
                     <button onClick={handleLogout} className="text-red-200 hover:text-white p-2">
                        <LogOut className="w-5 h-5" />
                     </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-red-100 hover:bg-medical-redHover focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-medical-red border-t border-red-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-medical-redHover">الرئيسية</Link>
              {profile && (
                <>
                    <Link to="/schedule-manager" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-medical-redHover">إدارة الجداول</Link>
                    {profile.role === UserRole.ADMIN && (
                        <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-medical-redHover">لوحة التحكم</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-right block px-3 py-2 rounded-md text-base font-medium text-red-200 hover:text-white hover:bg-medical-redHover">تسجيل خروج</button>
                </>
              )}
               {!profile && (
                 <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-medical-redHover">
                   دخول الموظفين
                 </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow w-full mx-auto">
        {children}
      </main>

      <footer className="bg-[#36454F] text-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
             &copy; {new Date().getFullYear()} Clinica i-Mind | Dr. Peter Ramsis | v1.0.010
        </div>
      </footer>
    </div>
  );
};

export default Layout;