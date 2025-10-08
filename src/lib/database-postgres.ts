import { sql } from '@vercel/postgres';
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
    // Создание таблицы записей
    await sql`
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
      )
    `;

    // Создание таблицы админов
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        full_name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login TEXT
      )
    `;

    // Создание начальных админов
    await createInitialAdmins();
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
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
  async getAll(): Promise<Appointment[]> {
    const { rows } = await sql`SELECT * FROM appointments ORDER BY date, time`;
    return rows.map(mapDbToAppointment);
  },

  // Получить активные записи (не отмененные)
  async getActive(): Promise<Appointment[]> {
    const { rows } = await sql`SELECT * FROM appointments WHERE status != 'cancelled' ORDER BY date, time`;
    return rows.map(mapDbToAppointment);
  },

  // Получить запись по ID
  async getById(id: string): Promise<Appointment | null> {
    const { rows } = await sql`SELECT * FROM appointments WHERE id = ${id}`;
    return rows.length > 0 ? mapDbToAppointment(rows[0]) : null;
  },

  // Создать новую запись
  async create(appointment: Appointment): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      await sql`
        INSERT INTO appointments (
          id, patient_name, patient_phone, patient_email, date, time,
          service_id, service_name, service_description, service_duration, service_price, service_icon,
          problem_description, status, created_at, updated_at
        ) VALUES (
          ${appointment.id}, ${appointment.patientName}, ${appointment.patientPhone}, 
          ${appointment.patientEmail || null}, ${appointment.date}, ${appointment.time},
          ${appointment.serviceType.id}, ${appointment.serviceType.name}, ${appointment.serviceType.description},
          ${appointment.serviceType.duration}, ${appointment.serviceType.price}, ${appointment.serviceType.icon},
          ${appointment.problemDescription || null}, ${appointment.status}, ${appointment.createdAt}, ${now}
        )
      `;
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
      const result = await sql`UPDATE appointments SET status = ${status}, updated_at = ${now} WHERE id = ${id}`;
      return result.rowCount > 0;
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
      
      // Обновляем только переданные поля
      const fields = [];
      const values = [];
      
      if (updateData.patientAttended !== undefined) {
        fields.push('patient_attended = $' + (values.length + 1));
        values.push(updateData.patientAttended);
      }
      
      if (updateData.doctorNotes !== undefined) {
        fields.push('doctor_notes = $' + (values.length + 1));
        values.push(updateData.doctorNotes);
      }
      
      if (updateData.status !== undefined) {
        fields.push('status = $' + (values.length + 1));
        values.push(updateData.status);
      }
      
      if (updateData.completedAt !== undefined) {
        fields.push('completed_at = $' + (values.length + 1));
        values.push(updateData.completedAt);
      }
      
      if (fields.length === 0) return appointment;
      
      fields.push('updated_at = $' + (values.length + 1));
      values.push(now);
      values.push(id);
      
      const sqlQuery = `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${values.length}`;
      await sql.unsafe(sqlQuery, values);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Ошибка при обновлении записи:', error);
      return null;
    }
  },

  // Проверить, занято ли время
  async isTimeSlotBooked(date: string, time: string): Promise<boolean> {
    try {
      const { rows } = await sql`SELECT COUNT(*) as count FROM appointments WHERE date = ${date} AND time = ${time} AND status != 'cancelled'`;
      return parseInt(rows[0].count) > 0;
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
      
      await sql`
        INSERT INTO admins (username, email, password_hash, role, full_name, is_active, created_at, updated_at)
        VALUES (${username}, ${email}, ${passwordHash}, ${role}, ${fullName}, true, ${now}, ${now})
      `;
      return true;
    } catch (error) {
      console.error('Ошибка при создании админа:', error);
      return false;
    }
  },

  // Получить админа по username
  async getByUsername(username: string): Promise<AdminWithPassword | null> {
    const { rows } = await sql`SELECT * FROM admins WHERE username = ${username} AND is_active = true`;
    return rows.length > 0 ? mapDbToAdminWithPassword(rows[0]) : null;
  },

  // Получить админа по email
  async getByEmail(email: string): Promise<AdminWithPassword | null> {
    const { rows } = await sql`SELECT * FROM admins WHERE email = ${email} AND is_active = true`;
    return rows.length > 0 ? mapDbToAdminWithPassword(rows[0]) : null;
  },

  // Получить всех админов
  async getAll(): Promise<Admin[]> {
    const { rows } = await sql`SELECT id, username, email, role, full_name, is_active, created_at, last_login FROM admins ORDER BY created_at`;
    return rows.map(mapDbToAdmin);
  },

  // Обновить время последнего входа
  async updateLastLogin(id: number): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const result = await sql`UPDATE admins SET last_login = ${now}, updated_at = ${now} WHERE id = ${id}`;
      return result.rowCount > 0;
    } catch (error) {
      console.error('Ошибка при обновлении времени входа:', error);
      return false;
    }
  },

  // Активировать/деактивировать админа
  async updateStatus(id: number, isActive: boolean): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const result = await sql`UPDATE admins SET is_active = ${isActive}, updated_at = ${now} WHERE id = ${id}`;
      return result.rowCount > 0;
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
