import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/lib/database';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверяем учетные данные
    const admin = await adminDB.validateCredentials(username, password);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    // Создаем JWT токен
    const token = createToken(admin);

    // Создаем response с токеном в cookie
    const response = NextResponse.json(
      { 
        message: 'Авторизация успешна',
        user: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          fullName: admin.fullName
        }
      },
      { status: 200 }
    );

    // Устанавливаем httpOnly cookie для безопасности
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 часа
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 