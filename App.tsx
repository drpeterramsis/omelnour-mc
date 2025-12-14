import React, { useEffect, useState } from 'react';
import { DataService } from './services/dataService';
import { Doctor, User, AppState } from './types';
import { Navbar } from './components/Navbar';
import { GeminiAssistant } from './components/GeminiAssistant';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const [page, setPage] = useState('home');
  const [state, setState] = useState<AppState>({
    currentUser: null,
    doctors: [],
    users: [],
  });
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const dataService = DataService.getInstance();

  const loadData = async () => {
    const doctors = await dataService.getDoctors();
    const users = await dataService.getUsers();
    setState(prev => ({ ...prev, doctors, users }));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await dataService.login(email);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      setPage('admin');
    } else {
      alert('البريد الإلكتروني غير مسجل (جرب admin@omelnour.com)');
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setPage('home');
  };

  const DAYS_AR = {'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة'};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Navbar 
        onNavigate={setPage} 
        currentPage={page} 
        isLoggedIn={!!state.currentUser}
        onLogout={handleLogout}
        userName={state.currentUser?.name}
      />

      <main className="container mx-auto px-4 py-8">
        
        {/* HOME PAGE */}
        {page === 'home' && (
          <div className="space-y-12 animate-fade-in">
             <div className="bg-gradient-to-l from-primary to-blue-600 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10 max-w-2xl">
                 <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">رعايتكم.. أمانة في أعناقنا</h2>
                 <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                   يقدم مركز أم النور الطبي أفضل الخدمات الطبية بأحدث التقنيات تحت إشراف نخبة من الأطباء المتخصصين. نحن هنا من أجل صحتكم وراحتكم على مدار الساعة.
                 </p>
                 <button 
                   onClick={() => setPage('doctors')}
                   className="bg-white text-primary px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                 >
                   تصفح جدول الأطباء
                 </button>
               </div>
               {/* Abstract decoration */}
               <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary opacity-10 rounded-full translate-x-1/3 translate-y-1/3 mix-blend-overlay"></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">طوارئ</h3>
                  <p className="text-gray-500 text-sm">استقبال حالات الطوارئ وتقديم الإسعافات الأولية.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">مواعيد مرنة</h3>
                  <p className="text-gray-500 text-sm">نظام حجز مواعيد سهل ومرن يناسب أوقاتكم.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 12 2s10 4.477 10 10z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">أطباء متخصصون</h3>
                  <p className="text-gray-500 text-sm">نخبة من الأطباء في كافة التخصصات الطبية.</p>
                </div>
             </div>
          </div>
        )}

        {/* DOCTORS SCHEDULE PAGE */}
        {page === 'doctors' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 border-r-4 border-secondary pr-4">جدول الأطباء</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.doctors.filter(d => d.isActive).map(doc => (
                <div key={doc.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                  <div className="h-24 bg-gradient-to-r from-blue-50 to-white relative">
                     <div className="absolute -bottom-8 right-6 w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200">
                        <img src={doc.photoUrl} alt={doc.name} className="w-full h-full object-cover" />
                     </div>
                  </div>
                  <div className="pt-10 px-6 pb-6">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">{doc.name}</h3>
                    <p className="text-secondary font-medium mb-4">{doc.specialty}</p>
                    
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">مواعيد العيادة</h4>
                      <div className="space-y-2">
                        {doc.schedule.length > 0 ? doc.schedule.map((slot, idx) => (
                          <div key={idx} className={`text-sm flex justify-between p-2 rounded ${slot.isCancelled ? 'bg-red-50 text-red-500 line-through decoration-red-500' : 'bg-gray-50 text-gray-600'}`}>
                            <span className="font-medium">{(DAYS_AR as any)[slot.day]}</span>
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-400 italic">لا توجد مواعيد متاحة حالياً</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGIN PAGE */}
        {page === 'login' && (
          <div className="max-w-md mx-auto mt-12 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                 <h2 className="text-2xl font-bold text-primary mb-2">تسجيل دخول الموظفين</h2>
                 <p className="text-gray-500 text-sm">يرجى استخدام البريد الإلكتروني الخاص بالعمل</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="example@omelnour.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
                >
                  دخول
                </button>
                <div className="text-center mt-4">
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">تلميح: admin@omelnour.com</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {page === 'admin' && state.currentUser && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 border-r-4 border-secondary pr-4">لوحة تحكم الإدارة</h2>
            <AdminPanel 
              doctors={state.doctors} 
              users={state.users} 
              refreshData={loadData}
            />
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 مركز أم النور الطبي. جميع الحقوق محفوظة.</p>
        <p className="mt-2 text-xs text-gray-400">نظام إدارة العيادات v1.0</p>
      </footer>

      {/* Floating Action Button for AI Assistant */}
      <GeminiAssistant doctors={state.doctors} />
    </div>
  );
}

export default App;