import React, { useState } from 'react';
import { Doctor, User, Role, ScheduleSlot } from '../types';
import { DataService } from '../services/dataService';

interface AdminPanelProps {
  doctors: Doctor[];
  users: User[];
  refreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ doctors, users, refreshData }) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'users'>('schedules');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.DOCTOR });
  const [loading, setLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleSlot[] | null>(null);
  
  const dataService = DataService.getInstance();
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dataService.createUser(newUser.name, newUser.email, newUser.role);
      setNewUser({ name: '', email: '', role: Role.DOCTOR });
      refreshData();
      alert('تم إضافة المستخدم بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء إضافة المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await dataService.toggleDoctorStatus(id);
    refreshData();
  };

  const handleSaveSchedule = async () => {
    if (selectedDoctorId && editingSchedule) {
      setLoading(true);
      try {
        await dataService.updateDoctorSchedule(selectedDoctorId, editingSchedule);
        refreshData();
        alert('تم تحديث الجدول');
      } finally {
        setLoading(false);
      }
    }
  };

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: any) => {
    if (!editingSchedule) return;
    const newSchedule = [...editingSchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setEditingSchedule(newSchedule);
  };

  const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const DAYS_AR = {'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة'};

  return (
    <div className="bg-white rounded-xl shadow-lg min-h-[600px] border border-gray-100">
      <div className="flex border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 py-4 text-center font-bold ${activeTab === 'schedules' ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          إدارة الجداول والأطباء
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 text-center font-bold ${activeTab === 'users' ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          إدارة الموظفين
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 17.175V18.75c0 .414.336.75.75.75h14.5c.414 0 .75-.336.75-.75v-1.575c0-.62-.504-1.125-1.125-1.125H5.375c-.621 0-1.125.505-1.125 1.125z" />
                </svg>
                إضافة مستخدم جديد
              </h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  type="text" 
                  placeholder="الاسم" 
                  required
                  className="p-2 border rounded-lg"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                />
                <input 
                  type="email" 
                  placeholder="البريد الإلكتروني" 
                  required
                  className="p-2 border rounded-lg"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
                <select 
                  className="p-2 border rounded-lg"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                >
                  <option value={Role.DOCTOR}>طبيب</option>
                  <option value={Role.RECEPTIONIST}>موظف استقبال</option>
                  <option value={Role.ADMIN}>مدير</option>
                </select>
                <button type="submit" disabled={loading} className="bg-primary text-white py-2 rounded-lg hover:bg-blue-800">
                  {loading ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">قائمة المستخدمين</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm">
                      <th className="p-3">الاسم</th>
                      <th className="p-3">البريد الإلكتروني</th>
                      <th className="p-3">الدور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="p-3 font-medium">{user.name}</td>
                        <td className="p-3 text-gray-500">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' :
                            user.role === Role.DOCTOR ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Doctors List */}
            <div className="md:col-span-1 space-y-3">
              <h3 className="font-bold text-gray-700 mb-2">اختر طبيباً للتعديل</h3>
              {doctors.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctorId(doc.id);
                    setEditingSchedule([...doc.schedule]);
                  }}
                  className={`p-3 rounded-lg cursor-pointer border transition-all flex justify-between items-center ${selectedDoctorId === doc.id ? 'bg-blue-50 border-primary ring-1 ring-primary' : 'bg-white border-gray-200 hover:border-primary'}`}
                >
                  <div>
                    <div className="font-bold text-gray-800">{doc.name}</div>
                    <div className="text-xs text-gray-500">{doc.specialty}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${doc.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={doc.isActive ? 'نشط' : 'غير نشط'} />
                </div>
              ))}
            </div>

            {/* Schedule Editor */}
            <div className="md:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
              {selectedDoctor ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">{selectedDoctor.name}</h3>
                      <p className="text-sm text-gray-500">تعديل جدول المواعيد والحالة</p>
                    </div>
                    <button 
                      onClick={() => handleToggleStatus(selectedDoctor.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedDoctor.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {selectedDoctor.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingSchedule?.map((slot, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                         <select 
                           value={slot.day}
                           onChange={e => updateScheduleSlot(idx, 'day', e.target.value)}
                           className="border rounded p-1 text-sm bg-gray-50"
                         >
                           {DAYS.map(d => <option key={d} value={d}>{(DAYS_AR as any)[d]}</option>)}
                         </select>
                         <div className="flex items-center gap-1">
                           <span className="text-xs text-gray-400">من</span>
                           <input 
                              type="time" 
                              value={slot.startTime} 
                              onChange={e => updateScheduleSlot(idx, 'startTime', e.target.value)}
                              className="border rounded p-1 text-sm"
                           />
                         </div>
                         <div className="flex items-center gap-1">
                           <span className="text-xs text-gray-400">إلى</span>
                           <input 
                              type="time" 
                              value={slot.endTime} 
                              onChange={e => updateScheduleSlot(idx, 'endTime', e.target.value)}
                              className="border rounded p-1 text-sm"
                           />
                         </div>
                         <div className="flex items-center gap-2 mr-auto">
                            <label className="flex items-center text-xs gap-1 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={slot.isCancelled} 
                                  onChange={e => updateScheduleSlot(idx, 'isCancelled', e.target.checked)}
                                  className="accent-red-500"
                                />
                                إلغاء
                            </label>
                            <button 
                              onClick={() => {
                                const newSched = editingSchedule.filter((_, i) => i !== idx);
                                setEditingSchedule(newSched);
                              }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                         </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => setEditingSchedule([...(editingSchedule || []), { day: 'Sunday', startTime: '09:00', endTime: '17:00' }])}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                      إضافة موعد جديد
                    </button>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleSaveSchedule}
                      disabled={loading}
                      className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-800 shadow-md transition-all"
                    >
                      {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                   </svg>
                   <p>يرجى اختيار طبيب من القائمة لبدء التعديل</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};