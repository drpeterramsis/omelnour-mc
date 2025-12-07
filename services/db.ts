import { supabase } from './supabaseClient';
import { 
  User, Doctor, Clinic, Schedule, Exception, Appointment, 
  UserRole, DEFAULT_PERMISSIONS, AppointmentStatus, Specialty 
} from '../types';

// Database Service Object (Now Async)
export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      const { data } = await supabase.from('profiles').select('*');
      return (data as User[]) || [];
    },
    update: async (user: User) => {
      await supabase.from('profiles').update({
        permissions: user.permissions,
        role: user.role,
        is_active: user.is_active
      }).eq('id', user.id);
    },
    // Note: Creating a user usually requires Auth signup. 
    // This helper is for the admin panel to insert a profile record if auth exists.
    create: async (user: User) => {
      await supabase.from('profiles').insert(user);
    }
  },
  specialties: {
    getAll: async (): Promise<Specialty[]> => {
      const { data } = await supabase.from('specialties').select('*');
      return (data as Specialty[]) || [];
    }
  },
  doctors: {
    getAll: async (): Promise<Doctor[]> => {
      const { data } = await supabase.from('doctors').select('*');
      return (data as Doctor[]) || [];
    },
    create: async (doc: Doctor) => {
      // Remove ID to let DB generate UUID
      const { id, ...rest } = doc;
      await supabase.from('doctors').insert(rest);
    },
    update: async (doc: Doctor) => {
       await supabase.from('doctors').update(doc).eq('id', doc.id);
    }
  },
  clinics: {
    getAll: async (): Promise<Clinic[]> => {
      const { data } = await supabase.from('clinics').select('*');
      return (data as Clinic[]) || [];
    },
    create: async (clinic: Clinic) => {
        const { id, ...rest } = clinic;
        await supabase.from('clinics').insert(rest);
    }
  },
  schedules: {
    getAll: async (): Promise<Schedule[]> => {
      const { data } = await supabase.from('schedules').select('*');
      return (data as Schedule[]) || [];
    },
    create: async (schedule: Schedule) => {
      const { id, ...rest } = schedule;
      await supabase.from('schedules').insert(rest);
    },
    delete: async (id: string) => {
        await supabase.from('schedules').delete().eq('id', id);
    }
  },
  exceptions: {
    getAll: async (): Promise<Exception[]> => {
      const { data } = await supabase.from('doctor_exceptions').select('*');
      return (data as Exception[]) || []; 
    },
    create: async (exc: Exception) => {
      const { id, ...rest } = exc;
      await supabase.from('doctor_exceptions').insert(rest);
    }
  },
  appointments: {
    getAll: async (): Promise<Appointment[]> => {
      const { data } = await supabase.from('appointments').select('*');
      return (data as Appointment[]) || [];
    },
    create: async (apt: Appointment) => {
      const { id, ...rest } = apt;
      await supabase.from('appointments').insert(rest);
    },
    update: async (apt: Appointment) => {
        await supabase.from('appointments').update({
            status: apt.status,
            notes: apt.notes
        }).eq('id', apt.id);
    }
  }
};