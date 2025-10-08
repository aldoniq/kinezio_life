'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  id: number;
  username: string;
  role: 'super_admin' | 'admin' | 'viewer';
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface CurrentUser {
  id: number;
  username: string;
  role: 'super_admin' | 'admin' | 'viewer';
  fullName: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== 'super_admin') {
          alert('Доступ запрещен. Только для супер администраторов.');
          router.push('/admin');
          return;
        }
        setCurrentUser(data.user);
        fetchUsers();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка при проверке авторизации:', error);
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    if (userId === currentUser?.id) {
      alert('Вы не можете деактивировать свой собственный аккаунт');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isActive }),
      });

      if (response.ok) {
        fetchUsers();
        alert(isActive ? 'Пользователь активирован' : 'Пользователь деактивирован');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при изменении статуса');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при изменении статуса');
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Управление пользователями</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Администраторы ({users.length})
            </h2>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                      {!user.isActive && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Деактивирован
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Username:</span> {user.username}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Email:</span> {user.email}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Создан:</span> {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                        {user.lastLogin && (
                          <p className="text-gray-600">
                            <span className="font-medium">Последний вход:</span> {new Date(user.lastLogin).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">ID:</span> {user.id}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Статус:</span> {user.isActive ? 'Активен' : 'Деактивирован'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {user.id !== currentUser?.id && (
                    <div className="ml-4 space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, !user.isActive)}
                        className={`px-3 py-1 text-sm border rounded-lg ${
                          user.isActive 
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 