import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/lib/database-supabase';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию (только супер админ)
    const user = requireRole(request.headers, 'super_admin');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для супер администраторов.' },
        { status: 403 }
      );
    }

    const users = await adminDB.getAll();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Проверяем авторизацию (только супер админ)
    const user = requireRole(request.headers, 'super_admin');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для супер администраторов.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (typeof userId !== 'number' || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь не пытается деактивировать сам себя
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Вы не можете изменить статус своего аккаунта' },
        { status: 400 }
      );
    }

    const updated = await adminDB.updateStatus(userId, isActive);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: isActive ? 'Пользователь активирован' : 'Пользователь деактивирован' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при обновлении статуса пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса пользователя' },
      { status: 500 }
    );
  }
} 