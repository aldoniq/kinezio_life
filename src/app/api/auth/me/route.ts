import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { adminDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request.headers);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Получаем актуальную информацию о пользователе из БД
    const admin = adminDB.getByUsername(user.username);
    
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Пользователь не найден или деактивирован' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        fullName: admin.fullName,
        email: admin.email,
        lastLogin: admin.lastLogin
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 