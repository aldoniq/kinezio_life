'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ServiceType, AppointmentDate, PatientInfo } from '@/types';

type Step = 'service' | 'datetime' | 'patient' | 'confirmation';

export default function AppointmentPage() {
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [schedule, setSchedule] = useState<AppointmentDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ 
    name: '', 
    phone: '', 
    problemDescription: '' 
  });

  useEffect(() => {
    Promise.all([
      fetchServices(),
      fetchSchedule()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/doctor');
      const data = await response.json();
      setServices(data.services);
    } catch (error) {
      console.error('Ошибка при загрузке услуг:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();
      setSchedule(data.schedule);
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
    }
  };

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setCurrentStep('datetime');
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep('patient');
  };

  const handlePatientInfoSubmit = (info: PatientInfo) => {
    setPatientInfo(info);
    setCurrentStep('confirmation');
  };

  const handleFinalSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !patientInfo.name || !patientInfo.phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: patientInfo.name,
          patientPhone: patientInfo.phone,
          date: selectedDate,
          time: selectedTime,
          serviceType: selectedService,
          problemDescription: patientInfo.problemDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Запись успешно создана! Мы свяжемся с вами для подтверждения.');
        // Обновляем расписание чтобы показать занятые слоты
        await fetchSchedule();
        // Сброс формы и возврат на главную
        setCurrentStep('service');
        setSelectedService(null);
        setSelectedDate('');
        setSelectedTime('');
        setPatientInfo({ name: '', phone: '', problemDescription: '' });
        // Перенаправляем на главную страницу
        window.location.href = '/';
      } else {
        alert(data.error || 'Произошла ошибка при создании записи');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при создании записи');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('service');
        break;
      case 'patient':
        setCurrentStep('datetime');
        break;
      case 'confirmation':
        setCurrentStep('patient');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {currentStep !== 'service' ? (
              <button onClick={goBack} className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <Link href="/" className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <h1 className="text-xl font-semibold text-gray-900">Запись к врачу</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto px-6 py-3">
        <div className="flex items-center justify-center">
          {['service', 'datetime', 'patient', 'confirmation'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep ? 'bg-blue-600 text-white' :
                ['service', 'datetime', 'patient', 'confirmation'].indexOf(currentStep) > index ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {['service', 'datetime', 'patient', 'confirmation'].indexOf(currentStep) > index ? '✓' : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-1 mx-2 ${
                  ['service', 'datetime', 'patient', 'confirmation'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 pb-8">
        {/* Step 1: Service Selection */}
        {currentStep === 'service' && (
          <ServiceSelection 
            services={services} 
            onSelect={handleServiceSelect}
          />
        )}

        {/* Step 2: Date & Time Selection */}
        {currentStep === 'datetime' && (
          <DateTimeSelection 
            schedule={schedule}
            selectedService={selectedService}
            onSelect={handleDateTimeSelect}
          />
        )}

        {/* Step 3: Patient Information */}
        {currentStep === 'patient' && (
          <PatientInfoForm 
            initialData={patientInfo}
            onSubmit={handlePatientInfoSubmit}
          />
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 'confirmation' && (
          <ConfirmationStep 
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            patientInfo={patientInfo}
            submitting={submitting}
            onSubmit={handleFinalSubmit}
          />
        )}
      </main>
    </div>
  );
}

// Service Selection Component
function ServiceSelection({ services, onSelect }: {
  services: ServiceType[];
  onSelect: (service: ServiceType) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите тип услуги</h2>
      {services.map((service) => (
        <div
          key={service.id}
          className="service-card available"
          onClick={() => onSelect(service)}
        >
          <div className="flex items-center space-x-4">
            <span className="text-3xl">{service.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{service.duration} мин</span>
                                 <span className="text-lg font-semibold text-blue-600 whitespace-nowrap">
                   {service.price.toLocaleString('kk-KZ')}&nbsp;₸
                 </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Date & Time Selection Component
function DateTimeSelection({ schedule, selectedService, onSelect }: {
  schedule: AppointmentDate[];
  selectedService: ServiceType | null;
  onSelect: (date: string, time: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const availableDates = schedule.filter(day => day.available);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    onSelect(selectedDate, time);
  };

  const selectedDaySchedule = schedule.find(day => day.date === selectedDate);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Выберите дату и время</h2>
        <p className="text-sm text-gray-600 mb-4">
          Услуга: <span className="font-medium">{selectedService?.name}</span>
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Дата</h3>
        <div className="grid grid-cols-3 gap-2">
          {availableDates.slice(0, 15).map((day) => (
            <button
              key={day.date}
              onClick={() => handleDateSelect(day.date)}
              className={`p-3 rounded-xl border text-center ${
                selectedDate === day.date
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-xs text-gray-500">{day.dayOfWeek}</div>
              <div className="text-lg font-semibold">{day.dayNumber}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && selectedDaySchedule && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Время</h3>
          <div className="grid grid-cols-3 gap-2">
            {selectedDaySchedule.timeSlots
              .filter(slot => slot.available)
              .map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleTimeSelect(slot.time)}
                  className="time-slot available"
                >
                  {slot.time}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Patient Info Form Component
function PatientInfoForm({ initialData, onSubmit }: {
  initialData: PatientInfo;
  onSubmit: (info: PatientInfo) => void;
}) {
  const [formData, setFormData] = useState<PatientInfo>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Пожалуйста, заполните имя и телефон');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ваши данные</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Имя и фамилия *</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Введите ваше имя и фамилию"
            required
          />
        </div>

        <div>
          <label className="label">Телефон *</label>
          <input
            type="tel"
            className="input"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+7 (999) 999-99-99"
            required
          />
        </div>


        <div>
          <label className="label">Опишите проблему (необязательно)</label>
          <textarea
            className="input min-h-[100px] resize-none"
            value={formData.problemDescription}
            onChange={(e) => setFormData({...formData, problemDescription: e.target.value})}
            placeholder="Кратко опишите ваши симптомы или проблему..."
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Продолжить
        </button>
      </form>
    </div>
  );
}

// Confirmation Step Component
function ConfirmationStep({ service, date, time, patientInfo, submitting, onSubmit }: {
  service: ServiceType | null;
  date: string;
  time: string;
  patientInfo: PatientInfo;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Подтверждение записи</h2>
      
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            📋
          </span>
          Детали записи
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Услуга:</span>
            <span className="font-medium">{service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Дата:</span>
            <span className="font-medium">{formatDate(date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Время:</span>
            <span className="font-medium">{time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Продолжительность:</span>
            <span className="font-medium">{service?.duration} мин</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-gray-600">Стоимость:</span>
                         <span className="font-semibold text-blue-600 whitespace-nowrap">
               {service?.price.toLocaleString('kk-KZ')}&nbsp;₸
             </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            👤
          </span>
          Ваши данные
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Имя:</span>
            <span className="font-medium">{patientInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Телефон:</span>
            <span className="font-medium">{patientInfo.phone}</span>
          </div>
          {patientInfo.problemDescription && (
            <div>
              <span className="text-gray-600 block mb-1">Описание проблемы:</span>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{patientInfo.problemDescription}</p>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={onSubmit}
        disabled={submitting}
        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Создание записи...' : 'Подтвердить запись'}
      </button>
    </div>
  );
} 