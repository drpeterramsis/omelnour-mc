export enum UserRole {
  ADMIN = 'admin',
  RECEPTIONIST = 'receptionist', // Acts as Employee/Staff
  DOCTOR = 'doctor',
  PATIENT = 'patient' // Implicit for non-logged in (Client)
}

export interface UserProfile {
  id: string; // uuid from auth.users
  email: string;
  role: UserRole;
  full_name?: string;
  created_at?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image_url?: string;
}

export interface Schedule {
  id: string;
  doctor_id: string;
  day_of_week: string; // "Monday", "Tuesday", etc.
  start_time: string; // "09:00"
  end_time: string; // "14:00"
  is_cancelled: boolean;
  notes?: string;
  doctor?: Doctor; // Joined fields
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppConfig {
  id: number;
  enable_client_signup: boolean;
}