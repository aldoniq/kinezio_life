import jwt from 'jsonwebtoken';
import { Admin } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface JWTPayload {
  id: number;
  username: string;
  role: Admin['role'];
  iat: number;
  exp: number;
}

// Создание JWT токена
export function createToken(admin: Admin): string {
  return jwt.sign(
    { 
      id: admin.id,
      username: admin.username, 
      role: admin.role,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Проверка JWT токена
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    if (decoded.id && decoded.username && decoded.role) {
      return decoded;
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return null;
  }
}

// Извлечение токена из заголовков запроса
export function extractTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// Извлечение токена из cookies
export function extractTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['admin_token'] || null;
}

// Middleware для проверки авторизации
export function requireAuth(headers: Headers): JWTPayload | null {
  // Сначала проверяем Authorization header
  let token = extractTokenFromHeaders(headers);
  
  // Если нет в headers, проверяем cookies
  if (!token) {
    const cookieHeader = headers.get('Cookie');
    token = extractTokenFromCookies(cookieHeader);
  }
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

// Проверка ролей
export function hasPermission(userRole: Admin['role'], requiredRole: Admin['role']): boolean {
  const roleHierarchy = {
    'viewer': 1,
    'admin': 2, 
    'super_admin': 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Проверка прав доступа с учетом ролей
export function requireRole(headers: Headers, requiredRole: Admin['role']): JWTPayload | null {
  const user = requireAuth(headers);
  
  if (!user) {
    return null;
  }

  if (!hasPermission(user.role, requiredRole)) {
    return null;
  }

  return user;
} 