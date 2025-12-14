import { Doctor, Role, User, ScheduleSlot } from '../types';

// Mock Data
const MOCK_USERS: User[] = [
  { id: '1', email: 'admin@omelnour.com', name: 'المدير العام', role: Role.ADMIN },
  { id: '2', email: 'doc1@omelnour.com', name: 'د. أحمد محمد', role: Role.DOCTOR },
  { id: '3', email: 'recep@omelnour.com', name: 'مكتب الاستقبال', role: Role.RECEPTIONIST },
];

const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'د. أحمد محمد',
    specialty: 'قلب وأوعية دموية',
    photoUrl: 'https://picsum.photos/200/200?random=1',
    isActive: true,
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '14:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '14:00' },
      { day: 'Friday', startTime: '16:00', endTime: '20:00' },
    ],
  },
  {
    id: '2',
    name: 'د. سارة علي',
    specialty: 'أطفال',
    photoUrl: 'https://picsum.photos/200/200?random=2',
    isActive: true,
    schedule: [
      { day: 'Sunday', startTime: '10:00', endTime: '15:00' },
      { day: 'Tuesday', startTime: '10:00', endTime: '15:00' },
      { day: 'Thursday', startTime: '10:00', endTime: '15:00' },
    ],
  },
  {
    id: '3',
    name: 'د. خالد عمر',
    specialty: 'عظام',
    photoUrl: 'https://picsum.photos/200/200?random=3',
    isActive: true,
    schedule: [
      { day: 'Saturday', startTime: '12:00', endTime: '18:00' },
      { day: 'Tuesday', startTime: '18:00', endTime: '22:00' },
    ],
  },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class DataService {
  private static instance: DataService;
  private doctors: Doctor[] = [...MOCK_DOCTORS];
  private users: User[] = [...MOCK_USERS];

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async login(email: string): Promise<User | null> {
    await delay(500);
    const user = this.users.find(u => u.email === email);
    return user || null;
  }

  async getDoctors(): Promise<Doctor[]> {
    await delay(300);
    return [...this.doctors];
  }

  async getUsers(): Promise<User[]> {
    await delay(300);
    return [...this.users];
  }

  async updateDoctorSchedule(doctorId: string, newSchedule: ScheduleSlot[]): Promise<Doctor> {
    await delay(500);
    const idx = this.doctors.findIndex(d => d.id === doctorId);
    if (idx !== -1) {
      this.doctors[idx] = { ...this.doctors[idx], schedule: newSchedule };
      return this.doctors[idx];
    }
    throw new Error('Doctor not found');
  }

  async toggleDoctorStatus(doctorId: string): Promise<Doctor> {
    await delay(300);
    const idx = this.doctors.findIndex(d => d.id === doctorId);
    if (idx !== -1) {
      this.doctors[idx] = { ...this.doctors[idx], isActive: !this.doctors[idx].isActive };
      return this.doctors[idx];
    }
    throw new Error('Doctor not found');
  }

  async createUser(name: string, email: string, role: Role): Promise<User> {
    await delay(500);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role
    };
    this.users.push(newUser);
    return newUser;
  }
}