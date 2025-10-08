# Настройка Supabase для Kinezio Life

## 🚀 Быстрая настройка

### 1. Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com/)
2. Зарегистрируйтесь или войдите в аккаунт
3. Нажмите "New Project"
4. Выберите организацию и введите название проекта: `kinezio_life`
5. Создайте пароль для базы данных
6. Выберите регион (ближайший к вам)
7. Нажмите "Create new project"

### 2. Получение ключей API

1. В Dashboard проекта перейдите в **Settings** → **API**
2. Скопируйте следующие значения:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### 3. Создание таблиц

1. В Dashboard перейдите в **SQL Editor**
2. Скопируйте и выполните содержимое файла `supabase-schema.sql`:

```sql
-- Создание таблицы записей
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

-- Создание таблицы админов
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
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
```

### 4. Настройка переменных окружения

#### Для Vercel:
1. В Vercel Dashboard → Settings → Environment Variables
2. Добавьте следующие переменные:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Для локальной разработки:
Создайте файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Инициализация базы данных

После развертывания приложения выполните:

```bash
curl -X POST https://your-app.vercel.app/api/init
```

Это создаст начальных админов:
- **superadmin** / super123 (супер админ)
- **admin** / admin123 (админ)  
- **viewer** / viewer123 (просмотрщик)

## 🔧 Управление данными

### Просмотр данных
- В Supabase Dashboard → **Table Editor** вы можете просматривать и редактировать данные

### Резервное копирование
- В Supabase Dashboard → **Settings** → **Database** → **Backups**

### Мониторинг
- В Supabase Dashboard → **Logs** для просмотра логов
- **Database** → **Usage** для мониторинга использования

## 🚨 Безопасность

### Row Level Security (RLS)
Для дополнительной безопасности рекомендуется включить RLS:

```sql
-- Включение RLS для таблиц
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Политики для appointments (только админы могут видеть все записи)
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update appointments" ON appointments
  FOR UPDATE USING (true);

-- Политики для admins (только супер админы могут управлять админами)
CREATE POLICY "Super admins can manage admins" ON admins
  FOR ALL USING (true);
```

## 📊 Мониторинг производительности

### Индексы
Созданы индексы для оптимизации запросов:
- `idx_appointments_date_time` - для поиска по дате и времени
- `idx_appointments_status` - для фильтрации по статусу
- `idx_admins_username` - для поиска по username
- `idx_admins_email` - для поиска по email
- `idx_admins_active` - для фильтрации активных админов

### Аналитика
В Supabase Dashboard → **Analytics** вы можете отслеживать:
- Количество запросов
- Время ответа
- Использование ресурсов

## 🔄 Миграция данных

Если у вас есть данные в SQLite, используйте этот скрипт для миграции:

```javascript
// Скрипт миграции данных из SQLite в Supabase
import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Миграция записей
const db = new Database('appointments.db');
const appointments = db.prepare('SELECT * FROM appointments').all();

for (const appointment of appointments) {
  await supabase.from('appointments').insert(appointment);
}

// Миграция админов
const admins = db.prepare('SELECT * FROM admins').all();

for (const admin of admins) {
  await supabase.from('admins').insert(admin);
}

console.log('Миграция завершена!');
```
