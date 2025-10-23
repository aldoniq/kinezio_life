'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Appointment } from '@/types';

interface AdminUser {
  id: number;
  username: string;
  role: 'super_admin' | 'admin' | 'viewer';
  fullName: string;
  email: string;
  lastLogin?: string;
}

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Не авторизован, перенаправляем на логин
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Ошибка при проверке авторизации:', error);
      router.push('/login');
      return;
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка при загрузке записей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!user || user.role === 'viewer') {
      alert('У вас нет прав для отмены записей');
      return;
    }

    if (!confirm('Вы уверены, что хотите отменить эту запись?')) return;

    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Запись отменена');
        fetchAppointments();
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при отмене записи');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при отмене записи');
    }
  };

  const updateAttendance = async (id: string, attended: boolean) => {
    if (!user || user.role === 'viewer') {
      alert('У вас нет прав для изменения записей');
      return;
    }

    try {
      const response = await fetch(`/api/appointments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          patientAttended: attended,
          status: attended ? 'completed' : 'cancelled'
        }),
      });

      if (response.ok) {
        fetchAppointments();
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при обновлении записи');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при обновлении записи');
    }
  };

  const updateDoctorNotes = async (id: string, notes: string) => {
    if (!user || user.role === 'viewer') return;

    try {
      const response = await fetch(`/api/appointments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          doctorNotes: notes
        }),
      });

      if (response.status === 401) {
        router.push('/login');
      }
      // Не показываем alert для комментариев, чтобы не мешать вводу
    } catch (error) {
      console.error('Ошибка при обновлении комментария:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'confirmed': return 'Подтверждена';
      case 'completed': return 'Выполнена';
      case 'cancelled': return 'Отменена';
      default: return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Супер админ';
      case 'admin': return 'Администратор';
      case 'viewer': return 'Просмотрщик';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Календарные функции
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getFilteredAppointments = (dateStr: string) => {
    let filtered = getAppointmentsForDate(dateStr);
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.serviceType.id === serviceFilter);
    }
    
    return filtered;
  };

  const getUniqueServices = () => {
    const services = new Set(appointments.map(apt => apt.serviceType.id));
    return Array.from(services).map(serviceId => {
      const apt = appointments.find(a => a.serviceType.id === serviceId);
      return apt?.serviceType;
    }).filter((service): service is NonNullable<typeof service> => Boolean(service));
  };

  const formatDateForCalendar = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Будет перенаправлен на логин
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Панель управления</h1>
                <p className="text-sm text-gray-600">
                  {user.fullName} • <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="btn btn-secondary text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
            <div className="text-sm text-gray-600">Всего записей</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(apt => apt.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Ожидают</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(apt => apt.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600">Подтверждены</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">
              {appointments.filter(apt => apt.status !== 'cancelled').reduce((sum, apt) => sum + apt.serviceType.price, 0).toLocaleString('kk-KZ')} ₸
            </div>
            <div className="text-sm text-gray-600">Общий доход</div>
          </div>
        </div>

        {/* View Toggle and Navigation */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Записи ({appointments.length})
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📅 Календарь
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Список
                </button>
              </div>
            </div>
            {user.role === 'super_admin' && (
              <Link href="/admin/users" className="btn btn-outline text-sm">
                Управление пользователями
              </Link>
            )}
          </div>
        </div>

                {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="card">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month start */}
                  {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-24 p-1"></div>
                  ))}
                  
                  {/* Days of the month */}
                  {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                    const day = index + 1;
                    const dateStr = formatDateForCalendar(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayAppointments = getAppointmentsForDate(dateStr);
                    const filteredAppointments = getFilteredAppointments(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    
                    return (
                      <div
                        key={day}
                        className={`h-24 p-1 border rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-400 shadow-md' 
                            : isToday 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                        } ${dayAppointments.length > 0 ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (filteredAppointments.length > 0) {
                            setSelectedDate(dateStr);
                            setSelectedAppointment(null);
                          }
                        }}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isSelected ? 'text-blue-700' : isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {filteredAppointments.slice(0, 2).map(apt => (
                            <div
                              key={apt.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(apt.status)}`}
                              title={`${apt.time} - ${apt.patientName}`}
                            >
                              {apt.time}
                            </div>
                          ))}
                          {filteredAppointments.length > 2 && (
                            <div className="text-xs text-blue-600 px-1 font-medium">
                              +{filteredAppointments.length - 2}
                            </div>
                          )}
                          {dayAppointments.length > 0 && filteredAppointments.length === 0 && (
                            <div className="text-xs text-gray-400 px-1">
                              скрыто фильтром
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Appointments for Selected Day */}
            <div className="lg:col-span-1">
              {selectedDate ? (
                <div className="card h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {new Date(selectedDate).getDate()} {new Date(selectedDate).toLocaleDateString('ru-RU', { month: 'long' })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getFilteredAppointments(selectedDate).length} из {getAppointmentsForDate(selectedDate).length} записей
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Статус</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Все статусы</option>
                        <option value="pending">Ожидает</option>
                        <option value="confirmed">Подтверждена</option>
                        <option value="completed">Выполнена</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Услуга</label>
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Все услуги</option>
                        {getUniqueServices().map(service => (
                          <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                      </select>
                    </div>

                    {(statusFilter !== 'all' || serviceFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setServiceFilter('all');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Сбросить фильтры
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {getFilteredAppointments(selectedDate)
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(apt => (
                      <div 
                        key={apt.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedAppointment?.id === apt.id 
                            ? 'border-blue-400 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedAppointment(selectedAppointment?.id === apt.id ? null : apt)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {apt.patientName.split(' ')[0]?.[0]}{apt.patientName.split(' ')[1]?.[0]}
                              </div>
                              {/* Attendance indicator */}
                              {apt.patientAttended === true && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                              {apt.patientAttended === false && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✗</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{apt.patientName}</h4>
                              <div className="flex items-center space-x-2">
                                <p className="text-xs text-gray-600">{apt.time}</p>
                                {apt.doctorNotes && (
                                  <span className="w-2 h-2 bg-blue-400 rounded-full" title="Есть комментарий доктора"></span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(apt.status)}`}>
                            {getStatusText(apt.status)}
                          </span>
                        </div>

                                                 {/* Expanded Details */}
                         {selectedAppointment?.id === apt.id && (
                           <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 animate-in slide-in-from-top duration-200">
                             <div className="grid grid-cols-2 gap-2 text-xs">
                               <div>
                                 <span className="text-gray-500">Услуга:</span>
                                 <p className="font-medium text-gray-900">{apt.serviceType.name}</p>
                               </div>
                               <div>
                                 <span className="text-gray-500">Стоимость:</span>
                                 <p className="font-semibold text-green-600">{apt.serviceType.price.toLocaleString('kk-KZ')} ₸</p>
                               </div>
                             </div>
                             
                             <div>
                               <span className="text-xs text-gray-500">Телефон:</span>
                               <p className="text-sm text-gray-900">{apt.patientPhone}</p>
                             </div>


                             {apt.problemDescription && (
                               <div>
                                 <span className="text-xs text-gray-500">Проблема:</span>
                                 <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">{apt.problemDescription}</p>
                               </div>
                             )}

                             {/* Attendance Status */}
                             <div className="bg-blue-50 p-3 rounded-lg">
                               <label className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2 block">Посещение</label>
                               <div className="flex items-center space-x-4 mb-3">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     updateAttendance(apt.id, true);
                                   }}
                                   className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                     apt.patientAttended === true 
                                       ? 'bg-green-600 text-white' 
                                       : 'bg-white border border-green-300 text-green-600 hover:bg-green-50'
                                   }`}
                                 >
                                   <span>✓</span>
                                   <span>Пришел</span>
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     updateAttendance(apt.id, false);
                                   }}
                                   className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                     apt.patientAttended === false 
                                       ? 'bg-red-600 text-white' 
                                       : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                                   }`}
                                 >
                                   <span>✗</span>
                                   <span>Не пришел</span>
                                 </button>
                               </div>

                               {/* Doctor Notes */}
                               <div>
                                 <label className="text-xs font-medium text-gray-700 mb-1 block">Комментарий доктора</label>
                                 <textarea
                                   value={apt.doctorNotes || ''}
                                   onChange={(e) => updateDoctorNotes(apt.id, e.target.value)}
                                   onClick={(e) => e.stopPropagation()}
                                   placeholder="Добавьте комментарий о приеме..."
                                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                   rows={3}
                                 />
                               </div>
                             </div>

                             <div className="flex items-center justify-between pt-2">
                               <span className="text-xs text-gray-400">ID: {apt.id}</span>
                               {apt.status !== 'cancelled' && user?.role !== 'viewer' && (
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     cancelAppointment(apt.id);
                                   }}
                                   className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                 >
                                   Отменить
                                 </button>
                               )}
                             </div>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите день</h3>
                    <p className="text-sm text-gray-600">
                      Кликните на день в календаре, чтобы увидеть записи
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="card">

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Записей пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments
                .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                .map((appointment) => (
                  <div key={appointment.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Услуга:</span> {appointment.serviceType.name}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Дата:</span> {formatDate(appointment.date)}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Время:</span> {appointment.time}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Телефон:</span> {appointment.patientPhone}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Длительность:</span> {appointment.serviceType.duration} мин
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Стоимость:</span> 
                              <span className="whitespace-nowrap"> {appointment.serviceType.price.toLocaleString('kk-KZ')}&nbsp;₸</span>
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">ID:</span> {appointment.id}
                            </p>
                          </div>
                        </div>

                        {appointment.problemDescription && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Описание проблемы:</span>
                            </p>
                            <p className="text-sm text-gray-700 mt-1">{appointment.problemDescription}</p>
                          </div>
                        )}
                      </div>

                      {appointment.status !== 'cancelled' && user.role !== 'viewer' && (
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          Отменить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
          </div>
        )}
      </main>

            
    </div>
  );
} 