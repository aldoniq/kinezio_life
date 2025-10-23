import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { Appointment } from '@/types';

// Типы для админов
export interface Admin {
  id: number;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AdminWithPassword extends Admin {
  passwordHash: string;
}

// Создание таблиц при первом запуске
export async function initializeDatabase() {
  try {
    console.log('Инициализация базы данных...');
    
    // Проверяем, существуют ли таблицы, пытаясь получить данные
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (appointmentsError) {
      console.error('Таблица appointments не найдена. Создайте таблицы в Supabase Dashboard → SQL Editor');
      console.error('Выполните SQL из файла supabase-schema.sql');
      return;
    }

    const { error: adminsError } = await supabase
      .from('admins')
      .select('id')
      .limit(1);
    
    if (adminsError) {
      console.error('Таблица admins не найдена. Создайте таблицы в Supabase Dashboard → SQL Editor');
      console.error('Выполните SQL из файла supabase-schema.sql');
      return;
    }

    console.log('Таблицы найдены, создание начальных админов...');
    
    // Создание начальных админов
    await createInitialAdmins();
    
    console.log('Инициализация завершена!');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}

// Функция для преобразования записи из БД в TypeScript объект
function mapDbToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    patientName: row.patient_name as string,
    patientPhone: row.patient_phone as string,
    date: row.date as string,
    time: row.time as string,
    serviceType: {
      id: row.service_id as string,
      name: row.service_name as string,
      description: row.service_description as string,
      duration: row.service_duration as number,
      price: row.service_price as number,
      icon: row.service_icon as string
    },
    problemDescription: (row.problem_description as string) || undefined,
    status: row.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    createdAt: row.created_at as string,
    patientAttended: row.patient_attended !== null ? Boolean(row.patient_attended) : undefined,
    doctorNotes: (row.doctor_notes as string) || undefined,
    completedAt: (row.completed_at as string) || undefined
  };
}

// Функция для преобразования админа из БД в TypeScript объект
function mapDbToAdmin(row: Record<string, unknown>): Admin {
  return {
    id: row.id as number,
    username: row.username as string,
    email: row.email as string,
    role: row.role as 'super_admin' | 'admin' | 'viewer',
    fullName: row.full_name as string,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastLogin: (row.last_login as string) || undefined
  };
}

function mapDbToAdminWithPassword(row: Record<string, unknown>): AdminWithPassword {
  return {
    ...mapDbToAdmin(row),
    passwordHash: row.password_hash as string
  };
}

export const appointmentDB = {
  // Получить все записи
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Ошибка при получении записей:', error);
      return [];
    }
    
    return data.map(mapDbToAppointment);
  },

  // Получить активные записи (не отмененные)
  async getActive(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Ошибка при получении активных записей:', error);
      return [];
    }
    
    return data.map(mapDbToAppointment);
  },

  // Получить запись по ID
  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return mapDbToAppointment(data);
  },

  // Создать новую запись
  async create(appointment: Appointment): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('appointments')
        .insert({
          id: appointment.id,
          patient_name: appointment.patientName,
          patient_phone: appointment.patientPhone,
          date: appointment.date,
          time: appointment.time,
          service_id: appointment.serviceType.id,
          service_name: appointment.serviceType.name,
          service_description: appointment.serviceType.description,
          service_duration: appointment.serviceType.duration,
          service_price: appointment.serviceType.price,
          service_icon: appointment.serviceType.icon,
          problem_description: appointment.problemDescription || null,
          status: appointment.status,
          created_at: appointment.createdAt,
          updated_at: now
        });
      
      if (error) {
        console.error('Ошибка при создании записи:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при создании записи:', error);
      return false;
    }
  },

  // Обновить статус записи
  async updateStatus(id: string, status: Appointment['status']): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('appointments')
        .update({ status, updated_at: now })
        .eq('id', id);
      
      if (error) {
        console.error('Ошибка при обновлении статуса:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      return false;
    }
  },

  // Обновить запись (универсальный метод)
  async update(id: string, updateData: Partial<Appointment>): Promise<Appointment | null> {
    try {
      const appointment = await this.getById(id);
      if (!appointment) return null;

      const now = new Date().toISOString();
      const updateFields: Record<string, unknown> = { updated_at: now };
      
      if (updateData.patientAttended !== undefined) {
        updateFields.patient_attended = updateData.patientAttended;
      }
      
      if (updateData.doctorNotes !== undefined) {
        updateFields.doctor_notes = updateData.doctorNotes;
      }
      
      if (updateData.status !== undefined) {
        updateFields.status = updateData.status;
      }
      
      if (updateData.completedAt !== undefined) {
        updateFields.completed_at = updateData.completedAt;
      }
      
      const { error } = await supabase
        .from('appointments')
        .update(updateFields)
        .eq('id', id);
      
      if (error) {
        console.error('Ошибка при обновлении записи:', error);
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Ошибка при обновлении записи:', error);
      return null;
    }
  },

  // Проверить, занято ли время
  async isTimeSlotBooked(date: string, time: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', date)
        .eq('time', time)
        .neq('status', 'cancelled');
      
      if (error) {
        console.error('Ошибка при проверке времени:', error);
        return false;
      }
      
      return data.length > 0;
    } catch (error) {
      console.error('Ошибка при проверке времени:', error);
      return false;
    }
  }
};

export const adminDB = {
  // Создать нового админа
  async create(username: string, email: string, password: string, role: Admin['role'], fullName: string): Promise<boolean> {
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('admins')
        .insert({
          username,
          email,
          password_hash: passwordHash,
          role,
          full_name: fullName,
          is_active: true,
          created_at: now,
          updated_at: now
        });
      
      if (error) {
        console.error('Ошибка при создании админа:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при создании админа:', error);
      return false;
    }
  },

  // Получить админа по username
  async getByUsername(username: string): Promise<AdminWithPassword | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return mapDbToAdminWithPassword(data);
  },

  // Получить админа по email
  async getByEmail(email: string): Promise<AdminWithPassword | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return mapDbToAdminWithPassword(data);
  },

  // Получить всех админов
  async getAll(): Promise<Admin[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, email, role, full_name, is_active, created_at, last_login')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Ошибка при получении админов:', error);
      return [];
    }
    
    return data.map(mapDbToAdmin);
  },

  // Обновить время последнего входа
  async updateLastLogin(id: number): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('admins')
        .update({ last_login: now, updated_at: now })
        .eq('id', id);
      
      if (error) {
        console.error('Ошибка при обновлении времени входа:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении времени входа:', error);
      return false;
    }
  },

  // Активировать/деактивировать админа
  async updateStatus(id: number, isActive: boolean): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('admins')
        .update({ is_active: isActive, updated_at: now })
        .eq('id', id);
      
      if (error) {
        console.error('Ошибка при обновлении статуса админа:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении статуса админа:', error);
      return false;
    }
  },

  // Проверить учетные данные
  async validateCredentials(username: string, password: string): Promise<Admin | null> {
    try {
      const admin = await this.getByUsername(username);
      if (!admin || !admin.isActive) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      // Обновляем время последнего входа
      await this.updateLastLogin(admin.id);

      // Возвращаем админа без пароля
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    } catch (error) {
      console.error('Ошибка при проверке учетных данных:', error);
      return null;
    }
  }
};

// Функция для создания начальных админов
export async function createInitialAdmins(): Promise<void> {
  try {
    const existingAdmins = await adminDB.getAll();
    
    if (existingAdmins.length === 0) {
      console.log('Создание начальных админов...');
      
      // Супер админ
      await adminDB.create(
        'superadmin',
        'super@kinezio.kz',
        'super123',
        'super_admin',
        'Супер Администратор'
      );

      // Обычный админ
      await adminDB.create(
        'admin',
        'admin@kinezio.kz',
        'admin123',
        'admin',
        'Администратор'
      );

      // Просмотрщик
      await adminDB.create(
        'viewer',
        'viewer@kinezio.kz',
        'viewer123',
        'viewer',
        'Просмотрщик'
      );

      console.log('Начальные админы созданы:');
      console.log('- superadmin / super123 (супер админ)');
      console.log('- admin / admin123 (админ)');
      console.log('- viewer / viewer123 (просмотрщик)');
    }
  } catch (error) {
    console.error('Ошибка при создании начальных админов:', error);
  }
}
