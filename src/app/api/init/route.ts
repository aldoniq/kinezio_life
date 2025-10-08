import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database-supabase';

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'База данных инициализирована' }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    return NextResponse.json(
      { error: 'Ошибка при инициализации базы данных' },
      { status: 500 }
    );
  }
}
