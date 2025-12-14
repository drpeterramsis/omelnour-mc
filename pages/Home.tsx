import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Doctor, Schedule } from '../types';
import { ChevronDown, ChevronUp, Printer, Phone, Search, AlertCircle, RefreshCw } from 'lucide-react';

const DAYS_ARABIC: Record<string, string> = {
  "Sunday": "الأحد",
  "Monday": "الإثنين",
  "Tuesday": "الثلاثاء",
  "Wednesday": "الأربعاء",
  "Thursday": "الخميس",
  "Friday": "الجمعة",
  "Saturday": "السبت"
};

const CAROUSEL_IMAGES = [
    "https://dl.dropboxusercontent.com/scl/fi/rd671sha3cjl19xpgfyv0/mc_banner_1.jpg?rlkey=wu1xot7fbjmrzwt48kjhh8muo&st=k2bhpgps",
    "https://dl.dropboxusercontent.com/scl/fi/bp52rsu18gwt3h4skxhub/mc_banner_2.jpg?rlkey=9t2q06v8u4h67npazv68kqm1d&st=h1mgf0e5"
];

const Home: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  
  // UI Toggles
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDates, setShowDates] = useState(true);
  const [showDays, setShowDays] = useState(true);
  
  // Carousel
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchData();
    
    // Auto slide carousel
    const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch for better performance
      const [doctorsResponse, schedulesResponse] = await Promise.all([
        supabase.from('doctors').select('*'),
        supabase.from('schedules').select('*')
      ]);

      if (doctorsResponse.error) throw doctorsResponse.error;
      if (schedulesResponse.error) throw schedulesResponse.error;

      const doctorsData = doctorsResponse.data || [];
      const schedulesData = schedulesResponse.data || [];

      setDoctors(doctorsData);
      setSchedules(schedulesData);
      
      // Extract unique specialties
      const specialties = Array.from(new Set(doctorsData.map(d => d.specialty).filter(Boolean)));
      setAvailableSpecialties(specialties);
      setSelectedSpecialties([]); 
    } catch (err: any) {
      // Safely handle error object to avoid [object Object]
      const errorObj = err || {};
      const errorMessage = errorObj.message || (typeof err === 'string' ? err : JSON.stringify(err));
      console.error('Error fetching data:', errorMessage);

      let displayMsg = 'حدث خطأ غير معروف أثناء تحميل البيانات.';

      if (typeof errorMessage === 'string') {
          // Check for missing table error (Postgres code 42P01)
          if (errorObj.code === '42P01' || errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
              displayMsg = 'قاعدة البيانات غير جاهزة. يرجى نسخ كود SQL من ملف supabaseClient.ts وتشغيله في لوحة تحكم Supabase.';
          } else if (errorMessage) {
              displayMsg = errorMessage;
          }
      }
      
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
      setSelectedSpecialties(prev => 
        prev.includes(specialty) 
            ? prev.filter(s => s !== specialty)
            : [...prev, specialty]
      );
  };

  const selectAllSpecialties = () => setSelectedSpecialties(availableSpecialties);
  const deselectAllSpecialties = () => setSelectedSpecialties([]);

  const filteredSchedules = schedules.filter(schedule => {
    const doctor = doctors.find(d => d.id === schedule.doctor_id);
    if (!doctor) return false;
    
    // 1. Filter by Specialty
    if (selectedSpecialties.length > 0 && !selectedSpecialties.includes(doctor.specialty)) {
        return false;
    }
    
    // 2. Filter by Day
    if (selectedDay !== 'all' && schedule.day_of_week !== selectedDay) return false;
    
    return true;
  });

  const getDoctor = (id: string) => doctors.find(d => d.id === id);

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="pb-12 bg-white min-h-screen">
      
      {/* 1. Carousel */}
      <div className="relative w-full overflow-hidden shadow-lg rounded-b-2xl max-w-5xl mx-auto">
         <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${currentSlide * 100}%)` }}>
            {CAROUSEL_IMAGES.map((img, idx) => (
                <img key={idx} src={img} alt={`Slide ${idx}`} className="w-full object-cover block" />
            ))}
         </div>
      </div>

      {/* 2. Call Us Bar */}
      <div className="bg-medical-red text-white text-center py-2 text-sm font-bold shadow-md rounded-b-xl mx-auto max-w-5xl flex justify-center items-center gap-2">
          <a href="tel:+2035352893" className="flex items-center gap-2 hover:text-gray-200 transition">
             <span>Call Us</span>
             <Phone size={16} />
             <span>اتصل بنا</span>
          </a>
      </div>

      <div className="max-w-4xl mx-auto px-2 mt-4">
        
        {/* Banner Heading */}
        <h1 className="text-xl md:text-2xl font-bold text-medical-red text-center my-4">
            مواعيد اطباء العيادات التخصصية
        </h1>

        {/* Date Navigation */}
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
            <div className="flex flex-wrap gap-2 justify-center mb-4">
                 <button 
                    onClick={() => setSelectedDay(new Date().toLocaleDateString('en-US', { weekday: 'long' }))}
                    className="bg-[#f5a623] hover:bg-[#d68f1d] text-white px-6 py-2 rounded-lg font-bold shadow transition"
                 >
                    اليوم 📅
                 </button>
                 <button 
                     onClick={() => {}} 
                     className="bg-medical-red hover:bg-medical-redHover text-white px-6 py-2 rounded-lg font-bold shadow transition flex items-center gap-2"
                 >
                    بحث <Search size={16} />
                 </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm">
                <button onClick={() => setSelectedDay('all')} className={`px-3 py-1 rounded ${selectedDay === 'all' ? 'bg-medical-blue text-white' : 'bg-gray-200 text-gray-700'}`}>الكل</button>
                {Object.entries(DAYS_ARABIC).map(([eng, ar]) => (
                     <button 
                        key={eng} 
                        onClick={() => setSelectedDay(eng)}
                        className={`px-3 py-1 rounded transition ${selectedDay === eng ? 'bg-medical-blue text-white' : 'bg-gray-200 text-gray-700'}`}
                     >
                         {ar}
                     </button>
                ))}
            </div>
        </div>

        {/* Print Button */}
        <div className="text-center mb-4">
            <button onClick={handlePrint} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 hover:opacity-80 transition print:hidden">
                <Printer size={16} />
                طباعة الجدول
            </button>
        </div>

        {/* 3. Filters Section */}
        <div className="space-y-4 mb-6 print:hidden">
            {/* Specialty Filter */}
            <div className="bg-medical-light border border-gray-200 rounded-lg shadow-sm">
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="w-full flex justify-between items-center p-3 text-medical-blue font-bold"
                >
                    <span className="flex items-center gap-2">
                        {isFilterOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        اختار التخصص
                    </span>
                </button>
                
                {isFilterOpen && (
                    <div className="p-3 border-t border-gray-200 bg-white animate-fadeIn">
                         <div className="flex flex-wrap gap-3 justify-end mb-4">
                            {availableSpecialties.map(spec => (
                                <label key={spec} className="flex items-center gap-2 bg-[#edf6f9] px-3 py-1 rounded-lg cursor-pointer hover:bg-gray-200 transition select-none">
                                    <span className="text-sm font-medium text-gray-700">{spec}</span>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSpecialties.includes(spec)}
                                        onChange={() => toggleSpecialty(spec)}
                                        className="w-4 h-4 text-medical-blue rounded focus:ring-medical-blue"
                                    />
                                </label>
                            ))}
                         </div>
                         <div className="flex justify-center gap-4">
                             <button onClick={selectAllSpecialties} className="text-xs border border-medical-blue text-medical-blue px-3 py-1 rounded-lg hover:bg-blue-50">✅ تحديد الكل</button>
                             <button onClick={deselectAllSpecialties} className="text-xs border border-medical-blue text-medical-blue px-3 py-1 rounded-lg hover:bg-blue-50">❌ الغاء الكل</button>
                         </div>
                    </div>
                )}
            </div>

            {/* Settings Filter */}
            <div className="bg-medical-light border border-gray-200 rounded-lg shadow-sm">
                 <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-full flex justify-between items-center p-3 text-medical-red font-bold"
                >
                    <span className="flex items-center gap-2">
                         {isSettingsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        إعدادات الصفحة
                    </span>
                </button>
                
                {isSettingsOpen && (
                    <div className="p-3 border-t border-gray-200 bg-white space-y-3">
                         <div className="flex flex-col gap-2 items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span>تواريخ جدول العيادات</span>
                                <input type="checkbox" checked={showDates} onChange={(e) => setShowDates(e.target.checked)} />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span>أيام جدول العيادات</span>
                                <input type="checkbox" checked={showDays} onChange={(e) => setShowDays(e.target.checked)} />
                            </label>
                         </div>
                    </div>
                )}
            </div>
        </div>

        {/* 4. Schedule Grid/Table */}
        {loading ? (
             <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-gray-200 border-l-medical-blue rounded-full animate-spin"></div></div>
        ) : error ? (
            <div className="mx-4 p-6 bg-red-50 border border-red-200 rounded-xl text-center shadow-sm">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-red-800 mb-2">تعذر تحميل البيانات</h3>
                <p className="text-red-600 mb-4 font-mono text-sm" dir="ltr">{error}</p>
                <button 
                    onClick={fetchData} 
                    className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition font-bold"
                >
                    <RefreshCw size={18} /> محاولة مرة أخرى
                </button>
            </div>
        ) : (
            <div id="schedule-print-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {selectedSpecialties.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 italic bg-gray-50 rounded-lg border border-dashed">
                        يرجى اختيار تخصص واحد على الأقل من القائمة أعلاه لعرض المواعيد.
                    </div>
                )}

                {filteredSchedules.map(schedule => {
                    const doctor = getDoctor(schedule.doctor_id);
                    if (!doctor) return null;

                    return (
                        <div key={schedule.id} className={`bg-white rounded-xl shadow border-2 ${schedule.is_cancelled ? 'border-red-200 bg-red-50' : 'border-[#0353a8]'} overflow-hidden transition hover:shadow-lg`}>
                            {/* Header similar to old site table header */}
                            <div className="bg-medical-blue text-white p-2 text-center font-bold text-sm">
                                {doctor.specialty}
                            </div>
                            
                            <div className="p-4 text-center">
                                <h3 className="font-bold text-lg text-gray-800 mb-2">{doctor.name}</h3>
                                
                                {showDays && (
                                    <div className="text-gray-600 font-medium mb-1">
                                        {DAYS_ARABIC[schedule.day_of_week]}
                                    </div>
                                )}
                                
                                {showDates && (
                                    <div className="inline-block bg-[#fff3f3] text-[#1100ff] px-3 py-1 rounded font-bold text-sm mb-2 dir-ltr">
                                        {schedule.start_time} - {schedule.end_time}
                                    </div>
                                )}

                                {schedule.is_cancelled ? (
                                    <div className="mt-2 flex items-center justify-center gap-2 bg-[#FFCCCC] text-[#DC143C] px-2 py-1 rounded text-sm font-bold mx-auto w-fit">
                                        <span className="line-through decoration-[#DC143C]">الموعد</span>
                                        <span>معتذر ❌</span>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-green-700 text-xs font-bold">
                                        متاح للحجز ✔️
                                    </div>
                                )}
                                
                                {schedule.notes && <p className="text-xs text-gray-500 mt-2 italic">{schedule.notes}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* 5. Map */}
        <div className="w-full flex justify-center items-center p-2 mb-8 print:hidden">
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3410.2962721543236!2d30.0059427!3d31.2678991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f5d077d4963845%3A0x7a0f4bfed5a5e129!2z2YXYs9iq2LTZgdmJINij2YUg2KfZhNmG2YjYsQ!5e0!3m2!1sen!2seg!4v1739529411844!5m2!1sen!2seg" 
                width="100%" 
                height="300" 
                style={{ border: '2px solid darkblue', borderRadius: '15px' }}
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Omelnour Location"
            >
            </iframe>
        </div>

      </div>
    </div>
  );
};

export default Home;