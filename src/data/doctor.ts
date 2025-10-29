import { Doctor, ServiceType, AppointmentDate } from '@/types';

export const serviceTypes: ServiceType[] = [
  {
    id: 'diagnosis',
    name: 'Диагностика',
    description: 'Функциональная диагностика опорно-двигательного аппарата, паттернов движений',
    duration: 30,
    price: 5000,
    icon: '🔍'
  },
  {
    id: 'treatment',
    name: 'Лечение',
    description: 'Постреабилитация, коррекция организма',
    duration: 90,
    price: 20000,
    icon: '🏃‍♂️'
  }
];

export const doctorInfo: Doctor = {
  id: 'doc-1',
  name: 'Елжас Ерланулы',
  specialization: 'Врач реабилитолог-кинезиолог',
  description: 'Специалист по восстановлению двигательных функций и коррекции осанки. Помогаю людям вернуть здоровье через правильное движение и персональные программы реабилитации.',
  photo: '/doctor-yelzhas.jpeg',
  experience: 5,
  education: [
    'Медицинский университет Астана',
    'Римский университет Ла Сапиенца',
    'Сертификат от Казахстанская Ассоциация Кинезиологов',
    'Сертификат от Международной Ассоциации Катастрофической медицины',
    'Курсы по ЛФК'
  ],
  rating: 4.9,
  reviewsCount: 2500
};

// Генерация расписания на ближайшие 14 дней
export const generateSchedule = (): AppointmentDate[] => {
  const schedule: AppointmentDate[] = [];
  const today = new Date();
  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  // Рабочие часы: 9:00 - 21:00, каждые 2 часа
  const timeSlots = [
    '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'
  ];

  for (let i = 1; i <= 15; i++) { // Начинаем с завтра
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    const dayOfWeek = currentDate.getDay();
    // Теперь все дни доступны для записи
    const isAvailable = true;
    
    schedule.push({
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek: daysOfWeek[dayOfWeek],
      dayNumber: currentDate.getDate(),
      available: isAvailable,
      timeSlots: timeSlots.map((time) => ({
        id: `${currentDate.toISOString().split('T')[0]}-${time}`,
        time,
        available: isAvailable, // Все слоты доступны по умолчанию, но будут проверяться через API
      })),
    });
  }
  
  return schedule;
}; 