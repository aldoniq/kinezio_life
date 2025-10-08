import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Appointment, ServiceType } from '@/types';

const dbPath = path.join(process.cwd(), 'appointments.db');
const db = new Database(dbPath);

// Создание таблиц при первом запуске
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_description TEXT NOT NULL,
    service_duration INTEGER NOT NULL,
    service_price INTEGER NOT NULL,
    service_icon TEXT NOT NULL,
    problem_description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    patient_attended BOOLEAN,
    doctor_notes TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    full_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT
  );
`);

// Подготовленные запросы для записей
const insertAppointment = db.prepare(`
  INSERT INTO appointments (
    id, patient_name, patient_phone, patient_email, date, time,
    service_id, service_name, service_description, service_duration, service_price, service_icon,
    problem_description, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getAllAppointments = db.prepare('SELECT * FROM appointments ORDER BY date, time');
const getActiveAppointments = db.prepare('SELECT * FROM appointments WHERE status != ? ORDER BY date, time');
const getAppointmentById = db.prepare('SELECT * FROM appointments WHERE id = ?');
const updateAppointmentStatus = db.prepare('UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?');
const checkTimeSlot = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE date = ? AND time = ? AND status != ?');

// Подготовленные запросы для админов
const insertAdmin = db.prepare(`
  INSERT INTO admins (username, email, password_hash, role, full_name, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const getAdminByUsername = db.prepare('SELECT * FROM admins WHERE username = ? AND is_active = 1');
const getAdminByEmail = db.prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1');
const getAllAdmins = db.prepare('SELECT id, username, email, role, full_name, is_active, created_at, last_login FROM admins ORDER BY created_at');
const updateAdminLastLogin = db.prepare('UPDATE admins SET last_login = ?, updated_at = ? WHERE id = ?');
const updateAdminStatus = db.prepare('UPDATE admins SET is_active = ?, updated_at = ? WHERE id = ?');

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

// Функция для преобразования записи из БД в TypeScript объект
function mapDbToAppointment(row: any): Appointment {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientEmail: row.patient_email || undefined,
    date: row.date,
    time: row.time,
    serviceType: {
      id: row.service_id,
      name: row.service_name,
      description: row.service_description,
      duration: row.service_duration,
      price: row.service_price,
      icon: row.service_icon
    },
    problemDescription: row.problem_description || undefined,
    status: row.status,
    createdAt: row.created_at,
    patientAttended: row.patient_attended !== null ? Boolean(row.patient_attended) : undefined,
    doctorNotes: row.doctor_notes || undefined,
    completedAt: row.completed_at || undefined
  };
}

// Функция для преобразования админа из БД в TypeScript объект
function mapDbToAdmin(row: any): Admin {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLogin: row.last_login || undefined
  };
}

function mapDbToAdminWithPassword(row: any): AdminWithPassword {
  return {
    ...mapDbToAdmin(row),
    passwordHash: row.password_hash
  };
}

export const appointmentDB = {
  // Получить все записи
  getAll(): Appointment[] {
    const rows = getAllAppointments.all();
    return rows.map(mapDbToAppointment);
  },

  // Получить активные записи (не отмененные)
  getActive(): Appointment[] {
    const rows = getActiveAppointments.all('cancelled');
    return rows.map(mapDbToAppointment);
  },

  // Получить запись по ID
  getById(id: string): Appointment | null {
    const row = getAppointmentById.get(id);
    return row ? mapDbToAppointment(row) : null;
  },

  // Создать новую запись
  create(appointment: Appointment): boolean {
    try {
      const now = new Date().toISOString();
      insertAppointment.run(
        appointment.id,
        appointment.patientName,
        appointment.patientPhone,
        appointment.patientEmail || null,
        appointment.date,
        appointment.time,
        appointment.serviceType.id,
        appointment.serviceType.name,
        appointment.serviceType.description,
        appointment.serviceType.duration,
        appointment.serviceType.price,
        appointment.serviceType.icon,
        appointment.problemDescription || null,
        appointment.status,
        appointment.createdAt,
        now
      );
      return true;
    } catch (error) {
      console.error('Ошибка при создании записи:', error);
      return false;
    }
  },

  // Обновить статус записи
  updateStatus(id: string, status: Appointment['status']): boolean {
    try {
      const now = new Date().toISOString();
      const result = updateAppointmentStatus.run(status, now, id);
      return result.changes > 0;
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      return false;
    }
  },

  // Обновить запись (универсальный метод)
  update(id: string, updateData: Partial<Appointment>): Appointment | null {
    try {
      const appointment = this.getById(id);
      if (!appointment) return null;

      const now = new Date().toISOString();
      
      // Обновляем только переданные поля
      const updatedAppointment = { ...appointment, ...updateData, updatedAt: now };
      
      // Подготавливаем SQL запрос динамически
      const fields = [];
      const values = [];
      
      if (updateData.patientAttended !== undefined) {
        fields.push('patient_attended = ?');
        values.push(updateData.patientAttended ? 1 : 0);
      }
      
      if (updateData.doctorNotes !== undefined) {
        fields.push('doctor_notes = ?');
        values.push(updateData.doctorNotes);
      }
      
      if (updateData.status !== undefined) {
        fields.push('status = ?');
        values.push(updateData.status);
      }
      
      if (updateData.completedAt !== undefined) {
        fields.push('completed_at = ?');
        values.push(updateData.completedAt);
      }
      
      if (fields.length === 0) return appointment; // Нечего обновлять
      
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id); // ID в конце для WHERE
      
      const sql = `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      
      return result.changes > 0 ? this.getById(id) : null;
    } catch (error) {
      console.error('Ошибка при обновлении записи:', error);
      return null;
    }
  },

  // Проверить, занято ли время
  isTimeSlotBooked(date: string, time: string): boolean {
    try {
      const result = checkTimeSlot.get(date, time, 'cancelled') as { count: number };
      return result.count > 0;
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
      
      insertAdmin.run(username, email, passwordHash, role, fullName, 1, now, now);
      return true;
    } catch (error) {
      console.error('Ошибка при создании админа:', error);
      return false;
    }
  },

  // Получить админа по username
  getByUsername(username: string): AdminWithPassword | null {
    const row = getAdminByUsername.get(username);
    return row ? mapDbToAdminWithPassword(row) : null;
  },

  // Получить админа по email
  getByEmail(email: string): AdminWithPassword | null {
    const row = getAdminByEmail.get(email);
    return row ? mapDbToAdminWithPassword(row) : null;
  },

  // Получить всех админов
  getAll(): Admin[] {
    const rows = getAllAdmins.all();
    return rows.map(mapDbToAdmin);
  },

  // Обновить время последнего входа
  updateLastLogin(id: number): boolean {
    try {
      const now = new Date().toISOString();
      const result = updateAdminLastLogin.run(now, now, id);
      return result.changes > 0;
    } catch (error) {
      console.error('Ошибка при обновлении времени входа:', error);
      return false;
    }
  },

  // Активировать/деактивировать админа
  updateStatus(id: number, isActive: boolean): boolean {
    try {
      const now = new Date().toISOString();
      const result = updateAdminStatus.run(isActive ? 1 : 0, now, id);
      return result.changes > 0;
    } catch (error) {
      console.error('Ошибка при обновлении статуса админа:', error);
      return false;
    }
  },

  // Проверить учетные данные
  async validateCredentials(username: string, password: string): Promise<Admin | null> {
    try {
      const admin = this.getByUsername(username);
      if (!admin || !admin.isActive) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      // Обновляем время последнего входа
      this.updateLastLogin(admin.id);

      // Возвращаем админа без пароля
      const { passwordHash, ...adminWithoutPassword } = admin;
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
    const existingAdmins = adminDB.getAll();
    
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

// Функция для закрытия подключения к БД (для graceful shutdown)
export function closeDatabase() {
  db.close();
}

// Создаем начальных админов при загрузке модуля
createInitialAdmins(); 