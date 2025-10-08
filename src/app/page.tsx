'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Doctor, ServiceType } from '@/types';

export default function HomePage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    fetchDoctorInfo();
  }, []);

  const fetchDoctorInfo = async () => {
    try {
      const response = await fetch('/api/doctor');
      const data = await response.json();
      setDoctor(data.doctor);
      setServices(data.services);
    } catch (error) {
      console.error('Ошибка при загрузке информации о враче:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ошибка загрузки информации о враче</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900 text-center">
            {doctor.name}
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Doctor Profile Card */}
        <div className="card fade-in">
          <div className="text-center mb-6">
            <div 
              className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-xl cursor-pointer hover:border-blue-300 transition-all duration-300"
              onClick={() => setIsPhotoModalOpen(true)}
            >
              <img 
                src={doctor.photo} 
                alt={doctor.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {doctor.name}
            </h2>
            <p className="text-lg text-blue-600 font-semibold mb-3">
              {doctor.specialization}
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{doctor.experience}</div>
                <div>лет опыта</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  {doctor.rating}
                </div>
                <div>{doctor.reviewsCount} отзывов</div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700 text-center leading-relaxed">
            {doctor.description}
          </p>
        </div>

        {/* About Me Section */}
        <div className="card slide-up">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-sm">
              👨‍⚕️
            </span>
            Обо мне
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Я специализируюсь на восстановлении естественных движений и помогаю людям избавиться от боли через правильную биомеханику.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Использую современные методы диагностики и индивидуальный подход к каждому пациенту.
            </p>
          </div>
        </div>

        {/* Education */}
        <div className="card slide-up">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-sm">
              🎓
            </span>
            Образование и сертификаты
          </h3>
          <div className="space-y-3">
            {doctor.education.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="card slide-up">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-sm">
              🏥
            </span>
            Мои услуги
          </h3>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Продолжительность: {service.duration} мин
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                                         <p className="text-lg font-semibold text-blue-600 whitespace-nowrap">
                       {service.price.toLocaleString('kk-KZ')}&nbsp;₸
                     </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="card slide-up bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <div className="text-center">
            <h3 className="text-lg text-white font-semibold mb-2">
              Запишитесь на консультацию
            </h3>
            <p className="text-blue-100  text-white text-sm mb-4">
              Начните путь к здоровью уже сегодня
            </p>
            <Link href="/appointment" className="btn bg-white text-blue-600 hover:bg-gray-100 inline-block">
              Записаться на прием
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card slide-up">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-sm">
              📞
            </span>
            Контакты
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-3">
              <span>📱</span>
              <span>+7 (777) 123-45-67</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>📧</span>
              <span>dr.sailaubek@example.com</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>📍</span>
              <span>г. Алматы, ул. Абая 123, офис 45</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-md mx-auto px-6 py-4 text-center text-sm text-gray-500">
          © 2024 {doctor.name}. Все права защищены.
          <div className="mt-2">
            <Link href="/login" className="text-blue-600 hover:underline text-xs">
              Вход для администраторов
            </Link>
          </div>
        </div>
      </footer>

      {/* Photo Modal */}
      {isPhotoModalOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-lg p-6 shadow-2xl">
              <img 
                src={doctor.photo} 
                alt={doctor.name}
                className="w-full h-auto rounded-lg"
              />
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-gray-900">{doctor.name}</h3>
                <p className="text-blue-600 font-semibold">{doctor.specialization}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Опыт работы: {doctor.experience} лет • Рейтинг: ⭐ {doctor.rating}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
