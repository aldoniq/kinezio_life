import { NextRequest, NextResponse } from 'next/server';
import { Appointment } from '@/types';
import { appointmentDB } from '@/lib/database-supabase';
import { notifyNewAppointment, notifyCancelledAppointment } from '@/lib/telegram';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию (минимум роль viewer)
    const user = requireRole(request.headers, 'viewer');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 401 }
      );
    }

    const appointments = appointmentDB.getAll();
    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении записей:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении записей' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientName, patientPhone, patientEmail, date, time, serviceType, problemDescription } = body;

    // Валидация
    if (!patientName || !patientPhone || !date || !time || !serviceType) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      );
    }

    // Проверка, не занято ли время
    if (appointmentDB.isTimeSlotBooked(date, time)) {
      return NextResponse.json(
        { error: 'Данное время уже занято' },
        { status: 409 }
      );
    }

    // Создание новой записи
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientName,
      patientPhone,
      patientEmail: patientEmail || undefined,
      date,
      time,
      serviceType,
      problemDescription: problemDescription || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Сохранение в базу данных
    const saved = appointmentDB.create(newAppointment);
    
    if (!saved) {
      return NextResponse.json(
        { error: 'Ошибка при сохранении записи в базу данных' },
        { status: 500 }
      );
    }

    // Отправка уведомления в Telegram (не блокируем ответ если не получится)
    notifyNewAppointment(newAppointment).catch(error => {
      console.error('Ошибка при отправке уведомления в Telegram:', error);
    });

    return NextResponse.json(
      { 
        message: 'Запись успешно создана',
        appointment: newAppointment 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании записи' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Проверяем авторизацию (минимум роль admin)
    const user = requireRole(request.headers, 'admin');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, patientAttended, doctorNotes, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID записи не указан' },
        { status: 400 }
      );
    }

    const appointment = appointmentDB.getById(id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    // Обновляем запись
    const updateData: Partial<Appointment> = {};
    
    if (patientAttended !== undefined) {
      updateData.patientAttended = patientAttended;
      updateData.completedAt = new Date().toISOString();
    }
    
    if (doctorNotes !== undefined) {
      updateData.doctorNotes = doctorNotes;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }

    const updated = appointmentDB.update(id, updateData);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Ошибка при обновлении записи' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Запись обновлена', appointment: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при обновлении записи:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении записи' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем авторизацию (минимум роль admin)
    const user = requireRole(request.headers, 'admin');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'ID записи не указан' },
        { status: 400 }
      );
    }

    const appointment = appointmentDB.getById(appointmentId);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    // Отмечаем как отмененную
    const updated = appointmentDB.updateStatus(appointmentId, 'cancelled');
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Ошибка при отмене записи' },
        { status: 500 }
      );
    }

    // Отправка уведомления об отмене в Telegram
    const updatedAppointment = { ...appointment, status: 'cancelled' as const };
    notifyCancelledAppointment(updatedAppointment).catch(error => {
      console.error('Ошибка при отправке уведомления об отмене в Telegram:', error);
    });

    return NextResponse.json(
      { message: 'Запись отменена' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при отмене записи:', error);
    return NextResponse.json(
      { error: 'Ошибка при отмене записи' },
      { status: 500 }
    );
  }
} 