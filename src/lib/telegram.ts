import TelegramBot from 'node-telegram-bot-api';
import { Appointment } from '@/types';

// Настройки бота
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

let bot: TelegramBot | null = null;

// Инициализация бота
function initBot() {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN не установлен');
    return null;
  }
  
  if (!bot) {
    bot = new TelegramBot(BOT_TOKEN, { polling: false });
  }
  
  return bot;
}

// Функция для отправки сообщения
async function sendMessage(message: string): Promise<boolean> {
  try {
    const telegramBot = initBot();
    
    if (!telegramBot || !CHAT_ID) {
      console.warn('Telegram бот не настроен');
      return false;
    }

    await telegramBot.sendMessage(CHAT_ID, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при отправке в Telegram:', error);
    return false;
  }
}

// Форматирование даты
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Функция для уведомления о новой записи
export async function notifyNewAppointment(appointment: Appointment): Promise<boolean> {
  const message = `
🆕 <b>Новая запись к врачу!</b>

👤 <b>Пациент:</b> ${appointment.patientName}
📞 <b>Телефон:</b> ${appointment.patientPhone}

🏥 <b>Услуга:</b> ${appointment.serviceType.name}
📝 <b>Описание:</b> ${appointment.serviceType.description}
⏱ <b>Длительность:</b> ${appointment.serviceType.duration} мин
💰 <b>Стоимость:</b> ${appointment.serviceType.price.toLocaleString('kk-KZ')} ₸

📅 <b>Дата:</b> ${formatDate(appointment.date)}
🕐 <b>Время:</b> ${appointment.time}

${appointment.problemDescription ? `💬 <b>Описание проблемы:</b>\n${appointment.problemDescription}\n` : ''}

📋 <b>ID записи:</b> ${appointment.id}
⏰ <b>Создано:</b> ${new Date(appointment.createdAt).toLocaleString('ru-RU')}
  `.trim();

  return await sendMessage(message);
}

// Функция для уведомления об отмене записи
export async function notifyCancelledAppointment(appointment: Appointment): Promise<boolean> {
  const message = `
❌ <b>Запись отменена</b>

👤 <b>Пациент:</b> ${appointment.patientName}
📞 <b>Телефон:</b> ${appointment.patientPhone}

🏥 <b>Услуга:</b> ${appointment.serviceType.name}
📅 <b>Дата:</b> ${formatDate(appointment.date)}
🕐 <b>Время:</b> ${appointment.time}

📋 <b>ID записи:</b> ${appointment.id}
  `.trim();

  return await sendMessage(message);
}

// Функция для отправки статистики
export async function notifyDailyStats(stats: {
  date: string;
  totalAppointments: number;
  newAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
}): Promise<boolean> {
  const message = `
📊 <b>Статистика за ${formatDate(stats.date)}</b>

📈 <b>Всего записей:</b> ${stats.totalAppointments}
🆕 <b>Новых записей:</b> ${stats.newAppointments}
❌ <b>Отменено:</b> ${stats.cancelledAppointments}
💰 <b>Общий доход:</b> ${stats.totalRevenue.toLocaleString('kk-KZ')} ₸
  `.trim();

  return await sendMessage(message);
}

// Функция для проверки настройки бота
export function isTelegramConfigured(): boolean {
  return !!(BOT_TOKEN && CHAT_ID);
} 