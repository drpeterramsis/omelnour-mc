import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Doctor, Schedule } from '../types';
import { Trash2, Edit, Plus, Calendar, Users, PenBox } from 'lucide-react';

const DAYS_OPTIONS = [
  { value: "Sunday", label: "الأحد" },
  { value: "Monday", label: "الإثنين" },
  { value: "Tuesday", label: "الثلاثاء" },
  { value: "Wednesday", label: "الأربعاء" },
  { value: "Thursday", label: "الخميس" },
  { value: "Friday", label: "الجمعة" },
  { value: "Saturday", label: "السبت" }
];

const ScheduleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'doctors'>('schedules');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Schedule Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState<Partial<Schedule>>({
      doctor_id: '',
      day_of_week: 'Sunday',
      start_time: '09:00',
      end_time: '17:00',
      is_cancelled: false,
      notes: ''
  });

  // Doctor Form State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorFormData, setDoctorFormData] = useState({ name: '', specialty: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data: d } = await supabase.from('doctors').select('*');
    const { data: s } = await supabase.from('schedules').select('*');
    if (d) setDoctors(d);
    if (s) setSchedules(s);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Schedule Handlers ---
  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
        await supabase.from('schedules').delete().eq('id', id);
        fetchData();
    }
  };

  const handleToggleCancel = async (schedule: Schedule) => {
      await supabase.from('schedules').update({ is_cancelled: !schedule.is_cancelled }).eq('id', schedule.id);
      fetchData();
  };

  const openAddScheduleModal = () => {
      setEditingSchedule(null);
      setScheduleFormData({
          doctor_id: '',
          day_of_week: 'Sunday',
          start_time: '09:00',
          end_time: '17:00',
          is_cancelled: false,
          notes: ''
      });
      setIsModalOpen(true);
  };

  const openEditScheduleModal = (schedule: Schedule) => {
      setEditingSchedule(schedule);
      setScheduleFormData({
          doctor_id: schedule.doctor_id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_cancelled: schedule.is_cancelled,
          notes: schedule.notes
      });
      setIsModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!scheduleFormData.doctor_id) {
          alert("الرجاء اختيار طبيب");
          return;
      }
      
      let error;
      if (editingSchedule) {
          // Update existing
          const { error: err } = await supabase
            .from('schedules')
            .update(scheduleFormData)
            .eq('id', editingSchedule.id);
          error = err;
      } else {
          // Create new
          const { error: err } = await supabase
            .from('schedules')
            .insert([scheduleFormData]);
          error = err;
      }

      if (error) {
          alert('خطأ في العملية: ' + error.message);
      } else {
          setIsModalOpen(false);
          fetchData();
          setEditingSchedule(null);
      }
  };

  // --- Doctor Handlers ---
  const handleDeleteDoctor = async (id: string) => {
      if (window.confirm('تحذير: حذف الطبيب سيؤدي لحذف جميع مواعيده. هل أنت متأكد؟')) {
          await supabase.from('schedules').delete().eq('doctor_id', id);
          const { error } = await supabase.from('doctors').delete().eq('id', id);
          
          if (error) {
              alert('لا يمكن حذف الطبيب: ' + error.message);
          } else {
              fetchData();
          }
      }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!doctorFormData.name || !doctorFormData.specialty) return;

      const { error } = await supabase.from('doctors').insert([doctorFormData]);
      if (error) {
          alert('خطأ في الإضافة: ' + error.message);
      } else {
          setIsDoctorModalOpen(false);
          fetchData();
          setDoctorFormData({ name: '', specialty: '' });
      }
  };


  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'غير معروف';

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">إدارة المركز</h1>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('schedules')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${activeTab === 'schedules' ? 'bg-white shadow text-medical-blue font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Calendar size={18} />
                <span>المواعيد</span>
            </button>
            <button 
                onClick={() => setActiveTab('doctors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${activeTab === 'doctors' ? 'bg-white shadow text-medical-blue font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Users size={18} />
                <span>الأطباء</span>
            </button>
        </div>

        {/* Action Button based on Tab */}
        {activeTab === 'schedules' ? (
            <button 
                onClick={openAddScheduleModal}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition"
            >
                <Plus size={20} />
                <span>إضافة موعد جديد</span>
            </button>
        ) : (
             <button 
                onClick={() => setIsDoctorModalOpen(true)}
                className="bg-medical-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition"
            >
                <Plus size={20} />
                <span>إضافة طبيب جديد</span>
            </button>
        )}
      </div>

      {loading ? (
          <div className="text-center py-10">جاري التحميل...</div>
      ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden min-h-[400px]">
              
              {/* === SCHEDULES TABLE === */}
              {activeTab === 'schedules' && (
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطبيب</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اليوم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {schedules.map(schedule => (
                              <tr key={schedule.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getDoctorName(schedule.doctor_id)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {DAYS_OPTIONS.find(d => d.value === schedule.day_of_week)?.label}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" dir="ltr">{schedule.start_time} - {schedule.end_time}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                      <button 
                                        onClick={() => handleToggleCancel(schedule)}
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${schedule.is_cancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                                      >
                                          {schedule.is_cancelled ? 'ملغى' : 'نشط'}
                                      </button>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                      <button onClick={() => openEditScheduleModal(schedule)} className="text-blue-600 hover:text-blue-900" title="تعديل الموعد">
                                          <PenBox size={18} />
                                      </button>
                                      <button onClick={() => handleDeleteSchedule(schedule.id)} className="text-red-600 hover:text-red-900" title="حذف الموعد">
                                          <Trash2 size={18} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {schedules.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-500">لا توجد مواعيد مضافة</td></tr>}
                      </tbody>
                  </table>
              )}

              {/* === DOCTORS TABLE === */}
              {activeTab === 'doctors' && (
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطبيب</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التخصص</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {doctors.map(doctor => (
                              <tr key={doctor.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doctor.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                                        {doctor.specialty}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button onClick={() => handleDeleteDoctor(doctor.id)} className="text-red-600 hover:text-red-900 mx-2 flex items-center gap-1">
                                          <Trash2 size={16} /> حذف
                                      </button>
                                  </td>
                              </tr>
                          ))}
                           {doctors.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-500">لا يوجد أطباء. أضف طبيب جديد.</td></tr>}
                      </tbody>
                  </table>
              )}
          </div>
      )}

      {/* === ADD/EDIT SCHEDULE MODAL === */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl animate-fadeIn">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                      {editingSchedule ? 'تعديل الموعد' : 'إضافة موعد جديد'}
                  </h2>
                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">الطبيب</label>
                          <select 
                            className="w-full border rounded p-2 bg-gray-50 focus:bg-white transition" 
                            value={scheduleFormData.doctor_id}
                            onChange={(e) => setScheduleFormData({...scheduleFormData, doctor_id: e.target.value})}
                            required
                            disabled={!!editingSchedule} // Disable changing doctor on edit to prevent confusion
                          >
                              <option value="">اختر الطبيب</option>
                              {doctors.map(d => (
                                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                              ))}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">اليوم</label>
                            <select 
                                className="w-full border rounded p-2" 
                                value={scheduleFormData.day_of_week}
                                onChange={(e) => setScheduleFormData({...scheduleFormData, day_of_week: e.target.value})}
                            >
                                {DAYS_OPTIONS.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">ملاحظات</label>
                             <input 
                                type="text"
                                className="w-full border rounded p-2"
                                value={scheduleFormData.notes || ''}
                                onChange={(e) => setScheduleFormData({...scheduleFormData, notes: e.target.value})}
                             />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1">من الساعة</label>
                              <input 
                                type="time" 
                                className="w-full border rounded p-2"
                                value={scheduleFormData.start_time}
                                onChange={(e) => setScheduleFormData({...scheduleFormData, start_time: e.target.value})}
                                required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">إلى الساعة</label>
                              <input 
                                type="time" 
                                className="w-full border rounded p-2"
                                value={scheduleFormData.end_time}
                                onChange={(e) => setScheduleFormData({...scheduleFormData, end_time: e.target.value})}
                                required
                              />
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                          <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                          >
                              إلغاء
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                              {editingSchedule ? 'تحديث الموعد' : 'حفظ الموعد'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* === ADD DOCTOR MODAL === */}
      {isDoctorModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl animate-fadeIn">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2 text-medical-blue">إضافة طبيب جديد</h2>
                  <form onSubmit={handleDoctorSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">اسم الطبيب</label>
                          <input 
                            type="text" 
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-medical-blue outline-none" 
                            placeholder="د. الاسم..."
                            value={doctorFormData.name}
                            onChange={(e) => setDoctorFormData({...doctorFormData, name: e.target.value})}
                            required
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium mb-1">التخصص</label>
                          <input 
                            type="text" 
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-medical-blue outline-none" 
                            placeholder="مثال: أسنان 🦷"
                            value={doctorFormData.specialty}
                            onChange={(e) => setDoctorFormData({...doctorFormData, specialty: e.target.value})}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            نصيحة: يمكنك استخدام الإيموجي لتمييز التخصص (مثال: 🦷، 🦴، 🩺).
                          </p>
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                          <button 
                            type="button" 
                            onClick={() => setIsDoctorModalOpen(false)}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                          >
                              إلغاء
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-medical-blue text-white rounded hover:bg-blue-800"
                          >
                              حفظ الطبيب
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default ScheduleManager;