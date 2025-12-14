import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Doctor, Role, User, ScheduleSlot } from '../types';

const SUPABASE_URL = 'https://wvgjiuxcnwbufjeqjrql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2ppdXhjbndidWZqZXFqcnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzYyNDUsImV4cCI6MjA4MTI1MjI0NX0.Vn9AU0OVRJC5PmwOQZxoSltllCIzzTh2yiI7JB97LGo';

// Initial Seed Data
const SEED_USERS = [
  { email: 'admin@omelnour.com', name: 'المدير العام', role: Role.ADMIN },
  { email: 'doc1@omelnour.com', name: 'د. أحمد محمد', role: Role.DOCTOR },
  { email: 'recep@omelnour.com', name: 'مكتب الاستقبال', role: Role.RECEPTIONIST },
];

const SEED_DOCTORS = [
  {
    name: 'د. أحمد محمد',
    specialty: 'قلب وأوعية دموية',
    photo_url: 'https://picsum.photos/200/200?random=1',
    is_active: true,
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '14:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '14:00' },
      { day: 'Friday', startTime: '16:00', endTime: '20:00' },
    ],
  },
  {
    name: 'د. سارة علي',
    specialty: 'أطفال',
    photo_url: 'https://picsum.photos/200/200?random=2',
    is_active: true,
    schedule: [
      { day: 'Sunday', startTime: '10:00', endTime: '15:00' },
      { day: 'Tuesday', startTime: '10:00', endTime: '15:00' },
      { day: 'Thursday', startTime: '10:00', endTime: '15:00' },
    ],
  },
  {
    name: 'د. خالد عمر',
    specialty: 'عظام',
    photo_url: 'https://picsum.photos/200/200?random=3',
    is_active: true,
    schedule: [
      { day: 'Saturday', startTime: '12:00', endTime: '18:00' },
      { day: 'Tuesday', startTime: '18:00', endTime: '22:00' },
    ],
  },
];

export class DataService {
  private static instance: DataService;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private mapDoctorFromDB(doc: any): Doctor {
    return {
      id: doc.id.toString(),
      name: doc.name,
      specialty: doc.specialty,
      photoUrl: doc.photo_url || doc.photoUrl,
      schedule: doc.schedule || [],
      isActive: doc.is_active,
    };
  }

  private getFallbackDoctors(): Doctor[] {
    return SEED_DOCTORS.map((d, i) => ({
      ...this.mapDoctorFromDB({ ...d, id: `local-${i}` })
    }));
  }

  private getFallbackUsers(): User[] {
    return SEED_USERS.map((u, i) => ({ 
      id: `local-${i}`, 
      name: u.name, 
      email: u.email, 
      role: u.role 
    }));
  }

  async login(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        // Quietly fail for missing table or data not found
        const localUser = SEED_USERS.find(u => u.email === email);
        if (localUser) {
           console.log("Using local fallback user for login.");
           return { ...localUser, id: 'local-admin' };
        }
        console.error("Login failed:", error.message);
        return null;
      }
      
      if (!data) return null;
      
      return {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        role: data.role as Role
      };
    } catch (e) {
      const localUser = SEED_USERS.find(u => u.email === email);
      if (localUser) return { ...localUser, id: 'local-admin' };
      return null;
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    try {
      const { data, error } = await this.supabase.from('doctors').select('*');
      
      if (error) {
        if (error.code === 'PGRST205') {
            console.warn("Doctors table not found in Supabase. Using local demo data.");
        } else {
            console.error("Error fetching doctors:", error.message);
        }
        return this.getFallbackDoctors();
      }

      if (data && data.length > 0) {
        return data.map(this.mapDoctorFromDB);
      }

      // Try to seed if empty
      if (!data || data.length === 0) {
        console.log("Seeding doctors...");
        const { data: newDocs, error: insertError } = await this.supabase
          .from('doctors')
          .insert(SEED_DOCTORS)
          .select();
        
        if (insertError) {
             // If insert fails (likely due to missing table), return fallback
             if (insertError.code === 'PGRST205') {
                 console.warn("Doctors table not found (cannot seed). Using local demo data.");
             } else {
                 console.error("Seeding doctors failed:", insertError.message);
             }
             return this.getFallbackDoctors();
        }
        return (newDocs || []).map(this.mapDoctorFromDB);
      }

      return [];
    } catch (e) {
      console.error("Unexpected error in getDoctors:", e);
      return this.getFallbackDoctors();
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await this.supabase.from('users').select('*');
      
      if (error) {
         if (error.code === 'PGRST205') {
            console.warn("Users table not found in Supabase. Using local demo data.");
         } else {
            console.error("Error fetching users:", error.message);
         }
         return this.getFallbackUsers();
      }

      if (!data || data.length === 0) {
         console.log("Seeding users...");
         const { data: newUsers, error: insertError } = await this.supabase
          .from('users')
          .insert(SEED_USERS)
          .select();
          
          if (insertError) {
             if (insertError.code === 'PGRST205') {
                console.warn("Users table not found (cannot seed). Using local demo data.");
             } else {
                console.error("Seeding users failed:", insertError.message);
             }
             return this.getFallbackUsers();
          }
          return newUsers.map((u: any) => ({...u, id: u.id.toString()})) as User[];
      }

      return data.map((u: any) => ({...u, id: u.id.toString()})) as User[];
    } catch (e) {
      console.error("Unexpected error in getUsers:", e);
      return this.getFallbackUsers();
    }
  }

  async updateDoctorSchedule(doctorId: string, newSchedule: ScheduleSlot[]): Promise<Doctor> {
     if (doctorId.startsWith('local-')) {
         alert("Cannot update mock data. Please create tables in Supabase.");
         throw new Error("Cannot update local data");
     }

     const { data, error } = await this.supabase
      .from('doctors')
      .update({ schedule: newSchedule })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) {
        console.error("Update schedule error:", error.message);
        throw error;
    }
    return this.mapDoctorFromDB(data);
  }

  async toggleDoctorStatus(doctorId: string): Promise<Doctor> {
    if (doctorId.startsWith('local-')) {
         alert("Cannot update mock data. Please create tables in Supabase.");
         throw new Error("Cannot update local data");
    }

    const { data: current } = await this.supabase
      .from('doctors')
      .select('is_active')
      .eq('id', doctorId)
      .single();
      
    if (!current) throw new Error("Doctor not found");

    const { data, error } = await this.supabase
      .from('doctors')
      .update({ is_active: !current.is_active })
      .eq('id', doctorId)
      .select()
      .single();
      
    if (error) {
        console.error("Toggle status error:", error.message);
        throw error;
    }
    return this.mapDoctorFromDB(data);
  }

  async createUser(name: string, email: string, role: Role): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([{ name, email, role }])
      .select()
      .single();

    if (error) {
        console.error("Create user error:", error.message);
        throw error;
    }
    return { ...data, id: data.id.toString() } as User;
  }
}