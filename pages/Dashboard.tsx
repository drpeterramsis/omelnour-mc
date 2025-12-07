import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { generateDailySummary, askAssistant } from '../services/geminiService';
import { Appointment, AppointmentStatus, Doctor } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../App';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [summary, setSummary] = useState<string>(t.loadingAI);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        const allApts = await db.appointments.getAll();
        setAppointments(allApts);
        
        const allDocs = await db.doctors.getAll();
        setDoctorsCount(allDocs.filter(d => d.is_active).length);

        setSummary(t.loadingAI);
        generateDailySummary(allApts).then(setSummary);
    };
    fetchData();
  }, [t.loadingAI]);

  const handleAsk = async () => {
      if(!assistantQuery) return;
      setAssistantResponse(t.thinking);
      const res = await askAssistant(assistantQuery);
      setAssistantResponse(res);
  };

  const statusData = [
    { name: 'Pending', count: appointments.filter(a => a.status === AppointmentStatus.PENDING).length },
    { name: 'Confirmed', count: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length },
    { name: 'Completed', count: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length },
    { name: 'Cancelled', count: appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length },
  ];

  return (
    <div className="space-y-6 font-sans">
      <h2 className="text-3xl font-bold text-gray-800">{t.dashboard}</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary">
          <p className="text-gray-500 text-sm">{t.totalAppointments}</p>
          <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">{t.confirmedToday}</p>
          <p className="text-3xl font-bold text-gray-800">
            {appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === AppointmentStatus.CONFIRMED).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-medical">
          <p className="text-gray-500 text-sm">{t.doctorsActive}</p>
          <p className="text-3xl font-bold text-gray-800">{doctorsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">{t.pendingRequests}</p>
          <p className="text-3xl font-bold text-gray-800">
            {appointments.filter(a => a.status === AppointmentStatus.PENDING).length}
          </p>
        </div>
      </div>

      {/* AI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="text-xl font-bold text-indigo-900">{t.smartSummary}</h3>
            </div>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{summary}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
             <h3 className="text-xl font-bold text-gray-800 mb-4">{t.medicalAssistant}</h3>
             <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    placeholder={t.askPlaceholder}
                    className="flex-1 border p-2 rounded"
                 />
                 <button onClick={handleAsk} className="bg-primary text-white px-4 py-2 rounded">{t.askAssistant}</button>
             </div>
             {assistantResponse && (
                 <div className="mt-4 p-4 bg-gray-50 rounded border text-sm text-gray-700">
                     {assistantResponse}
                 </div>
             )}
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl shadow-sm h-80">
        <h3 className="text-lg font-bold text-gray-700 mb-4">{t.status}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2270D4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};