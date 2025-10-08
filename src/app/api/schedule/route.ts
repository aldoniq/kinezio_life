import { NextResponse } from 'next/server';
import { generateSchedule } from '@/data/doctor';
import { appointmentDB } from '@/lib/database-supabase';

export async function GET() {
  try {
    // Получаем базовое расписание
    const baseSchedule = generateSchedule();
    
    // Получаем все активные записи
    const activeAppointments = await appointmentDB.getActive();
    
    // Отмечаем занятые слоты как недоступные
    const scheduleWithAvailability = baseSchedule.map(day => ({
      ...day,
      timeSlots: day.timeSlots.map(slot => {
        // Проверяем, есть ли запись на это время
        const isBooked = activeAppointments.some(apt => 
          apt.date === day.date && apt.time === slot.time
        );
        
        return {
          ...slot,
          available: day.available && !isBooked
        };
      })
    }));
    
    return NextResponse.json({ schedule: scheduleWithAvailability }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении расписания:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении расписания' },
      { status: 500 }
    );
  }
} 