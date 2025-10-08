export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  description: string;
  photo: string;
  experience: number;
  education: string[];
  rating: number;
  reviewsCount: number;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  duration: number; // в минутах
  price: number;
  icon: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface AppointmentDate {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  available: boolean;
  timeSlots: TimeSlot[];
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  date: string;
  time: string;
  serviceType: ServiceType;
  problemDescription?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  // Новые поля для доктора
  patientAttended?: boolean; // пришел ли пациент
  doctorNotes?: string; // комментарии доктора
  completedAt?: string; // когда была завершена запись
}

export interface PatientInfo {
  name: string;
  phone: string;
  email?: string;
  problemDescription?: string;
} 