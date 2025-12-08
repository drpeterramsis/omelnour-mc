import React, { useState } from 'react';
import { useAuth } from '../App';
import { useLanguage } from '../App';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, dir } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleLang = () => {
      setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const LangSwitcher = () => (
      <button 
        onClick={toggleLang}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-bold mx-2"
      >
        {language === 'ar' ? 'English' : 'عربي'}
      </button>
  );

  // --- Public Layout (No User) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir={dir}>
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none tracking-tight">{t.appTitle}</h1>
                <p className="text-xs text-primary font-medium tracking-wider">{t.subTitle}</p>
              </div>
            </div>
            
            <nav className="hidden md:flex gap-8 items-center">
              <a href="#/" className="text-gray-600 hover:text-primary font-medium transition">{t.home}</a>
              <a href="#/#doctors" className="text-gray-600 hover:text-primary font-medium transition">{t.doctors}</a>
              <a href="#/#clinics" className="text-gray-600 hover:text-primary font-medium transition">{t.clinics}</a>
            </nav>

            <div className="flex items-center gap-2">
              <LangSwitcher />
              <a 
                href="#/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 shadow-sm transition"
              >
                {t.login}
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-white border-t py-8 mt-12">
           <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} {t.appTitle}. v1.0.007
           </div>
        </footer>
      </div>
    );
  }

  // --- Protected Layout (Logged In) ---
  const NavItem = ({ label, href, icon, requiredPermission }: { label: string, href: string, icon: string, requiredPermission?: boolean }) => {
    if (requiredPermission === false) return null;
    return (
      <a href={href} className="flex items-center px-6 py-3 text-white hover:bg-white/10 transition-colors">
        <span className="text-xl ms-0 me-3">{icon}</span>
        <span className="font-medium">{label}</span>
      </a>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir={dir}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')} md:relative md:transform-none shadow-xl`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold tracking-wider">{t.appTitle}</h1>
          <p className="text-xs text-white/70 mt-1">{t.subTitle}</p>
        </div>
        <nav className="mt-6 flex flex-col space-y-1">
          <NavItem label={t.dashboard} href="#/dashboard" icon="📊" />
          <NavItem label={t.appointments} href="#/appointments" icon="📅" requiredPermission={user.permissions.can_manage_appointments} />
          <NavItem label={t.doctors} href="#/doctors" icon="👨‍⚕️" requiredPermission={user.permissions.can_manage_doctors} />
          <NavItem label={t.schedule} href="#/schedule" icon="🕒" requiredPermission={user.permissions.can_manage_schedules} />
          <NavItem label={t.clinics} href="#/clinics" icon="🏥" requiredPermission={user.permissions.can_manage_clinics} />
          <NavItem label={t.adminPanel} href="#/admin" icon="🛡️" requiredPermission={user.permissions.can_view_admin_panel} />
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-white/10 bg-primary">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-white/70 truncate">{user.role}</p>
                </div>
            </div>
            <button onClick={logout} className="w-full text-start text-sm text-red-200 hover:text-white mt-2">{t.logout}</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-600 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
             </button>
             <span className="text-sm text-gray-500">{new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
          </div>
          <div className="flex items-center ms-auto">
             <LangSwitcher />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};