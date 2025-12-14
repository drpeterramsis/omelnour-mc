import React from 'react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, isLoggedIn, onLogout, userName }) => {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-t-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
             {/* Logo Icon */}
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold ml-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">مركز أم النور الطبي</h1>
              <p className="text-xs text-secondary hidden sm:block">رعاية طبية متميزة</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-reverse space-x-6">
            <button 
              onClick={() => onNavigate('home')}
              className={`${currentPage === 'home' ? 'text-secondary font-bold' : 'text-gray-600 hover:text-primary'} transition-colors`}
            >
              الرئيسية
            </button>
            <button 
              onClick={() => onNavigate('doctors')}
              className={`${currentPage === 'doctors' ? 'text-secondary font-bold' : 'text-gray-600 hover:text-primary'} transition-colors`}
            >
              الأطباء
            </button>
            {isLoggedIn && (
               <button 
               onClick={() => onNavigate('admin')}
               className={`${currentPage === 'admin' ? 'text-secondary font-bold' : 'text-gray-600 hover:text-primary'} transition-colors`}
             >
               لوحة التحكم
             </button>
            )}
          </div>

          <div className="flex items-center">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:block">مرحباً، {userName}</span>
                <button 
                  onClick={onLogout}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm"
              >
                دخول الموظفين
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Bar (Simplified) */}
      <div className="md:hidden border-t border-gray-100 flex justify-around p-2 bg-gray-50 text-sm">
        <button onClick={() => onNavigate('home')} className={`flex-1 text-center py-2 ${currentPage === 'home' ? 'font-bold text-primary' : ''}`}>الرئيسية</button>
        <button onClick={() => onNavigate('doctors')} className={`flex-1 text-center py-2 ${currentPage === 'doctors' ? 'font-bold text-primary' : ''}`}>الأطباء</button>
        {isLoggedIn && <button onClick={() => onNavigate('admin')} className={`flex-1 text-center py-2 ${currentPage === 'admin' ? 'font-bold text-primary' : ''}`}>الإدارة</button>}
      </div>
    </nav>
  );
};