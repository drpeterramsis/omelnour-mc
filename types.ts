export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  USER = 'USER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ScheduleSlot {
  day: string; // e.g., "Monday"
  startTime: string; // "09:00"
  endTime: string; // "14:00"
  isException?: boolean;
  isCancelled?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photoUrl?: string;
  schedule: ScheduleSlot[];
  isActive: boolean;
}

export interface AppState {
  currentUser: User | null;
  doctors: Doctor[];
  users: User[];
}