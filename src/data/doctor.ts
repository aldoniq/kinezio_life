import { Doctor, ServiceType, AppointmentDate } from '@/types';

export const serviceTypes: ServiceType[] = [
  {
    id: 'diagnosis',
    name: 'Диагностика',
    description: 'Функциональная диагностика движений и постуры',
    duration: 15,
    price: 5000, // 25 000 ₸
    icon: '🔍'
  },
  {
    id: 'treatment',
    name: 'Кинезиотерапия',
    description: 'Лечебная физкультура и коррекция движений',
    duration: 120,
    price: 20000, // 100 000 ₸
    icon: '🏃‍♂️'
  }
];

export const doctorInfo: Doctor = {
  id: 'doc-1',
  name: 'Доктор Сайлаубек Елжас',
  specialization: 'Кинезиолог',
  description: 'Специалист по восстановлению двигательных функций и коррекции осанки. Помогаю людям вернуть здоровье через правильное движение и персональные программы реабилитации.',
  photo: '/doctor-yelzhas.jpeg',
  experience: 12,
  education: [
    'Казахская академия спорта и туризма',
    'Специализация по кинезиологии и биомеханике',
    'Сертификат по функциональному тестированию',
    'Курсы повышения квалификации по реабилитации'
  ],
  rating: 4.9,
  reviewsCount: 183
};

// Генерация расписания на ближайшие 14 дней
export const generateSchedule = (): AppointmentDate[] => {
  const schedule: AppointmentDate[] = [];
  const today = new Date();
  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  // Рабочие часы: 9:00 - 19:00, каждые 2 часа
  const timeSlots = [
    '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'
  ];

  for (let i = 1; i <= 14; i++) { // Начинаем с завтра
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Воскресенье или суббота
    
    schedule.push({
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek: daysOfWeek[dayOfWeek],
      dayNumber: currentDate.getDate(),
      available: !isWeekend,
      timeSlots: timeSlots.map((time) => ({
        id: `${currentDate.toISOString().split('T')[0]}-${time}`,
        time,
        available: !isWeekend, // Все слоты доступны по умолчанию, но будут проверяться через API
      })),
    });
  }
  
  return schedule;
}; 