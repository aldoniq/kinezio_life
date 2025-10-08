import { NextResponse } from 'next/server';
import { doctorInfo, serviceTypes } from '@/data/doctor';

export async function GET() {
  try {
    return NextResponse.json({ 
      doctor: doctorInfo,
      services: serviceTypes 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении информации о враче' },
      { status: 500 }
    );
  }
} 