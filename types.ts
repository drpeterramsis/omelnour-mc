export enum UserRole {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
  DOCTOR = 'DOCTOR'
}

export interface Permissions {
  can_manage_doctors: boolean;
  can_manage_schedules: boolean;
  can_manage_appointments: boolean;
  can_manage_exceptions: boolean;
  can_manage_clinics: boolean;
  can_view_admin_panel: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  permissions: Permissions;
}

export interface Specialty {
  id: string;
  title: string;
}

export interface Clinic {
  id: string;
  name: string;
  location: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialty_id: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface Schedule {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // "09:00"
  end_time: string;   // "17:00"
}

export interface Exception {
  id: string;
  doctor_id: string;
  date: string; // ISO Date "2023-10-25"
  reason: string;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Appointment {
  id: string;
  doctor_id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  date: string; // ISO Date
  time: string; // "10:30"
  status: AppointmentStatus;
  notes?: string;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, Permissions> = {
  [UserRole.ADMIN]: {
    can_manage_doctors: true,
    can_manage_schedules: true,
    can_manage_appointments: true,
    can_manage_exceptions: true,
    can_manage_clinics: true,
    can_view_admin_panel: true,
  },
  [UserRole.RECEPTION]: {
    can_manage_doctors: false,
    can_manage_schedules: false,
    can_manage_appointments: true,
    can_manage_exceptions: true,
    can_manage_clinics: false,
    can_view_admin_panel: false,
  },
  [UserRole.DOCTOR]: {
    can_manage_doctors: false,
    can_manage_schedules: false,
    can_manage_appointments: true, // Own appointments
    can_manage_exceptions: true, // Own exceptions
    can_manage_clinics: false,
    can_view_admin_panel: false,
  }
};