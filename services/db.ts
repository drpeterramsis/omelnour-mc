import { supabase } from './supabaseClient';
import { 
  User, Doctor, Clinic, Schedule, Exception, Appointment, 
  UserRole, DEFAULT_PERMISSIONS, AppointmentStatus, Specialty 
} from '../types';

// --- MOCK DATA FOR OFFLINE/DEMO MODE ---
let isMockMode = false;

export const enableMockMode = () => {
  console.log("⚠️ Enabling Mock/Offline Mode");
  isMockMode = true;
};

const MOCK_DATA = {
  users: [
    { id: 'mock-admin', name: 'Demo Admin', email: 'admin@demo.com', role: UserRole.ADMIN, is_active: true, permissions: DEFAULT_PERMISSIONS.ADMIN },
    { id: 'mock-doc-1', name: 'Dr. Sarah Wilson', email: 'sarah@demo.com', role: UserRole.DOCTOR, is_active: true, permissions: DEFAULT_PERMISSIONS.DOCTOR }
  ] as User[],
  specialties: [
    { id: 's1', title: 'General Medicine' },
    { id: 's2', title: 'Cardiology' },
    { id: 's3', title: 'Pediatrics' },
    { id: 's4', title: 'Dermatology' }
  ] as Specialty[],
  clinics: [
    { id: 'c1', name: 'Main Branch', location: 'Building A, Floor 1' },
    { id: 'c2', name: 'Specialty Center', location: 'Building B, Floor 2' }
  ] as Clinic[],
  doctors: [
    { id: 'd1', user_id: 'mock-doc-1', name: 'Dr. Sarah Wilson', specialty_id: 's3', start_date: '2023-01-01', is_active: true },
    { id: 'd2', user_id: 'mock-doc-2', name: 'Dr. Ahmed Ali', specialty_id: 's2', start_date: '2022-05-15', is_active: true },
    { id: 'd3', user_id: 'mock-doc-3', name: 'Dr. Emily Chen', specialty_id: 's1', start_date: '2023-08-20', is_active: true }
  ] as Doctor[],
  schedules: [
    { id: 'sch1', doctor_id: 'd1', clinic_id: 'c1', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
    { id: 'sch2', doctor_id: 'd2', clinic_id: 'c2', day_of_week: 2, start_time: '10:00', end_time: '18:00' }
  ] as Schedule[],
  appointments: [
    { id: 'a1', doctor_id: 'd1', clinic_id: 'c1', patient_name: 'John Doe', patient_phone: '555-0123', date: new Date().toISOString().split('T')[0], time: '09:30', status: AppointmentStatus.CONFIRMED, notes: 'Regular checkup' },
    { id: 'a2', doctor_id: 'd2', clinic_id: 'c2', patient_name: 'Jane Smith', patient_phone: '555-0199', date: new Date().toISOString().split('T')[0], time: '14:00', status: AppointmentStatus.PENDING, notes: 'Heart consultation' },
    { id: 'a3', doctor_id: 'd1', clinic_id: 'c1', patient_name: 'Michael Brown', patient_phone: '555-0144', date: '2023-12-25', time: '11:00', status: AppointmentStatus.COMPLETED, notes: 'Follow up' }
  ] as Appointment[],
  exceptions: [] as Exception[]
};

// Helper to handle DB calls safely
async function safeDbCall<T>(
  operation: () => Promise<{ data: any; error: any }>, 
  fallback: T
): Promise<T> {
  if (isMockMode) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));
    return fallback;
  }
  try {
    const { data, error } = await operation();
    if (error) {
      console.warn("Supabase Error (Switching to Mock Data for this call):", error.message);
      return fallback;
    }
    return (data as T) || fallback;
  } catch (e) {
    console.warn("Network/Logic Error (Switching to Mock Data):", e);
    return fallback;
  }
}

// Database Service Object
export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      return safeDbCall(
        () => supabase.from('profiles').select('*').order('name'),
        MOCK_DATA.users
      );
    },
    update: async (user: User) => {
      if (isMockMode) {
        const idx = MOCK_DATA.users.findIndex(u => u.id === user.id);
        if (idx !== -1) MOCK_DATA.users[idx] = user;
        return;
      }
      await supabase.from('profiles').update({
        name: user.name,
        permissions: user.permissions,
        role: user.role,
        is_active: user.is_active
      }).eq('id', user.id);
    },
    create: async (user: User) => {
      if (isMockMode) {
        MOCK_DATA.users.push(user);
        return;
      }
      await supabase.from('profiles').insert(user);
    },
    resetPassword: async (userId: string, newPass: string) => {
      if (isMockMode) return;
      const { error } = await supabase.rpc('admin_reset_password', { 
        target_user_id: userId, 
        new_password: newPass 
      });
      if (error) throw error;
    },
    resetAllPasswords: async (newPass: string) => {
      if (isMockMode) return;
      const { error } = await supabase.rpc('admin_reset_all_passwords', {
        new_password: newPass
      });
      if (error) throw error;
    }
  },
  specialties: {
    getAll: async (): Promise<Specialty[]> => {
      return safeDbCall(
        () => supabase.from('specialties').select('*'),
        MOCK_DATA.specialties
      );
    }
  },
  doctors: {
    getAll: async (): Promise<Doctor[]> => {
      return safeDbCall(
        () => supabase.from('doctors').select('*'),
        MOCK_DATA.doctors
      );
    },
    create: async (doc: Doctor) => {
      if (isMockMode) {
        MOCK_DATA.doctors.push({ ...doc, id: `mock-doc-${Date.now()}` });
        return;
      }
      const { id, ...rest } = doc;
      await supabase.from('doctors').insert(rest);
    },
    update: async (doc: Doctor) => {
      if (isMockMode) {
        const idx = MOCK_DATA.doctors.findIndex(d => d.id === doc.id);
        if (idx !== -1) MOCK_DATA.doctors[idx] = doc;
        return;
      }
      await supabase.from('doctors').update(doc).eq('id', doc.id);
    }
  },
  clinics: {
    getAll: async (): Promise<Clinic[]> => {
      return safeDbCall(
        () => supabase.from('clinics').select('*'),
        MOCK_DATA.clinics
      );
    },
    create: async (clinic: Clinic) => {
        if (isMockMode) {
            MOCK_DATA.clinics.push({ ...clinic, id: `mock-c-${Date.now()}` });
            return;
        }
        const { id, ...rest } = clinic;
        await supabase.from('clinics').insert(rest);
    }
  },
  schedules: {
    getAll: async (): Promise<Schedule[]> => {
      return safeDbCall(
        () => supabase.from('schedules').select('*'),
        MOCK_DATA.schedules
      );
    },
    create: async (schedule: Schedule) => {
      if (isMockMode) {
          MOCK_DATA.schedules.push({ ...schedule, id: `mock-s-${Date.now()}` });
          return;
      }
      const { id, ...rest } = schedule;
      await supabase.from('schedules').insert(rest);
    },
    delete: async (id: string) => {
        if (isMockMode) {
            MOCK_DATA.schedules = MOCK_DATA.schedules.filter(s => s.id !== id);
            return;
        }
        await supabase.from('schedules').delete().eq('id', id);
    }
  },
  exceptions: {
    getAll: async (): Promise<Exception[]> => {
      return safeDbCall(
        () => supabase.from('doctor_exceptions').select('*'),
        MOCK_DATA.exceptions
      );
    },
    create: async (exc: Exception) => {
      if (isMockMode) {
          MOCK_DATA.exceptions.push({ ...exc, id: `mock-e-${Date.now()}` });
          return;
      }
      const { id, ...rest } = exc;
      await supabase.from('doctor_exceptions').insert(rest);
    }
  },
  appointments: {
    getAll: async (): Promise<Appointment[]> => {
      return safeDbCall(
        () => supabase.from('appointments').select('*'),
        MOCK_DATA.appointments
      );
    },
    create: async (apt: Appointment) => {
      if (isMockMode) {
          MOCK_DATA.appointments.push({ ...apt, id: `mock-a-${Date.now()}` });
          return;
      }
      const { id, ...rest } = apt;
      await supabase.from('appointments').insert(rest);
    },
    update: async (apt: Appointment) => {
        if (isMockMode) {
            const idx = MOCK_DATA.appointments.findIndex(a => a.id === apt.id);
            if (idx !== -1) MOCK_DATA.appointments[idx] = apt;
            return;
        }
        await supabase.from('appointments').update({
            status: apt.status,
            notes: apt.notes
        }).eq('id', apt.id);
    }
  }
};