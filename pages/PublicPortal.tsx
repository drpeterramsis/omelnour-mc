import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Doctor, Clinic, Schedule, Specialty, Appointment, AppointmentStatus } from '../types';
import { useLanguage } from '../App';

export const PublicPortal: React.FC = () => {
  const { t, language } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Booking State
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const loadPublicData = async () => {
        const [d, c, s] = await Promise.all([
            db.doctors.getAll(),
            db.clinics.getAll(),
            db.specialties.getAll()
        ]);
        setDoctors(d.filter(doc => doc.is_active));
        setClinics(c);
        setSpecialties(s);
    };
    loadPublicData();
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty ? doc.specialty_id === selectedSpecialty : true;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookingStart = (doc: Doctor) => {
    setBookingDoctor(doc);
    setBookingDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
    setBookingSuccess(false);
  };

  const handleDateChange = async (date: string) => {
    setBookingDate(date);
    if (!bookingDoctor) return;

    // 1. Get Day of week (0=Sun, 1=Mon...)
    const dayOfWeek = new Date(date).getDay();
    
    // 2. Find Schedule (Async)
    const schedules = await db.schedules.getAll();
    const schedule = schedules.find(s => s.doctor_id === bookingDoctor.id && s.day_of_week === dayOfWeek);

    if (!schedule) {
      setAvailableSlots([]);
      return;
    }

    // 3. Generate Slots (Simplified logic: every 30 mins from start to end)
    const slots = [];
    let currentTime = schedule.start_time; 
    const endTime = schedule.end_time;     

    // Basic comparison loop
    while (currentTime < endTime) {
        slots.push(currentTime);
        // Add 30 mins
        const [h, m] = currentTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + 30);
        currentTime = d.toTimeString().slice(0, 5);
    }

    // 4. Filter out taken appointments
    const allApps = await db.appointments.getAll();
    const existingApps = allApps.filter(a => 
        a.doctor_id === bookingDoctor.id && 
        a.date === date && 
        a.status !== AppointmentStatus.CANCELLED
    );
    const takenTimes = existingApps.map(a => a.time);
    
    setAvailableSlots(slots.filter(s => !takenTimes.includes(s)));
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor || !selectedSlot) return;

    const allSchedules = await db.schedules.getAll();
    const schedules = allSchedules.filter(s => s.doctor_id === bookingDoctor.id);
    const clinicId = schedules.length > 0 ? schedules[0].clinic_id : (await db.clinics.getAll())[0]?.id;

    const newAppt: Appointment = {
      id: '', // Generated
      doctor_id: bookingDoctor.id,
      clinic_id: clinicId,
      date: bookingDate,
      time: selectedSlot,
      patient_name: patientName,
      patient_phone: patientPhone,
      status: AppointmentStatus.PENDING,
      notes: 'Booked via Public Portal'
    };

    await db.appointments.create(newAppt);
    setBookingSuccess(true);
    setPatientName('');
    setPatientPhone('');
  };

  return (
    <div className="space-y-16 pb-20 font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-20 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{t.heroTitle}</h1>
            <p className="text-xl text-blue-100 mb-10">{t.heroDesc}</p>
            
            <div className="bg-white p-2 rounded-lg shadow-lg flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
                <input 
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    className="flex-1 p-3 text-gray-800 outline-none rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                    className="p-3 text-gray-800 outline-none border-l bg-transparent"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                    <option value="">{t.allSpecialties}</option>
                    {specialties.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <button className="bg-medical text-white px-8 py-3 rounded font-bold hover:bg-red-700 transition">
                    {t.searchBtn}
                </button>
            </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800">{t.meetDoctors}</h2>
              <p className="text-gray-500 mt-2">{t.meetDoctorsDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDoctors.map(doc => {
                  const spec = specialties.find(s => s.id === doc.specialty_id)?.title;
                  return (
                      <div key={doc.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100 flex flex-col">
                          <div className="p-6 flex flex-col items-center text-center flex-1">
                              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">
                                  👨‍⚕️
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">{doc.name}</h3>
                              <p className="text-primary font-medium">{spec}</p>
                              {/* Note: Clinic location usually requires mapping schedule to clinic */}
                              <div className="mt-4 text-sm text-gray-500">
                                  {t.availableAt} <br/>
                                  {t.appTitle}
                              </div>
                          </div>
                          <div className="bg-gray-50 p-4 border-t">
                              <button 
                                onClick={() => handleBookingStart(doc)}
                                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                              >
                                  {t.bookNow}
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>
          {filteredDoctors.length === 0 && <p className="text-center text-gray-500">{t.noAppointments}</p>}
      </section>

      {/* Clinics Section */}
      <section id="clinics" className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800">{t.ourClinics}</h2>
                <p className="text-gray-500 mt-2">{t.clinicsDesc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clinics.map(clinic => (
                    <div key={clinic.id} className="bg-white p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-primary rounded-lg text-2xl">🏥</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{clinic.name}</h3>
                            <p className="text-gray-500">{clinic.location}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </section>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t.bookWith} {bookingDoctor.name}</h3>
                    <button onClick={() => setBookingDoctor(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="p-6">
                    {bookingSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2">{t.bookingRequested}</h4>
                            <p className="text-gray-600 mb-6">{t.bookingDesc}</p>
                            <button onClick={() => setBookingDoctor(null)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">{t.close}</button>
                        </div>
                    ) : (
                        <form onSubmit={submitBooking} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                                <input 
                                    type="date" 
                                    min={new Date().toISOString().split('T')[0]}
                                    value={bookingDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            {bookingDate && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.slotsAvailable}</label>
                                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-2 px-1 text-sm rounded border ${selectedSlot === slot ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:border-primary'}`}
                                            >
                                                {slot}
                                            </button>
                                        )) : (
                                            <p className="col-span-3 text-sm text-red-500 text-center py-2 bg-red-50 rounded">{t.noSlots}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedSlot && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.patientName}</label>
                                        <input 
                                            type="text" 
                                            value={patientName}
                                            onChange={e => setPatientName(e.target.value)}
                                            className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                                        <input 
                                            type="tel" 
                                            value={patientPhone}
                                            onChange={e => setPatientPhone(e.target.value)}
                                            className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    disabled={!selectedSlot}
                                    className="w-full bg-primary disabled:bg-gray-300 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    {t.confirmBooking}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};