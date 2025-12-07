import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Doctor, Specialty } from '../types';
import { useLanguage } from '../App';

export const Doctors: React.FC = () => {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', specialty_id: '', start_date: '' });

  const loadData = async () => {
      const [docs, specs] = await Promise.all([
          db.doctors.getAll(),
          db.specialties.getAll()
      ]);
      setDoctors(docs);
      setSpecialties(specs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc: Doctor = {
        id: '', // DB generates
        user_id: '', // Optional linkage
        name: newDoc.name,
        specialty_id: newDoc.specialty_id,
        start_date: newDoc.start_date,
        is_active: true
    };
    await db.doctors.create(doc);
    await loadData();
    setIsModalOpen(false);
    setNewDoc({ name: '', specialty_id: '', start_date: '' });
  };

  const toggleStatus = async (doc: Doctor) => {
      await db.doctors.update({ ...doc, is_active: !doc.is_active });
      await loadData();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t.doctors}</h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
        >
            + {t.addDoctor}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doc => {
              const specTitle = specialties.find(s => s.id === doc.specialty_id)?.title || 'General';
              return (
                  <div key={doc.id} className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center border hover:border-primary transition-colors">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-2xl">👨‍⚕️</div>
                      <h3 className="text-xl font-bold text-gray-800">{doc.name}</h3>
                      <p className="text-primary font-medium mb-4">{specTitle}</p>
                      
                      <div className="w-full border-t pt-4 flex justify-between items-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${doc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {doc.is_active ? t.active : t.inactive}
                          </span>
                          <button 
                            onClick={() => toggleStatus(doc)}
                            className="text-sm text-gray-500 hover:text-primary underline"
                          >
                              {doc.is_active ? t.deactivate : t.activate}
                          </button>
                      </div>
                  </div>
              )
          })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-6">{t.addDoctor}</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.patientName}</label>
                        <input className="w-full border p-2 rounded" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} required placeholder="Dr. Name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.specialty}</label>
                        <select className="w-full border p-2 rounded" value={newDoc.specialty_id} onChange={e => setNewDoc({...newDoc, specialty_id: e.target.value})} required>
                            <option value="">Select...</option>
                            {specialties.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.startDate}</label>
                        <input type="date" className="w-full border p-2 rounded" value={newDoc.start_date} onChange={e => setNewDoc({...newDoc, start_date: e.target.value})} required />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t.cancelBtn}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700">{t.create}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};